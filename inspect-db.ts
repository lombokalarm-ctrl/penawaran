import * as dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables
dotenv.config();

console.log('===================================================');
console.log('🔍 DATABASE INSPECTOR SCRIPT');
console.log('===================================================\n');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DB_URL;

const host = process.env.SQL_HOST || process.env.DB_HOST || process.env.PGHOST;
const user = process.env.SQL_USER || process.env.DB_USER || process.env.PGUSER || process.env.SQL_ADMIN_USER;
const password = process.env.SQL_PASSWORD || process.env.DB_PASSWORD || process.env.PGPASSWORD || process.env.SQL_ADMIN_PASSWORD;
const database = process.env.SQL_DB_NAME || process.env.DB_NAME || process.env.PGDATABASE;
const port = Number(process.env.SQL_PORT || process.env.DB_PORT || process.env.PGPORT || 5432);

// Setup pool
let pool: any;
if (connectionString) {
  console.log('✅ Connection string detected. Connecting via DATABASE_URL...');
  // Redact connection string for security logs
  const redacted = connectionString.replace(/:([^:@]+)@/, ':******@');
  console.log(`🔗 Target: ${redacted}`);
  pool = new Pool({ connectionString, connectionTimeoutMillis: 10000 });
} else {
  console.log('✅ Connecting via individual parameters...');
  console.log(`📡 Host:     ${host || 'localhost'}`);
  console.log(`🔌 Port:     ${port}`);
  console.log(`👤 User:     ${user || 'postgres'}`);
  console.log(`🗄️ Database: ${database || 'postgres'}`);
  pool = new Pool({
    host: host || 'localhost',
    port: port,
    user: user || 'postgres',
    password: password || '',
    database: database || 'postgres',
    connectionTimeoutMillis: 10000,
  });
}

async function run() {
  const client = await pool.connect();
  try {
    // 1. Check Connection
    console.log('\n🔄 Testing database connection...');
    const timeRes = await client.query('SELECT NOW() as now, version() as version;');
    console.log(`✨ Connection Successful!`);
    console.log(`⏰ DB Server Time: ${timeRes.rows[0].now}`);
    console.log(`📦 DB Engine Version: ${timeRes.rows[0].version}\n`);

    // 2. List Tables in the 'public' schema
    console.log('---------------------------------------------------');
    console.log('📋 SCHEMAS & TABLES LIST');
    console.log('---------------------------------------------------');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    const tablesRes = await client.query(tablesQuery);
    const tables = tablesRes.rows.map((row: any) => row.table_name);

    if (tables.length === 0) {
      console.log('⚠️ No tables found in the "public" schema!');
      console.log('💡 Tip: Have you pushed the schema? Run: npm run db:push');
      return;
    }

    console.log(`Found ${tables.length} tables: ${tables.join(', ')}\n`);

    // 3. Inspect columns and count rows for each table
    for (const table of tables) {
      console.log(`\n🔹 Table: [${table}]`);
      
      // Get count
      const countRes = await client.query(`SELECT COUNT(*) as total FROM "${table}"`);
      console.log(`📊 Total rows: ${countRes.rows[0].total}`);

      // Get columns
      const colsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `;
      const colsRes = await client.query(colsQuery, [table]);
      console.log('📐 Schema columns:');
      colsRes.rows.forEach((col: any) => {
        console.log(`   - ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable}`);
      });

      // Sample data
      if (Number(countRes.rows[0].total) > 0) {
        console.log('📝 Sample records (up to 3):');
        const dataRes = await client.query(`SELECT * FROM "${table}" LIMIT 3`);
        dataRes.rows.forEach((row: any, idx: number) => {
          // Redact sensitive info for display
          const sanitizedRow = { ...row };
          if ('password' in sanitizedRow) sanitizedRow.password = '***REDACTED***';
          if ('password_hash' in sanitizedRow) sanitizedRow.password_hash = '***REDACTED***';
          if ('passwordHash' in sanitizedRow) sanitizedRow.passwordHash = '***REDACTED***';
          if ('token' in sanitizedRow && sanitizedRow.token) {
            sanitizedRow.token = sanitizedRow.token.substring(0, 10) + '...';
          }
          console.log(`   [Record ${idx + 1}]:`, JSON.stringify(sanitizedRow, null, 2).split('\n').map(l => '     ' + l).join('\n').trim());
        });
      } else {
        console.log('💨 Table is currently empty.');
      }
      console.log('---------------------------------------------------');
    }

  } catch (err: any) {
    console.error('\n❌ Error occurred during database inspection:');
    console.error(err.stack || err);
    console.log('\n💡 Tip: Double check your .env file credentials on the VPS.');
  } finally {
    client.release();
    await pool.end();
    console.log('\n🏁 Inspection finished.');
  }
}

run();
