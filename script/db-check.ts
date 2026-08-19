import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const idx = await db.execute(sql`SELECT indexname, indexdef FROM pg_indexes WHERE tablename='subscriptions'`);
  console.log("indexes:", JSON.stringify(idx.rows, null, 1));
  const cols = await db.execute(sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name='subscriptions'`);
  console.log(JSON.stringify(cols.rows, null, 1));
  
  console.log("migrations:", JSON.stringify(mig.rows, null, 1));
}
main();
