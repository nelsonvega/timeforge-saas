import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

export async function cleanDatabase() {
  // Query all tables in public schema (excluding system tables)
  const tables = await db.execute<{ tablename: string }>(sql`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
  `);

  if (tables.rows.length === 0) {
    return;
  }

  // Build TRUNCATE statement with all tables
  const tableNames = tables.rows.map(row => `"${row.tablename}"`).join(', ');
  await db.execute(sql.raw(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`));
}

export async function resetDatabase() {
  await cleanDatabase();
}
