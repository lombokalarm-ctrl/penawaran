import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file.
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_URL;

const sqlHost = process.env.SQL_HOST || process.env.DB_HOST || process.env.PGHOST;
const sqlDbName = process.env.SQL_DB_NAME || process.env.DB_NAME || process.env.PGDATABASE;
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER || process.env.DB_USER || process.env.PGUSER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || process.env.DB_PASSWORD || process.env.PGPASSWORD;
const port = Number(process.env.SQL_PORT || process.env.DB_PORT || process.env.PGPORT || 5432);

if (!connectionString && (!sqlHost || !sqlDbName || !user)) {
  console.warn("⚠️ Warning: Database environment variables are partially missing. Drizzle-kit may fail if not configured.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle", // Output directory for migrations.
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: connectionString ? {
    url: connectionString,
  } : {
    host: sqlHost || 'localhost',
    port: port,
    user: user || 'postgres',
    password: password || '',
    database: sqlDbName || 'postgres',
    ssl: false,
  },
  verbose: true, // Enable verbose output.
});
