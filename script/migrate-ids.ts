import { pool } from "../server/db";

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function generatePublicId(prefix: string): string {
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 36)]).join('');
  return `${prefix}-${part()}-${part()}-${part()}`;
}

async function ensureColumn(table: string, column: string, type = 'TEXT') {
  try {
    await pool.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${type}`);
    console.log(`  Created: ${table}.${column}`);
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log(`  Exists: ${table}.${column}`);
    } else {
      throw err;
    }
  }
}

async function backfillTable(table: string, column: string, prefix: string) {
  const { rows } = await pool.query(`SELECT id FROM "${table}" WHERE "${column}" IS NULL`);
  for (const row of rows) {
    const id = generatePublicId(prefix);
    await pool.query(`UPDATE "${table}" SET "${column}" = $1 WHERE id = $2`, [id, row.id]);
  }
  console.log(`  Backfilled ${rows.length} rows in ${table}.${column}`);
}

async function main() {
  console.log("Creating columns...");
  await ensureColumn("users", "public_id");
  await ensureColumn("inboxes", "public_id");
  await ensureColumn("email_messages", "public_id");
  await ensureColumn("email_domains", "public_id");
  await ensureColumn("tasks", "inbox_id", 'INTEGER');

  console.log("Backfilling public IDs...");
  await backfillTable("users", "public_id", "USER");
  await backfillTable("inboxes", "public_id", "INBX");
  await backfillTable("email_messages", "public_id", "EMAL");
  await backfillTable("email_domains", "public_id", "DOMN");

  // Create usage table if not exists
  console.log("Creating usage table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "usage" (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      emails_sent INTEGER NOT NULL DEFAULT 0,
      emails_received INTEGER NOT NULL DEFAULT 0,
      agent_replies_used INTEGER NOT NULL DEFAULT 0,
      ai_rewrites_used INTEGER NOT NULL DEFAULT 0,
      period_start TIMESTAMP NOT NULL,
      period_end TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("  Created usage table");

  // Add unique constraints
  console.log("Applying constraints...");
  const constraints = [
    `ALTER TABLE "users" ALTER COLUMN "public_id" SET NOT NULL`,
    `ALTER TABLE "inboxes" ALTER COLUMN "public_id" SET NOT NULL`,
    `ALTER TABLE "email_messages" ALTER COLUMN "public_id" SET NOT NULL`,
    `ALTER TABLE "email_domains" ALTER COLUMN "public_id" SET NOT NULL`,
  ];
  for (const sql of constraints) {
    try { await pool.query(sql); console.log(`  OK: ${sql.slice(0, 60)}...`); }
    catch (err: any) { if (!err.message?.includes('already exists')) throw err; }
  }

  // Add unique indexes
  const indexes = [
    `CREATE UNIQUE INDEX IF NOT EXISTS users_public_id_idx ON "users" ("public_id")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS inboxes_public_id_idx ON "inboxes" ("public_id")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS email_messages_public_id_idx ON "email_messages" ("public_id")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS email_domains_public_id_idx ON "email_domains" ("public_id")`,
  ];
  for (const sql of indexes) {
    try { await pool.query(sql); console.log(`  OK: ${sql.slice(0, 60)}...`); }
    catch (err: any) { console.error(`  ERROR: ${sql}`, err.message); }
  }

  console.log("Done.");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
