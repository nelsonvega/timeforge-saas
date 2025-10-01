import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../../storage.js';
import { createTestUser } from '../../../test/helpers/fixtures.js';
import { cleanDatabase } from '../../../test/helpers/database.js';

describe('Storage - User Operations', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password).toBeDefined();
      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it('should create user with custom role', async () => {
      const userData = await createTestUser({ role: 'admin' });
      const user = await storage.createUser(userData);

      expect(user.role).toBe('admin');
    });

    it('should set default role to member', async () => {
      const userData = await createTestUser({ role: undefined });
      const user = await storage.createUser(userData);

      expect(user.role).toBe('member');
    });
  });

  describe('getUser', () => {
    it('should find user by ID', async () => {
      const userData = await createTestUser();
      const created = await storage.createUser(userData);

      const found = await storage.getUser(created.id!);

      expect(found).toBeDefined();
      expect(found?.email).toBe(userData.email);
    });

    it('should return undefined for non-existent ID', async () => {
      const found = await storage.getUser('non-existent-id');

      expect(found).toBeUndefined();
    });
  });

  describe('getUserByEmail', () => {
    it('should find user by email', async () => {
      const userData = await createTestUser({ email: 'unique@example.com' });
      await storage.createUser(userData);

      const found = await storage.getUserByEmail('unique@example.com');

      expect(found).toBeDefined();
      expect(found?.email).toBe('unique@example.com');
    });

    it('should return undefined for non-existent email', async () => {
      const found = await storage.getUserByEmail('nonexistent@example.com');

      expect(found).toBeUndefined();
    });
  });

  describe('getUserByUsername', () => {
    it('should find user by username', async () => {
      const userData = await createTestUser({ username: 'uniqueuser' });
      await storage.createUser(userData);

      const found = await storage.getUserByUsername('uniqueuser');

      expect(found).toBeDefined();
      expect(found?.username).toBe('uniqueuser');
    });

    it('should return undefined for non-existent username', async () => {
      const found = await storage.getUserByUsername('nonexistent');

      expect(found).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const userData = await createTestUser();
      const created = await storage.createUser(userData);

      const updated = await storage.updateUser(created.id!, {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
      });

      expect(updated?.firstName).toBe('UpdatedFirst');
      expect(updated?.lastName).toBe('UpdatedLast');
      expect(updated?.email).toBe(created.email);
    });

    it('should return undefined for non-existent user', async () => {
      const updated = await storage.updateUser('non-existent-id', {
        firstName: 'Test',
      });

      expect(updated).toBeUndefined();
    });
  });

  describe('upsertUser', () => {
    it('should create new user if not exists', async () => {
      const upserted = await storage.upsertUser({
        id: 'new-oauth-user',
        email: 'oauth@example.com',
        firstName: 'OAuth',
        lastName: 'User',
      });

      expect(upserted.id).toBe('new-oauth-user');
      expect(upserted.email).toBe('oauth@example.com');
    });

    it('should update existing user on conflict', async () => {
      await storage.upsertUser({
        id: 'oauth-user-1',
        email: 'original@example.com',
        firstName: 'Original',
        lastName: 'Name',
      });

      const updated = await storage.upsertUser({
        id: 'oauth-user-1',
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'Name',
      });

      expect(updated.email).toBe('updated@example.com');
      expect(updated.firstName).toBe('Updated');
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const userData = await createTestUser();
      const created = await storage.createUser(userData);

      const deleted = await storage.deleteUser(created.id!);
      expect(deleted).toBe(true);

      const found = await storage.getUser(created.id!);
      expect(found).toBeUndefined();
    });

    it('should return false for non-existent user', async () => {
      const deleted = await storage.deleteUser('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      await storage.createUser(await createTestUser({ email: 'user1@example.com' }));
      await storage.createUser(await createTestUser({ email: 'user2@example.com' }));
      await storage.createUser(await createTestUser({ email: 'user3@example.com' }));

      const users = await storage.getAllUsers();

      expect(users.length).toBeGreaterThanOrEqual(3);
    });

    it('should return empty array when no users exist', async () => {
      const users = await storage.getAllUsers();
      expect(users).toEqual([]);
    });
  });
});
