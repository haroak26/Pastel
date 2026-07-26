import test from "node:test";
import assert from "node:assert/strict";

const TEST_DOMAIN = "test-dns-latte-com";

test("dns-records: fetchStalwartDnsRecords - check if Stalwart API is reachable", async () => {
  const { fetchStalwartDnsRecords } = await import("../lms");
  try {
    const result = await fetchStalwartDnsRecords(TEST_DOMAIN);
    assert.ok(typeof result === "string", "Should return a string");
    const parsed = JSON.parse(result);
    assert.ok(parsed, "Should be valid JSON");
    console.log("[test] Stalwart API responded with:", JSON.stringify(parsed).slice(0, 500));
  } catch (err) {
    const msg = (err as Error)?.message ?? "";
    console.log("[test] Stalwart API unreachable (expected if server is down):", msg);
    // This is expected if the Stalwart server is down
    assert.ok(
      msg.includes("LMS") || msg.includes("fetch") || msg.includes("404") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND"),
      `Expected LMS error but got: ${msg}`
    );
  }
});

test("dns-records: getRequiredDnsRecords falls back to generated records when Stalwart is down", async () => {
  const { getRequiredDnsRecords } = await import("../domain-dns");

  const records = await getRequiredDnsRecords(TEST_DOMAIN);

  assert.ok(Array.isArray(records), "Should return an array of records");
  assert.ok(records.length >= 3, `Should have at least 3 DNS records, got ${records.length}`);

  const mxRecord = records.find((r) => r.type === "MX");
  assert.ok(mxRecord, "Should have an MX record");
  assert.ok(mxRecord?.value?.includes("10 "), "MX record should have priority 10");
  assert.ok(mxRecord?.source === "generated" || mxRecord?.source === "lms",
    `MX source should be 'generated' or 'lms', got '${mxRecord?.source}'`);

  const spfRecord = records.find((r) => r.type === "TXT" && r.name === TEST_DOMAIN);
  assert.ok(spfRecord, "Should have an SPF TXT record");
  assert.ok(spfRecord?.value?.includes("v=spf1"), "SPF record should contain v=spf1");

  const dmarcRecord = records.find((r) => r.type === "TXT" && r.name.startsWith("_dmarc."));
  assert.ok(dmarcRecord, "Should have a DMARC record");
  assert.ok(dmarcRecord?.value?.includes("v=DMARC1"), "DMARC record should contain v=DMARC1");

  const dkimRecord = records.find((r) => r.type === "TXT" && r.name.includes("._domainkey."));
  assert.ok(dkimRecord, "Should have a DKIM record");

  console.log("[test] DNS records received:", JSON.stringify(records, null, 2));
});

test("dns-records: getRequiredDnsRecords with BIMI URL adds BIMI record", async () => {
  const { getRequiredDnsRecords } = await import("../domain-dns");
  const bimiUrl = "https://example.com/logo.svg";

  const records = await getRequiredDnsRecords(TEST_DOMAIN, bimiUrl);

  const bimiRecord = records.find((r) => r.name.startsWith("default._bimi."));
  assert.ok(bimiRecord, "Should have a BIMI record when bimiUrl is provided");
  assert.ok(bimiRecord?.value?.includes("v=BIMI1"), "BIMI record should contain v=BIMI1");
  assert.ok(bimiRecord?.value?.includes(bimiUrl), `BIMI record should contain the URL ${bimiUrl}`);
});

test("dns-records: getRequiredDnsRecords with expected DKIM adds DKIM record", async () => {
  const { getRequiredDnsRecords } = await import("../domain-dns");
  const expectedDkim = {
    selector: "mail",
    value: "v=DKIM1; p=MCowBQYDK2VwAyEA7H4O6FhMnTJCf7YZKd5LhJmYqR8LVhX4Qw==",
  };

  const records = await getRequiredDnsRecords(TEST_DOMAIN, undefined, expectedDkim);

  const dkimRecord = records.find((r) => r.selector === "mail");
  assert.ok(dkimRecord, "Should have a DKIM record with selector 'mail'");
  assert.ok(dkimRecord?.value?.includes("v=DKIM1"), "DKIM record should contain v=DKIM1");
  assert.ok(dkimRecord?.source === "generated" || dkimRecord?.source === "lms",
    `DKIM source should be 'generated' or 'lms', got '${dkimRecord?.source}'`);
});

test("dns-records: verifyDnsRecordsAgainstExpected handles missing DNS", async () => {
  const { getRequiredDnsRecords, verifyDnsRecordsAgainstExpected } = await import("../domain-dns");

  const records = await getRequiredDnsRecords(TEST_DOMAIN);
  const result = await verifyDnsRecordsAgainstExpected(TEST_DOMAIN, records);

  assert.ok(result, "Should return a verification result");
  assert.ok(typeof result.allVerified === "boolean", "Should have allVerified boolean");
  assert.ok(Array.isArray(result.records), "Should have records array");
  assert.ok(result.diagnostics, "Should have diagnostics");
  assert.ok(Array.isArray(result.diagnostics.dkimAlternateSelectors), "Should have dkimAlternateSelectors");

  console.log("[test] Verification results:", JSON.stringify(result.results, null, 2));
  console.log("[test] Verification diagnostics:", JSON.stringify(result.records.map((r) => ({
    kind: r.kind,
    status: r.status,
    name: r.name,
  })), null, 2));
});

test("dns-records: verifyStalwartDnsRecords - full flow with Stalwart (if available)", async () => {
  const { fetchStalwartDnsRecords, createStalwartDomain, createStalwartDkim, deleteStalwartDomain } = await import("../lms");
  const { recordsFromStalwartDns, getRequiredDnsRecords } = await import("../domain-dns");

  let domainCreated = false;
  const ephemeralDomain = `test-${Date.now()}.com`;

  try {
    // Try creating a domain on Stalwart
    await createStalwartDomain(ephemeralDomain);
    domainCreated = true;
    console.log(`[test] Created Stalwart domain: ${ephemeralDomain}`);

    // Try creating DKIM
    try {
      const dkimResult = await createStalwartDkim(ephemeralDomain);
      console.log(`[test] DKIM created:`, dkimResult.slice(0, 300));
    } catch (dkimErr) {
      console.log(`[test] DKIM creation failed (may be expected):`, (dkimErr as Error)?.message);
    }

    // Try fetching DNS records from Stalwart
    const rawDns = await fetchStalwartDnsRecords(ephemeralDomain);
    console.log(`[test] Raw DNS response (first 500 chars):`, rawDns.slice(0, 500));

    // Parse and validate
    const parsed = JSON.parse(rawDns);
    assert.ok(parsed, "Should be valid JSON");
    console.log(`[test] Stalwart DNS records for ${ephemeralDomain}:`, JSON.stringify(parsed, null, 2));

    // Try parsing through recordsFromStalwartDns
    const records = await recordsFromStalwartDns(ephemeralDomain, rawDns);
    assert.ok(Array.isArray(records), "recordsFromStalwartDns should return an array");
    console.log(`[test] Parsed ${records.length} DNS records from Stalwart`);

  } catch (err) {
    const msg = (err as Error)?.message ?? "";
    console.log(`[test] Stalwart full flow test skipped (API unavailable): ${msg}`);
    // Expected: Stalwart is down
    assert.ok(
      msg.includes("LMS") || msg.includes("fetch") || msg.includes("404") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND"),
      `Expected LMS error but got: ${msg}`
    );
  } finally {
    if (domainCreated) {
      try {
        await deleteStalwartDomain(ephemeralDomain);
        console.log(`[test] Cleaned up domain: ${ephemeralDomain}`);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
});
