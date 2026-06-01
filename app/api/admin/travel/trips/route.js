export const dynamic = "force-dynamic";

import { requireAdmin } from "../../../../../lib/auth";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

function arrayServices(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

export async function GET(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const customerId = url.searchParams.get("customer_id");

  let query = supabaseAdmin
    .from("travel_trips")
    .select("*, travel_customers(name, email, phone, alert_email)")
    .order("created_at", { ascending: false });

  if (customerId) query = query.eq("travel_customer_id", customerId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ trips: data || [] });
}

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();

  if (!body.travel_customer_id) return Response.json({ error: "Cliente da viagem é obrigatório." }, { status: 400 });
  if (!body.title) return Response.json({ error: "Título da viagem é obrigatório." }, { status: 400 });

  const payload = {
    travel_customer_id: body.travel_customer_id,
    title: body.title,
    destination: body.destination || "",
    status: body.status || "planejada",
    passengers: body.passengers || "",
    services: arrayServices(body.services),
    buyer_name: body.buyer_name || "",
    buyer_email: body.buyer_email || "",
    buyer_phone: body.buyer_phone || "",
    outbound_date: body.outbound_date || null,
    outbound_airline: body.outbound_airline || "",
    outbound_flight: body.outbound_flight || "",
    has_return: !!body.has_return,
    return_date: body.return_date || null,
    return_airline: body.return_airline || "",
    return_flight: body.return_flight || "",
    hotel_name: body.hotel_name || "",
    hotel_address: body.hotel_address || "",
    hotel_checkin: body.hotel_checkin || null,
    hotel_checkout: body.hotel_checkout || null,
    hotel_confirmation: body.hotel_confirmation || "",
    car_company: body.car_company || "",
    car_pickup: body.car_pickup || null,
    car_return: body.car_return || null,
    car_confirmation: body.car_confirmation || "",
    insurance_company: body.insurance_company || "",
    insurance_policy: body.insurance_policy || "",
    insurance_valid_until: body.insurance_valid_until || null,
    tickets_notes: body.tickets_notes || "",
    notes: body.notes || "",
    stage_created: true,
    stage_air_issued: !!body.stage_air_issued,
    stage_hotel_confirmed: !!body.stage_hotel_confirmed,
    stage_insurance_issued: !!body.stage_insurance_issued,
    stage_car_confirmed: !!body.stage_car_confirmed,
    stage_docs_sent: !!body.stage_docs_sent,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabaseAdmin
    .from("travel_trips")
    .insert(payload)
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ trip: data });
}
