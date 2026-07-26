import { db, pool } from "../server/db";
import { workspaces, emailDomains, users, onboardingSessions } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { getMailServerDomain } from "../server/lms";
import { verifyStoredDnsRecords } from "../server/domain-dns";

async function backfill() {
  const mailDomain = getMailServerDomain();
  if (!mailDomain) {
    console.log("LMS_BASE_URL not configured — skipping backfill");
    await pool.end();
    return;
  }

  const clean = (d: string) => d.toLowerCase().trim().replace(/\.$/, "");

  const allWorkspaces = await db.select().from(workspaces);

  let created = 0;
  let updated = 0;
  let dnsFetched = 0;

  for (const ws of allWorkspaces) {
    if (!ws.domain) continue;

    const wd = clean(ws.domain);
    const md = clean(mailDomain);
    const isMailServerDomain = wd === md || wd.endsWith("." + md) || md.endsWith("." + wd);

    if (!isMailServerDomain) continue;

    // Check if an email_domains row already exists for this user+domain
    const existing = await db
      .select()
      .from(emailDomains)
      .where(
        and(
          eq(emailDomains.userId, ws.ownerId),
          eq(emailDomains.domain, ws.domain),
        ),
      )
      .limit(1);

    let domainRowId: string | null = existing[0]?.id ?? null;

    if (!domainRowId) {
      // Create the missing domain row
      const [inserted] = await db.insert(emailDomains).values({
        userId: ws.ownerId,
        domain: ws.domain,
        publicId: `EDOM_BF_${ws.id.slice(0, 8)}`,
      }).returning({ id: emailDomains.id });
      domainRowId = inserted.id;
      created++;
    }

    // Fetch actual DNS records via live DNS check + store results
    try {
      const result = await verifyStoredDnsRecords(ws.ownerId, domainRowId);
      console.log(`  DNS check for ${ws.domain}: mx=${result.results.mx} spf=${result.results.spf} dkim=${result.results.dkim} dmarc=${result.results.dmarc}`);
      dnsFetched++;
    } catch (err) {
      console.log(`  DNS lookup failed for ${ws.domain}:`, err instanceof Error ? err.message : err);
    }

    // Mail server's own domain — force all verification flags to true
    await db.update(emailDomains)
      .set({
        verified: true,
        mxVerified: true,
        spfVerified: true,
        dkimVerified: true,
        dmarcVerified: true,
        bimiVerified: true,
      })
      .where(eq(emailDomains.id, domainRowId));

    // Ensure the onboarding session points to the correct domain row
    const session = await db
      .select()
      .from(onboardingSessions)
      .where(eq(onboardingSessions.userId, ws.ownerId))
      .limit(1);

    if (session.length > 0) {
      const needsUpdate =
        session[0].domainId !== domainRowId ||
        session[0].domainStatus !== "complete" ||
        session[0].dnsStatus !== "complete" ||
        session[0].currentStep !== "space";

      if (needsUpdate) {
        await db
          .update(onboardingSessions)
          .set({
            domainId: domainRowId,
            domainStatus: "complete",
            dnsStatus: "complete",
            currentStep: "space",
            currentSubStep: "space",
          })
          .where(eq(onboardingSessions.userId, ws.ownerId));
      }
    }
  }

  console.log(`Backfill complete: ${created} domain rows created, ${updated} fallback rows, ${dnsFetched} DNS-verified rows`);
  await pool.end();
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
