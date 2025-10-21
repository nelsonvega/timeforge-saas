#!/usr/bin/env tsx
/**
 * Database Connection Test Script
 *
 * Tests your DATABASE_URL configuration and verifies connectivity
 * Usage: npm run test:db or tsx scripts/test-db-connection.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { pool } from "../server/db";

const colors = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
};

async function testConnection() {
  console.log(colors.blue("\n🔍 Testing Database Connection...\n"));

  if (!process.env.DATABASE_URL) {
    console.error(colors.red("❌ ERROR: DATABASE_URL is not set in .env file\n"));
    process.exit(1);
  }

  // Parse connection info (hide password)
  const dbUrl = process.env.DATABASE_URL;
  const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/(.+?)(\?.*)?$/);

  if (urlMatch) {
    const [, user, , host, port, database] = urlMatch;
    console.log(colors.cyan("📋 Connection Details:"));
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port || '5432'}`);
    console.log(`   User: ${user}`);
    console.log(`   Database: ${database.split('?')[0]}`);
    console.log(`   SSL: ${dbUrl.includes('sslmode=require') || process.env.DB_SSL === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log();
  }

  try {
    console.log(colors.yellow("⏳ Connecting to database..."));

    // Test basic connection
    const client = await pool.connect();
    console.log(colors.green("✅ Connection successful!\n"));

    // Test query
    console.log(colors.yellow("⏳ Running test query..."));
    const result = await client.query('SELECT version(), current_database(), current_user');

    console.log(colors.green("✅ Query successful!\n"));
    console.log(colors.cyan("📊 Database Information:"));
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    console.log(`   Current Database: ${result.rows[0].current_database}`);
    console.log(`   Current User: ${result.rows[0].current_user}`);
    console.log();

    // Check for existing tables
    console.log(colors.yellow("⏳ Checking for application tables..."));
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log(colors.yellow("⚠️  No tables found. Run 'npm run db:push' to create schema.\n"));
    } else {
      console.log(colors.green(`✅ Found ${tablesResult.rows.length} tables:\n`));
      tablesResult.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });
      console.log();
    }

    client.release();

    console.log(colors.green("✅ All tests passed! Your database is ready.\n"));
    process.exit(0);

  } catch (error: any) {
    console.error(colors.red("\n❌ Connection failed!\n"));

    if (error.code === 'ECONNREFUSED') {
      console.error(colors.yellow("   PostgreSQL server is not running or not accessible."));
      console.error(colors.yellow("   - Check if PostgreSQL is running"));
      console.error(colors.yellow("   - Verify host and port in DATABASE_URL"));
      console.error(colors.yellow("   - Check firewall settings\n"));
    } else if (error.code === '28P01') {
      console.error(colors.yellow("   Authentication failed."));
      console.error(colors.yellow("   - Check username and password in DATABASE_URL"));
      console.error(colors.yellow("   - Verify user exists in PostgreSQL\n"));
    } else if (error.code === '3D000') {
      console.error(colors.yellow("   Database does not exist."));
      console.error(colors.yellow("   - Create the database in PostgreSQL"));
      console.error(colors.yellow(`   - Run: createdb ${process.env.PGDATABASE || 'FocusFlow'}\n`));
    } else if (error.message?.includes('SSL')) {
      console.error(colors.yellow("   SSL connection error."));
      console.error(colors.yellow("   - For local connections, remove 'sslmode=require' from DATABASE_URL"));
      console.error(colors.yellow("   - For self-signed certs, set DB_SSL_REJECT_UNAUTHORIZED=false\n"));
    } else {
      console.error(colors.yellow("   Error details:"));
      console.error(`   ${error.message}\n`);
    }

    console.error(colors.cyan("💡 Need help? See docs/DATABASE_SETUP.md\n"));
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
