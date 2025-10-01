import type { Application } from 'express';
import request from 'supertest';
import { storage } from '../../server/storage';
import { createTestUser, createTestTenant, createTestWorkspace, createTestMembership, type TestHierarchy } from './fixtures';

export async function createAuthenticatedUser(
  app: Application,
  role: 'admin' | 'manager' | 'member' = 'admin',
  plan: 'free' | 'paid' = 'free'
): Promise<TestHierarchy> {
  const userData = await createTestUser({ role });
  const user = await storage.createUser(userData);

  const tenantData = createTestTenant({ plan });
  const tenant = await storage.createTenant(tenantData);

  const workspaceData = createTestWorkspace(tenant.id!);
  const workspace = await storage.createWorkspace(workspaceData);

  const membershipData = createTestMembership(workspace.id!, user.id!, { role });
  const membership = await storage.createWorkspaceMembership(membershipData);

  return { user, tenant, workspace, membership };
}

export async function getAuthCookie(app: Application, email: string, password: string = 'password123'): Promise<string> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  const cookies = response.headers['set-cookie'];
  if (!cookies || !cookies.length) {
    throw new Error('No auth cookie returned from login');
  }

  return Array.isArray(cookies) ? cookies[0] : cookies;
}

export function extractWorkspaceHeader(workspaceId: string) {
  return { 'x-workspace-id': workspaceId };
}

export async function loginAsUser(
  app: Application,
  hierarchy: TestHierarchy
): Promise<{ cookie: string; headers: Record<string, string> }> {
  const cookie = await getAuthCookie(app, hierarchy.user.email);
  const headers = extractWorkspaceHeader(hierarchy.workspace.id!);

  return { cookie, headers };
}
