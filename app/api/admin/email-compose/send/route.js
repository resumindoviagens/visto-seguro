export const dynamic = "force-dynamic";

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../../lib/auth";
import { sendWithBrevo } from "../../../../../lib/brevoEmail";
import { readFileSync } from "fs";
import path from "path";

function isInitialFormTemplate(templateId) {
  return ["formulario", "formulario_pendente", "formulario_recebido"].includes(templateId);
}

function isPassportTemplate(templateId) {
  return String(templateId || "").startsWith("passaporte_");
}

function isCanadaTemplate(templateId) {
  return String(templateId || "").startsWith("canada_");
}

function isFeedbackTemplate(templateId) {
  return templateId === "pesquisa_satisfacao";
}

function isPassportReturnedTemplate(templateId) {
  return templateId === "passaporte_recebido" || templateId === "rastreio";
}

function isTemplateAllowedForClient(client, templateId) {
  if (isPassportTemplate(templateId) && client.tipo_processo !== "Passaporte") {
    return { ok: false, reason: "Modelo disponível apenas para serviço de passaporte." };
  }

  if (isCanadaTemplate(templateId) && !String(client.tipo_processo || "").toLowerCase().includes("canad")) {
    return { ok: false, reason: "Modelo disponível apenas para visto canadense." };
  }

  if ((client.no_form_required || !client.access_token) && isInitialFormTemplate(templateId)) {
    return { ok: false, reason: "Modelo indisponível para cadastro de controle." };
  }

  if (isFeedbackTemplate(templateId) && !(client.stage_passport_returned || client.is_completed || client.stage_ready_to_archive)) {
    return { ok: false, reason: "Pesquisa de satisfação disponível somente após passaporte devolvido/processo concluído." };
  }

  if (isPassportReturnedTemplate(templateId) && !(client.stage_passport_returned || client.passport_tracking_code || client.is_completed)) {
    return { ok: false, reason: "Modelo disponível somente após rastreio/passaporte devolvido." };
  }

  return { ok: true };
}

function photoAttachmentsForTemplate(templateId) {
  }
  if (templateId !== "foto_instrucoes") return [];
  try {
    const filePath = path.join(process.cwd(), "public", "foto", "infografico_foto_visto.jpg");
    const content = readFileSync(filePath).toString("base64");
    return [{ name: "instrucoes-foto-visto.jpg", content }];
  } catch {
    return [];
  }
}

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

    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .maybeSingle();

    if (clientError || !client) return Response.json({ error: "Cliente não encontrado." }, { status: 404 });

    const allowed = isTemplateAllowedForClient(client, templateId);
    if (!allowed.ok) return Response.json({ error: allowed.reason }, { status: 400 });

    if (!toEmail) return Response.json({ error: "Email de destino obrigatório." }, { status: 400 });
    if (!subject) return Response.json({ error: "Assunto obrigatório." }, { status: 400 });
    if (!html) return Response.json({ error: "Corpo do email obrigatório." }, { status: 400 });

    const result = await sendWithBrevo({
      toEmail,
      toName,
      subject,
      html,
      text,
      tags: ["resumindo-viagens", "editor-email", templateId],
      attachments: photoAttachmentsForTemplate(templateId)
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
