import { describe, it, expect, beforeEach } from 'vitest';
import { DbStorage } from '../../storage';
import { cleanDatabase } from '../../../test/helpers/database';
import type { InsertTenant, InsertUser } from '@shared/schema';

describe('Storage - Tenant Operations', () => {
  let storage: DbStorage;

  beforeEach(async () => {
    await cleanDatabase();
    storage = new DbStorage();
  });

  describe('createTenant', () => {
    it('should create tenant with default free plan', async () => {
      const tenantData: InsertTenant = {
        name: 'Acme Corp',
        slug: 'acme-corp',
        plan: 'free',
      };

      const tenant = await storage.createTenant(tenantData);

      expect(tenant).toBeDefined();
      expect(tenant.id).toBeDefined();
      expect(tenant.name).toBe('Acme Corp');
      expect(tenant.slug).toBe('acme-corp');
      expect(tenant.plan).toBe('free');
      expect(tenant.stripeCustomerId).toBeNull();
      expect(tenant.stripeSubscriptionId).toBeNull();
    });

    it('should create tenant with paid plan', async () => {
      const tenantData: InsertTenant = {
        name: 'Premium Corp',
        slug: 'premium-corp',
        plan: 'paid',
      };

      const tenant = await storage.createTenant(tenantData);

      expect(tenant.plan).toBe('paid');
    });
  });

  describe('getTenant', () => {
    it('should retrieve tenant by ID', async () => {
      const created = await storage.createTenant({ name: 'Test Tenant', slug: 'test-tenant', plan: 'free' });
      
      const found = await storage.getTenant(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Tenant');
    });

    it('should return undefined for non-existent tenant', async () => {
      const found = await storage.getTenant('00000000-0000-0000-0000-000000000000');

      expect(found).toBeUndefined();
    });
  });

  describe('getAllTenants', () => {
    it('should return all tenants ordered by creation date', async () => {
      await storage.createTenant({ name: 'Tenant 1', slug: 'tenant-1', plan: 'free' });
      await storage.createTenant({ name: 'Tenant 2', slug: 'tenant-2', plan: 'paid' });
      await storage.createTenant({ name: 'Tenant 3', slug: 'tenant-3', plan: 'free' });

      const tenants = await storage.getAllTenants();

      expect(tenants.length).toBeGreaterThanOrEqual(3);
      expect(tenants[0].name).toBe('Tenant 3');
      expect(tenants[1].name).toBe('Tenant 2');
      expect(tenants[2].name).toBe('Tenant 1');
    });

    it('should return empty array when no tenants exist', async () => {
      const tenants = await storage.getAllTenants();

      expect(tenants).toEqual([]);
    });
  });

  describe('updateTenant', () => {
    it('should update tenant name', async () => {
      const tenant = await storage.createTenant({ name: 'Old Name', slug: 'old-name', plan: 'free' });

      const updated = await storage.updateTenant(tenant.id, { name: 'New Name' });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('New Name');
      expect(updated?.plan).toBe('free');
    });

    it('should update tenant plan', async () => {
      const tenant = await storage.createTenant({ name: 'Test', slug: 'test', plan: 'free' });

      const updated = await storage.updateTenant(tenant.id, { plan: 'paid' });

      expect(updated?.plan).toBe('paid');
    });

    it('should return undefined for non-existent tenant', async () => {
      const updated = await storage.updateTenant('00000000-0000-0000-0000-000000000000', { name: 'New Name' });

      expect(updated).toBeUndefined();
    });
  });

  describe('updateTenantStripeInfo', () => {
    it('should update Stripe customer ID and subscription ID', async () => {
      const tenant = await storage.createTenant({ name: 'Test', slug: 'test-stripe', plan: 'free' });

      const updated = await storage.updateTenantStripeInfo(
        tenant.id,
        'cus_test123',
        'sub_test456'
      );

      expect(updated).toBeDefined();
      expect(updated?.stripeCustomerId).toBe('cus_test123');
      expect(updated?.stripeSubscriptionId).toBe('sub_test456');
      expect(updated?.plan).toBe('paid');
    });

    it('should update to paid plan when adding Stripe info', async () => {
      const tenant = await storage.createTenant({ name: 'Test', slug: 'test-upgrade', plan: 'free' });

      const updated = await storage.updateTenantStripeInfo(tenant.id, 'cus_test123');

      expect(updated?.plan).toBe('paid');
    });

    it('should return undefined for non-existent tenant', async () => {
      const updated = await storage.updateTenantStripeInfo(
        '00000000-0000-0000-0000-000000000000',
        'cus_test'
      );

      expect(updated).toBeUndefined();
    });
  });
});
