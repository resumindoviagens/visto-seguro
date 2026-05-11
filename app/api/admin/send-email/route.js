import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../lib/auth";
import { getEmailTemplate } from "../../../../lib/emailTemplates";
import { sendWithBrevo } from "../../../../lib/brevoEmail";
import { randomBytes } from "crypto";



function makeFeedbackToken() {
  return randomBytes(24).toString("hex");
}

async function ensureFeedbackLink(client, origin) {
  let token = client.feedback_token;
  if (!token) {
    token = makeFeedbackToken();
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    const { error } = await supabaseAdmin
      .from("clients")
      .update({
        feedback_liberado: true,
        feedback_token: token,
        feedback_token_expires_at: expires.toISOString(),
        stage_feedback_sent: true
      })
      .eq("id", client.id);

    if (error) throw error;
  }

  return `${origin}/feedback/${token}`;
}

function siteOrigin(request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { client_id, template_id } = body;

    if (!client_id || !template_id) return Response.json({ error: "Cliente e modelo de email são obrigatórios." }, { status: 400 });

    const { data: client, error } = await supabaseAdmin.from("clients").select("*").eq("id", client_id).single();
    if (error || !client) return Response.json({ error: "Cliente não encontrado." }, { status: 404 });
    if (!client.email) return Response.json({ error: "Cliente sem email cadastrado." }, { status: 400 });

    const origin = siteOrigin(request);
    const formLink = client.access_token ? `${origin}/acesso/${client.access_token}` : "";
    const preparationLink = client.access_token ? `${origin}/preparacao/${client.access_token}` : "";
    const feedbackLink = template_id === "pesquisa_satisfacao" ? await ensureFeedbackLink(client, origin) : "";
    const template = getEmailTemplate(template_id, client, { formLink, preparationLink, feedbackLink, rastreio: body.rastreio || client.passport_tracking_code || "" });

    const result = await sendWithBrevo({ toEmail: client.email, toName: client.name, subject: template.subject, html: template.html, text: template.text });

    if (template_id === "pesquisa_satisfacao") {
      await supabaseAdmin
        .from("clients")
        .update({ stage_feedback_sent: true })
        .eq("id", client_id);
    }

    await supabaseAdmin.from("audit_logs").insert({
      client_id,
      action: "email_sent",
      details: { provider: "brevo", template_id, subject: template.subject, to: client.email, message_id: result?.messageId || null }
    });

    return Response.json({ ok: true, message: "Email enviado com sucesso pela Brevo." });
  } catch (error) {
    return Response.json({ error: error.message || "Erro ao enviar email." }, { status: 500 });
  }
}
