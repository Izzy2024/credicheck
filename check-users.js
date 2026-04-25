const { Client } = require('pg');

async function main() {
  // Read DATABASE_URL from backend/.env
  const fs = require('fs');
  const envContent = fs.readFileSync(__dirname + '/backend/.env', 'utf8');
  const match = envContent.match(/DATABASE_URL="(.+)"/);
  if (!match) {
    console.error('DATABASE_URL not found in backend/.env');
    process.exit(1);
  }
  
  const dbUrl = match[1];
  // neon pooler uses pgborncr? convert to non-pooler for admin queries
  const directUrl = dbUrl.replace('-pooler', '');
  
  const client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  try {
    // List users
    console.log('=== USERS ===');
    const res = await client.query(`
      SELECT id, email, role, "firstName", "lastName", "createdAt", "tenantId" 
      FROM "User" 
      ORDER BY "createdAt"
    `);
    console.log(`Total users: ${res.rows.length}\n`);
    for (const row of res.rows) {
      console.log(`  ${row.email} | role: ${row.role} | ${row.firstName} ${row.lastName} | tenant: ${row.tenantId} | created: ${row.createdAt}`);
    }
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
