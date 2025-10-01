import { describe, it, expect, beforeEach } from 'vitest';
import { DbStorage } from '../../storage';
import { cleanDatabase } from '../../../test/helpers/database';
import { createTestUser, createTestTenant, createTestWorkspace, createTestClient } from '../../../test/helpers/fixtures';
import type { InsertProject } from '@shared/schema';

describe('Storage - Project Operations (Multi-Tenant Isolation)', () => {
  let storage: DbStorage;

  beforeEach(async () => {
    await cleanDatabase();
    storage = new DbStorage();
  });

  describe('getAllProjects', () => {
    it('should filter projects by workspaceId', async () => {
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

      const projects = await storage.getAllProjects(workspace.id);

      expect(projects.length).toBe(2);
      expect(projects.find(p => p.id === project1.id)).toBeDefined();
      expect(projects.find(p => p.id === project2.id)).toBeDefined();
    });

    it('should not leak projects across workspaces', async () => {
      const tenant1 = await storage.createTenant(createTestTenant());
      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id, { name: 'Workspace 1' }));
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id, { name: 'Workspace 2' }));
      const client1 = await storage.createClient(createTestClient(workspace1.id));
      const client2 = await storage.createClient(createTestClient(workspace2.id));

      await storage.createProject({
        workspaceId: workspace1.id,
        name: 'Workspace 1 Project',
        clientId: client1.id,
        status: 'active',
      });

      await storage.createProject({
        workspaceId: workspace2.id,
        name: 'Workspace 2 Project',
        clientId: client2.id,
        status: 'active',
      });

      const workspace1Projects = await storage.getAllProjects(workspace1.id);
      const workspace2Projects = await storage.getAllProjects(workspace2.id);

      expect(workspace1Projects.length).toBe(1);
      expect(workspace2Projects.length).toBe(1);
      expect(workspace1Projects[0].name).toBe('Workspace 1 Project');
      expect(workspace2Projects[0].name).toBe('Workspace 2 Project');
    });
  });

  describe('createProject', () => {
    it('should create project in workspace', async () => {
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));

      const projectData: InsertProject = {
        workspaceId: workspace.id,
        name: 'New Project',
        clientId: client.id,
        status: 'active',
        budget: '5000.00',
      };

      const project = await storage.createProject(projectData);

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.name).toBe('New Project');
      expect(project.workspaceId).toBe(workspace.id);
      expect(project.clientId).toBe(client.id);
      expect(project.budget).toBe('5000.00');
    });
  });

  describe('getProject', () => {
    it('should get project from correct workspace', async () => {
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));

      const created = await storage.createProject({
        workspaceId: workspace.id,
        name: 'Test Project',
        clientId: client.id,
        status: 'active',
      });

      const found = await storage.getProject(workspace.id, created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Project');
    });

    it('should not get project from different workspace', async () => {
      const tenant1 = await storage.createTenant(createTestTenant());
      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id, { name: 'Workspace 1' }));
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id, { name: 'Workspace 2' }));
      const client1 = await storage.createClient(createTestClient(workspace1.id));

      const project = await storage.createProject({
        workspaceId: workspace1.id,
        name: 'Workspace 1 Project',
        clientId: client1.id,
        status: 'active',
      });

      const found = await storage.getProject(workspace2.id, project.id);

      expect(found).toBeUndefined();
    });
  });

  describe('getProjectsByClient', () => {
    it('should get projects filtered by client', async () => {
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client1 = await storage.createClient(createTestClient(workspace.id, { name: 'Client 1' }));
      const client2 = await storage.createClient(createTestClient(workspace.id, { name: 'Client 2' }));

      await storage.createProject({
        workspaceId: workspace.id,
        name: 'Client 1 Project 1',
        clientId: client1.id,
        status: 'active',
      });

      await storage.createProject({
        workspaceId: workspace.id,
        name: 'Client 1 Project 2',
        clientId: client1.id,
        status: 'active',
      });

      await storage.createProject({
        workspaceId: workspace.id,
        name: 'Client 2 Project',
        clientId: client2.id,
        status: 'active',
      });

      const client1Projects = await storage.getProjectsByClient(workspace.id, client1.id);
      const client2Projects = await storage.getProjectsByClient(workspace.id, client2.id);

      expect(client1Projects.length).toBe(2);
      expect(client2Projects.length).toBe(1);
    });
  });

  describe('updateProject', () => {
    it('should update project in correct workspace', async () => {
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));

      const project = await storage.createProject({
        workspaceId: workspace.id,
        name: 'Old Name',
        clientId: client.id,
        status: 'active',
      });

      const updated = await storage.updateProject(workspace.id, project.id, {
        name: 'New Name',
        status: 'completed',
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('New Name');
      expect(updated?.status).toBe('completed');
    });

    it('should not update project from different workspace', async () => {
      const tenant1 = await storage.createTenant(createTestTenant());
      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id, { name: 'Workspace 1' }));
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id, { name: 'Workspace 2' }));
      const client1 = await storage.createClient(createTestClient(workspace1.id));

      const project = await storage.createProject({
        workspaceId: workspace1.id,
        name: 'Original Name',
        clientId: client1.id,
        status: 'active',
      });

      const updated = await storage.updateProject(workspace2.id, project.id, {
        name: 'Hacked Name',
      });

      expect(updated).toBeUndefined();

      const original = await storage.getProject(workspace1.id, project.id);
      expect(original?.name).toBe('Original Name');
    });
  });

  describe('deleteProject', () => {
    it('should delete project from correct workspace', async () => {
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));

      const project = await storage.createProject({
        workspaceId: workspace.id,
        name: 'To Delete',
        clientId: client.id,
        status: 'active',
      });

      const deleted = await storage.deleteProject(workspace.id, project.id);
      expect(deleted).toBe(true);

      const found = await storage.getProject(workspace.id, project.id);
      expect(found).toBeUndefined();
    });

    it('should not delete project from different workspace', async () => {
      const tenant1 = await storage.createTenant(createTestTenant());
      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id, { name: 'Workspace 1' }));
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id, { name: 'Workspace 2' }));
      const client1 = await storage.createClient(createTestClient(workspace1.id));

      const project = await storage.createProject({
        workspaceId: workspace1.id,
        name: 'Protected Project',
        clientId: client1.id,
        status: 'active',
      });

      const deleted = await storage.deleteProject(workspace2.id, project.id);
      expect(deleted).toBe(false);

      const found = await storage.getProject(workspace1.id, project.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Protected Project');
    });
  });
});
