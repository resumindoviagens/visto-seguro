export const dynamic = "force-dynamic";

import { requireAdmin } from "../../../../../lib/auth";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

function arrayServices(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function cleanCPF(value) {
  return String(value || "").replace(/\D/g, "");
}

function cleanPayload(body) {
  return {
    title: body.title,
    destination: body.destination || "",
    status: body.status || "planejada",
    passengers: body.passengers || "",
    passenger_count: Number(body.passenger_count || 1),
    services: arrayServices(body.services),
    organizer_name: body.organizer_name || "",
    organizer_email: body.organizer_email || "",
    organizer_phone: body.organizer_phone || "",
    organizer_is_passenger: !!body.organizer_is_passenger,
    email_recipient_mode: body.email_recipient_mode || "all",
    buyer_name: body.organizer_name || body.buyer_name || "",
    buyer_email: body.organizer_email || body.buyer_email || "",
    buyer_phone: body.organizer_phone || body.buyer_phone || "",
    outbound_date: body.outbound_date || null,
    outbound_airline: body.outbound_airline || "",
    outbound_flight: body.outbound_flight || "",
    booking_locator: body.booking_locator || "",
    has_return: !!body.has_return,
    return_date: body.return_date || null,
    return_airline: body.return_airline || "",
    return_flight: body.return_flight || "",
    return_booking_locator: body.return_booking_locator || "",
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
    stage_checkin_available: !!body.stage_checkin_available,
    stage_trip_started: !!body.stage_trip_started,
    stage_trip_finished: !!body.stage_trip_finished,
    updated_at: new Date().toISOString()
  };
}

function cleanPassenger(passenger, index, tripId) {
  return {
    travel_trip_id: tripId,
    travel_customer_id: passenger.travel_customer_id || null,
    passenger_order: Number(passenger.passenger_order || index + 1),
    name: passenger.name || `Passageiro ${index + 1}`,
    email: passenger.email || "",
    phone: passenger.phone || "",
    cpf: cleanCPF(passenger.cpf),
    birth_date: passenger.birth_date || null,
    is_primary: index === 0,
    updated_at: new Date().toISOString()
  };
}

async function replacePassengers(tripId, passengers = []) {
  await supabaseAdmin.from("travel_trip_passengers").delete().eq("travel_trip_id", tripId);
  const clean = passengers
    .filter((p) => p && (p.name || p.travel_customer_id))
    .map((p, index) => cleanPassenger(p, index, tripId));

  if (clean.length > 0) {
    const { error } = await supabaseAdmin.from("travel_trip_passengers").insert(clean);
    if (error) throw error;
  }
}

export async function GET(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { data, error } = await supabaseAdmin
    .from("travel_trips")
    .select("*, travel_trip_passengers(*)")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const trips = (data || []).map((trip) => ({
    ...trip,
    passengers_list: (trip.travel_trip_passengers || []).sort((a, b) => (a.passenger_order || 0) - (b.passenger_order || 0))
  }));

  return Response.json({ trips });
}

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  if (!body.title) return Response.json({ error: "Título da viagem é obrigatório." }, { status: 400 });

  const passengers = body.passengers_list || [];
  const primary = passengers.find((p) => p.travel_customer_id) || passengers[0] || null;

  const payload = {
    ...cleanPayload(body),
    travel_customer_id: primary?.travel_customer_id || null
  };

  const { data, error } = await supabaseAdmin
    .from("travel_trips")
    .insert(payload)
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  try {
    await replacePassengers(data.id, passengers);
  } catch (passengerError) {
    return Response.json({ error: passengerError.message }, { status: 500 });
  }

  return Response.json({ trip: data });
}

export async function PATCH(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  if (!body.id) return Response.json({ error: "ID da viagem é obrigatório." }, { status: 400 });
  if (!body.title) return Response.json({ error: "Título da viagem é obrigatório." }, { status: 400 });

  const passengers = body.passengers_list || [];
  const primary = passengers.find((p) => p.travel_customer_id) || passengers[0] || null;

  const payload = {
    ...cleanPayload(body),
    travel_customer_id: primary?.travel_customer_id || body.travel_customer_id || null
  };

  const { data, error } = await supabaseAdmin
    .from("travel_trips")
    .update(payload)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  try {
    await replacePassengers(data.id, passengers);
  } catch (passengerError) {
    return Response.json({ error: passengerError.message }, { status: 500 });
  }

  return Response.json({ trip: data });
}

export async function DELETE(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "ID da viagem é obrigatório." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("travel_trips")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
