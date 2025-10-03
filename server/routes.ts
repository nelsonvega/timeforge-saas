import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertClientSchema, insertProjectSchema, insertUserSchema, insertTimeEntrySchema, insertProjectAssignmentSchema, insertWorkspaceSchema, insertWorkspaceMembershipSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireRole } from "./middleware/authorization";
import { requireWorkspace } from "./middleware/workspace";

// Lazy load Stripe only when needed
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-09-30.clover" as any,
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Protect all /api routes except auth-related ones
  app.use('/api', (req, res, next) => {
    const publicPaths = ['/login', '/callback', '/logout', '/auth/login', '/auth/register'];
    if (publicPaths.includes(req.path)) {
      return next();
    }
    return isAuthenticated(req, res, next);
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const { id, email, name, profileImageUrl, role } = req.user;
      res.json({ id, email, name, profileImageUrl, role });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Workspaces - These routes don't require workspace context as they're for managing workspaces
  app.get('/api/workspaces', async (req: any, res) => {
    try {
      const workspaces = await storage.getUserWorkspaces(req.user.id);
      res.json(workspaces);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/workspaces/:id', async (req: any, res) => {
    try {
      const workspace = await storage.getWorkspace(req.params.id);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      
      // Verify user is a member of this workspace
      const membership = await storage.getWorkspaceMembership(req.params.id, req.user.id);
      if (!membership) {
        return res.status(403).json({ error: "Access denied. Not a member of this workspace" });
      }
      
      // Include tenant information with plan
      const tenant = await storage.getTenant(workspace.tenantId);
      
      res.json({
        ...workspace,
        userRole: membership.role, // Include the user's workspace-specific role
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
        } : null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/workspaces', async (req, res) => {
    try {
      const validatedData = insertWorkspaceSchema.parse(req.body);
      const workspace = await storage.createWorkspace(validatedData);
      res.status(201).json(workspace);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Workspace Memberships
  app.get('/api/workspace-memberships', requireWorkspace, async (req: any, res) => {
    try {
      const memberships = await storage.getWorkspaceMemberships(req.workspaceId);
      res.json(memberships);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/workspace-memberships', requireWorkspace, async (req: any, res) => {
    try {
      const validatedData = insertWorkspaceMembershipSchema.parse({
        ...req.body,
        workspaceId: req.workspaceId,
      });
      const membership = await storage.createWorkspaceMembership(validatedData);
      res.status(201).json(membership);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Dashboard
  app.get('/api/dashboard/metrics', requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(req.workspaceId);
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clients
  app.get("/api/clients", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const clients = await storage.getAllClients(req.workspaceId);
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/clients/:id", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const client = await storage.getClient(req.workspaceId, req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clients", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const validatedData = insertClientSchema.parse({
        ...req.body,
        workspaceId: req.workspaceId,
      });
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/clients/:id", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const client = await storage.updateClient(req.workspaceId, req.params.id, req.body);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/clients/:id", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const success = await storage.deleteClient(req.workspaceId, req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Projects
  app.get("/api/projects", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const projects = await storage.getAllProjects(req.workspaceId);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects/:id", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const project = await storage.getProject(req.workspaceId, req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects/client/:clientId", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const projects = await storage.getProjectsByClient(req.workspaceId, req.params.clientId);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        workspaceId: req.workspaceId,
      });
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/projects/:id", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const project = await storage.updateProject(req.workspaceId, req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/projects/:id", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const success = await storage.deleteProject(req.workspaceId, req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Users (Team Members)
  app.get("/api/users", requireRole("owner", "admin", "manager"), async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", requireRole("owner", "admin", "manager"), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", requireRole("owner", "admin", "manager"), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", requireRole("owner", "admin", "manager"), async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", requireRole("owner", "admin", "manager"), async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Time Entries
  app.get("/api/time-entries", requireWorkspace, async (req: any, res) => {
    try {
      const entries = await storage.getAllTimeEntries(req.workspaceId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/time-entries/:id", requireWorkspace, async (req: any, res) => {
    try {
      const entry = await storage.getTimeEntry(req.workspaceId, req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/time-entries/user/:userId", requireWorkspace, async (req: any, res) => {
    try {
      const entries = await storage.getTimeEntriesByUser(req.workspaceId, req.params.userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/time-entries/project/:projectId", requireWorkspace, async (req: any, res) => {
    try {
      const entries = await storage.getTimeEntriesByProject(req.workspaceId, req.params.projectId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/time-entries", requireWorkspace, async (req: any, res) => {
    try {
      const validatedData = insertTimeEntrySchema.parse({
        ...req.body,
        workspaceId: req.workspaceId,
      });
      const entry = await storage.createTimeEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/time-entries/:id", requireWorkspace, async (req: any, res) => {
    try {
      const entry = await storage.updateTimeEntry(req.workspaceId, req.params.id, req.body);
      if (!entry) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.json(entry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/time-entries/:id", requireWorkspace, async (req: any, res) => {
    try {
      const success = await storage.deleteTimeEntry(req.workspaceId, req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Project Assignments
  app.post("/api/project-assignments", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const validatedData = insertProjectAssignmentSchema.parse({
        ...req.body,
        workspaceId: req.workspaceId,
      });
      const assignment = await storage.assignUserToProject(validatedData);
      res.status(201).json(assignment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/project-assignments/project/:projectId", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const assignments = await storage.getProjectAssignments(req.workspaceId, req.params.projectId);
      res.json(assignments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/project-assignments/user/:userId", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const assignments = await storage.getUserAssignments(req.workspaceId, req.params.userId);
      res.json(assignments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/project-assignments/:userId/:projectId", requireWorkspace, requireRole("owner", "admin", "manager"), async (req: any, res) => {
    try {
      const success = await storage.removeUserFromProject(req.workspaceId, req.params.userId, req.params.projectId);
      if (!success) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe payment routes (require authentication)
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const stripe = getStripeClient();
      const { tenantId } = req.body;
      const userId = req.user.id; // Get from authenticated session
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      // Verify authenticated user owns this tenant (is admin)
      const memberships = await storage.getUserMemberships(userId);
      const workspaces = await storage.getWorkspacesByTenant(tenantId);
      
      const isAdminOfTenant = memberships.some(m => 
        workspaces.some(w => w.id === m.workspaceId && m.role === 'admin')
      );
      
      if (!isAdminOfTenant) {
        return res.status(403).json({ error: 'Not authorized to manage this tenant' });
      }

      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Create payment intent for $15
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1500, // $15.00 in cents
        currency: "usd",
        metadata: {
          tenantId: tenant.id,
          userId: userId,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/confirm-payment", isAuthenticated, async (req: any, res) => {
    try {
      const stripe = getStripeClient();
      const { paymentIntentId, tenantId } = req.body;
      const userId = req.user.id; // Get from authenticated session
      
      if (!paymentIntentId || !tenantId) {
        return res.status(400).json({ error: 'Payment Intent ID and Tenant ID are required' });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Verify payment intent belongs to this tenant
      if (paymentIntent.metadata.tenantId !== tenantId) {
        return res.status(403).json({ error: 'Payment Intent does not match tenant' });
      }

      // Verify authenticated user is authorized
      if (paymentIntent.metadata.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to confirm this payment' });
      }
      
      if (paymentIntent.status === 'succeeded') {
        // Create customer if needed
        let customerId = paymentIntent.customer as string;
        if (!customerId) {
          const customer = await stripe.customers.create({
            metadata: { tenantId },
          });
          customerId = customer.id;
        }

        // Update tenant with Stripe info and upgrade to paid plan
        await storage.updateTenantStripeInfo(tenantId, customerId);
        
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Payment not successful' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
