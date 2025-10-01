import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireWorkspace } from '../../middleware/workspace.js';
import { storage } from '../../storage.js';
import { createTestUser, createTestTenant, createTestWorkspace, createTestMembership } from '../../../test/helpers/fixtures.js';
import { cleanDatabase } from '../../../test/helpers/database.js';

describe('Middleware - Workspace Validation', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('requireWorkspace', () => {
    it('should validate workspace header is present', async () => {
      const req = {
        headers: {},
        query: {},
        user: { id: 'user1' },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;

      await requireWorkspace(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Workspace ID is required',
      });
    });

    it('should validate user is workspace member', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);

      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id!));
      await storage.createWorkspaceMembership(createTestMembership(workspace.id!, user.id!, { role: 'admin' }));

      const req = {
        headers: { 'x-workspace-id': workspace.id },
        query: {},
        user: { id: user.id },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;

      await requireWorkspace(req, res, next);

      expect(next).toHaveBeenCalled();
      expect((req as any).workspaceId).toBe(workspace.id);
      expect((req as any).userRole).toBe('admin');
    });

    it('should block non-members from accessing workspace', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);

      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id!));

      const req = {
        headers: { 'x-workspace-id': workspace.id },
        query: {},
        user: { id: user.id },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;

      await requireWorkspace(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not a member of this workspace',
      });
    });

    it('should attach workspace role to request', async () => {
      const userData = await createTestUser();
      const user = await storage.createUser(userData);

      const tenant = await storage.createTenant(createTestTenant());
      const workspace = await storage.createWorkspace(createTestWorkspace(tenant.id!));
      await storage.createWorkspaceMembership(createTestMembership(workspace.id!, user.id!, { role: 'manager' }));

      const req = {
        headers: { 'x-workspace-id': workspace.id },
        query: {},
        user: { id: user.id },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;

      await requireWorkspace(req, res, next);

      expect((req as any).userRole).toBe('manager');
    });
  });
});
