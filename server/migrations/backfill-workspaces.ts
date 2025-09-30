import { db } from "../db";
import { tenants, workspaces, workspaceMemberships, clients, projects, timeEntries, projectAssignments, users } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

export async function backfillWorkspaces() {
  console.log("Starting workspace backfill migration...");

  const defaultTenant = await db
    .insert(tenants)
    .values({
      name: "Default Organization",
      slug: "default-org",
      status: "active",
    })
    .onConflictDoNothing()
    .returning();

  const tenantId = defaultTenant[0]?.id || (await db.select().from(tenants).where(eq(tenants.slug, "default-org")).then(r => r[0].id));

  console.log(`Tenant created/found: ${tenantId}`);

  const defaultWorkspace = await db
    .insert(workspaces)
    .values({
      tenantId,
      name: "Default Workspace",
      slug: "default",
      timezone: "UTC",
      status: "active",
    })
    .onConflictDoNothing()
    .returning();

  const workspaceId = defaultWorkspace[0]?.id || (await db.select().from(workspaces).where(eq(workspaces.slug, "default")).then(r => r[0].id));

  console.log(`Workspace created/found: ${workspaceId}`);

  const allUsers = await db.select().from(users);
  console.log(`Found ${allUsers.length} users to migrate`);

  for (const user of allUsers) {
    const existingMembership = await db
      .select()
      .from(workspaceMemberships)
      .where(eq(workspaceMemberships.userId, user.id));

    if (existingMembership.length === 0) {
      await db.insert(workspaceMemberships).values({
        workspaceId,
        userId: user.id,
        role: user.role || "member",
        title: null,
        invitedBy: null,
      });
      console.log(`Created membership for user: ${user.email}`);
    }
  }

  const clientsToUpdate = await db.select().from(clients).where(isNull(clients.workspaceId));
  console.log(`Updating ${clientsToUpdate.length} clients`);
  
  if (clientsToUpdate.length > 0) {
    await db.update(clients)
      .set({ workspaceId })
      .where(isNull(clients.workspaceId));
  }

  const projectsToUpdate = await db.select().from(projects).where(isNull(projects.workspaceId));
  console.log(`Updating ${projectsToUpdate.length} projects`);
  
  if (projectsToUpdate.length > 0) {
    await db.update(projects)
      .set({ workspaceId })
      .where(isNull(projects.workspaceId));
  }

  const timeEntriesToUpdate = await db.select().from(timeEntries).where(isNull(timeEntries.workspaceId));
  console.log(`Updating ${timeEntriesToUpdate.length} time entries`);
  
  if (timeEntriesToUpdate.length > 0) {
    await db.update(timeEntries)
      .set({ workspaceId })
      .where(isNull(timeEntries.workspaceId));
  }

  const assignmentsToUpdate = await db.select().from(projectAssignments).where(isNull(projectAssignments.workspaceId));
  console.log(`Updating ${assignmentsToUpdate.length} project assignments`);
  
  if (assignmentsToUpdate.length > 0) {
    await db.update(projectAssignments)
      .set({ workspaceId })
      .where(isNull(projectAssignments.workspaceId));
  }

  console.log("Workspace backfill migration completed successfully!");
  return { tenantId, workspaceId };
}

backfillWorkspaces()
  .then(() => {
    console.log("Migration complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
