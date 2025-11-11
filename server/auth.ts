import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  let sessionStore;

  // Try to use PostgreSQL store, fall back to memory store if DB not available
  try {
    // Test database connection using drizzle
    await db.execute(sql`SELECT 1`);
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: false,
      ttl: sessionTtl / 1000, // PostgreSQL store uses seconds
      tableName: "sessions",
    });
    console.log('✅ Using PostgreSQL session store');
  } catch (error) {
    console.warn('⚠️  Database not available, using memory session store');
    const MemStore = MemoryStore(session);
    sessionStore = new MemStore({
      checkPeriod: sessionTtl, // prune expired entries every 24h
    });
  }

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}


async function createUserWithTenantAndWorkspace(userData: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}) {
  // Upsert the user
  const user = await storage.upsertUser(userData);

  // Check if user already has workspaces
  const existingWorkspaces = await storage.getUserWorkspaces(user.id);
  
  // Only create tenant/workspace for truly new users
  if (existingWorkspaces.length === 0) {
    const tenantName = `${userData.firstName}'s Organization`;
    const tenantSlug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    const tenant = await storage.createTenant({
      name: tenantName,
      slug: tenantSlug,
      plan: 'free',
      status: 'active',
    });

    const workspace = await storage.createWorkspace({
      tenantId: tenant.id,
      name: 'Main Workspace',
      slug: 'main',
      timezone: 'UTC',
      status: 'active',
    });

    await storage.createWorkspaceMembership({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    });
  }
}


export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(await getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy for username/password
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);

        if (!user || !user.password) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Create session user object for local auth
        const sessionUser = {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
          isLocalAuth: true,
        };

        return done(null, sessionUser);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user data from Google profile
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';
          const profileImageUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          // Check if user already exists by email (from local registration)
          let existingUser = await storage.getUserByEmail(email);

          if (existingUser) {
            // User exists with this email - link Google account to existing user
            // Update profile image if not set
            if (!existingUser.profileImageUrl && profileImageUrl) {
              await storage.updateUser(existingUser.id, {
                profileImageUrl,
              });
              existingUser.profileImageUrl = profileImageUrl;
            }

            // Create session user object using existing user's ID
            const sessionUser = {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name || `${existingUser.firstName} ${existingUser.lastName}`,
              profileImageUrl: existingUser.profileImageUrl,
              isGoogleAuth: true,
              accessToken,
              refreshToken,
            };

            return done(null, sessionUser);
          }

          // New user - create user with tenant and workspace
          await createUserWithTenantAndWorkspace({
            id: profile.id,
            email,
            firstName,
            lastName,
            profileImageUrl,
          });

          // Create session user object for Google auth
          const sessionUser = {
            id: profile.id,
            email,
            name: `${firstName} ${lastName}`,
            profileImageUrl,
            isGoogleAuth: true,
            accessToken,
            refreshToken,
          };

          return done(null, sessionUser);
        } catch (error) {
          return done(error as Error);
        }
      }
    ));
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Local auth endpoints
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', async (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || 'Invalid credentials' });
      }

      req.logIn(user, async (err) => {
        if (err) {
          return res.status(500).json({ error: 'Login error' });
        }

        // Check workspace memberships
        const workspaces = await storage.getUserWorkspaces(user.id);

        if (workspaces.length === 0) {
          return res.status(403).json({
            error: 'No workspace access',
            message: 'User is not a member of any workspace'
          });
        }

        return res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            profileImageUrl: user.profileImageUrl,
            role: user.role,
          },
          workspaces: workspaces.map(w => ({
            id: w.id,
            name: w.name,
            slug: w.slug,
          })),
          requiresWorkspaceSelection: workspaces.length > 1,
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, plan, tenantName } = req.body;

      if (!email || !password || !firstName || !lastName || !plan || !tenantName) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        role: 'owner',
      });

      // Create tenant - always start with free plan, upgrade after payment
      const tenantSlug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const tenant = await storage.createTenant({
        name: tenantName,
        slug: tenantSlug,
        plan: 'free', // Always start with free, upgrade after payment confirmation
        status: 'active',
      });

      // Create default workspace
      const workspace = await storage.createWorkspace({
        tenantId: tenant.id,
        name: 'Main Workspace',
        slug: 'main',
        timezone: 'UTC',
        status: 'active',
      });

      // Add user as owner of the workspace
      await storage.createWorkspaceMembership({
        workspaceId: workspace.id,
        userId: user.id,
        role: 'owner',
      });

      req.logIn({
        id: user.id,
        email: user.email,
        name: user.name,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        isLocalAuth: true,
        tenantId: tenant.id,
      }, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Login error after registration' });
        }
        res.status(201).json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            profileImageUrl: user.profileImageUrl,
            role: user.role,
          },
          tenant: {
            id: tenant.id,
            plan: tenant.plan,
          },
          workspaces: [{
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
          }],
          requiresWorkspaceSelection: false, // New user always has only one workspace
          selectedPlan: plan, // Return the plan they selected for payment flow
        });
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Google OAuth endpoints
  app.get("/api/auth/google", (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ error: "Google OAuth not configured" });
    }
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })(req, res, next);
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", async (err: any, user: any) => {
      if (err || !user) {
        return res.redirect("/login?error=google_auth_failed");
      }

      req.logIn(user, async (loginErr) => {
        if (loginErr) {
          return res.redirect("/login?error=login_failed");
        }

        // Check workspace memberships
        const workspaces = await storage.getUserWorkspaces(user.id);

        if (workspaces.length === 0) {
          req.logout(() => {
            res.redirect("/login?error=no_workspace");
          });
          return;
        }

        // If multiple workspaces, redirect to workspace selector
        if (workspaces.length > 1) {
          return res.redirect("/select-workspace");
        }

        // Single workspace - redirect to dashboard
        return res.redirect("/");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/login");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const sessionUser = req.user as any;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Handle local auth (username/password)
  if (sessionUser.isLocalAuth) {
    try {
      const fullUser = await storage.getUser(sessionUser.id);

      if (!fullUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      sessionUser.role = fullUser.role;
      sessionUser.id = fullUser.id;
      sessionUser.email = fullUser.email;
      sessionUser.name = fullUser.name;
      sessionUser.profileImageUrl = fullUser.profileImageUrl;

      return next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
  }

  // Handle Google OAuth
  if (sessionUser.isGoogleAuth) {
    try {
      const fullUser = await storage.getUser(sessionUser.id);

      if (!fullUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      sessionUser.role = fullUser.role;
      sessionUser.id = fullUser.id;
      sessionUser.email = fullUser.email;
      sessionUser.name = fullUser.name;
      sessionUser.profileImageUrl = fullUser.profileImageUrl;

      return next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
  }

  // Unknown auth type
  return res.status(401).json({ message: "Unauthorized" });
};
