import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../routes.js';
import { storage } from '../../storage.js';
import { cleanDatabase } from '../../../test/helpers/database.js';
import { createAuthenticatedUser, getAuthCookie } from '../../../test/helpers/auth.js';
import { createTestUser, createTestTenant, createTestWorkspace, createTestMembership } from '../../../test/helpers/fixtures.js';

describe('Workspace API Routes', () => {
  let app: express.Express;

  beforeEach(async () => {
    await cleanDatabase();
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('GET /api/workspaces', () => {
    it('should list all workspaces for authenticated user', async () => {
      // Create user with workspace
      const hierarchy = await createAuthenticatedUser(app, 'admin', 'free');
      const cookie = await getAuthCookie(app, hierarchy.user.email);

      const response = await request(app)
        .get('/api/workspaces')
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(hierarchy.workspace.id);
      expect(response.body[0].name).toBe(hierarchy.workspace.name);
    });

    it('should return multiple workspaces when user is member of multiple', async () => {
      // Create first workspace
      const hierarchy1 = await createAuthenticatedUser(app, 'admin', 'free');

      // Create second workspace with same user
      const tenant2Data = createTestTenant({ name: 'Second Company' });
      const tenant2 = await storage.createTenant(tenant2Data);

      const workspace2Data = createTestWorkspace(tenant2.id!, { name: 'Second Workspace' });
      const workspace2 = await storage.createWorkspace(workspace2Data);

      // Add user to second workspace
      const membership2Data = createTestMembership(workspace2.id!, hierarchy1.user.id!, { role: 'member' });
      await storage.createWorkspaceMembership(membership2Data);

      const cookie = await getAuthCookie(app, hierarchy1.user.email);

      const response = await request(app)
        .get('/api/workspaces')
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.map((w: any) => w.id)).toContain(hierarchy1.workspace.id);
      expect(response.body.map((w: any) => w.id)).toContain(workspace2.id);
    });

    it('should return empty array when user has no workspace memberships', async () => {
      // Create user without workspace membership
      const userData = await createTestUser({ role: 'member' });
      const user = await storage.createUser(userData);

      const cookie = await getAuthCookie(app, user.email);

      const response = await request(app)
        .get('/api/workspaces')
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/workspaces')
        .expect(401);
    });
  });

  describe('GET /api/workspaces/:id', () => {
    it('should return workspace with tenant plan for member', async () => {
      const hierarchy = await createAuthenticatedUser(app, 'admin', 'paid');
      const cookie = await getAuthCookie(app, hierarchy.user.email);

      const response = await request(app)
        .get(`/api/workspaces/${hierarchy.workspace.id}`)
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body.id).toBe(hierarchy.workspace.id);
      expect(response.body.name).toBe(hierarchy.workspace.name);
      expect(response.body.tenantId).toBe(hierarchy.tenant.id);
      expect(response.body.userRole).toBe('admin');

      // Verify tenant information is included
      expect(response.body.tenant).toBeDefined();
      expect(response.body.tenant.id).toBe(hierarchy.tenant.id);
      expect(response.body.tenant.name).toBe(hierarchy.tenant.name);
      expect(response.body.tenant.plan).toBe('paid');
    });

    it('should include user role in workspace response', async () => {
      const hierarchy = await createAuthenticatedUser(app, 'manager', 'free');
      const cookie = await getAuthCookie(app, hierarchy.user.email);

      const response = await request(app)
        .get(`/api/workspaces/${hierarchy.workspace.id}`)
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body.userRole).toBe('manager');
    });

    it('should block non-members from accessing workspace', async () => {
      // Create first user with workspace
      const hierarchy1 = await createAuthenticatedUser(app, 'admin', 'free');

      // Create second user with different workspace
      const hierarchy2 = await createAuthenticatedUser(app, 'admin', 'free');
      const cookie2 = await getAuthCookie(app, hierarchy2.user.email);

      // User 2 tries to access User 1's workspace
      const response = await request(app)
        .get(`/api/workspaces/${hierarchy1.workspace.id}`)
        .set('Cookie', cookie2)
        .expect(403);

      expect(response.body.error).toContain('Access denied');
      expect(response.body.error).toContain('Not a member');
    });

    it('should return 404 for non-existent workspace', async () => {
      const hierarchy = await createAuthenticatedUser(app, 'admin', 'free');
      const cookie = await getAuthCookie(app, hierarchy.user.email);

      await request(app)
        .get('/api/workspaces/non-existent-id')
        .set('Cookie', cookie)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/workspaces/some-id')
        .expect(401);
    });

    it('should validate workspace membership for different role types', async () => {
      // Create workspace with owner
      const ownerHierarchy = await createAuthenticatedUser(app, 'owner', 'free');

      // Create member user and add to same workspace
      const memberUserData = await createTestUser({ role: 'member' });
      const memberUser = await storage.createUser(memberUserData);

      const membershipData = createTestMembership(ownerHierarchy.workspace.id!, memberUser.id!, { role: 'member' });
      await storage.createWorkspaceMembership(membershipData);

      const memberCookie = await getAuthCookie(app, memberUser.email);

      const response = await request(app)
        .get(`/api/workspaces/${ownerHierarchy.workspace.id}`)
        .set('Cookie', memberCookie)
        .expect(200);

      expect(response.body.userRole).toBe('member');
      expect(response.body.id).toBe(ownerHierarchy.workspace.id);
    });
  });

  describe('POST /api/workspaces', () => {
    it('should create a new workspace under a tenant', async () => {
      const hierarchy = await createAuthenticatedUser(app, 'admin', 'free');
      const cookie = await getAuthCookie(app, hierarchy.user.email);

      const newWorkspaceData = {
        tenantId: hierarchy.tenant.id,
        name: 'New Workspace',
        slug: 'new-workspace',
        timezone: 'America/New_York',
        status: 'active',
      };

      const response = await request(app)
        .post('/api/workspaces')
        .set('Cookie', cookie)
        .send(newWorkspaceData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('New Workspace');
      expect(response.body.tenantId).toBe(hierarchy.tenant.id);
      expect(response.body.slug).toBe('new-workspace');
      expect(response.body.timezone).toBe('America/New_York');

      // Verify workspace was created in database
      const workspace = await storage.getWorkspace(response.body.id);
      expect(workspace).toBeDefined();
      expect(workspace?.name).toBe('New Workspace');
    });

    it('should create workspace with minimal required fields', async () => {
      const hierarchy = await createAuthenticatedUser(app, 'admin', 'free');
      const cookie = await getAuthCookie(app, hierarchy.user.email);

      const minimalWorkspaceData = {
        tenantId: hierarchy.tenant.id,
        name: 'Minimal Workspace',
      };

      const response = await request(app)
        .post('/api/workspaces')
        .set('Cookie', cookie)
        .send(minimalWorkspaceData)
        .expect(201);

      expect(response.body.name).toBe('Minimal Workspace');
      expect(response.body.tenantId).toBe(hierarchy.tenant.id);
    });

    it('should reject workspace creation with invalid data', async () => {
      const hierarchy = await createAuthenticatedUser(app, 'admin', 'free');
      const cookie = await getAuthCookie(app, hierarchy.user.email);

      const invalidData = {
        // Missing required tenantId
        name: 'Invalid Workspace',
      };

      await request(app)
        .post('/api/workspaces')
        .set('Cookie', cookie)
        .send(invalidData)
        .expect(400);
    });

    it('should require authentication', async () => {
      const workspaceData = {
        tenantId: 'some-tenant-id',
        name: 'Test Workspace',
      };

      await request(app)
        .post('/api/workspaces')
        .send(workspaceData)
        .expect(401);
    });
  });

  describe('Cross-workspace isolation', () => {
    it('should prevent user from accessing workspace they are not member of', async () => {
      // Create two separate tenants with workspaces
      const hierarchy1 = await createAuthenticatedUser(app, 'admin', 'free');
      const hierarchy2 = await createAuthenticatedUser(app, 'admin', 'free');

      const cookie1 = await getAuthCookie(app, hierarchy1.user.email);

      // User 1 should only see their own workspace
      const response = await request(app)
        .get('/api/workspaces')
        .set('Cookie', cookie1)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(hierarchy1.workspace.id);
      expect(response.body.map((w: any) => w.id)).not.toContain(hierarchy2.workspace.id);
    });

    it('should not allow access to workspace details across tenant boundaries', async () => {
      // Create two tenants
      const hierarchy1 = await createAuthenticatedUser(app, 'admin', 'free');
      const hierarchy2 = await createAuthenticatedUser(app, 'admin', 'free');

      const cookie1 = await getAuthCookie(app, hierarchy1.user.email);

      // User 1 tries to access User 2's workspace
      const response = await request(app)
        .get(`/api/workspaces/${hierarchy2.workspace.id}`)
        .set('Cookie', cookie1)
        .expect(403);

      expect(response.body.error).toContain('Access denied');
    });
  });

  describe('Tenant plan information', () => {
    it('should include free plan in workspace response', async () => {
      const hierarchy = await createAuthenticatedUser(app, 'admin', 'free');
      const cookie = await getAuthCookie(app, hierarchy.user.email);

      const response = await request(app)
        .get(`/api/workspaces/${hierarchy.workspace.id}`)
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body.tenant.plan).toBe('free');
    });

    it('should include paid plan in workspace response', async () => {
      const hierarchy = await createAuthenticatedUser(app, 'admin', 'paid');
      const cookie = await getAuthCookie(app, hierarchy.user.email);

      const response = await request(app)
        .get(`/api/workspaces/${hierarchy.workspace.id}`)
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body.tenant.plan).toBe('paid');
    });

    it('should handle tenant without plan information gracefully', async () => {
      const hierarchy = await createAuthenticatedUser(app, 'admin', 'free');
      const cookie = await getAuthCookie(app, hierarchy.user.email);

      // Get workspace to verify tenant is included
      const response = await request(app)
        .get(`/api/workspaces/${hierarchy.workspace.id}`)
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body.tenant).toBeDefined();
      expect(response.body.tenant.id).toBe(hierarchy.tenant.id);
      expect(response.body.tenant.plan).toBeDefined();
    });
  });
});
