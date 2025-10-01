import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../../storage.js';
import { createTestTenant, createTestWorkspace, createTestClient } from '../../../test/helpers/fixtures.js';
import { cleanDatabase } from '../../../test/helpers/database.js';

describe('Storage - Client Operations (Multi-Tenant Isolation)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('getAllClients', () => {
    it('should filter clients by workspaceId', async () => {
      const tenant1 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id!));

      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id!));

      await storage.createClient(createTestClient(workspace1.id!, { name: 'Workspace 1 Client' }));
      await storage.createClient(createTestClient(workspace2.id!, { name: 'Workspace 2 Client' }));

      const workspace1Clients = await storage.getAllClients(workspace1.id!);
      const workspace2Clients = await storage.getAllClients(workspace2.id!);

      expect(workspace1Clients.length).toBe(1);
      expect(workspace1Clients[0].name).toBe('Workspace 1 Client');
      
      expect(workspace2Clients.length).toBe(1);
      expect(workspace2Clients[0].name).toBe('Workspace 2 Client');
    });

    it('should not leak clients across workspaces', async () => {
      const tenant1 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id!));

      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id!));

      await storage.createClient(createTestClient(workspace1.id!));
      await storage.createClient(createTestClient(workspace1.id!));

      const workspace2Clients = await storage.getAllClients(workspace2.id!);

      expect(workspace2Clients.length).toBe(0);
    });
  });

  describe('createClient', () => {
    it('should create client in workspace', async () => {
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id!));

      const clientData = createTestClient(workspace.id!, { name: 'Test Client' });
      const client = await storage.createClient(clientData);

      expect(client.id).toBeDefined();
      expect(client.workspaceId).toBe(workspace.id);
      expect(client.name).toBe('Test Client');
    });
  });

  describe('getClient', () => {
    it('should get client from correct workspace', async () => {
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id!));

      const clientData = createTestClient(workspace.id!);
      const created = await storage.createClient(clientData);

      const found = await storage.getClient(workspace.id!, created.id!);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should not get client from different workspace', async () => {
      const tenant1 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id!));

      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id!));

      const client = await storage.createClient(createTestClient(workspace1.id!));

      const found = await storage.getClient(workspace2.id!, client.id!);

      expect(found).toBeUndefined();
    });
  });

  describe('updateClient', () => {
    it('should update client in correct workspace', async () => {
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id!));

      const client = await storage.createClient(createTestClient(workspace.id!));

      const updated = await storage.updateClient(workspace.id!, client.id!, {
        name: 'Updated Name',
      });

      expect(updated?.name).toBe('Updated Name');
    });

    it('should not update client from different workspace', async () => {
      const tenant1 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id!));

      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id!));

      const client = await storage.createClient(createTestClient(workspace1.id!));

      const updated = await storage.updateClient(workspace2.id!, client.id!, {
        name: 'Attempted Hack',
      });

      expect(updated).toBeUndefined();
    });
  });

  describe('deleteClient', () => {
    it('should delete client from correct workspace', async () => {
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id!));

      const client = await storage.createClient(createTestClient(workspace.id!));

      const deleted = await storage.deleteClient(workspace.id!, client.id!);

      expect(deleted).toBe(true);
    });

    it('should not delete client from different workspace', async () => {
      const tenant1 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id!));

      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id!));

      const client = await storage.createClient(createTestClient(workspace1.id!));

      const deleted = await storage.deleteClient(workspace2.id!, client.id!);

      expect(deleted).toBe(false);
    });
  });
});
