export const dynamic = "force-dynamic";

import { requireAdmin } from "../../../../../lib/auth";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { sendWithBrevo } from "../../../../../lib/brevoEmail";
import { getTravelEmailTemplate } from "../../../../../lib/travelEmailTemplates";
import { travelAgendaAttachments } from "../../../../../lib/travelAgenda";

function recipients(customer, trip) {
  const list = [];
  if (customer?.email) list.push({ email: customer.email, name: customer.name });
  if (customer?.alert_email && customer.alert_email !== customer.email) list.push({ email: customer.alert_email, name: trip.buyer_name || customer.name });
  if (trip?.buyer_email && !list.some((item) => item.email === trip.buyer_email)) list.push({ email: trip.buyer_email, name: trip.buyer_name || customer.name });
  return list;
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
    .select("*, travel_customers(*)")
    .eq("id", trip_id)
    .maybeSingle();

  if (error || !trip) return Response.json({ error: "Viagem não encontrada." }, { status: 404 });

  const customer = trip.travel_customers;
  const to = recipients(customer, trip);
  if (to.length === 0) return Response.json({ error: "Nenhum email cadastrado para cliente/comprador." }, { status: 400 });

  const template = getTravelEmailTemplate(template_id, customer, trip, body.options || {});
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
    details: { trip_id, template_id, results }
  });

  return Response.json({ ok: true, sent: results.length, results });
}
