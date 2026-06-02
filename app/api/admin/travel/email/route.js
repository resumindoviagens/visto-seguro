export const dynamic = "force-dynamic";

import { requireAdmin } from "../../../../../lib/auth";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { sendWithBrevo } from "../../../../../lib/brevoEmail";
import { getTravelEmailTemplate } from "../../../../../lib/travelEmailTemplates";
import { travelAgendaAttachments } from "../../../../../lib/travelAgenda";

function uniqueRecipients(list) {
  const seen = new Set();
  return list
    .filter((item) => item?.email && String(item.email).includes("@"))
    .filter((item) => {
      const email = String(item.email).trim().toLowerCase();
      if (seen.has(email)) return false;
      seen.add(email);
      return true;
    });
}

function recipients(trip) {
  const mode = trip.email_recipient_mode || "all";
  const passengers = (trip.travel_trip_passengers || trip.passengers_list || []).map((p) => ({ email: p.email, name: p.name }));
  const organizer = trip.organizer_email ? [{ email: trip.organizer_email, name: trip.organizer_name || "Organizador da viagem" }] : [];

  if (mode === "organizer") return uniqueRecipients(organizer);
  if (mode === "passengers") return uniqueRecipients(passengers);
  return uniqueRecipients([...passengers, ...organizer]);
}

function updateFieldForTemplate(templateId) {
  const map = {
    travel_calendar: "calendar_email_sent_at",
    travel_missing_services: "offer_email_sent_at",
    travel_week_before: "offer_email_sent_at",
    travel_checkin_outbound: "checkin_outbound_email_sent_at",
    travel_checkin_return: "checkin_return_email_sent_at",
    travel_airport_outbound: "airport_outbound_email_sent_at",
    travel_airport_return: "airport_return_email_sent_at"
  };
  return map[templateId] || null;
}

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const { trip_id, template_id } = body;
  if (!trip_id || !template_id) return Response.json({ error: "Viagem e modelo são obrigatórios." }, { status: 400 });

  const { data: trip, error } = await supabaseAdmin
    .from("travel_trips")
    .select("*, travel_trip_passengers(*)")
    .eq("id", trip_id)
    .maybeSingle();

  if (error || !trip) return Response.json({ error: "Viagem não encontrada." }, { status: 404 });

  trip.passengers_list = (trip.travel_trip_passengers || []).sort((a, b) => (a.passenger_order || 0) - (b.passenger_order || 0));

  const to = recipients(trip);
  if (to.length === 0) return Response.json({ error: "Nenhum destinatário conforme regra escolhida na viagem." }, { status: 400 });

  const baseTemplate = getTravelEmailTemplate(template_id, { name: trip.organizer_name || trip.passengers_list?.[0]?.name || "cliente" }, trip, body.options || {});
  const template = {
    subject: body.subject || baseTemplate.subject,
    html: body.html || baseTemplate.html,
    text: body.text || baseTemplate.text
  };
  const attachments = template_id === "travel_calendar" ? travelAgendaAttachments(trip) : [];

  const results = [];
  for (const recipient of to) {
    const result = await sendWithBrevo({
      toEmail: recipient.email,
      toName: recipient.name,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: ["resumindo-viagens", "viagens", template_id],
      attachments
    });
    results.push({ to: recipient.email, messageId: result?.messageId || null });
  }

  const field = updateFieldForTemplate(template_id);
  if (field) {
    await supabaseAdmin.from("travel_trips").update({ [field]: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", trip_id);
  }

  await supabaseAdmin.from("audit_logs").insert({
    action: "travel_email_sent",
    details: { trip_id, template_id, recipients: results.map((r) => r.to), results }
  });

  return Response.json({ ok: true, sent: results.length, results });
}
