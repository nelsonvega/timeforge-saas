import { db } from '../../server/db.js';
import { 
  users, tenants, workspaces, workspaceMemberships,
  clients, projects, timeEntries, projectAssignments 
} from '../../shared/schema.js';

export async function cleanDatabase() {
  await db.delete(projectAssignments);
  await db.delete(timeEntries);
  await db.delete(projects);
  await db.delete(clients);
  await db.delete(workspaceMemberships);
  await db.delete(workspaces);
  await db.delete(tenants);
  await db.delete(users);
}

export async function resetDatabase() {
  await cleanDatabase();
}
