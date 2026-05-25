export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../../lib/auth";
import { EMAIL_TEMPLATES, getEmailTemplate } from "../../../../../lib/emailTemplates";
import { randomBytes } from "crypto";

function makeFeedbackToken() {
  return randomBytes(24).toString("hex");
}

function htmlToPlainText(html = "") {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function siteOriginFromHeaders(headerStore) {
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") || "https";
  return process.env.NEXT_PUBLIC_SITE_URL || (host ? `${protocol}://${host}` : "https://app.resumindoviagens.com.br");
}

async function ensureFeedbackLink(client, origin) {
  let token = client.feedback_token;
  if (!token) token = makeFeedbackToken();

  const expires = new Date();
  expires.setDate(expires.getDate() + 60);

  await supabaseAdmin
    .from("clients")
    .update({
      feedback_liberado: true,
      feedback_token: token,
      feedback_token_expires_at: expires.toISOString(),
      stage_feedback_sent: true
    })
    .eq("id", client.id);

  return `${origin}/feedback/${token}`;
}

export async function GET(request, context) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const params = await context.params;
  const url = new URL(request.url);
  const templateId = url.searchParams.get("template") || "formulario";

  const { data: client, error } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !client) {
    return Response.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  let processGroup = null;
  if (client.group_process_id) {
    const { data: group } = await supabaseAdmin
      .from("grupos_processo")
      .select("*")
      .eq("id", client.group_process_id)
      .maybeSingle();
    processGroup = group || null;
  }

  const headerStore = await headers();
  const origin = siteOriginFromHeaders(headerStore);
  const clientWithGroup = { ...client, process_group: processGroup };

  const formLink = client.access_token ? `${origin}/acesso/${client.access_token}` : "";
  const preparationLink = `${origin}/preparacao/${client.access_token || client.id}`;
  const feedbackLink = templateId === "pesquisa_satisfacao"
    ? await ensureFeedbackLink(client, origin)
    : (client.feedback_token ? `${origin}/feedback/${client.feedback_token}` : "");

  const template = getEmailTemplate(templateId, clientWithGroup, {
    formLink,
    preparationLink,
    feedbackLink,
    rastreio: client.passport_tracking_code || processGroup?.passport_tracking_code || "",
    videoCallDateTime: processGroup?.video_call_date || client.video_call_date || ""
  });

  return Response.json({
    templates: EMAIL_TEMPLATES,
    templateId,
    toEmail: client.email || "",
    toName: client.name || "",
    subject: template.subject,
    html: template.html,
    text: template.text,
    plainText: template.text || htmlToPlainText(template.html)
  }, { headers: { "Cache-Control": "no-store" } });
}
