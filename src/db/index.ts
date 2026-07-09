import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

// Function to create a new connection pool.
export const createPool = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_URL;
  if (connectionString) {
    return new Pool({
      connectionString,
      connectionTimeoutMillis: 15000,
    });
  }
  return new Pool({
    host: process.env.SQL_HOST || process.env.DB_HOST || process.env.PGHOST,
    user: process.env.SQL_USER || process.env.DB_USER || process.env.PGUSER,
    password: process.env.SQL_PASSWORD || process.env.DB_PASSWORD || process.env.PGPASSWORD,
    database: process.env.SQL_DB_NAME || process.env.DB_NAME || process.env.PGDATABASE,
    port: Number(process.env.SQL_PORT || process.env.DB_PORT || process.env.PGPORT || 5432),
    connectionTimeoutMillis: 15000,
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Initialize Drizzle with the pool and schema.
export const db = drizzle({ client: pool, schema });
