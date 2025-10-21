import dotenv from "dotenv";
dotenv.config();

import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = process.env.DATABASE_URL;
const isNeonDatabase = databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.dev');

let pool: NeonPool | pg.Pool;
let db: ReturnType<typeof neonDrizzle> | ReturnType<typeof pgDrizzle>;

if (isNeonDatabase) {
  // Use Neon serverless driver for Neon databases
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: databaseUrl });
  db = neonDrizzle({ client: pool, schema });
} else {
  // Use standard PostgreSQL driver for local and network databases
  const poolConfig: pg.PoolConfig = {
    connectionString: databaseUrl,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
  };

  // Configure SSL for network connections
  const dbSsl = process.env.DB_SSL === 'true';
  const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

  if (dbSsl || (!isLocalhost && databaseUrl.includes('sslmode=require'))) {
    poolConfig.ssl = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    };
  }

  pool = new pg.Pool(poolConfig);

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });

  db = pgDrizzle({ client: pool, schema });
}

export { pool, db };
