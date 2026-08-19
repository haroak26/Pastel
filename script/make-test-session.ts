import { db } from "../server/db";
import { users } from "@shared/schema";
import { sql } from "drizzle-orm";
import { randomBytes } from "crypto";

const [user] = await db.select().from(users).limit(1);
console.log("user:", user ? { id: user.id, email: user.email, verified: user.emailVerified, plan: "n/a" } : "none");

if (user) {
  const sid = randomBytes(24).toString("hex");
  const csrfToken = randomBytes(24).toString("hex");
  const sess = JSON.stringify({
    cookie: {
      originalMaxAge: 604800000,
      expires: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
    passport: { user: user.id },
    csrfToken,
  });
  const expire = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  await db.execute(sql`INSERT INTO session (sid, sess, expire) VALUES (${sid}, ${sess}, ${expire}) ON CONFLICT (sid) DO NOTHING`)
    .catch(e => console.error("insert failed:", e.message));
  console.log(JSON.stringify({ sid, csrfToken, csrfCookie: csrfToken }));
}
