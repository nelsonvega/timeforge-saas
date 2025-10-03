import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../routes.js';
import { storage } from '../../storage.js';
import { cleanDatabase } from '../../../test/helpers/database.js';

describe('Authentication Integration - Automatic Tenant & Workspace Creation', () => {
  let app: express.Express;

  beforeEach(async () => {
    await cleanDatabase();
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('POST /api/auth/register - Local Authentication', () => {
    it('should create user, tenant, and workspace on registration', async () => {
      const registrationData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        plan: 'free',
        tenantName: 'Acme Corporation',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(registrationData.email);
      expect(response.body.tenant).toBeDefined();
      expect(response.body.tenant.plan).toBe('free');

      // Verify user was created in database
      const user = await storage.getUserByEmail(registrationData.email);
      expect(user).toBeDefined();
      expect(user?.firstName).toBe('John');
      expect(user?.lastName).toBe('Doe');

      // Verify user has a workspace
      const workspaces = await storage.getUserWorkspaces(user!.id);
      expect(workspaces).toHaveLength(1);
      expect(workspaces[0].name).toBe('Main Workspace');

      // Verify user is admin of the workspace
      const membership = await storage.getWorkspaceMembership(workspaces[0].id, user!.id);
      expect(membership).toBeDefined();
      expect(membership?.role).toBe('admin');

      // Verify tenant was created
      const tenant = await storage.getTenant(response.body.tenant.id);
      expect(tenant).toBeDefined();
      expect(tenant?.name).toBe('Acme Corporation');
      expect(tenant?.slug).toBe('acme-corporation');
    });

    it('should handle tenant names with special characters in slug generation', async () => {
      const registrationData = {
        email: 'special@example.com',
        password: 'SecurePassword123!',
        firstName: 'Jane',
        lastName: 'Smith',
        plan: 'free',
        tenantName: "Jane's Amazing Company!!!",
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      const tenant = await storage.getTenant(response.body.tenant.id);
      expect(tenant?.slug).toBe('jane-s-amazing-company');
      expect(tenant?.slug).not.toMatch(/^-/); // No leading hyphen
      expect(tenant?.slug).not.toMatch(/-$/); // No trailing hyphen
    });

    it('should create tenant with paid plan in response but free in database', async () => {
      const registrationData = {
        email: 'paiduser@example.com',
        password: 'SecurePassword123!',
        firstName: 'Pay',
        lastName: 'User',
        plan: 'paid',
        tenantName: 'Premium Corp',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.selectedPlan).toBe('paid');
      expect(response.body.tenant.plan).toBe('free'); // Always starts as free

      const tenant = await storage.getTenant(response.body.tenant.id);
      expect(tenant?.plan).toBe('free'); // Upgrades after payment
    });

    it('should reject duplicate email registration', async () => {
      const registrationData = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        firstName: 'First',
        lastName: 'User',
        plan: 'free',
        tenantName: 'First Org',
      };

      await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      const duplicateResponse = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(400);

      expect(duplicateResponse.body.error).toContain('already registered');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'incomplete@example.com',
        password: 'password',
        // Missing firstName, lastName, plan, tenantName
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toContain('required');
    });
  });

  describe('Local Authentication Login', () => {
    it('should successfully login with registered credentials', async () => {
      // First register
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'LoginPassword123!',
          firstName: 'Login',
          lastName: 'User',
          plan: 'free',
          tenantName: 'Login Org',
        })
        .expect(201);

      // Then login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPassword123!',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.user).toBeDefined();
      expect(loginResponse.body.user.email).toBe('login@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });
});
