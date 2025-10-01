import bcrypt from 'bcrypt';
import type { InsertUser, InsertTenant, InsertWorkspace, InsertWorkspaceMembership, InsertClient, InsertProject, InsertTimeEntry } from '../../shared/schema.js';

function nanoid() {
  return Math.random().toString(36).substring(7);
}

export async function createTestUser(override?: Partial<InsertUser>): Promise<InsertUser> {
  const uniqueId = nanoid();
  const password = await bcrypt.hash(override?.password || 'password123', 10);
  
  return {
    email: override?.email || `test-${uniqueId}@example.com`,
    password,
    firstName: override?.firstName || 'Test',
    lastName: override?.lastName || 'User',
    name: override?.name || 'Test User',
    username: override?.username || `testuser${uniqueId}`,
    role: override?.role || 'member',
    ...override,
  };
}

export function createTestTenant(override?: Partial<InsertTenant>): InsertTenant {
  const id = nanoid();
  
  return {
    name: override?.name || `Test Company ${id}`,
    slug: override?.slug || `test-company-${id}`,
    plan: override?.plan || 'free',
    status: override?.status || 'active',
    ...override,
  };
}

export function createTestWorkspace(tenantId: string, override?: Partial<InsertWorkspace>): InsertWorkspace {
  const id = nanoid();
  
  return {
    tenantId,
    name: override?.name || `Test Workspace ${id}`,
    slug: override?.slug || `test-workspace-${id}`,
    timezone: override?.timezone || 'UTC',
    status: override?.status || 'active',
    ...override,
  };
}

export function createTestMembership(
  workspaceId: string,
  userId: string,
  override?: Partial<InsertWorkspaceMembership>
): InsertWorkspaceMembership {
  return {
    workspaceId,
    userId,
    role: override?.role || 'member',
    title: override?.title,
    invitedBy: override?.invitedBy,
    ...override,
  };
}

export function createTestClient(workspaceId: string, override?: Partial<InsertClient>): InsertClient {
  const id = nanoid();
  
  return {
    workspaceId,
    name: override?.name || `Test Client ${id}`,
    email: override?.email || `client-${id}@example.com`,
    phone: override?.phone || '+1234567890',
    address: override?.address,
    notes: override?.notes,
    status: override?.status || 'active',
    ...override,
  };
}

export function createTestProject(
  workspaceId: string,
  clientId: string,
  override?: Partial<InsertProject>
): InsertProject {
  const id = nanoid();
  
  return {
    workspaceId,
    clientId,
    name: override?.name || `Test Project ${id}`,
    budget: override?.budget || '10000',
    status: override?.status || 'active',
    ...override,
  };
}

export function createTestTimeEntry(
  workspaceId: string,
  userId: string,
  projectId: string,
  override?: Partial<InsertTimeEntry>
): InsertTimeEntry {
  return {
    workspaceId,
    userId,
    projectId,
    description: override?.description || 'Test time entry',
    startTime: override?.startTime || new Date(),
    endTime: override?.endTime,
    duration: override?.duration || 60,
    isBillable: override?.isBillable ?? true,
    ...override,
  };
}

export interface TestHierarchy {
  user: any;
  tenant: any;
  workspace: any;
  membership: any;
}
