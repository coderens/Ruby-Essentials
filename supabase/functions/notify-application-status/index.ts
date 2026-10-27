import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigin = "https://ruby-essentials.vercel.app";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getPublishableKey() {
  const keyMap = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (keyMap) {
    try {
      const parsed = JSON.parse(keyMap) as Record<string, string>;
      if (parsed.default) return parsed.default;
      const firstKey = Object.values(parsed).find((value) => typeof value === "string" && value.length > 0);
      if (firstKey) return firstKey;
    } catch {
      // Continue to the legacy key fallback.
    }
  }
  return Deno.env.get("SUPABASE_ANON_KEY") ?? "";
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse(405, { sent: false, error: "Method not allowed." });
  }

  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = getPublishableKey();

  if (!token || !supabaseUrl || !publishableKey) {
    return jsonResponse(401, { sent: false, error: "A valid signed-in session is required." });
  }

  try {
    // The caller's JWT is used throughout; no service-role key is exposed or needed.
    const supabase = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userResult, error: userError } = await supabase.auth.getUser(token);
    const user = userResult.user;
    if (userError || !user) {
      return jsonResponse(401, { sent: false, error: "Please sign in again and retry." });
    }
    if (user.app_metadata?.role !== "admin") {
      return jsonResponse(403, { sent: false, error: "Administrator access is required to send membership notifications." });
    }

    const body = await request.json().catch(() => null) as { applicationId?: unknown } | null;
    const applicationId = typeof body?.applicationId === "string" ? body.applicationId.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(applicationId)) {
      return jsonResponse(400, { sent: false, error: "A valid application ID is required." });
    }

    const { data: application, error: applicationError } = await supabase
      .from("join_applications")
      .select("id, display_name, ign, email, status")
      .eq("id", applicationId)
      .maybeSingle();

    if (applicationError) {
      console.error("Unable to load membership application:", applicationError.message);
      return jsonResponse(500, { sent: false, error: "Unable to load the application. Check the database permissions and retry." });
    }
    if (!application) {
      return jsonResponse(404, { sent: false, error: "Application not found or not accessible." });
    }
    if (application.status !== "approved" && application.status !== "rejected") {
      return jsonResponse(409, { sent: false, error: "Only approved or rejected applications can receive a decision email." });
    }

    const recipient = typeof application.email === "string" ? application.email.trim() : "";
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return jsonResponse(422, { sent: false, error: "This application has no valid email address. Check the applicant's email in the database." });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM");
    if (!resendApiKey || !emailFrom) {
      return jsonResponse(503, {
        sent: false,
        error: "Email is not configured yet. Add RESEND_API_KEY and EMAIL_FROM in Supabase Edge Function secrets.",
      });
    }

    const displayName = typeof application.display_name === "string" && application.display_name.trim()
      ? application.display_name.trim()
      : "Ruby Essentials applicant";
    const safeName = escapeHtml(displayName);
    const approved = application.status === "approved";
    const subject = approved
      ? "Your Ruby Essentials membership request was approved"
      : "Update on your Ruby Essentials membership request";
    const decisionText = approved
      ? "Good news! Your Ruby Essentials membership request has been approved."
      : "Thank you for applying to Ruby Essentials. After reviewing your request, we are unable to approve it at this time.";
    const nextStepText = approved
      ? "You can sign in to the Ruby Essentials website to view your account dashboard and the latest clan updates."
      : "If you have questions about this decision, please contact the Ruby Essentials team through the website.";
    const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#090708;color:#f5edef;font-family:Arial,Helvetica,sans-serif"><div style="max-width:600px;margin:0 auto;padding:28px;border:1px solid #452028;background:#120d0f"><p style="margin:0 0 14px;color:#ff8292;font-size:12px;font-weight:bold;letter-spacing:2px">RUBY ESSENTIALS</p><h1 style="margin:0 0 20px;font-size:25px;line-height:1.25;color:#fff">${approved ? "MEMBERSHIP APPROVED" : "MEMBERSHIP UPDATE"}</h1><p style="font-size:15px;line-height:1.7">Hi ${safeName},</p><p style="font-size:15px;line-height:1.7">${escapeHtml(decisionText)}</p><p style="font-size:15px;line-height:1.7">${escapeHtml(nextStepText)}</p><p style="margin:26px 0 0"><a href="https://ruby-essentials.vercel.app/dashboard" style="display:inline-block;padding:12px 18px;background:#a71930;color:#fff;text-decoration:none;font-size:13px;font-weight:bold">OPEN RUBY ESSENTIALS</a></p><p style="margin:28px 0 0;padding-top:18px;border-top:1px solid #342126;color:#b9a8ae;font-size:12px;line-height:1.6">This is an automated membership status update from Ruby Essentials. Please do not reply with your password or other sign-in credentials.</p></div></body></html>`;
    const text = `Ruby Essentials

Hi ${displayName},

${decisionText}

${nextStepText}

Open your dashboard: https://ruby-essentials.vercel.app/dashboard

This is an automated notification from Ruby Essentials.`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [recipient],
        subject,
        html,
        text,
      }),
    });

    const resendData = await resendResponse.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
    if (!resendResponse.ok) {
      console.error("Resend rejected a membership notification:", resendResponse.status, resendData.message ?? resendData.name ?? "unknown error");
      return jsonResponse(502, {
        sent: false,
        error: "The email provider rejected the message. Check your Resend API key, verified sender address, and sender-domain settings.",
      });
    }

    return jsonResponse(200, { sent: true, to: recipient, emailId: resendData.id ?? null });
  } catch (error) {
    console.error("Unexpected membership notification error:", error);
    return jsonResponse(500, { sent: false, error: "Unexpected email notification error. Check the Edge Function logs." });
  }
});
