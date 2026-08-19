import { db } from "../server/db";
import { sql } from "drizzle-orm";
async function main() {
  const sid = "74898c8a265bf1898a29ee7b8d14f185e2776cc746057c44";
  const r = await db.execute(sql`SELECT sess FROM session WHERE sid = ${sid} AND expire >= to_timestamp(${Math.ceil(Date.now()/1000)})`);
  console.log("rows:", r.rows.length, "type:", typeof r.rows[0]?.sess, JSON.stringify(r.rows[0]?.sess)?.slice(0, 120));
}
main();
