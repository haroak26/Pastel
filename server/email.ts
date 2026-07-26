import { randomInt } from "crypto";
import {
  buildEmailChangeTemplate,
  buildPasswordResetTemplate,
  buildTwoFactorTemplate,
  buildVerificationTemplate,
  buildPinTemplate,
  buildNewDeviceTemplate,
  buildWelcomeTemplate,
  buildWorkspaceInviteTemplate,
  buildSubscriptionUpdateTemplate,
  buildAccountDeletionTemplate,
  renderMarkdown,
  stripHtml,
  LATTE_EMAIL_STYLES,
} from "./emailTemplates";
import { sendMailFromSmtp, createSmtpTransport, sendMailWithTimeout } from "./transport-pool";
import { sendViaBrevo } from "./brevo";

export { stripHtml, renderMarkdown } from "./emailTemplates";

function sanitizeName(name: string): string {
  return name.replace(/[\r\n"]/g, "");
}

// ─── Space Config Cache (stubbed for design tool) ──────────────────

async function getSpaceByEmail(_email: string) {
  return null;
}

export function clearSpaceConfigCache(): void {
  spaceConfigCache.clear();
}

// ─── Auth / Transactional Emails ───────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  token: string,
  baseUrl: string,
): Promise<void> {
  const code = randomInt(100000, 999999).toString();
  const { html, text } = buildVerificationTemplate(code);
  await sendSecureMail(to, "Verify your Latte email address", text, html);
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  baseUrl: string,
): Promise<void> {
  const link = `${baseUrl}/auth/reset-password?token=${token}`;
  const { html, text } = buildPasswordResetTemplate(link);
  await sendSecureMail(to, "Reset your Latte password", text, html);
}

export async function sendEmailChangeVerification(
  to: string,
  token: string,
  baseUrl: string,
): Promise<void> {
  const link = `${baseUrl}/api/me/verify-email-change?token=${token}`;
  const { html, text } = buildEmailChangeTemplate(link);
  await sendSecureMail(to, "Confirm your new Latte email address", text, html);
}

// ─── Helpers ───────────────────────────────────────────────────────

function getSecureFrom(): { name: string; email: string } {
  const raw = process.env.SECURE_EMAIL;
  if (raw) {
    const match = raw.match(/^(?:"?([^"]*)"?\s+)?<(.+)>$/);
    if (match) return { name: match[1] || "Latte", email: match[2] };
    if (raw.includes("@")) return { name: "Latte", email: raw };
    return { name: "Latte", email: raw };
  }
  return { name: "Latte", email: "secure@meetlatte.com" };
}

function inboxFrom(_inbox: { name?: string | null; emailAddress?: string | null }): string {
  return "";
}

async function sendSecureMail(to: string, subject: string, textContent: string, htmlContent: string): Promise<boolean> {
  try {
    await sendViaBrevo({ to, subject, htmlContent, textContent });
    return true;
  } catch (err) {
    try {
      const from = getSecureFrom();
      const fromField = `${from.name} <${from.email}>`;
      await sendMailFromSmtp({ host: "localhost", port: 25 }, { from: fromField, to, subject, text: textContent, html: htmlContent });
      return true;
    } catch (fallbackErr) {
      console.warn("[email] secure send failed:", err, fallbackErr);
      return false;
    }
  }
}

export async function sendTwoFactorEmail(
  to: string,
  code: string,
  challengeId: string,
  token: string,
  baseUrl: string,
): Promise<void> {
  const link = `${baseUrl}/api/login/verify-link?challengeId=${encodeURIComponent(challengeId)}&token=${encodeURIComponent(token)}`;
  const { html, text } = buildTwoFactorTemplate(link, code);
  await sendSecureMail(to, "Your Latte verification code", text, html);
}

export async function sendAdminTwoFactorEmail(
  to: string,
  code: string,
  challengeId: string,
  token: string,
  baseUrl: string,
): Promise<void> {
  const link = `${baseUrl}/api/admin/login/2fa/verify-link?challengeId=${encodeURIComponent(challengeId)}&token=${encodeURIComponent(token)}`;
  const { html, text } = buildTwoFactorTemplate(link, code);
  await sendSecureMail(to, "Your admin verification code", text, html);
}

export async function sendPinEmail(
  to: string,
  pin: string,
): Promise<void> {
  const { html, text } = buildPinTemplate(pin);
  const brevoSent = await sendViaBrevo({
    to,
    subject: "Your Latte verification code",
    htmlContent: html,
    textContent: text,
  });
  if (brevoSent) return;
  console.warn("[email] No Brevo configured — PIN email not sent");
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  details?: { workspaceName?: string; domain?: string; spaceName?: string; spaceEmail?: string },
): Promise<void> {
  const { html: htmlContent, text: textContent } = buildWelcomeTemplate(name, details);
  await sendViaBrevo({
    to,
    toName: name,
    subject: "Welcome to Latte!",
    htmlContent,
    textContent,
  });
}

export function appendTicketFooter(body: string, _ticketId?: string, _trackingUrl?: string): string {
  return body;
}

export async function sendWorkspaceInviteEmail(
  to: string,
  invitedByName: string,
  workspaceName: string,
  inviteUrl: string,
): Promise<void> {
  const { html: htmlContent, text: textContent } = buildWorkspaceInviteTemplate(invitedByName, workspaceName, inviteUrl);
  await sendSecureMail(to, `You've been invited to ${workspaceName}`, textContent, htmlContent);
}

export async function sendTicketAssignedEmail(
  to: string,
  assigneeName: string,
  ticketSubject: string,
  ticketId: string,
  assignedByName: string,
  publicId?: number | null,
): Promise<void> {
  const displayId = publicId != null ? `#${publicId}` : `#${ticketId}`;
  const textContent = `You've been assigned a ticket on Latte

Hi ${assigneeName},

${assignedByName} has assigned you to ticket ${displayId}: "${ticketSubject}".

Click the link below to view and respond to the ticket:
https://app.meetlatte.com/home/tickets/detail/${ticketId}

— The Latte team`;

  const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${LATTE_EMAIL_STYLES}</style>
</head>
<body>
<h1>Ticket assigned to you</h1>
<p>Hi ${assigneeName.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}, you've been assigned a new ticket.</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.8">
  <strong style="color:#6b7280">Ticket:</strong> ${String(displayId).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}<br>
  <strong style="color:#6b7280">Subject:</strong> ${ticketSubject.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
</p>
<p>${assignedByName.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")} has assigned this ticket to you.</p>
<p><a href="https://app.meetlatte.com/home/tickets/detail/${ticketId}" style="color:#4682B4;font-weight:500">View ticket →</a></p>
</body>
</html>`;

  await sendSecureMail(to, `Assigned to ticket #${ticketId}: ${ticketSubject}`, textContent, htmlContent);
}

export async function sendNewDeviceEmail(
  to: string,
  userName: string,
  deviceInfo: { browser?: string; os?: string; ip?: string; location?: string; time?: string },
): Promise<void> {
  const { html: htmlContent, text: textContent } = buildNewDeviceTemplate(userName, to, deviceInfo);
  await sendSecureMail(to, "New sign-in to your Latte account", textContent, htmlContent);
}

export async function sendSubscriptionUpdateEmail(
  to: string,
  name: string,
  planName: string,
  action: "new" | "cancelled" | "updated",
  billingDate?: string,
): Promise<void> {
  const { html: htmlContent, text: textContent } = buildSubscriptionUpdateTemplate(name, planName, action, billingDate);
  const subjects: Record<string, string> = {
    new: `You're now on the ${planName} plan`,
    cancelled: "Your Latte subscription has been cancelled",
    updated: `Your Latte plan has been updated to ${planName}`,
  };
  await sendViaBrevo({
    to,
    toName: name,
    subject: subjects[action],
    htmlContent,
    textContent,
  });
}

export async function sendAccountDeletionEmail(
  to: string,
  name: string,
): Promise<void> {
  const { html: htmlContent, text: textContent } = buildAccountDeletionTemplate(name, to);
  await sendViaBrevo({
    to,
    toName: name,
    subject: "Your Latte account has been deleted",
    htmlContent,
    textContent,
  });
}

export async function sendDkimRotationAlert(
  to: string,
  domain: string,
  newSelector: string,
  newValue: string,
): Promise<void> {
  const recordName = `${newSelector}._domainkey.${domain}`;
  const containerStyle = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#000;line-height:1.6;font-size:14px;max-width:480px;margin:0 auto;padding:40px 24px 48px;background:#ffffff";
  const headingStyle = "font-size:16px;font-weight:600;margin:0 0 6px;color:#000";
  const bodyStyle = "margin:0 0 12px;color:#000";
  const htmlContent = `
<div style="${containerStyle}">
  <h2 style="${headingStyle}">Action required: DKIM key rotated for ${domain}</h2>
  <p style="${bodyStyle}">
    Your mail server has automatically rotated the DKIM signing key for <strong>${domain}</strong>.
    This happens every 90 days to maintain security.
  </p>
  <p style="${bodyStyle}">
    <strong>You must update your DNS before emails can be verified again.</strong>
    Until you update the record, outbound emails from ${domain} may be rejected or land in spam.
  </p>
  <p style="${bodyStyle}">Add or update this TXT record with your DNS provider:</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
    <tr style="background:#f5f5f5;">
      <th style="text-align:left;padding:8px 12px;border:1px solid #e5e5e5;">Field</th>
      <th style="text-align:left;padding:8px 12px;border:1px solid #e5e5e5;">Value</th>
    </tr>
    <tr>
      <td style="padding:8px 12px;border:1px solid #e5e5e5;">Type</td>
      <td style="padding:8px 12px;border:1px solid #e5e5e5;">TXT</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:8px 12px;border:1px solid #e5e5e5;">Name</td>
      <td style="padding:8px 12px;border:1px solid #e5e5e5;font-family:monospace;">${recordName}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border:1px solid #e5e5e5;">Value</td>
      <td style="padding:8px 12px;border:1px solid #e5e5e5;font-family:monospace;word-break:break-all;">${newValue}</td>
    </tr>
  </table>
  <p style="${bodyStyle}">
    Once you've updated the record, go to your domain settings in Latte and click <strong>Verify DNS</strong>.
    Your domain will be re-validated automatically.
  </p>
  <p style="${bodyStyle}">The Latte Team</p>
</div>`;
  const textContent = `Action required: DKIM key rotated for ${domain}

Your mail server has automatically rotated the DKIM signing key for ${domain}.
This happens every 90 days to maintain security.

You must update your DNS before emails can be verified again.

Add or update this TXT record with your DNS provider:
  Type:  TXT
  Name:  ${recordName}
  Value: ${newValue}

Once updated, go to your domain settings in Latte and click Verify DNS.

The Latte Team`;
  await sendViaBrevo({
    to,
    subject: `Action required: DKIM key rotated for ${domain}`,
    htmlContent,
    textContent,
  });
}

/** Send a set of test emails to verify all template redesigns. */
export async function sendAllTestEmails(to: string, baseUrl: string): Promise<void> {
  // 1. Verification / PIN email
  const verify = buildVerificationTemplate("482916");
  await sendSecureMail(to, "TEST: Verify your Latte email address", verify.text, verify.html);
  console.log("  ✓ Verification email sent");

  // 2. Password reset email
  const resetLink = `${baseUrl}/auth/reset-password?token=test-reset-token-123`;
  const reset = buildPasswordResetTemplate(resetLink);
  await sendSecureMail(to, "TEST: Reset your Latte password", reset.text, reset.html);
  console.log("  ✓ Password reset email sent");

  // 3. Workspace invite email
  await sendWorkspaceInviteEmail(to, "Alice", "Acme Corp", `${baseUrl}/invite/test-123`);
  console.log("  ✓ Workspace invite email sent");

  // 4. New device / sign-in email
  await sendNewDeviceEmail(to, "Rach", {
    browser: "Chrome 135",
    os: "macOS 15",
    ip: "203.0.113.42",
    location: "Sydney, Australia",
    time: "Monday, June 15, 2026 at 10:00 AM UTC",
  });
  console.log("  ✓ New device / sign-in email sent");

  // 5. Welcome email
  await sendWelcomeEmail(to, "Rach", {
    workspaceName: "Acme Corp",
    domain: "acme.com",
    spaceEmail: "rach@acme.com",
  });
  console.log("  ✓ Welcome email sent");

  // 6. Ticket assigned email
  await sendTicketAssignedEmail(to, "Rach", "Login issue with dashboard", "TKT-4242", "Alice");
  console.log("  ✓ Ticket assigned email sent");

  // 7. Subscription update — new subscription
  await sendSubscriptionUpdateEmail(to, "Rach", "Pro", "new", "July 15, 2026");
  console.log("  ✓ Subscription new email sent");

  // 8. Subscription update — cancelled
  await sendSubscriptionUpdateEmail(to, "Rach", "Pro", "cancelled", "July 15, 2026");
  console.log("  ✓ Subscription cancelled email sent");

  // 9. Account deletion
  await sendAccountDeletionEmail(to, "Rach");
  console.log("  ✓ Account deletion email sent");
}
