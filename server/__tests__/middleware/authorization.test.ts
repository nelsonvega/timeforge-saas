import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireRole } from '../../middleware/authorization.js';

describe('Middleware - Authorization', () => {
  describe('requireRole', () => {
    it('should allow admin access to admin-only routes', () => {
      const req = {
        user: { id: '1', role: 'admin' },
        userRole: 'admin',
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;

      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow manager access to manager-allowed routes', () => {
      const req = {
        user: { id: '1', role: 'manager' },
        userRole: 'manager',
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;

      const middleware = requireRole('admin', 'manager');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block member from admin-only routes', () => {
      const req = {
        user: { id: '1', role: 'member' },
        userRole: 'member',
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;

      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Insufficient permissions for this workspace.',
      });
    });

    it('should block member from manager routes', () => {
      const req = {
        user: { id: '1', role: 'member' },
        userRole: 'member',
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;

      const middleware = requireRole('admin', 'manager');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should allow multiple roles', () => {
      const adminReq = {
        user: { id: '1', role: 'admin' },
        workspaceMembership: { role: 'admin' },
      } as unknown as Request;
      
      const managerReq = {
        user: { id: '2', role: 'manager' },
        workspaceMembership: { role: 'manager' },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;

      const middleware = requireRole('admin', 'manager');
      
      middleware(adminReq, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      
      middleware(managerReq, res, next);
      expect(next).toHaveBeenCalledTimes(2);
      
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fallback to user.role when no workspace membership exists', () => {
      const adminReq = {
        user: { id: '1', role: 'admin' },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;

      const middleware = requireRole('admin');
      middleware(adminReq, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block when no workspace membership and user role insufficient', () => {
      const memberReq = {
        user: { id: '1', role: 'member' },
      } as unknown as Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      
      const next = vi.fn() as NextFunction;

      const middleware = requireRole('admin');
      middleware(memberReq, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
