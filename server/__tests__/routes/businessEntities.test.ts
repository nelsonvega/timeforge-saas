import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../routes.js';
import { storage } from '../../storage.js';
import { cleanDatabase } from '../../../test/helpers/database.js';
import { createAuthenticatedUser, loginAsUser } from '../../../test/helpers/auth.js';
import { createTestClient, createTestProject, createTestTimeEntry } from '../../../test/helpers/fixtures.js';

describe('Business Entity API Integration Tests', () => {
  let app: express.Express;

  beforeEach(async () => {
    await cleanDatabase();
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('Clients API', () => {
    describe('GET /api/clients', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/clients')
          .expect(401);
      });

      it('should require workspace header', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie } = await loginAsUser(app, hierarchy);

        await request(app)
          .get('/api/clients')
          .set('Cookie', cookie)
          .expect(403);
      });

      it('should require admin, manager, or owner role', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'member');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .get('/api/clients')
          .set('Cookie', cookie)
          .set(headers)
          .expect(403);
      });

      it('should return clients for authenticated user with correct role', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        await storage.createClient(clientData);

        const response = await request(app)
          .get('/api/clients')
          .set('Cookie', cookie)
          .set(headers)
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].name).toBe(clientData.name);
      });

      it('should only return clients from user workspace (cross-tenant isolation)', async () => {
        const hierarchy1 = await createAuthenticatedUser(app, 'admin');
        const hierarchy2 = await createAuthenticatedUser(app, 'admin');

        const client1Data = createTestClient(hierarchy1.workspace.id!);
        const client2Data = createTestClient(hierarchy2.workspace.id!);

        await storage.createClient(client1Data);
        await storage.createClient(client2Data);

        const { cookie: cookie1, headers: headers1 } = await loginAsUser(app, hierarchy1);

        const response = await request(app)
          .get('/api/clients')
          .set('Cookie', cookie1)
          .set(headers1)
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].name).toBe(client1Data.name);
      });
    });

    describe('GET /api/clients/:id', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/clients/some-id')
          .expect(401);
      });

      it('should return 404 for non-existent client', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .get('/api/clients/non-existent-id')
          .set('Cookie', cookie)
          .set(headers)
          .expect(404);
      });

      it('should return client by id', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        const response = await request(app)
          .get(`/api/clients/${client.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .expect(200);

        expect(response.body.id).toBe(client.id);
        expect(response.body.name).toBe(clientData.name);
      });

      it('should not return client from different workspace', async () => {
        const hierarchy1 = await createAuthenticatedUser(app, 'admin');
        const hierarchy2 = await createAuthenticatedUser(app, 'admin');

        const clientData = createTestClient(hierarchy2.workspace.id!);
        const client = await storage.createClient(clientData);

        const { cookie, headers } = await loginAsUser(app, hierarchy1);

        await request(app)
          .get(`/api/clients/${client.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .expect(404);
      });
    });

    describe('POST /api/clients', () => {
      it('should require authentication', async () => {
        await request(app)
          .post('/api/clients')
          .send({ name: 'Test Client' })
          .expect(401);
      });

      it('should require workspace header', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie } = await loginAsUser(app, hierarchy);

        await request(app)
          .post('/api/clients')
          .set('Cookie', cookie)
          .send({ name: 'Test Client' })
          .expect(403);
      });

      it('should require admin, manager, or owner role', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'member');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .post('/api/clients')
          .set('Cookie', cookie)
          .set(headers)
          .send({ name: 'Test Client' })
          .expect(403);
      });

      it('should create client with valid data', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = {
          name: 'New Client',
          email: 'client@example.com',
          phone: '+1234567890',
          status: 'active'
        };

        const response = await request(app)
          .post('/api/clients')
          .set('Cookie', cookie)
          .set(headers)
          .send(clientData)
          .expect(201);

        expect(response.body.name).toBe(clientData.name);
        expect(response.body.email).toBe(clientData.email);
        expect(response.body.workspaceId).toBe(hierarchy.workspace.id);
      });

      it('should return 400 for invalid data', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .post('/api/clients')
          .set('Cookie', cookie)
          .set(headers)
          .send({}) // Missing required name field
          .expect(400);
      });
    });

    describe('PATCH /api/clients/:id', () => {
      it('should require authentication', async () => {
        await request(app)
          .patch('/api/clients/some-id')
          .send({ name: 'Updated' })
          .expect(401);
      });

      it('should update client', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        const updateData = { name: 'Updated Client Name' };

        const response = await request(app)
          .patch(`/api/clients/${client.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .send(updateData)
          .expect(200);

        expect(response.body.name).toBe(updateData.name);
      });

      it('should return 404 for non-existent client', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .patch('/api/clients/non-existent-id')
          .set('Cookie', cookie)
          .set(headers)
          .send({ name: 'Updated' })
          .expect(404);
      });

      it('should not update client from different workspace', async () => {
        const hierarchy1 = await createAuthenticatedUser(app, 'admin');
        const hierarchy2 = await createAuthenticatedUser(app, 'admin');

        const clientData = createTestClient(hierarchy2.workspace.id!);
        const client = await storage.createClient(clientData);

        const { cookie, headers } = await loginAsUser(app, hierarchy1);

        await request(app)
          .patch(`/api/clients/${client.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .send({ name: 'Updated' })
          .expect(404);
      });
    });

    describe('DELETE /api/clients/:id', () => {
      it('should require authentication', async () => {
        await request(app)
          .delete('/api/clients/some-id')
          .expect(401);
      });

      it('should delete client', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        await request(app)
          .delete(`/api/clients/${client.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .expect(204);

        // Verify client is deleted
        const deletedClient = await storage.getClient(hierarchy.workspace.id!, client.id!);
        expect(deletedClient).toBeUndefined();
      });

      it('should return 404 for non-existent client', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .delete('/api/clients/non-existent-id')
          .set('Cookie', cookie)
          .set(headers)
          .expect(404);
      });

      it('should not delete client from different workspace', async () => {
        const hierarchy1 = await createAuthenticatedUser(app, 'admin');
        const hierarchy2 = await createAuthenticatedUser(app, 'admin');

        const clientData = createTestClient(hierarchy2.workspace.id!);
        const client = await storage.createClient(clientData);

        const { cookie, headers } = await loginAsUser(app, hierarchy1);

        await request(app)
          .delete(`/api/clients/${client.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .expect(404);

        // Verify client still exists in workspace 2
        const existingClient = await storage.getClient(hierarchy2.workspace.id!, client.id!);
        expect(existingClient).toBeDefined();
      });
    });
  });

  describe('Projects API', () => {
    describe('GET /api/projects', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/projects')
          .expect(401);
      });

      it('should require workspace header', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie } = await loginAsUser(app, hierarchy);

        await request(app)
          .get('/api/projects')
          .set('Cookie', cookie)
          .expect(403);
      });

      it('should require admin, manager, or owner role', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'member');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .get('/api/projects')
          .set('Cookie', cookie)
          .set(headers)
          .expect(403);
      });

      it('should return projects for authenticated user with correct role', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy.workspace.id!, client.id!);
        await storage.createProject(projectData);

        const response = await request(app)
          .get('/api/projects')
          .set('Cookie', cookie)
          .set(headers)
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].name).toBe(projectData.name);
      });

      it('should only return projects from user workspace (cross-tenant isolation)', async () => {
        const hierarchy1 = await createAuthenticatedUser(app, 'admin');
        const hierarchy2 = await createAuthenticatedUser(app, 'admin');

        const client1Data = createTestClient(hierarchy1.workspace.id!);
        const client1 = await storage.createClient(client1Data);

        const client2Data = createTestClient(hierarchy2.workspace.id!);
        const client2 = await storage.createClient(client2Data);

        const project1Data = createTestProject(hierarchy1.workspace.id!, client1.id!);
        const project2Data = createTestProject(hierarchy2.workspace.id!, client2.id!);

        await storage.createProject(project1Data);
        await storage.createProject(project2Data);

        const { cookie: cookie1, headers: headers1 } = await loginAsUser(app, hierarchy1);

        const response = await request(app)
          .get('/api/projects')
          .set('Cookie', cookie1)
          .set(headers1)
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].name).toBe(project1Data.name);
      });
    });

    describe('GET /api/projects/:id', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/projects/some-id')
          .expect(401);
      });

      it('should return 404 for non-existent project', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .get('/api/projects/non-existent-id')
          .set('Cookie', cookie)
          .set(headers)
          .expect(404);
      });

      it('should return project by id', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const response = await request(app)
          .get(`/api/projects/${project.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .expect(200);

        expect(response.body.id).toBe(project.id);
        expect(response.body.name).toBe(projectData.name);
      });

      it('should not return project from different workspace', async () => {
        const hierarchy1 = await createAuthenticatedUser(app, 'admin');
        const hierarchy2 = await createAuthenticatedUser(app, 'admin');

        const clientData = createTestClient(hierarchy2.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy2.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const { cookie, headers } = await loginAsUser(app, hierarchy1);

        await request(app)
          .get(`/api/projects/${project.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .expect(404);
      });
    });

    describe('POST /api/projects', () => {
      it('should require authentication', async () => {
        await request(app)
          .post('/api/projects')
          .send({ name: 'Test Project' })
          .expect(401);
      });

      it('should require workspace header', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie } = await loginAsUser(app, hierarchy);

        await request(app)
          .post('/api/projects')
          .set('Cookie', cookie)
          .send({ name: 'Test Project' })
          .expect(403);
      });

      it('should require admin, manager, or owner role', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'member');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .post('/api/projects')
          .set('Cookie', cookie)
          .set(headers)
          .send({ name: 'Test Project' })
          .expect(403);
      });

      it('should create project with valid data', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = {
          name: 'New Project',
          clientId: client.id,
          budget: '5000',
          status: 'active'
        };

        const response = await request(app)
          .post('/api/projects')
          .set('Cookie', cookie)
          .set(headers)
          .send(projectData)
          .expect(201);

        expect(response.body.name).toBe(projectData.name);
        expect(response.body.clientId).toBe(client.id);
        expect(response.body.workspaceId).toBe(hierarchy.workspace.id);
      });

      it('should return 400 for invalid data', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .post('/api/projects')
          .set('Cookie', cookie)
          .set(headers)
          .send({}) // Missing required fields
          .expect(400);
      });
    });

    describe('PATCH /api/projects/:id', () => {
      it('should require authentication', async () => {
        await request(app)
          .patch('/api/projects/some-id')
          .send({ name: 'Updated' })
          .expect(401);
      });

      it('should update project', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const updateData = { name: 'Updated Project Name' };

        const response = await request(app)
          .patch(`/api/projects/${project.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .send(updateData)
          .expect(200);

        expect(response.body.name).toBe(updateData.name);
      });

      it('should return 404 for non-existent project', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .patch('/api/projects/non-existent-id')
          .set('Cookie', cookie)
          .set(headers)
          .send({ name: 'Updated' })
          .expect(404);
      });

      it('should not update project from different workspace', async () => {
        const hierarchy1 = await createAuthenticatedUser(app, 'admin');
        const hierarchy2 = await createAuthenticatedUser(app, 'admin');

        const clientData = createTestClient(hierarchy2.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy2.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const { cookie, headers } = await loginAsUser(app, hierarchy1);

        await request(app)
          .patch(`/api/projects/${project.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .send({ name: 'Updated' })
          .expect(404);
      });
    });

    describe('DELETE /api/projects/:id', () => {
      it('should require authentication', async () => {
        await request(app)
          .delete('/api/projects/some-id')
          .expect(401);
      });

      it('should delete project', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        await request(app)
          .delete(`/api/projects/${project.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .expect(204);

        // Verify project is deleted
        const deletedProject = await storage.getProject(hierarchy.workspace.id!, project.id!);
        expect(deletedProject).toBeUndefined();
      });

      it('should return 404 for non-existent project', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .delete('/api/projects/non-existent-id')
          .set('Cookie', cookie)
          .set(headers)
          .expect(404);
      });

      it('should not delete project from different workspace', async () => {
        const hierarchy1 = await createAuthenticatedUser(app, 'admin');
        const hierarchy2 = await createAuthenticatedUser(app, 'admin');

        const clientData = createTestClient(hierarchy2.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy2.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const { cookie, headers } = await loginAsUser(app, hierarchy1);

        await request(app)
          .delete(`/api/projects/${project.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .expect(404);

        // Verify project still exists in workspace 2
        const existingProject = await storage.getProject(hierarchy2.workspace.id!, project.id!);
        expect(existingProject).toBeDefined();
      });
    });
  });

  describe('Time Entries API', () => {
    describe('GET /api/time-entries', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/time-entries')
          .expect(401);
      });

      it('should require workspace header', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie } = await loginAsUser(app, hierarchy);

        await request(app)
          .get('/api/time-entries')
          .set('Cookie', cookie)
          .expect(403);
      });

      it('should return time entries for authenticated user', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const entryData = createTestTimeEntry(hierarchy.workspace.id!, hierarchy.user.id!, project.id!);
        await storage.createTimeEntry(entryData);

        const response = await request(app)
          .get('/api/time-entries')
          .set('Cookie', cookie)
          .set(headers)
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].description).toBe(entryData.description);
      });

      it('should only return time entries from user workspace (cross-tenant isolation)', async () => {
        const hierarchy1 = await createAuthenticatedUser(app, 'admin');
        const hierarchy2 = await createAuthenticatedUser(app, 'admin');

        const client1Data = createTestClient(hierarchy1.workspace.id!);
        const client1 = await storage.createClient(client1Data);
        const project1Data = createTestProject(hierarchy1.workspace.id!, client1.id!);
        const project1 = await storage.createProject(project1Data);

        const client2Data = createTestClient(hierarchy2.workspace.id!);
        const client2 = await storage.createClient(client2Data);
        const project2Data = createTestProject(hierarchy2.workspace.id!, client2.id!);
        const project2 = await storage.createProject(project2Data);

        const entry1Data = createTestTimeEntry(hierarchy1.workspace.id!, hierarchy1.user.id!, project1.id!);
        const entry2Data = createTestTimeEntry(hierarchy2.workspace.id!, hierarchy2.user.id!, project2.id!);

        await storage.createTimeEntry(entry1Data);
        await storage.createTimeEntry(entry2Data);

        const { cookie: cookie1, headers: headers1 } = await loginAsUser(app, hierarchy1);

        const response = await request(app)
          .get('/api/time-entries')
          .set('Cookie', cookie1)
          .set(headers1)
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].description).toBe(entry1Data.description);
      });
    });

    describe('GET /api/time-entries/:id', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/time-entries/some-id')
          .expect(401);
      });

      it('should return 404 for non-existent time entry', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .get('/api/time-entries/non-existent-id')
          .set('Cookie', cookie)
          .set(headers)
          .expect(404);
      });

      it('should return time entry by id', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const entryData = createTestTimeEntry(hierarchy.workspace.id!, hierarchy.user.id!, project.id!);
        const entry = await storage.createTimeEntry(entryData);

        const response = await request(app)
          .get(`/api/time-entries/${entry.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .expect(200);

        expect(response.body.id).toBe(entry.id);
        expect(response.body.description).toBe(entryData.description);
      });

      it('should not return time entry from different workspace', async () => {
        const hierarchy1 = await createAuthenticatedUser(app, 'admin');
        const hierarchy2 = await createAuthenticatedUser(app, 'admin');

        const clientData = createTestClient(hierarchy2.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy2.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const entryData = createTestTimeEntry(hierarchy2.workspace.id!, hierarchy2.user.id!, project.id!);
        const entry = await storage.createTimeEntry(entryData);

        const { cookie, headers } = await loginAsUser(app, hierarchy1);

        await request(app)
          .get(`/api/time-entries/${entry.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .expect(404);
      });
    });

    describe('POST /api/time-entries', () => {
      it('should require authentication', async () => {
        await request(app)
          .post('/api/time-entries')
          .send({ description: 'Test Entry' })
          .expect(401);
      });

      it('should require workspace header', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie } = await loginAsUser(app, hierarchy);

        await request(app)
          .post('/api/time-entries')
          .set('Cookie', cookie)
          .send({ description: 'Test Entry' })
          .expect(403);
      });

      it('should create time entry with valid data', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const entryData = {
          userId: hierarchy.user.id,
          projectId: project.id,
          description: 'New time entry',
          startTime: new Date().toISOString(),
          duration: 120,
          isBillable: true
        };

        const response = await request(app)
          .post('/api/time-entries')
          .set('Cookie', cookie)
          .set(headers)
          .send(entryData)
          .expect(201);

        expect(response.body.description).toBe(entryData.description);
        expect(response.body.userId).toBe(hierarchy.user.id);
        expect(response.body.workspaceId).toBe(hierarchy.workspace.id);
      });

      it('should return 400 for invalid data', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .post('/api/time-entries')
          .set('Cookie', cookie)
          .set(headers)
          .send({}) // Missing required fields
          .expect(400);
      });
    });

    describe('PATCH /api/time-entries/:id', () => {
      it('should require authentication', async () => {
        await request(app)
          .patch('/api/time-entries/some-id')
          .send({ description: 'Updated' })
          .expect(401);
      });

      it('should update time entry', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const entryData = createTestTimeEntry(hierarchy.workspace.id!, hierarchy.user.id!, project.id!);
        const entry = await storage.createTimeEntry(entryData);

        const updateData = { description: 'Updated time entry description' };

        const response = await request(app)
          .patch(`/api/time-entries/${entry.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .send(updateData)
          .expect(200);

        expect(response.body.description).toBe(updateData.description);
      });

      it('should return 404 for non-existent time entry', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .patch('/api/time-entries/non-existent-id')
          .set('Cookie', cookie)
          .set(headers)
          .send({ description: 'Updated' })
          .expect(404);
      });

      it('should not update time entry from different workspace', async () => {
        const hierarchy1 = await createAuthenticatedUser(app, 'admin');
        const hierarchy2 = await createAuthenticatedUser(app, 'admin');

        const clientData = createTestClient(hierarchy2.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy2.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const entryData = createTestTimeEntry(hierarchy2.workspace.id!, hierarchy2.user.id!, project.id!);
        const entry = await storage.createTimeEntry(entryData);

        const { cookie, headers } = await loginAsUser(app, hierarchy1);

        await request(app)
          .patch(`/api/time-entries/${entry.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .send({ description: 'Updated' })
          .expect(404);
      });
    });

    describe('DELETE /api/time-entries/:id', () => {
      it('should require authentication', async () => {
        await request(app)
          .delete('/api/time-entries/some-id')
          .expect(401);
      });

      it('should delete time entry', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        const clientData = createTestClient(hierarchy.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const entryData = createTestTimeEntry(hierarchy.workspace.id!, hierarchy.user.id!, project.id!);
        const entry = await storage.createTimeEntry(entryData);

        await request(app)
          .delete(`/api/time-entries/${entry.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .expect(204);

        // Verify time entry is deleted
        const deletedEntry = await storage.getTimeEntry(hierarchy.workspace.id!, entry.id!);
        expect(deletedEntry).toBeUndefined();
      });

      it('should return 404 for non-existent time entry', async () => {
        const hierarchy = await createAuthenticatedUser(app, 'admin');
        const { cookie, headers } = await loginAsUser(app, hierarchy);

        await request(app)
          .delete('/api/time-entries/non-existent-id')
          .set('Cookie', cookie)
          .set(headers)
          .expect(404);
      });

      it('should not delete time entry from different workspace', async () => {
        const hierarchy1 = await createAuthenticatedUser(app, 'admin');
        const hierarchy2 = await createAuthenticatedUser(app, 'admin');

        const clientData = createTestClient(hierarchy2.workspace.id!);
        const client = await storage.createClient(clientData);

        const projectData = createTestProject(hierarchy2.workspace.id!, client.id!);
        const project = await storage.createProject(projectData);

        const entryData = createTestTimeEntry(hierarchy2.workspace.id!, hierarchy2.user.id!, project.id!);
        const entry = await storage.createTimeEntry(entryData);

        const { cookie, headers } = await loginAsUser(app, hierarchy1);

        await request(app)
          .delete(`/api/time-entries/${entry.id}`)
          .set('Cookie', cookie)
          .set(headers)
          .expect(404);

        // Verify time entry still exists in workspace 2
        const existingEntry = await storage.getTimeEntry(hierarchy2.workspace.id!, entry.id!);
        expect(existingEntry).toBeDefined();
      });
    });
  });
});
