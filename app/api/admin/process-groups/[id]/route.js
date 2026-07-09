import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../../lib/auth";
import { sendWithBrevo, simpleHtml } from "../../../../../lib/brevoEmail";

function padICS(value) {
  return String(value).padStart(2, "0");
}

function toICSDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return `${date.getUTCFullYear()}${padICS(date.getUTCMonth() + 1)}${padICS(date.getUTCDate())}T${padICS(date.getUTCHours())}${padICS(date.getUTCMinutes())}00Z`;
}

function buildICSLocal({ title, description = "", location = "", start, end }) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date(startDate.getTime() + 60 * 60 * 1000);
  const uid = `${Date.now()}-${Math.random().toString(16).slice(2)}@resumindoviagens.com.br`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Resumindo Viagens//Sistema de Vistos//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(startDate)}`,
    `DTEND:${toICSDate(endDate)}`,
    `SUMMARY:${String(title).replace(/\n/g, " ")}`,
    `DESCRIPTION:${String(description).replace(/\n/g, "\\n")}`,
    location ? `LOCATION:${String(location).replace(/\n/g, " ")}` : "",
    "END:VEVENT",
    "END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
}

function icsAttachment({ title, description, location, start }) {
  const ics = buildICSLocal({ title, description, location, start });
  return {
    name: "videochamada-resumindo.ics",
    content: Buffer.from(ics, "utf-8").toString("base64")
  };
}

function fmtDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  } catch {
    return String(value);
  }
}


export async function PATCH(request, context) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const params = await context.params;
  const body = await request.json();

  const { data: oldGroup } = await supabaseAdmin
    .from("grupos_processo")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  const updates = {
    nome: body.nome,
    consulate_city: body.consulate_city || "",
    casv_date: body.casv_date || null,
    interview_date: body.interview_date || null,
    video_call_date: body.video_call_date || null,
    passport_tracking_code: body.passport_tracking_code || "",
    data_inicio_processo: body.data_inicio_processo || null,
    ds160_travel_date: body.ds160_travel_date || null,
    ds160_trip_duration_days: body.ds160_trip_duration_days ? Number(body.ds160_trip_duration_days) : null,
    ds160_destination_city: body.ds160_destination_city || "",
    ds160_selected_hotel_name: body.ds160_selected_hotel_name || "",
    ds160_selected_hotel_address: body.ds160_selected_hotel_address || "",
    ds160_selected_hotel_phone: body.ds160_selected_hotel_phone || "",
    ds160_common_notes: body.ds160_common_notes || "",
    ds160_common_security_answers: body.ds160_common_security_answers || "",
    updated_at: new Date().toISOString()
  };
  Object.keys(updates).forEach((key) => typeof updates[key] === "undefined" && delete updates[key]);

  const { data, error } = await supabaseAdmin
    .from("grupos_processo")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (updates.video_call_date && updates.video_call_date !== oldGroup?.video_call_date) {
    try {
      const title = `Videochamada Resumindo Viagens — ${data.nome}`;
      const description = `Videochamada de preparação/orientação com a Resumindo Viagens para o grupo ${data.nome}.`;
      await sendWithBrevo({
        toEmail: process.env.ALERT_EMAIL_TO || "contato@resumindoviagens.com.br",
        toName: "Resumindo Viagens",
        subject: `Videochamada agendada — ${data.nome}`,
        html: simpleHtml(`Videochamada agendada — ${data.nome}`, [
          `Foi informada/alterada a data de videochamada do grupo de processo <strong>${data.nome}</strong>.`,
          `<strong>Data da videochamada:</strong> ${fmtDateTime(updates.video_call_date)}`,
          data.consulate_city ? `<strong>Consulado:</strong> ${data.consulate_city}` : "",
          "Este email possui arquivo .ics para adicionar a videochamada à agenda."
        ].filter(Boolean)),
        text: `Videochamada agendada para ${data.nome}: ${updates.video_call_date}`,
        tags: ["resumindo-viagens", "alerta-videochamada", "agenda-interna"],
        attachments: [icsAttachment({ title, description, location: "Online", start: updates.video_call_date })],
        fromEmail: process.env.SYSTEM_EMAIL_FROM || process.env.ALERT_EMAIL_FROM || "alertas@resumindoviagens.com.br",
        fromName: process.env.ALERT_EMAIL_FROM_NAME || "Resumindo Viagens - Alertas",
        replyToEmail: process.env.SYSTEM_EMAIL_REPLY_TO || process.env.ALERT_EMAIL_REPLY_TO || "contato@resumindoviagens.com.br"
      });
    } catch (emailError) {
      // Não bloqueia o salvamento da data se o email falhar.
    }
  }

  return Response.json({ group: data });
}

export async function DELETE(request, context) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const params = await context.params;

  await supabaseAdmin.from("clients").update({ group_process_id: null }).eq("group_process_id", params.id);
  const { error } = await supabaseAdmin.from("grupos_processo").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
