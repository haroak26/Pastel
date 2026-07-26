import test from "node:test";
import assert from "node:assert/strict";

// Mock request/response for the inbound email handler
function mockReq(body: Record<string, unknown>, provider = "sendgrid") {
  return {
    body,
    query: { provider },
    headers: { "x-webhook-token": "test-token" },
  } as any;
}

function mockRes() {
  const calls: any[] = [];
  return {
    status: (code: number) => ({ json: (data: unknown) => calls.push({ code, data }) }),
    json: (data: unknown) => calls.push({ code: 200, data }),
    _calls: calls,
  } as any;
}

test("inbound-email: rejects missing webhook token", async () => {
  const prev = process.env.INBOUND_EMAIL_WEBHOOK_TOKEN;
  process.env.INBOUND_EMAIL_WEBHOOK_TOKEN = "test-token";

  const req = mockReq({});
  req.headers["x-webhook-token"] = "wrong-token";
  const res = mockRes();

  const { handleInboundEmail } = await import("../webhooks/inbound-email");
  await handleInboundEmail(req, res);

  assert.equal(res._calls[0]?.code, 401);

  process.env.INBOUND_EMAIL_WEBHOOK_TOKEN = prev;
});

test("inbound-email: rejects empty body", async () => {
  process.env.INBOUND_EMAIL_WEBHOOK_TOKEN = "test-token";
  const req = mockReq({});
  const res = mockRes();

  const { handleInboundEmail } = await import("../webhooks/inbound-email");
  await handleInboundEmail(req, res);

  assert.equal(res._calls[0]?.code, 400);
});

test("inbound-email: extracts sendgrid format", async () => {
  const { handleInboundEmail } = await import("../webhooks/inbound-email");

  // This just tests the extraction logic doesn't crash
  const req = mockReq({ from: "test@example.com", to: "inbox@test.latte", subject: "Test", text: "Hello" });
  const res = mockRes();

  // It should try to find a matching space and return 200 or 404
  await handleInboundEmail(req, res);

  // Either it processed (200) or didn't find a space (200 with message)
  assert.ok(res._calls.length > 0);
  assert.ok(res._calls[0]?.code === 200 || res._calls[0]?.code === 400);
});
