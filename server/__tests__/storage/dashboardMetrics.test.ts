import { describe, it, expect, beforeEach } from 'vitest';
import { DbStorage } from '../../storage';
import { cleanDatabase } from '../../../test/helpers/database';
import {
  createTestUser,
  createTestTenant,
  createTestWorkspace,
  createTestClient,
  createTestProject,
  createTestTimeEntry
} from '../../../test/helpers/fixtures';

describe('Storage - Dashboard Metrics', () => {
  let storage: DbStorage;

  beforeEach(async () => {
    await cleanDatabase();
    storage = new DbStorage();
  });

  describe('getDashboardMetrics', () => {
    it('should calculate total hours from time entries', async () => {
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

      // Create time entries with different durations
      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 60, // 1 hour
        isBillable: true,
      }));

      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 90, // 1.5 hours
        isBillable: true,
      }));

      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 30, // 0.5 hours
        isBillable: false,
      }));

      const metrics = await storage.getDashboardMetrics(workspace.id);

      // Total: 60 + 90 + 30 = 180 minutes = 3 hours
      expect(metrics.totalHours).toBe(3);
    });

    it('should calculate billable percentage correctly', async () => {
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

      // Create 75% billable time entries
      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 60, // billable
        isBillable: true,
      }));

      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 60, // billable
        isBillable: true,
      }));

      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 60, // billable
        isBillable: true,
      }));

      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 60, // non-billable
        isBillable: false,
      }));

      const metrics = await storage.getDashboardMetrics(workspace.id);

      // 180 billable / 240 total = 75%
      expect(metrics.billablePercentage).toBe(75);
    });

    it('should count active projects only', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));

      // Create active projects
      await storage.createProject({
        workspaceId: workspace.id,
        name: 'Active Project 1',
        clientId: client.id,
        status: 'active',
      });

      await storage.createProject({
        workspaceId: workspace.id,
        name: 'Active Project 2',
        clientId: client.id,
        status: 'active',
      });

      // Create completed project (should not count)
      await storage.createProject({
        workspaceId: workspace.id,
        name: 'Completed Project',
        clientId: client.id,
        status: 'completed',
      });

      // Create on-hold project (should not count)
      await storage.createProject({
        workspaceId: workspace.id,
        name: 'On Hold Project',
        clientId: client.id,
        status: 'on-hold',
      });

      const metrics = await storage.getDashboardMetrics(workspace.id);

      expect(metrics.activeProjects).toBe(2);
    });

    it('should calculate utilization rate based on 40-hour work week', async () => {
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

      // Create 20 hours of time entries (50% of 40 hours)
      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 1200, // 20 hours in minutes
        isBillable: true,
      }));

      const metrics = await storage.getDashboardMetrics(workspace.id);

      // 1200 minutes / (40 * 60) = 50%
      expect(metrics.utilizationRate).toBe(50);
    });

    it('should cap utilization rate at 100%', async () => {
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

      // Create 60 hours of time entries (150% of 40 hours)
      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 3600, // 60 hours in minutes
        isBillable: true,
      }));

      const metrics = await storage.getDashboardMetrics(workspace.id);

      // Should be capped at 100%
      expect(metrics.utilizationRate).toBe(100);
    });

    it('should return zero metrics for empty workspace', async () => {
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));

      const metrics = await storage.getDashboardMetrics(workspace.id);

      expect(metrics.totalHours).toBe(0);
      expect(metrics.billablePercentage).toBe(0);
      expect(metrics.activeProjects).toBe(0);
      expect(metrics.utilizationRate).toBe(0);
    });

    it('should return zero metrics for workspace with no time entries', async () => {
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));

      // Create projects but no time entries
      await storage.createProject({
        workspaceId: workspace.id,
        name: 'Project 1',
        clientId: client.id,
        status: 'active',
      });

      await storage.createProject({
        workspaceId: workspace.id,
        name: 'Project 2',
        clientId: client.id,
        status: 'active',
      });

      const metrics = await storage.getDashboardMetrics(workspace.id);

      expect(metrics.totalHours).toBe(0);
      expect(metrics.billablePercentage).toBe(0);
      expect(metrics.activeProjects).toBe(2);
      expect(metrics.utilizationRate).toBe(0);
    });

    it('should handle workspace with only non-billable time', async () => {
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

      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 120,
        isBillable: false,
      }));

      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 60,
        isBillable: false,
      }));

      const metrics = await storage.getDashboardMetrics(workspace.id);

      expect(metrics.totalHours).toBe(3); // 180 minutes = 3 hours
      expect(metrics.billablePercentage).toBe(0);
      expect(metrics.activeProjects).toBe(1);
      expect(metrics.utilizationRate).toBeGreaterThan(0);
    });

    it('should handle workspace with 100% billable time', async () => {
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

      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 120,
        isBillable: true,
      }));

      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 60,
        isBillable: true,
      }));

      const metrics = await storage.getDashboardMetrics(workspace.id);

      expect(metrics.totalHours).toBe(3);
      expect(metrics.billablePercentage).toBe(100);
    });

    it('should handle multiple projects scenario', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));

      // Create multiple projects
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

      const project3 = await storage.createProject({
        workspaceId: workspace.id,
        name: 'Project 3',
        clientId: client.id,
        status: 'completed',
      });

      // Add time entries to different projects
      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project1.id, {
        duration: 120,
        isBillable: true,
      }));

      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project2.id, {
        duration: 90,
        isBillable: true,
      }));

      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project2.id, {
        duration: 30,
        isBillable: false,
      }));

      const metrics = await storage.getDashboardMetrics(workspace.id);

      expect(metrics.totalHours).toBe(4); // 240 minutes = 4 hours
      expect(metrics.billablePercentage).toBe(88); // 210/240 = 87.5%, rounded to 88
      expect(metrics.activeProjects).toBe(2); // only active projects
      expect(metrics.utilizationRate).toBeGreaterThan(0);
    });

    it('should not leak metrics across workspaces', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);

      // Create two separate workspaces
      const tenant1 = await storage.createTenant(createTestTenant());
      const workspace1 = await storage.createWorkspace(createTestWorkspace(tenant1.id, { name: 'Workspace 1' }));
      const client1 = await storage.createClient(createTestClient(workspace1.id));
      const project1 = await storage.createProject({
        workspaceId: workspace1.id,
        name: 'Project 1',
        clientId: client1.id,
        status: 'active',
      });

      const tenant2 = await storage.createTenant(createTestTenant());
      const workspace2 = await storage.createWorkspace(createTestWorkspace(tenant2.id, { name: 'Workspace 2' }));
      const client2 = await storage.createClient(createTestClient(workspace2.id));
      const project2 = await storage.createProject({
        workspaceId: workspace2.id,
        name: 'Project 2',
        clientId: client2.id,
        status: 'active',
      });

      // Add time entries to workspace 1
      await storage.createTimeEntry(createTestTimeEntry(workspace1.id, user.id, project1.id, {
        duration: 120,
        isBillable: true,
      }));

      // Add time entries to workspace 2
      await storage.createTimeEntry(createTestTimeEntry(workspace2.id, user.id, project2.id, {
        duration: 60,
        isBillable: true,
      }));

      const metrics1 = await storage.getDashboardMetrics(workspace1.id);
      const metrics2 = await storage.getDashboardMetrics(workspace2.id);

      // Workspace 1: 120 minutes = 2 hours
      expect(metrics1.totalHours).toBe(2);
      expect(metrics1.activeProjects).toBe(1);

      // Workspace 2: 60 minutes = 1 hour
      expect(metrics2.totalHours).toBe(1);
      expect(metrics2.activeProjects).toBe(1);

      // Ensure they're different
      expect(metrics1.totalHours).not.toBe(metrics2.totalHours);
    });

    it('should round total hours to one decimal place', async () => {
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

      // Create time entry with odd duration
      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 77, // 1.283333... hours
        isBillable: true,
      }));

      const metrics = await storage.getDashboardMetrics(workspace.id);

      // Should be rounded to 1 decimal place: 1.3 hours
      expect(metrics.totalHours).toBe(1.3);
    });

    it('should handle time entries with null durations', async () => {
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

      // Create time entry with valid duration
      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: 60,
        isBillable: true,
      }));

      // Create time entry with null duration (should be filtered out)
      await storage.createTimeEntry(createTestTimeEntry(workspace.id, user.id, project.id, {
        duration: undefined as any,
        isBillable: true,
      }));

      const metrics = await storage.getDashboardMetrics(workspace.id);

      // Should only count the valid entry
      expect(metrics.totalHours).toBe(1);
    });

    it('should handle mixed project statuses', async () => {
      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id));
      const client = await storage.createClient(createTestClient(workspace.id));

      await storage.createProject({
        workspaceId: workspace.id,
        name: 'Active 1',
        clientId: client.id,
        status: 'active',
      });

      await storage.createProject({
        workspaceId: workspace.id,
        name: 'Active 2',
        clientId: client.id,
        status: 'active',
      });

      await storage.createProject({
        workspaceId: workspace.id,
        name: 'Completed',
        clientId: client.id,
        status: 'completed',
      });

      await storage.createProject({
        workspaceId: workspace.id,
        name: 'On Hold',
        clientId: client.id,
        status: 'on-hold',
      });

      await storage.createProject({
        workspaceId: workspace.id,
        name: 'Archived',
        clientId: client.id,
        status: 'archived',
      });

      const metrics = await storage.getDashboardMetrics(workspace.id);

      // Only 2 active projects
      expect(metrics.activeProjects).toBe(2);
    });
  });
});
