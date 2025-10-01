import { describe, it, expect, beforeEach } from 'vitest';
import { DbStorage } from '../../storage';
import { cleanDatabase } from '../../../test/helpers/database';
import { createTestUser, createTestTenant, createTestWorkspace, createTestClient } from '../../../test/helpers/fixtures';
import type { InsertTimeEntry } from '@shared/schema';

describe('Storage - Time Entry Operations (Multi-Tenant Isolation)', () => {
  let storage: DbStorage;

  beforeEach(async () => {
    await cleanDatabase();
    storage = new DbStorage();
  });

  describe('getAllTimeEntries', () => {
    it('should filter time entries by workspaceId', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));
      const project = await storage.createProject({
        workspaceId: workspace.id,
        name: 'Test Project',
        clientId: client.id,
        status: 'active',
      });

      const entry1 = await storage.createTimeEntry({
        workspaceId: workspace.id,
        userId: user.id,
        projectId: project.id,
        description: 'Entry 1',
        startTime: new Date('2024-01-01T09:00:00Z'),
        duration: 60,
        isBillable: true,
      });

      const entry2 = await storage.createTimeEntry({
        workspaceId: workspace.id,
        userId: user.id,
        projectId: project.id,
        description: 'Entry 2',
        startTime: new Date('2024-01-01T10:00:00Z'),
        duration: 120,
        isBillable: false,
      });

      const entries = await storage.getAllTimeEntries(workspace.id);

      expect(entries.length).toBe(2);
      expect(entries.find(e => e.id === entry1.id)).toBeDefined();
      expect(entries.find(e => e.id === entry2.id)).toBeDefined();
    });

    it('should not leak time entries across workspaces', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);
      const tenant1 = await storage.createTenant(createTestTenant());
      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id, { name: 'Workspace 1' }));
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id, { name: 'Workspace 2' }));
      const client1 = await storage.createClient(createTestClient(workspace1.id));
      const client2 = await storage.createClient(createTestClient(workspace2.id));
      const project1 = await storage.createProject({
        workspaceId: workspace1.id,
        name: 'Project 1',
        clientId: client1.id,
        status: 'active',
      });
      const project2 = await storage.createProject({
        workspaceId: workspace2.id,
        name: 'Project 2',
        clientId: client2.id,
        status: 'active',
      });

      await storage.createTimeEntry({
        workspaceId: workspace1.id,
        userId: user.id,
        projectId: project1.id,
        description: 'Workspace 1 Entry',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      await storage.createTimeEntry({
        workspaceId: workspace2.id,
        userId: user.id,
        projectId: project2.id,
        description: 'Workspace 2 Entry',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      const workspace1Entries = await storage.getAllTimeEntries(workspace1.id);
      const workspace2Entries = await storage.getAllTimeEntries(workspace2.id);

      expect(workspace1Entries.length).toBe(1);
      expect(workspace2Entries.length).toBe(1);
      expect(workspace1Entries[0].description).toBe('Workspace 1 Entry');
      expect(workspace2Entries[0].description).toBe('Workspace 2 Entry');
    });
  });

  describe('createTimeEntry', () => {
    it('should create time entry with all fields', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));
      const project = await storage.createProject({
        workspaceId: workspace.id,
        name: 'Test Project',
        clientId: client.id,
        status: 'active',
      });

      const entryData: InsertTimeEntry = {
        workspaceId: workspace.id,
        userId: user.id,
        projectId: project.id,
        description: 'Development work',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:30:00Z'),
        duration: 90,
        isBillable: true,
      };

      const entry = await storage.createTimeEntry(entryData);

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.description).toBe('Development work');
      expect(entry.duration).toBe(90);
      expect(entry.isBillable).toBe(true);
    });
  });

  describe('getTimeEntry', () => {
    it('should get time entry from correct workspace', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));
      const project = await storage.createProject({
        workspaceId: workspace.id,
        name: 'Test Project',
        clientId: client.id,
        status: 'active',
      });

      const created = await storage.createTimeEntry({
        workspaceId: workspace.id,
        userId: user.id,
        projectId: project.id,
        description: 'Test entry',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      const found = await storage.getTimeEntry(workspace.id, created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.description).toBe('Test entry');
    });

    it('should not get time entry from different workspace', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);
      const tenant1 = await storage.createTenant(createTestTenant());
      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id, { name: 'Workspace 1' }));
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id, { name: 'Workspace 2' }));
      const client1 = await storage.createClient(createTestClient(workspace1.id));
      const project1 = await storage.createProject({
        workspaceId: workspace1.id,
        name: 'Project 1',
        clientId: client1.id,
        status: 'active',
      });

      const entry = await storage.createTimeEntry({
        workspaceId: workspace1.id,
        userId: user.id,
        projectId: project1.id,
        description: 'Workspace 1 Entry',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      const found = await storage.getTimeEntry(workspace2.id, entry.id);

      expect(found).toBeUndefined();
    });
  });

  describe('getTimeEntriesByUser', () => {
    it('should filter time entries by user', async () => {
      const user1Data = await createTestUser();
      const user1 = await storage.createUser(user1Data);
      const user2Data = await createTestUser();
      const user2 = await storage.createUser(user2Data);
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));
      const project = await storage.createProject({
        workspaceId: workspace.id,
        name: 'Test Project',
        clientId: client.id,
        status: 'active',
      });

      await storage.createTimeEntry({
        workspaceId: workspace.id,
        userId: user1.id,
        projectId: project.id,
        description: 'User 1 Entry 1',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      await storage.createTimeEntry({
        workspaceId: workspace.id,
        userId: user1.id,
        projectId: project.id,
        description: 'User 1 Entry 2',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      await storage.createTimeEntry({
        workspaceId: workspace.id,
        userId: user2.id,
        projectId: project.id,
        description: 'User 2 Entry',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      const user1Entries = await storage.getTimeEntriesByUser(workspace.id, user1.id);
      const user2Entries = await storage.getTimeEntriesByUser(workspace.id, user2.id);

      expect(user1Entries.length).toBe(2);
      expect(user2Entries.length).toBe(1);
    });
  });

  describe('getTimeEntriesByProject', () => {
    it('should filter time entries by project', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));
      const project1 = await storage.createProject({
        workspaceId: workspace.id,
        name: 'Project 1',
        clientId: client.id,
        status: 'active',
      });
      const project2 = await storage.createProject({
        workspaceId: workspace.id,
        name: 'Project 2',
        clientId: client.id,
        status: 'active',
      });

      await storage.createTimeEntry({
        workspaceId: workspace.id,
        userId: user.id,
        projectId: project1.id,
        description: 'Project 1 Entry 1',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      await storage.createTimeEntry({
        workspaceId: workspace.id,
        userId: user.id,
        projectId: project1.id,
        description: 'Project 1 Entry 2',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      await storage.createTimeEntry({
        workspaceId: workspace.id,
        userId: user.id,
        projectId: project2.id,
        description: 'Project 2 Entry',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      const project1Entries = await storage.getTimeEntriesByProject(workspace.id, project1.id);
      const project2Entries = await storage.getTimeEntriesByProject(workspace.id, project2.id);

      expect(project1Entries.length).toBe(2);
      expect(project2Entries.length).toBe(1);
    });
  });

  describe('updateTimeEntry', () => {
    it('should update time entry in correct workspace', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));
      const project = await storage.createProject({
        workspaceId: workspace.id,
        name: 'Test Project',
        clientId: client.id,
        status: 'active',
      });

      const entry = await storage.createTimeEntry({
        workspaceId: workspace.id,
        userId: user.id,
        projectId: project.id,
        description: 'Old description',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      const updated = await storage.updateTimeEntry(workspace.id, entry.id, {
        description: 'New description',
        duration: 120,
        isBillable: false,
      });

      expect(updated).toBeDefined();
      expect(updated?.description).toBe('New description');
      expect(updated?.duration).toBe(120);
      expect(updated?.isBillable).toBe(false);
    });

    it('should not update time entry from different workspace', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);
      const tenant1 = await storage.createTenant(createTestTenant());
      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id, { name: 'Workspace 1' }));
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id, { name: 'Workspace 2' }));
      const client1 = await storage.createClient(createTestClient(workspace1.id));
      const project1 = await storage.createProject({
        workspaceId: workspace1.id,
        name: 'Project 1',
        clientId: client1.id,
        status: 'active',
      });

      const entry = await storage.createTimeEntry({
        workspaceId: workspace1.id,
        userId: user.id,
        projectId: project1.id,
        description: 'Original description',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      const updated = await storage.updateTimeEntry(workspace2.id, entry.id, {
        description: 'Hacked description',
      });

      expect(updated).toBeUndefined();

      const original = await storage.getTimeEntry(workspace1.id, entry.id);
      expect(original?.description).toBe('Original description');
    });
  });

  describe('deleteTimeEntry', () => {
    it('should delete time entry from correct workspace', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));
      const project = await storage.createProject({
        workspaceId: workspace.id,
        name: 'Test Project',
        clientId: client.id,
        status: 'active',
      });

      const entry = await storage.createTimeEntry({
        workspaceId: workspace.id,
        userId: user.id,
        projectId: project.id,
        description: 'To delete',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      const deleted = await storage.deleteTimeEntry(workspace.id, entry.id);
      expect(deleted).toBe(true);

      const found = await storage.getTimeEntry(workspace.id, entry.id);
      expect(found).toBeUndefined();
    });

    it('should not delete time entry from different workspace', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);
      const tenant1 = await storage.createTenant(createTestTenant());
      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id, { name: 'Workspace 1' }));
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id, { name: 'Workspace 2' }));
      const client1 = await storage.createClient(createTestClient(workspace1.id));
      const project1 = await storage.createProject({
        workspaceId: workspace1.id,
        name: 'Project 1',
        clientId: client1.id,
        status: 'active',
      });

      const entry = await storage.createTimeEntry({
        workspaceId: workspace1.id,
        userId: user.id,
        projectId: project1.id,
        description: 'Protected entry',
        startTime: new Date(),
        duration: 60,
        isBillable: true,
      });

      const deleted = await storage.deleteTimeEntry(workspace2.id, entry.id);
      expect(deleted).toBe(false);

      const found = await storage.getTimeEntry(workspace1.id, entry.id);
      expect(found).toBeDefined();
      expect(found?.description).toBe('Protected entry');
    });
  });
});
