export const dynamic = "force-dynamic";

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../../lib/auth";
import { sendWithBrevo } from "../../../../../lib/brevoEmail";

function htmlToText(html = "") {
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const clientId = body.client_id;
    const toEmail = body.to_email;
    const toName = body.to_name || "";
    const subject = body.subject || "";
    const html = body.html || "";
    const text = body.text || htmlToText(html);
    const templateId = body.template_id || "personalizado";

    if (!clientId) return Response.json({ error: "Cliente obrigatório." }, { status: 400 });
    if (!toEmail) return Response.json({ error: "Email de destino obrigatório." }, { status: 400 });
    if (!subject) return Response.json({ error: "Assunto obrigatório." }, { status: 400 });
    if (!html) return Response.json({ error: "Corpo do email obrigatório." }, { status: 400 });

    const result = await sendWithBrevo({
      toEmail,
      toName,
      subject,
      html,
      text,
      tags: ["resumindo-viagens", "editor-email", templateId]
    });

    const updates = {};
    if (templateId === "pesquisa_satisfacao") updates.stage_feedback_sent = true;

    if (Object.keys(updates).length > 0) {
      await supabaseAdmin.from("clients").update(updates).eq("id", clientId);
    }

    await supabaseAdmin.from("audit_logs").insert({
      client_id: clientId,
      action: "email_editor_sent",
      details: { template_id: templateId, to: toEmail, messageId: result?.messageId || result?.messageIds || null }
    });

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: error.message || "Erro ao enviar email." }, { status: 500 });
  }
}
