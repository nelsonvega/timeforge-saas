import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

export async function cleanDatabase() {
  // TRUNCATE CASCADE handles dependencies automatically
  // This single statement clears all tables regardless of foreign key relationships
  await db.execute(sql`
    TRUNCATE TABLE 
      users,
      tenants,
      workspaces,
      workspace_memberships,
      clients,
      projects,
      project_assignments,
      time_entries,
      sessions
    RESTART IDENTITY CASCADE
  `);
}

export async function resetDatabase() {
  await cleanDatabase();
}
