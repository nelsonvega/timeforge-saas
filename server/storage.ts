import type {
  User, InsertUser, UpsertUser,
  Tenant, InsertTenant,
  Workspace, InsertWorkspace,
  WorkspaceMembership, InsertWorkspaceMembership,
  Client, InsertClient,
  Project, InsertProject,
  TimeEntry, InsertTimeEntry,
  ProjectAssignment, InsertProjectAssignment,
  Group, InsertGroup,
  GroupMember, InsertGroupMember,
  GroupClientAssignment, InsertGroupClientAssignment,
  GroupProjectAssignment, InsertGroupProjectAssignment
} from "@shared/schema";
import { db } from "./db";
import {
  users, tenants, workspaces, workspaceMemberships,
  clients, projects, timeEntries, projectAssignments,
  groups, groupMembers, groupClientAssignments, groupProjectAssignments
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface DashboardMetrics {
  totalHours: number;
  billablePercentage: number;
  activeProjects: number;
  utilizationRate: number;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Tenants
  getTenant(id: string): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, tenant: Partial<InsertTenant>): Promise<Tenant | undefined>;
  updateTenantStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<Tenant | undefined>;

  // Workspaces
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getWorkspacesByTenant(tenantId: string): Promise<Workspace[]>;
  getUserWorkspaces(userId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, workspace: Partial<InsertWorkspace>): Promise<Workspace | undefined>;
  deleteWorkspace(id: string): Promise<boolean>;

  // Workspace Memberships
  getWorkspaceMembership(workspaceId: string, userId: string): Promise<WorkspaceMembership | undefined>;
  getWorkspaceMemberships(workspaceId: string): Promise<WorkspaceMembership[]>;
  getUserMemberships(userId: string): Promise<WorkspaceMembership[]>;
  createWorkspaceMembership(membership: InsertWorkspaceMembership): Promise<WorkspaceMembership>;
  updateWorkspaceMembership(id: string, membership: Partial<InsertWorkspaceMembership>): Promise<WorkspaceMembership | undefined>;
  removeWorkspaceMembership(workspaceId: string, userId: string): Promise<boolean>;

  // Clients
  getClient(workspaceId: string, id: string): Promise<Client | undefined>;
  getAllClients(workspaceId: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(workspaceId: string, id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(workspaceId: string, id: string): Promise<boolean>;

  // Projects
  getProject(workspaceId: string, id: string): Promise<Project | undefined>;
  getAllProjects(workspaceId: string): Promise<Project[]>;
  getProjectsByClient(workspaceId: string, clientId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(workspaceId: string, id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(workspaceId: string, id: string): Promise<boolean>;

  // Time Entries
  getTimeEntry(workspaceId: string, id: string): Promise<TimeEntry | undefined>;
  getAllTimeEntries(workspaceId: string): Promise<TimeEntry[]>;
  getTimeEntriesByUser(workspaceId: string, userId: string): Promise<TimeEntry[]>;
  getTimeEntriesByProject(workspaceId: string, projectId: string): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(workspaceId: string, id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(workspaceId: string, id: string): Promise<boolean>;

  // Project Assignments
  assignUserToProject(assignment: InsertProjectAssignment): Promise<ProjectAssignment>;
  getProjectAssignments(workspaceId: string, projectId: string): Promise<ProjectAssignment[]>;
  getUserAssignments(workspaceId: string, userId: string): Promise<ProjectAssignment[]>;
  removeUserFromProject(workspaceId: string, userId: string, projectId: string): Promise<boolean>;

  // Groups
  createGroup(group: InsertGroup): Promise<Group>;
  getGroups(workspaceId: string): Promise<Group[]>;
  getGroup(workspaceId: string, id: string): Promise<Group | undefined>;
  updateGroup(workspaceId: string, id: string, group: Partial<InsertGroup>): Promise<Group | undefined>;
  deleteGroup(workspaceId: string, id: string): Promise<boolean>;

  // Group Members
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(workspaceId: string, groupId: string): Promise<GroupMember[]>;
  removeGroupMember(workspaceId: string, groupId: string, userId: string): Promise<boolean>;

  // Group-Client Assignments
  assignGroupToClient(assignment: InsertGroupClientAssignment): Promise<GroupClientAssignment>;
  getGroupClients(workspaceId: string, groupId: string): Promise<Client[]>;
  removeGroupFromClient(workspaceId: string, groupId: string, clientId: string): Promise<boolean>;

  // Group-Project Assignments
  assignGroupToProject(assignment: InsertGroupProjectAssignment): Promise<GroupProjectAssignment>;
  getGroupProjects(workspaceId: string, groupId: string): Promise<Project[]>;
  removeGroupFromProject(workspaceId: string, groupId: string, projectId: string): Promise<boolean>;

  // Dashboard
  getDashboardMetrics(workspaceId: string): Promise<DashboardMetrics>;
}

export class DbStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Tenants
  async getTenant(id: string): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return result[0];
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const result = await db.insert(tenants).values(tenant).returning();
    return result[0];
  }

  async updateTenant(id: string, tenant: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const result = await db.update(tenants).set(tenant).where(eq(tenants.id, id)).returning();
    return result[0];
  }

  async updateTenantStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<Tenant | undefined> {
    const result = await db.update(tenants)
      .set({ 
        stripeCustomerId, 
        stripeSubscriptionId,
        plan: 'paid',
        updatedAt: new Date() 
      })
      .where(eq(tenants.id, id))
      .returning();
    return result[0];
  }

  // Workspaces
  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const result = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
    return result[0];
  }

  async getWorkspacesByTenant(tenantId: string): Promise<Workspace[]> {
    return await db.select().from(workspaces).where(eq(workspaces.tenantId, tenantId)).orderBy(desc(workspaces.createdAt));
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const memberships = await db
      .select({ workspace: workspaces })
      .from(workspaceMemberships)
      .innerJoin(workspaces, eq(workspaceMemberships.workspaceId, workspaces.id))
      .where(eq(workspaceMemberships.userId, userId))
      .orderBy(desc(workspaces.createdAt));
    return memberships.map(m => m.workspace);
  }

  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const result = await db.insert(workspaces).values(workspace).returning();
    return result[0];
  }

  async updateWorkspace(id: string, workspace: Partial<InsertWorkspace>): Promise<Workspace | undefined> {
    const result = await db.update(workspaces).set(workspace).where(eq(workspaces.id, id)).returning();
    return result[0];
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const result = await db.delete(workspaces).where(eq(workspaces.id, id)).returning();
    return result.length > 0;
  }

  // Workspace Memberships
  async getWorkspaceMembership(workspaceId: string, userId: string): Promise<WorkspaceMembership | undefined> {
    const result = await db
      .select()
      .from(workspaceMemberships)
      .where(and(eq(workspaceMemberships.workspaceId, workspaceId), eq(workspaceMemberships.userId, userId)))
      .limit(1);
    return result[0];
  }

  async getWorkspaceMemberships(workspaceId: string): Promise<WorkspaceMembership[]> {
    return await db
      .select()
      .from(workspaceMemberships)
      .where(eq(workspaceMemberships.workspaceId, workspaceId))
      .orderBy(desc(workspaceMemberships.joinedAt));
  }

  async getUserMemberships(userId: string): Promise<WorkspaceMembership[]> {
    return await db
      .select()
      .from(workspaceMemberships)
      .where(eq(workspaceMemberships.userId, userId))
      .orderBy(desc(workspaceMemberships.joinedAt));
  }

  async createWorkspaceMembership(membership: InsertWorkspaceMembership): Promise<WorkspaceMembership> {
    const result = await db.insert(workspaceMemberships).values(membership).returning();
    return result[0];
  }

  async updateWorkspaceMembership(id: string, membership: Partial<InsertWorkspaceMembership>): Promise<WorkspaceMembership | undefined> {
    const result = await db.update(workspaceMemberships).set(membership).where(eq(workspaceMemberships.id, id)).returning();
    return result[0];
  }

  async removeWorkspaceMembership(workspaceId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(workspaceMemberships)
      .where(and(eq(workspaceMemberships.workspaceId, workspaceId), eq(workspaceMemberships.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Clients
  async getClient(workspaceId: string, id: string): Promise<Client | undefined> {
    const result = await db
      .select()
      .from(clients)
      .where(and(eq(clients.workspaceId, workspaceId), eq(clients.id, id)))
      .limit(1);
    return result[0];
  }

  async getAllClients(workspaceId: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.workspaceId, workspaceId))
      .orderBy(desc(clients.createdAt));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(client).returning();
    return result[0];
  }

  async updateClient(workspaceId: string, id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db
      .update(clients)
      .set(client)
      .where(and(eq(clients.workspaceId, workspaceId), eq(clients.id, id)))
      .returning();
    return result[0];
  }

  async deleteClient(workspaceId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(clients)
      .where(and(eq(clients.workspaceId, workspaceId), eq(clients.id, id)))
      .returning();
    return result.length > 0;
  }

  // Projects
  async getProject(workspaceId: string, id: string): Promise<Project | undefined> {
    const result = await db
      .select()
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.id, id)))
      .limit(1);
    return result[0];
  }

  async getAllProjects(workspaceId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId))
      .orderBy(desc(projects.createdAt));
  }

  async getProjectsByClient(workspaceId: string, clientId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.clientId, clientId)));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  async updateProject(workspaceId: string, id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db
      .update(projects)
      .set(project)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.id, id)))
      .returning();
    return result[0];
  }

  async deleteProject(workspaceId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.id, id)))
      .returning();
    return result.length > 0;
  }

  // Time Entries
  async getTimeEntry(workspaceId: string, id: string): Promise<TimeEntry | undefined> {
    const result = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.workspaceId, workspaceId), eq(timeEntries.id, id)))
      .limit(1);
    return result[0];
  }

  async getAllTimeEntries(workspaceId: string): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.workspaceId, workspaceId))
      .orderBy(desc(timeEntries.startTime));
  }

  async getTimeEntriesByUser(workspaceId: string, userId: string): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.workspaceId, workspaceId), eq(timeEntries.userId, userId)))
      .orderBy(desc(timeEntries.startTime));
  }

  async getTimeEntriesByProject(workspaceId: string, projectId: string): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.workspaceId, workspaceId), eq(timeEntries.projectId, projectId)))
      .orderBy(desc(timeEntries.startTime));
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const result = await db.insert(timeEntries).values(entry).returning();
    return result[0];
  }

  async updateTimeEntry(workspaceId: string, id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const result = await db
      .update(timeEntries)
      .set(entry)
      .where(and(eq(timeEntries.workspaceId, workspaceId), eq(timeEntries.id, id)))
      .returning();
    return result[0];
  }

  async deleteTimeEntry(workspaceId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(timeEntries)
      .where(and(eq(timeEntries.workspaceId, workspaceId), eq(timeEntries.id, id)))
      .returning();
    return result.length > 0;
  }

  // Project Assignments
  async assignUserToProject(assignment: InsertProjectAssignment): Promise<ProjectAssignment> {
    const result = await db.insert(projectAssignments).values(assignment).returning();
    return result[0];
  }

  async getProjectAssignments(workspaceId: string, projectId: string): Promise<ProjectAssignment[]> {
    return await db
      .select()
      .from(projectAssignments)
      .where(and(eq(projectAssignments.workspaceId, workspaceId), eq(projectAssignments.projectId, projectId)));
  }

  async getUserAssignments(workspaceId: string, userId: string): Promise<ProjectAssignment[]> {
    return await db
      .select()
      .from(projectAssignments)
      .where(and(eq(projectAssignments.workspaceId, workspaceId), eq(projectAssignments.userId, userId)));
  }

  async removeUserFromProject(workspaceId: string, userId: string, projectId: string): Promise<boolean> {
    const result = await db
      .delete(projectAssignments)
      .where(
        and(
          eq(projectAssignments.workspaceId, workspaceId),
          eq(projectAssignments.userId, userId),
          eq(projectAssignments.projectId, projectId)
        )
      )
      .returning();
    return result.length > 0;
  }

  // Dashboard
  async getDashboardMetrics(workspaceId: string): Promise<DashboardMetrics> {
    const allEntries = await this.getAllTimeEntries(workspaceId);
    const allProjects = await this.getAllProjects(workspaceId);
    
    const totalMinutes = allEntries
      .filter(entry => entry.duration)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    
    const billableMinutes = allEntries
      .filter(entry => entry.isBillable && entry.duration)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const billablePercentage = totalMinutes > 0 
      ? Math.round((billableMinutes / totalMinutes) * 100) 
      : 0;
    
    const activeProjects = allProjects.filter(p => p.status === 'active').length;
    
    const utilizationRate = totalMinutes > 0 ? Math.min(100, Math.round((totalMinutes / (40 * 60)) * 100)) : 0;
    
    return {
      totalHours,
      billablePercentage,
      activeProjects,
      utilizationRate,
    };
  }

  // Groups
  async createGroup(group: InsertGroup): Promise<Group> {
    const result = await db.insert(groups).values(group).returning();
    return result[0];
  }

  async getGroups(workspaceId: string): Promise<Group[]> {
    return await db
      .select()
      .from(groups)
      .where(eq(groups.workspaceId, workspaceId))
      .orderBy(desc(groups.createdAt));
  }

  async getGroup(workspaceId: string, id: string): Promise<Group | undefined> {
    const result = await db
      .select()
      .from(groups)
      .where(and(eq(groups.workspaceId, workspaceId), eq(groups.id, id)))
      .limit(1);
    return result[0];
  }

  async updateGroup(workspaceId: string, id: string, group: Partial<InsertGroup>): Promise<Group | undefined> {
    // Ensure workspaceId cannot be modified (defensive constraint)
    const { workspaceId: _ignored, ...safeUpdate } = group;
    
    const result = await db
      .update(groups)
      .set(safeUpdate)
      .where(and(eq(groups.workspaceId, workspaceId), eq(groups.id, id)))
      .returning();
    return result[0];
  }

  async deleteGroup(workspaceId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(groups)
      .where(and(eq(groups.workspaceId, workspaceId), eq(groups.id, id)))
      .returning();
    return result.length > 0;
  }

  // Group Members
  async addGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const result = await db.insert(groupMembers).values(member).returning();
    return result[0];
  }

  async getGroupMembers(workspaceId: string, groupId: string): Promise<GroupMember[]> {
    return await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.workspaceId, workspaceId), eq(groupMembers.groupId, groupId)));
  }

  async removeGroupMember(workspaceId: string, groupId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(groupMembers)
      .where(and(
        eq(groupMembers.workspaceId, workspaceId),
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      ))
      .returning();
    return result.length > 0;
  }

  // Group-Client Assignments
  async assignGroupToClient(assignment: InsertGroupClientAssignment): Promise<GroupClientAssignment> {
    const result = await db.insert(groupClientAssignments).values(assignment).returning();
    return result[0];
  }

  async getGroupClients(workspaceId: string, groupId: string): Promise<Client[]> {
    const assignments = await db
      .select()
      .from(groupClientAssignments)
      .where(and(
        eq(groupClientAssignments.workspaceId, workspaceId),
        eq(groupClientAssignments.groupId, groupId)
      ));

    const clientIds = assignments.map(a => a.clientId);
    if (clientIds.length === 0) return [];

    return await db
      .select()
      .from(clients)
      .where(and(
        eq(clients.workspaceId, workspaceId),
        // @ts-ignore - inArray is valid for varchar fields
        clients.id.in(clientIds)
      ));
  }

  async removeGroupFromClient(workspaceId: string, groupId: string, clientId: string): Promise<boolean> {
    const result = await db
      .delete(groupClientAssignments)
      .where(and(
        eq(groupClientAssignments.workspaceId, workspaceId),
        eq(groupClientAssignments.groupId, groupId),
        eq(groupClientAssignments.clientId, clientId)
      ))
      .returning();
    return result.length > 0;
  }

  // Group-Project Assignments
  async assignGroupToProject(assignment: InsertGroupProjectAssignment): Promise<GroupProjectAssignment> {
    const result = await db.insert(groupProjectAssignments).values(assignment).returning();
    return result[0];
  }

  async getGroupProjects(workspaceId: string, groupId: string): Promise<Project[]> {
    const assignments = await db
      .select()
      .from(groupProjectAssignments)
      .where(and(
        eq(groupProjectAssignments.workspaceId, workspaceId),
        eq(groupProjectAssignments.groupId, groupId)
      ));

    const projectIds = assignments.map(a => a.projectId);
    if (projectIds.length === 0) return [];

    return await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.workspaceId, workspaceId),
        // @ts-ignore - inArray is valid for varchar fields
        projects.id.in(projectIds)
      ));
  }

  async removeGroupFromProject(workspaceId: string, groupId: string, projectId: string): Promise<boolean> {
    const result = await db
      .delete(groupProjectAssignments)
      .where(and(
        eq(groupProjectAssignments.workspaceId, workspaceId),
        eq(groupProjectAssignments.groupId, groupId),
        eq(groupProjectAssignments.projectId, projectId)
      ))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DbStorage();
