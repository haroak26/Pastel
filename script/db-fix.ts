import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const dupes = await db.execute(sql`SELECT user_id, count(*) FROM subscriptions GROUP BY user_id HAVING count(*) > 1`);
  console.log("duplicates:", JSON.stringify(dupes.rows));
  if (dupes.rows.length === 0) {
    const r = await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_unique ON subscriptions (user_id)`);
    console.log("created unique index:", r.rowsAffected >= 0);
  }
  const idx = await db.execute(sql`SELECT indexname FROM pg_indexes WHERE tablename='subscriptions'`);
  console.log("indexes:", JSON.stringify(idx.rows.map(r => r.indexname)));
}
main();
