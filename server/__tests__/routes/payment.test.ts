import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import Stripe from 'stripe';
import { registerRoutes } from '../../routes.js';
import { storage } from '../../storage.js';
import { cleanDatabase } from '../../../test/helpers/database.js';
import { createTestUser, createTestTenant, createTestWorkspace, createTestMembership } from '../../../test/helpers/fixtures.js';

// Mock Stripe module
vi.mock('stripe', () => {
  const MockStripe = vi.fn().mockImplementation(() => ({
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
    customers: {
      create: vi.fn(),
    },
  }));
  return { default: MockStripe };
});

describe('Payment API Endpoints', () => {
  let app: express.Express;
  let mockStripe: any;
  let adminUser: any;
  let adminTenant: any;
  let adminWorkspace: any;
  let adminCookie: string;
  let memberUser: any;
  let memberCookie: string;

  beforeEach(async () => {
    // Clean database
    await cleanDatabase();

    // Set up Express app
    app = express();
    app.use(express.json());
    await registerRoutes(app);

    // Get mock Stripe instance
    mockStripe = new Stripe('test_key', { apiVersion: '2025-09-30.clover' as any });

    // Create admin user with tenant and workspace
    const adminUserData = await createTestUser({
      email: 'admin@example.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });
    adminUser = await storage.createUser(adminUserData);

    const tenantData = createTestTenant({
      name: 'Test Company',
      slug: 'test-company',
      plan: 'free',
    });
    adminTenant = await storage.createTenant(tenantData);

    const workspaceData = createTestWorkspace(adminTenant.id, {
      name: 'Main Workspace',
      slug: 'main',
    });
    adminWorkspace = await storage.createWorkspace(workspaceData);

    const membershipData = createTestMembership(adminWorkspace.id, adminUser.id, {
      role: 'admin',
    });
    await storage.createWorkspaceMembership(membershipData);

    // Login admin user
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      });
    adminCookie = adminLoginResponse.headers['set-cookie'];

    // Create member user (non-admin)
    const memberUserData = await createTestUser({
      email: 'member@example.com',
      password: 'password123',
      firstName: 'Member',
      lastName: 'User',
      role: 'member',
    });
    memberUser = await storage.createUser(memberUserData);

    const memberMembershipData = createTestMembership(adminWorkspace.id, memberUser.id, {
      role: 'member',
    });
    await storage.createWorkspaceMembership(memberMembershipData);

    // Login member user
    const memberLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'member@example.com',
        password: 'password123',
      });
    memberCookie = memberLoginResponse.headers['set-cookie'];
  });

  describe('POST /api/create-payment-intent', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/create-payment-intent')
        .send({ tenantId: adminTenant.id });

      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .post('/api/create-payment-intent')
        .set('Cookie', memberCookie)
        .send({ tenantId: adminTenant.id });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });

    it('should require tenantId in request body', async () => {
      const response = await request(app)
        .post('/api/create-payment-intent')
        .set('Cookie', adminCookie)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Tenant ID is required');
    });

    it('should return 404 if tenant does not exist', async () => {
      const response = await request(app)
        .post('/api/create-payment-intent')
        .set('Cookie', adminCookie)
        .send({ tenantId: 'non-existent-tenant' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Tenant not found');
    });

    it('should create Stripe payment intent for admin user', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_abc',
        amount: 1500,
        currency: 'usd',
        status: 'requires_payment_method',
        metadata: {
          tenantId: adminTenant.id,
          userId: adminUser.id,
        },
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/create-payment-intent')
        .set('Cookie', adminCookie)
        .send({ tenantId: adminTenant.id });

      expect(response.status).toBe(200);
      expect(response.body.clientSecret).toBe('pi_test123_secret_abc');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1500,
        currency: 'usd',
        metadata: {
          tenantId: adminTenant.id,
          userId: adminUser.id,
        },
      });
    });

    it('should set correct metadata on payment intent', async () => {
      const mockPaymentIntent = {
        id: 'pi_test456',
        client_secret: 'pi_test456_secret_xyz',
        amount: 1500,
        currency: 'usd',
        status: 'requires_payment_method',
        metadata: {
          tenantId: adminTenant.id,
          userId: adminUser.id,
        },
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await request(app)
        .post('/api/create-payment-intent')
        .set('Cookie', adminCookie)
        .send({ tenantId: adminTenant.id });

      const createCall = mockStripe.paymentIntents.create.mock.calls[0][0];
      expect(createCall.metadata).toEqual({
        tenantId: adminTenant.id,
        userId: adminUser.id,
      });
    });

    it('should handle Stripe API errors', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Stripe API error: Invalid API key')
      );

      const response = await request(app)
        .post('/api/create-payment-intent')
        .set('Cookie', adminCookie)
        .send({ tenantId: adminTenant.id });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Stripe API error');
    });

    it('should prevent non-admin from creating payment intent for tenant', async () => {
      // Create a separate tenant
      const otherTenantData = createTestTenant({
        name: 'Other Company',
        slug: 'other-company',
        plan: 'free',
      });
      const otherTenant = await storage.createTenant(otherTenantData);

      const response = await request(app)
        .post('/api/create-payment-intent')
        .set('Cookie', adminCookie)
        .send({ tenantId: otherTenant.id });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to manage this tenant');
    });
  });

  describe('POST /api/confirm-payment', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/confirm-payment')
        .send({
          paymentIntentId: 'pi_test123',
          tenantId: adminTenant.id,
        });

      expect(response.status).toBe(401);
    });

    it('should require paymentIntentId and tenantId', async () => {
      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', adminCookie)
        .send({ paymentIntentId: 'pi_test123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Payment Intent ID and Tenant ID are required');
    });

    it('should validate payment intent metadata matches tenant', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          tenantId: 'different-tenant-id',
          userId: adminUser.id,
        },
        customer: null,
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', adminCookie)
        .send({
          paymentIntentId: 'pi_test123',
          tenantId: adminTenant.id,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Payment Intent does not match tenant');
    });

    it('should validate payment intent metadata matches user', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          tenantId: adminTenant.id,
          userId: 'different-user-id',
        },
        customer: null,
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', adminCookie)
        .send({
          paymentIntentId: 'pi_test123',
          tenantId: adminTenant.id,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to confirm this payment');
    });

    it('should upgrade tenant plan to paid after successful payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          tenantId: adminTenant.id,
          userId: adminUser.id,
        },
        customer: 'cus_existing123',
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', adminCookie)
        .send({
          paymentIntentId: 'pi_test123',
          tenantId: adminTenant.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify tenant was upgraded to paid plan
      const updatedTenant = await storage.getTenant(adminTenant.id);
      expect(updatedTenant?.plan).toBe('paid');
      expect(updatedTenant?.stripeCustomerId).toBe('cus_existing123');
    });

    it('should create Stripe customer if not exists', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          tenantId: adminTenant.id,
          userId: adminUser.id,
        },
        customer: null,
      };

      const mockCustomer = {
        id: 'cus_new123',
        metadata: {
          tenantId: adminTenant.id,
        },
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', adminCookie)
        .send({
          paymentIntentId: 'pi_test123',
          tenantId: adminTenant.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        metadata: { tenantId: adminTenant.id },
      });

      // Verify tenant was upgraded with new customer
      const updatedTenant = await storage.getTenant(adminTenant.id);
      expect(updatedTenant?.plan).toBe('paid');
      expect(updatedTenant?.stripeCustomerId).toBe('cus_new123');
    });

    it('should reject payment if status is not succeeded', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'requires_payment_method',
        metadata: {
          tenantId: adminTenant.id,
          userId: adminUser.id,
        },
        customer: null,
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', adminCookie)
        .send({
          paymentIntentId: 'pi_test123',
          tenantId: adminTenant.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Payment not successful');

      // Verify tenant plan was NOT upgraded
      const tenant = await storage.getTenant(adminTenant.id);
      expect(tenant?.plan).toBe('free');
    });

    it('should handle payment failures gracefully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'canceled',
        metadata: {
          tenantId: adminTenant.id,
          userId: adminUser.id,
        },
        customer: null,
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', adminCookie)
        .send({
          paymentIntentId: 'pi_test123',
          tenantId: adminTenant.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Payment not successful');

      // Verify no upgrade occurred
      const tenant = await storage.getTenant(adminTenant.id);
      expect(tenant?.plan).toBe('free');
    });

    it('should handle Stripe API errors during retrieval', async () => {
      mockStripe.paymentIntents.retrieve.mockRejectedValue(
        new Error('Stripe API error: Payment intent not found')
      );

      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', adminCookie)
        .send({
          paymentIntentId: 'pi_invalid',
          tenantId: adminTenant.id,
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Stripe API error');
    });

    it('should handle Stripe API errors during customer creation', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          tenantId: adminTenant.id,
          userId: adminUser.id,
        },
        customer: null,
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      mockStripe.customers.create.mockRejectedValue(
        new Error('Stripe API error: Customer creation failed')
      );

      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', adminCookie)
        .send({
          paymentIntentId: 'pi_test123',
          tenantId: adminTenant.id,
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Stripe API error');
    });
  });

  describe('Payment Security Tests', () => {
    it('should prevent user from confirming payment for another users tenant', async () => {
      // Create another user with their own tenant
      const otherUserData = await createTestUser({
        email: 'other@example.com',
        password: 'password123',
        firstName: 'Other',
        lastName: 'User',
        role: 'admin',
      });
      const otherUser = await storage.createUser(otherUserData);

      const otherTenantData = createTestTenant({
        name: 'Other Company',
        slug: 'other-company',
        plan: 'free',
      });
      const otherTenant = await storage.createTenant(otherTenantData);

      const otherWorkspaceData = createTestWorkspace(otherTenant.id, {
        name: 'Other Workspace',
        slug: 'other',
      });
      const otherWorkspace = await storage.createWorkspace(otherWorkspaceData);

      const otherMembershipData = createTestMembership(otherWorkspace.id, otherUser.id, {
        role: 'admin',
      });
      await storage.createWorkspaceMembership(otherMembershipData);

      // Admin user tries to confirm payment for other user's tenant
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          tenantId: otherTenant.id,
          userId: otherUser.id,
        },
        customer: 'cus_other123',
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', adminCookie)
        .send({
          paymentIntentId: 'pi_test123',
          tenantId: otherTenant.id,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to confirm this payment');

      // Verify other tenant was NOT upgraded
      const tenant = await storage.getTenant(otherTenant.id);
      expect(tenant?.plan).toBe('free');
    });

    it('should prevent metadata tampering attack', async () => {
      // Attacker tries to use their payment for victim's tenant
      const victimTenantData = createTestTenant({
        name: 'Victim Company',
        slug: 'victim-company',
        plan: 'free',
      });
      const victimTenant = await storage.createTenant(victimTenantData);

      const mockPaymentIntent = {
        id: 'pi_attacker123',
        status: 'succeeded',
        metadata: {
          tenantId: adminTenant.id, // Attacker's tenant in metadata
          userId: adminUser.id,
        },
        customer: 'cus_attacker123',
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      // Try to use payment for victim's tenant
      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', adminCookie)
        .send({
          paymentIntentId: 'pi_attacker123',
          tenantId: victimTenant.id, // Trying to upgrade different tenant
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Payment Intent does not match tenant');

      // Verify victim tenant was NOT upgraded
      const tenant = await storage.getTenant(victimTenant.id);
      expect(tenant?.plan).toBe('free');
    });
  });
});
