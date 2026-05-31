import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { URL } from 'url';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');

async function connectWithUrl(url, label) {
  console.log(`\n=== Trying ${label} ===`);
  console.log(`URL: ${url.substring(0, 40)}...`);

  // Parse the URL and create Pool with proper SSL config
  const parsed = new URL(url);

  const pool = new Pool({
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432'),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
    ssl: {
      rejectUnauthorized: false,
      sslmode: 'require',
    },
    connectionTimeoutMillis: 30000,
  });

  try {
    const client = await pool.connect();
    console.log(`Connected via ${label}!`);
    const sql = readFileSync('supabase/migrations/20260115_arrival_workflow_ratings.sql', 'utf8');
    console.log(`Migration: ${sql.length} chars`);
    await client.query(sql);
    console.log('✅ Migration applied successfully!');
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.error(`${label} failed:`, err.message?.substring(0, 250));
    await pool.end();
    return false;
  }
}

async function main() {
  const envContent = readFileSync('.env.local', 'utf8');

  const nonPoolingMatch = envContent.match(/POSTGRES_URL_NON_POOLING="?([^"\n]+)/);
  if (nonPoolingMatch) {
    const url = nonPoolingMatch[1].trim();
    const success = await connectWithUrl(url, 'POSTGRES_URL_NON_POOLING');
    if (success) process.exit(0);
  }

  // Try POSTGRES_PRISMA_URL as another option
  const prismaMatch = envContent.match(/POSTGRES_PRISMA_URL="?([^"\n]+)/);
  if (prismaMatch) {
    const url = prismaMatch[1].trim();
    const success = await connectWithUrl(url, 'POSTGRES_PRISMA_URL');
    if (success) process.exit(0);
  }

  // Try POSTGRES_URL (pooled)
  const pgUrlMatch = envContent.match(/POSTGRES_URL="?([^"\n]+)/);
  if (pgUrlMatch) {
    const url = pgUrlMatch[1].trim();
    const success = await connectWithUrl(url, 'POSTGRES_URL');
    if (success) process.exit(0);
  }

  console.error('\n❌ All connection attempts failed.');
  console.log('\nTo apply the migration manually:');
  console.log('1. Go to https://supabase.com/dashboard/project/solrsmnkxklsqklqhgxf/sql/new');
  console.log('2. Copy the entire content of supabase/migrations/20260115_arrival_workflow_ratings.sql');
  console.log('3. Paste and run');
  process.exit(1);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
