import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../../storage.js';
import { createTestUser, createTestTenant, createTestWorkspace, createTestMembership } from '../../../test/helpers/fixtures.js';
import { cleanDatabase } from '../../../test/helpers/database.js';

describe('Storage - Workspace Operations', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('createWorkspace', () => {
    it('should create workspace under tenant', async () => {
      const tenantData = createTestTenant();
      const tenant = await storage.createTenant(tenantData);

      const workspaceData = createTestWorkspace(tenant.id!);
      const workspace = await storage.createWorkspace(workspaceData);

      expect(workspace.id).toBeDefined();
      expect(workspace.tenantId).toBe(tenant.id);
      expect(workspace.name).toBe(workspaceData.name);
    });
  });

  describe('getWorkspace', () => {
    it('should find workspace by ID', async () => {
      const tenantData = createTestTenant();
      const tenant = await storage.createTenant(tenantData);
      const workspaceData = createTestWorkspace(tenant.id!);
      const created = await storage.createWorkspace(workspaceData);

      const found = await storage.getWorkspace(created.id!);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });
  });

  describe('getUserWorkspaces', () => {
    it('should return workspaces user is member of', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);

      const tenant1 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id!));
      await storage.createWorkspaceMembership(createTestMembership(workspace1.id!, user.id!));

      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id!));
      await storage.createWorkspaceMembership(createTestMembership(workspace2.id!, user.id!));

      const userWorkspaces = await storage.getUserWorkspaces(user.id!);

      expect(userWorkspaces.length).toBe(2);
      expect(userWorkspaces.map(w => w.id)).toContain(workspace1.id);
      expect(userWorkspaces.map(w => w.id)).toContain(workspace2.id);
    });

    it('should not return workspaces user is not member of', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);

      const tenant = await storage.createTenant(createTestTenant());
      await storage.createWorkspace(createTestWorkspace(tenant.id!));

      const userWorkspaces = await storage.getUserWorkspaces(user.id!);

      expect(userWorkspaces.length).toBe(0);
    });
  });

  describe('getWorkspaceMembership', () => {
    it('should validate user workspace access', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);

      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id!));
      const membershipData = createTestMembership(workspace.id!, user.id!, { role: 'admin' });
      await storage.createWorkspaceMembership(membershipData);

      const membership = await storage.getWorkspaceMembership(workspace.id!, user.id!);

      expect(membership).toBeDefined();
      expect(membership?.role).toBe('admin');
    });

    it('should return undefined for non-member', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);

      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id!));

      const membership = await storage.getWorkspaceMembership(workspace.id!, user.id!);

      expect(membership).toBeUndefined();
    });
  });
});
