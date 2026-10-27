/**
 * Free Gmail-backed sender for Ruby Essentials membership notifications.
 *
 * Deploy this project as a Web app that executes as the script owner.
 * Store the same long random token in Script Properties under
 * RUBY_ESSENTIALS_WEBHOOK_SECRET and in Supabase as
 * GOOGLE_APPS_SCRIPT_SECRET. Never commit the token to GitHub.
 */

function doPost(e) {
  try {
    const expectedSecret = PropertiesService.getScriptProperties()
      .getProperty("RUBY_ESSENTIALS_WEBHOOK_SECRET");
    if (!expectedSecret) {
      return jsonOutput_({ ok: false, error: "Sender is not configured." });
    }

    const rawBody = e && e.postData && e.postData.contents;
    const payload = JSON.parse(rawBody || "{}");
    const providedSecret = String(payload.secret || "");
    if (!constantTimeEquals_(providedSecret, expectedSecret)) {
      return jsonOutput_({ ok: false, error: "Unauthorized." });
    }

    const to = String(payload.to || "").trim();
    const status = String(payload.status || "");
    const subject = String(payload.subject || "").trim();
    const html = String(payload.html || "");
    const body = String(payload.text || "");

    const expectedSubject = status === "approved"
      ? "Your Ruby Essentials membership request was approved"
      : status === "rejected"
        ? "Update on your Ruby Essentials membership request"
        : "";

    if (!expectedSubject || subject !== expectedSubject) {
      return jsonOutput_({ ok: false, error: "Invalid membership decision." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return jsonOutput_({ ok: false, error: "Invalid recipient address." });
    }
    if (!html || !body || html.length > 200000 || body.length > 20000) {
      return jsonOutput_({ ok: false, error: "Invalid email content." });
    }
    if (MailApp.getRemainingDailyQuota() < 1) {
      return jsonOutput_({ ok: false, error: "The Gmail daily sending quota has been reached." });
    }

    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: body,
      htmlBody: html,
      name: "Ruby Essentials"
    });

    return jsonOutput_({ ok: true });
  } catch (error) {
    console.error("Membership email send failed:", error && error.message ? error.message : error);
    return jsonOutput_({ ok: false, error: "Email delivery failed." });
  }
}

/**
 * Run this once from the Apps Script editor to authorize MailApp.
 */
function authorizeMailService() {
  const remaining = MailApp.getRemainingDailyQuota();
  console.log("Remaining email recipients for today: " + remaining);
}

function constantTimeEquals_(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function jsonOutput_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
