import { sql } from "drizzle-orm";
import { db } from "./db";
import { execSync } from "child_process";

const colors = {
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
};

export async function initializeDatabase() {
  console.log(colors.blue("\n🔍 Checking database status...\n"));

  try {
    // Check if the sessions table exists (one of our core tables)
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sessions'
      );
    `);

    const tablesExist = tableCheck.rows[0]?.exists;

    if (!tablesExist) {
      console.log(colors.yellow("📦 Database tables not found. Initializing database...\n"));
      
      // Run database push to create all tables
      console.log(colors.cyan("⚙️  Creating database schema...\n"));
      execSync("npm run db:push -- --force", { 
        stdio: "inherit",
        env: { ...process.env }
      });
      
      console.log(colors.green("\n✅ Database initialized successfully!\n"));
      console.log(colors.gray("All tables have been created and are ready to use.\n"));
    } else {
      // Tables exist, check if schema is up to date
      console.log(colors.green("✅ Database tables found.\n"));
      
      // Try to sync any schema changes
      try {
        console.log(colors.cyan("🔄 Checking for schema updates...\n"));
        const result = execSync("npm run db:push", { 
          encoding: 'utf-8',
          env: { ...process.env }
        });
        
        if (result.includes("No changes detected")) {
          console.log(colors.green("✅ Database schema is up to date.\n"));
        } else {
          console.log(colors.green("✅ Database schema updated successfully.\n"));
        }
      } catch (error: any) {
        // If db:push fails, it might mean the schema is already in sync
        if (error.stdout?.includes("No changes detected")) {
          console.log(colors.green("✅ Database schema is up to date.\n"));
        } else {
          console.log(colors.yellow("⚠️  Could not check for schema updates. Continuing...\n"));
        }
      }
    }

    // Verify connection
    await db.execute(sql`SELECT 1`);
    console.log(colors.green("✅ Database connection verified.\n"));
    
    return true;
  } catch (error) {
    console.error(colors.red("\n❌ Database initialization failed:"), error);
    console.error(colors.yellow("\nPlease check your DATABASE_URL and ensure PostgreSQL is accessible.\n"));
    throw error;
  }
}

export async function checkDatabaseHealth() {
  try {
    await db.execute(sql`SELECT 1`);
    return { healthy: true };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
