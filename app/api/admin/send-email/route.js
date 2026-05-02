import nodemailer from "nodemailer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../lib/auth";
import { getEmailTemplate } from "../../../../lib/emailTemplates";

function siteOrigin(request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

function createTransporter() {
  const user = process.env.GMAIL_SMTP_USER;
  const pass = process.env.GMAIL_SMTP_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("SMTP Gmail não configurado. Configure GMAIL_SMTP_USER e GMAIL_SMTP_APP_PASSWORD nas variáveis de ambiente.");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass }
  });
}

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { client_id, template_id } = body;

    if (!client_id || !template_id) {
      return Response.json({ error: "Cliente e modelo de email são obrigatórios." }, { status: 400 });
    }

    const { data: client, error } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("id", client_id)
      .single();

    if (error || !client) {
      return Response.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    if (!client.email) {
      return Response.json({ error: "Cliente sem email cadastrado." }, { status: 400 });
    }

    const origin = siteOrigin(request);
    const formLink = `${origin}/acesso/${client.access_token}`;
    const template = getEmailTemplate(template_id, client, {
      formLink,
      rastreio: body.rastreio || ""
    });

    const fromEmail = process.env.EMAIL_FROM || process.env.GMAIL_SMTP_USER;
    const fromName = process.env.EMAIL_FROM_NAME || "Resumindo Viagens";

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: client.email,
      subject: template.subject,
      text: template.text,
      html: template.html
    });

    await supabaseAdmin.from("audit_logs").insert({
      client_id,
      action: "email_sent",
      details: {
        template_id,
        subject: template.subject,
        to: client.email,
        message_id: info.messageId || null
      }
    });

    return Response.json({ ok: true, message: "Email enviado com sucesso." });
  } catch (error) {
    return Response.json({ error: error.message || "Erro ao enviar email." }, { status: 500 });
  }
}
