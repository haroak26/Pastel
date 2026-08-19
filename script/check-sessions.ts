import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const t = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='session'`);
  console.log(JSON.stringify(t.rows));
  const s = await db.execute(sql`SELECT sid, expire, left(sess::text, 300) as sess FROM session ORDER BY expire DESC LIMIT 5`);
  console.log(JSON.stringify(s.rows, null, 1));
}
main();
