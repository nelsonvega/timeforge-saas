import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { pool } from "./db";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export async function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  let sessionStore;

  // Try to use PostgreSQL store, fall back to memory store if DB not available
  try {
    await pool.query('SELECT 1'); // Test database connection
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
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

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
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

async function upsertUser(claims: any) {
  await createUserWithTenantAndWorkspace({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
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

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Local auth endpoints
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || 'Invalid credentials' });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Login error' });
        }
        return res.json({ success: true, user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
        }});
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
          selectedPlan: plan, // Return the plan they selected for payment flow
        });
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // OAuth endpoints
  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const isLocalAuth = (req.user as any)?.isLocalAuth;
    
    req.logout(() => {
      if (isLocalAuth) {
        // Local auth - just redirect to login
        res.redirect("/login");
      } else {
        // OAuth - redirect to OIDC logout
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      }
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

  // Handle OAuth
  if (!sessionUser.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > sessionUser.expires_at) {
    const refreshToken = sessionUser.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(sessionUser, tokenResponse);
    } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
  }

  try {
    const userId = sessionUser.claims.sub;
    const fullUser = await storage.getUser(userId);
    
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
};
