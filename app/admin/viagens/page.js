"use client";

import { useEffect, useMemo, useState } from "react";

const SERVICE_OPTIONS = ["Passagem aérea", "Hotel", "Seguro viagem", "Locação de carro", "Ingressos", "Cruzeiro", "Pacote"];

const TRAVEL_EMAILS = [
  ["travel_calendar", "V01 - Agenda/calendário"],
  ["travel_confirmation", "V02 - Confirmação da compra/reserva"],
  ["travel_missing_services", "V03 - Oferecer seguro/hotel/carro/ingressos"],
  ["travel_checkin_outbound", "V04 - Check-in ida 48h"],
  ["travel_checkin_return", "V05 - Check-in volta/outro trecho 48h"],
  ["travel_airport_outbound", "V06 - Dia do voo ida"],
  ["travel_airport_return", "V07 - Dia do voo volta/outro trecho"],
  ["travel_week_before", "V08 - Uma semana antes: falta algo?"]
];

const TRIP_STEPS = [
  ["stage_created", "Viagem criada"],
  ["stage_air_issued", "Passagem emitida"],
  ["stage_hotel_confirmed", "Hotel confirmado"],
  ["stage_insurance_issued", "Seguro emitido"],
  ["stage_car_confirmed", "Carro confirmado"],
  ["stage_docs_sent", "Documentação enviada"],
  ["stage_checkin_available", "Check-in disponível"],
  ["stage_trip_started", "Viagem iniciada"],
  ["stage_trip_finished", "Viagem concluída"]
];

function formatDateTime(value) {
  if (!value) return "-";
  const raw = String(value).replace(" ", "T").slice(0, 16);
  const [datePart, timePart = ""] = raw.split("T");
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return raw;
  return `${d}/${m}/${y}${timePart ? `, ${timePart}` : ""}`;
}

function formatDate(value) {
  if (!value) return "-";
  const raw = String(value).slice(0, 10);
  const [y, m, d] = raw.split("-");
  return y && m && d ? `${d}/${m}/${y}` : raw;
}

function toLocal(value) { return value ? String(value).slice(0, 16) : ""; }
function toDate(value) { return value ? String(value).slice(0, 10) : ""; }

function emptyCustomer() {
  return { name: "", email: "", phone: "", cpf: "", birth_date: "", alert_email: "", notes: "" };
}

function passengerFromCustomer(customer, order) {
  return {
    travel_customer_id: customer?.id || "",
    passenger_order: order,
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    cpf: customer?.cpf || "",
    birth_date: customer?.birth_date || ""
  };
}

function blankPassenger(order) {
  return {
    travel_customer_id: "",
    passenger_order: order,
    name: "",
    email: "",
    phone: "",
    cpf: "",
    birth_date: ""
  };
}

function makePassengers(count, current = []) {
  const n = Math.max(1, Math.min(9, Number(count || 1)));
  return Array.from({ length: n }, (_, index) => current[index] || blankPassenger(index + 1));
}

function emptyTrip() {
  return {
    id: "",
    title: "",
    destination: "",
    passenger_count: 1,
    passengers_list: [blankPassenger(1)],
    services: [],
    organizer_name: "",
    organizer_email: "",
    organizer_phone: "",
    organizer_is_passenger: false,
    email_recipient_mode: "all",
    automation_enabled: true,
    outbound_date: "",
    outbound_airline: "",
    outbound_flight: "",
    booking_locator: "",
    has_return: false,
    return_date: "",
    return_airline: "",
    return_flight: "",
    return_booking_locator: "",
    hotel_name: "",
    hotel_address: "",
    hotel_checkin: "",
    hotel_checkout: "",
    hotel_confirmation: "",
    car_company: "",
    car_pickup: "",
    car_return: "",
    car_confirmation: "",
    insurance_company: "",
    insurance_policy: "",
    insurance_valid_until: "",
    tickets_notes: "",
    notes: "",
    stage_air_issued: false,
    stage_hotel_confirmed: false,
    stage_insurance_issued: false,
    stage_car_confirmed: false,
    stage_docs_sent: false,
    stage_checkin_available: false,
    stage_trip_started: false,
    stage_trip_finished: false
  };
}

function tripToForm(trip) {
  const passengers = (trip.passengers_list || trip.travel_trip_passengers || []).sort((a, b) => (a.passenger_order || 0) - (b.passenger_order || 0));
  const count = Math.max(1, Math.min(9, Number(trip.passenger_count || passengers.length || 1)));
  return {
    id: trip.id,
    title: trip.title || "",
    destination: trip.destination || "",
    passenger_count: count,
    passengers_list: makePassengers(count, passengers.map((p, index) => ({
      travel_customer_id: p.travel_customer_id || "",
      passenger_order: index + 1,
      name: p.name || "",
      email: p.email || "",
      phone: p.phone || "",
      cpf: p.cpf || "",
      birth_date: toDate(p.birth_date)
    }))),
    services: trip.services || [],
    organizer_name: trip.organizer_name || trip.buyer_name || "",
    organizer_email: trip.organizer_email || trip.buyer_email || "",
    organizer_phone: trip.organizer_phone || trip.buyer_phone || "",
    organizer_is_passenger: !!trip.organizer_is_passenger,
    email_recipient_mode: trip.email_recipient_mode || "all",
    automation_enabled: trip.automation_enabled !== false,
    outbound_date: toLocal(trip.outbound_date),
    outbound_airline: trip.outbound_airline || "",
    outbound_flight: trip.outbound_flight || "",
    booking_locator: trip.booking_locator || "",
    has_return: !!trip.has_return,
    return_date: toLocal(trip.return_date),
    return_airline: trip.return_airline || "",
    return_flight: trip.return_flight || "",
    return_booking_locator: trip.return_booking_locator || "",
    hotel_name: trip.hotel_name || "",
    hotel_address: trip.hotel_address || "",
    hotel_checkin: toDate(trip.hotel_checkin),
    hotel_checkout: toDate(trip.hotel_checkout),
    hotel_confirmation: trip.hotel_confirmation || "",
    car_company: trip.car_company || "",
    car_pickup: toLocal(trip.car_pickup),
    car_return: toLocal(trip.car_return),
    car_confirmation: trip.car_confirmation || "",
    insurance_company: trip.insurance_company || "",
    insurance_policy: trip.insurance_policy || "",
    insurance_valid_until: toDate(trip.insurance_valid_until),
    tickets_notes: trip.tickets_notes || "",
    notes: trip.notes || "",
    stage_air_issued: !!trip.stage_air_issued,
    stage_hotel_confirmed: !!trip.stage_hotel_confirmed,
    stage_insurance_issued: !!trip.stage_insurance_issued,
    stage_car_confirmed: !!trip.stage_car_confirmed,
    stage_docs_sent: !!trip.stage_docs_sent,
    stage_checkin_available: !!trip.stage_checkin_available,
    stage_trip_started: !!trip.stage_trip_started,
    stage_trip_finished: !!trip.stage_trip_finished
  };
}

function inputStyle() {
  return { padding: 11, borderRadius: 11, border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box" };
}

export default function AdminViagensPage() {
  const [customers, setCustomers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [customerForm, setCustomerForm] = useState(emptyCustomer());
  const [tripForm, setTripForm] = useState(emptyTrip());
  const [editingTripId, setEditingTripId] = useState("");
  const [search, setSearch] = useState("");
  const [tripSearch, setTripSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailComposer, setEmailComposer] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);

  async function load() {
    const [customersRes, tripsRes] = await Promise.all([
      fetch("/api/admin/travel/customers", { cache: "no-store" }),
      fetch("/api/admin/travel/trips", { cache: "no-store" })
    ]);
    const customersData = await customersRes.json();
    const tripsData = await tripsRes.json();

    if (!customersRes.ok) return alert(customersData.error || "Erro ao carregar clientes de viagem.");
    if (!tripsRes.ok) return alert(tripsData.error || "Erro ao carregar viagens.");

    setCustomers(customersData.customers || []);
    setTrips(tripsData.trips || []);
  }

  useEffect(() => { load(); }, []);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers.slice(0, 20);
    return customers.filter((item) => [item.name, item.email, item.phone, item.cpf].filter(Boolean).join(" ").toLowerCase().includes(q)).slice(0, 30);
  }, [customers, search]);

  const filteredTrips = useMemo(() => {
    const q = tripSearch.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((trip) => [
      trip.title,
      trip.destination,
      trip.organizer_name,
      trip.organizer_email,
      ...(trip.passengers_list || []).map((p) => `${p.name} ${p.email}`)
    ].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [trips, tripSearch]);

  async function createCustomer() {
    if (!customerForm.name) return alert("Informe o nome do cliente.");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/travel/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm)
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Erro ao criar cliente.");
      setCustomerForm(emptyCustomer());
      await load();
      alert("Cliente de viagem cadastrado. Agora você pode selecioná-lo como passageiro.");
    } finally {
      setLoading(false);
    }
  }

  async function saveTrip() {
    if (!tripForm.title) return alert("Informe o título da viagem.");
    const validPassengers = tripForm.passengers_list.filter((p) => p.name || p.travel_customer_id);
    if (validPassengers.length === 0) return alert("Informe ao menos um passageiro.");

    setLoading(true);
    try {
      const method = editingTripId ? "PATCH" : "POST";
      const res = await fetch("/api/admin/travel/trips", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tripForm, id: editingTripId, passengers_list: validPassengers })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Erro ao salvar viagem.");
      setTripForm(emptyTrip());
      setEditingTripId("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  function editTrip(trip) {
    setEditingTripId(trip.id);
    setTripForm(tripToForm(trip));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingTripId("");
    setTripForm(emptyTrip());
  }

  async function deleteTrip(trip) {
    const ok = confirm(`Excluir a viagem "${trip.title}"? Esta ação remove somente a viagem, não remove clientes/passageiros.`);
    if (!ok) return;

    const res = await fetch(`/api/admin/travel/trips?id=${trip.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Erro ao excluir viagem.");
    await load();
  }

  function toggleService(service) {
    const current = tripForm.services || [];
    const next = current.includes(service) ? current.filter((item) => item !== service) : [...current, service];
    setTripForm({ ...tripForm, services: next });
  }

  function changePassengerCount(count) {
    const n = Math.max(1, Math.min(9, Number(count || 1)));
    setTripForm({ ...tripForm, passenger_count: n, passengers_list: makePassengers(n, tripForm.passengers_list) });
  }

  function updatePassenger(index, patch) {
    const list = [...tripForm.passengers_list];
    list[index] = { ...list[index], ...patch, passenger_order: index + 1 };
    setTripForm({ ...tripForm, passengers_list: list });
  }

  function selectCustomerForPassenger(index, customerId) {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return updatePassenger(index, { travel_customer_id: "" });
    updatePassenger(index, passengerFromCustomer(customer, index + 1));
  }

  function usePassengerAsOrganizer(index) {
    const p = tripForm.passengers_list[index];
    if (!p) return;
    setTripForm({
      ...tripForm,
      organizer_name: p.name || "",
      organizer_email: p.email || "",
      organizer_phone: p.phone || "",
      organizer_is_passenger: true
    });
  }

  async function openTravelEmail(trip, templateId) {
    setEmailLoading(true);
    try {
      const res = await fetch(`/api/admin/travel/email-preview?trip_id=${trip.id}&template_id=${templateId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Erro ao carregar email.");

      setEmailComposer({
        trip,
        templateId,
        subject: data.subject || "",
        bodyText: data.bodyText || "",
        html: data.html || "",
        to: data.to || [],
        recipientMode: data.recipientMode || "all"
      });
    } finally {
      setEmailLoading(false);
    }
  }

  function emailStatusLabel(trip, field) {
    return trip[field] ? `✓ ${formatDateTime(trip[field])}` : "○ não enviado";
  }

  async function runTravelAutomationNow() {
    const ok = confirm("Executar agora a automação de emails de viagens? Isso enviará apenas emails que estiverem dentro das janelas programadas e ainda não enviados.");
    if (!ok) return;
    const res = await fetch("/api/admin/travel/run-automation", { method: "POST" });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Erro ao executar automação.");
    alert(`Automação processada. Viagens verificadas: ${data.processed || 0}. Emails/ações: ${(data.results || []).length}.`);
    await load();
  }

  async function sendTravelEmail() {
    if (!emailComposer) return;
    const ok = confirm(`Enviar este email para ${emailComposer.to.length || 0} destinatário(s)?`);
    if (!ok) return;

    setEmailLoading(true);
    try {
      const res = await fetch("/api/admin/travel/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: emailComposer.trip.id,
          template_id: emailComposer.templateId,
          subject: emailComposer.subject,
          bodyText: emailComposer.bodyText
        })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Erro ao enviar email.");
      alert(`Email enviado para ${data.sent || 0} destinatário(s).`);
      setEmailComposer(null);
      await load();
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: 24, fontFamily: "Arial, Helvetica, sans-serif", color: "#1f2937" }}>
      <div style={{ background: "#1f2a60", color: "#fff", borderRadius: 24, padding: 26, marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontSize: 34 }}>Administração de Viagens</h1>
        <p style={{ margin: "8px 0 0", opacity: .95 }}>A viagem agora é o centro do cadastro. Cada viagem pode ter de 1 a 9 passageiros e um organizador externo.</p>
        <button onClick={runTravelAutomationNow} style={{ marginTop: 16, background: "#ff9800", color: "#fff", border: 0, borderRadius: 12, padding: "11px 14px", fontWeight: 900 }}>Rodar automação de viagens agora</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", gap: 18, alignItems: "start" }}>
        <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 18 }}>
          <h2 style={{ color: "#1f2a60", marginTop: 0 }}>Pré-cadastro de passageiros</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Use quando um passageiro ainda não existir no banco. Clientes de visto/passaporte já aparecem na busca.</p>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar passageiro, email, CPF..." style={{ ...inputStyle(), marginBottom: 12 }} />

          <div style={{ maxHeight: 280, overflow: "auto", display: "grid", gap: 8 }}>
            {filteredCustomers.map((customer) => (
              <div key={customer.id} style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 14, padding: 12 }}>
                <strong>{customer.name}</strong>
                <div style={{ fontSize: 13, color: "#4b5563" }}>{customer.email || "sem email"} · {customer.phone || "sem telefone"}</div>
              </div>
            ))}
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "18px 0" }} />

          <h3>Novo passageiro</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <input style={inputStyle()} placeholder="Nome" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} />
            <input style={inputStyle()} placeholder="Email principal" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
            <input style={inputStyle()} placeholder="Email adicional / responsável" value={customerForm.alert_email} onChange={(e) => setCustomerForm({ ...customerForm, alert_email: e.target.value })} />
            <input style={inputStyle()} placeholder="Telefone" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} />
            <input style={inputStyle()} placeholder="CPF" value={customerForm.cpf} onChange={(e) => setCustomerForm({ ...customerForm, cpf: e.target.value })} />
            <label style={{ fontSize: 13 }}>Nascimento<input style={inputStyle()} type="date" value={customerForm.birth_date} onChange={(e) => setCustomerForm({ ...customerForm, birth_date: e.target.value })} /></label>
            <textarea style={inputStyle()} placeholder="Observações" value={customerForm.notes} onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })} />
            <button onClick={createCustomer} disabled={loading} style={{ background: "#1f2a60", color: "#fff", border: 0, borderRadius: 12, padding: "12px 14px", fontWeight: 800 }}>Pré-cadastrar passageiro</button>
          </div>
        </section>

        <section style={{ display: "grid", gap: 18 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 18 }}>
            <h2 style={{ color: "#1f2a60", marginTop: 0 }}>{editingTripId ? "Editar viagem" : "Criar viagem"}</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px", gap: 10 }}>
                <input style={inputStyle()} placeholder="Título da viagem. Ex.: Orlando Julho 2027" value={tripForm.title} onChange={(e) => setTripForm({ ...tripForm, title: e.target.value })} />
                <input style={inputStyle()} placeholder="Destino" value={tripForm.destination} onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })} />
                <label style={{ fontSize: 13 }}>Qtd. passageiros
                  <select style={inputStyle()} value={tripForm.passenger_count} onChange={(e) => changePassengerCount(e.target.value)}>
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </div>

              <details open style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 14 }}>
                <summary style={{ fontWeight: 900, color: "#1f2a60", cursor: "pointer" }}>Passageiros da viagem ({tripForm.passenger_count})</summary>
                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                  {tripForm.passengers_list.map((passenger, index) => (
                    <div key={index} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8 }}>
                        <strong>Passageiro {index + 1}</strong>
                        <button type="button" onClick={() => usePassengerAsOrganizer(index)} style={{ border: 0, background: "#ffedd5", color: "#9a3412", borderRadius: 10, padding: "7px 10px", fontWeight: 800 }}>Usar como organizador</button>
                      </div>
                      <select style={{ ...inputStyle(), marginBottom: 8 }} value={passenger.travel_customer_id || ""} onChange={(e) => selectCustomerForPassenger(index, e.target.value)}>
                        <option value="">Selecionar cliente já cadastrado ou preencher manualmente</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>{customer.name} — {customer.email || "sem email"}</option>
                        ))}
                      </select>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 8 }}>
                        <input style={inputStyle()} placeholder="Nome" value={passenger.name || ""} onChange={(e) => updatePassenger(index, { name: e.target.value, travel_customer_id: "" })} />
                        <input style={inputStyle()} placeholder="Email" value={passenger.email || ""} onChange={(e) => updatePassenger(index, { email: e.target.value })} />
                        <input style={inputStyle()} placeholder="Telefone" value={passenger.phone || ""} onChange={(e) => updatePassenger(index, { phone: e.target.value })} />
                        <input style={inputStyle()} placeholder="CPF" value={passenger.cpf || ""} onChange={(e) => updatePassenger(index, { cpf: e.target.value })} />
                        <input style={inputStyle()} type="date" value={toDate(passenger.birth_date)} onChange={(e) => updatePassenger(index, { birth_date: e.target.value })} />
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              <details open style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 14 }}>
                <summary style={{ fontWeight: 900, color: "#1f2a60", cursor: "pointer" }}>Organizador e destinatários</summary>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
                  <input style={inputStyle()} placeholder="Nome do organizador" value={tripForm.organizer_name} onChange={(e) => setTripForm({ ...tripForm, organizer_name: e.target.value })} />
                  <input style={inputStyle()} placeholder="Email do organizador" value={tripForm.organizer_email} onChange={(e) => setTripForm({ ...tripForm, organizer_email: e.target.value })} />
                  <input style={inputStyle()} placeholder="Telefone do organizador" value={tripForm.organizer_phone} onChange={(e) => setTripForm({ ...tripForm, organizer_phone: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
                  <label><input type="checkbox" checked={tripForm.organizer_is_passenger} onChange={(e) => setTripForm({ ...tripForm, organizer_is_passenger: e.target.checked })} /> Organizador também é passageiro</label>
                  <label><input type="radio" name="recipients" checked={tripForm.email_recipient_mode === "organizer"} onChange={() => setTripForm({ ...tripForm, email_recipient_mode: "organizer" })} /> Apenas organizador</label>
                  <label><input type="radio" name="recipients" checked={tripForm.email_recipient_mode === "passengers"} onChange={() => setTripForm({ ...tripForm, email_recipient_mode: "passengers" })} /> Todos os passageiros</label>
                  <label><input type="radio" name="recipients" checked={tripForm.email_recipient_mode === "all"} onChange={() => setTripForm({ ...tripForm, email_recipient_mode: "all" })} /> Passageiros + organizador</label>
                </div>
                <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                  <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontWeight: 800 }}>
                    <input type="checkbox" checked={tripForm.automation_enabled !== false} onChange={(e) => setTripForm({ ...tripForm, automation_enabled: e.target.checked })} />
                    Enviar automaticamente os emails de viagem nas antecedências programadas
                  </label>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
                    Ao criar a viagem, a agenda/calendário é enviada automaticamente. Depois o cron envia check-in, dia do voo e lembretes conforme as datas.
                  </div>
                </div>
              </details>

              <div>
                <strong>Serviços agregados</strong>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {SERVICE_OPTIONS.map((service) => (
                    <button key={service} type="button" onClick={() => toggleService(service)} style={{ border: "1px solid #d1d5db", borderRadius: 999, padding: "8px 12px", background: tripForm.services.includes(service) ? "#1f2a60" : "#fff", color: tripForm.services.includes(service) ? "#fff" : "#1f2937", fontWeight: 700 }}>
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <h3>Passagem aérea</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                <label>Ida<input style={inputStyle()} type="datetime-local" value={tripForm.outbound_date} onChange={(e) => setTripForm({ ...tripForm, outbound_date: e.target.value })} /></label>
                <input style={inputStyle()} placeholder="Cia aérea ida" value={tripForm.outbound_airline} onChange={(e) => setTripForm({ ...tripForm, outbound_airline: e.target.value })} />
                <input style={inputStyle()} placeholder="Voo ida" value={tripForm.outbound_flight} onChange={(e) => setTripForm({ ...tripForm, outbound_flight: e.target.value })} />
                <input style={inputStyle()} placeholder="Localizador da reserva" value={tripForm.booking_locator} onChange={(e) => setTripForm({ ...tripForm, booking_locator: e.target.value })} />
              </div>

              <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={tripForm.has_return} onChange={(e) => setTripForm({ ...tripForm, has_return: e.target.checked })} />
                Contém volta ou outro trecho na mesma reserva
              </label>

              {tripForm.has_return && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                  <label>Volta / outro trecho<input style={inputStyle()} type="datetime-local" value={tripForm.return_date} onChange={(e) => setTripForm({ ...tripForm, return_date: e.target.value })} /></label>
                  <input style={inputStyle()} placeholder="Cia aérea volta" value={tripForm.return_airline} onChange={(e) => setTripForm({ ...tripForm, return_airline: e.target.value })} />
                  <input style={inputStyle()} placeholder="Voo volta" value={tripForm.return_flight} onChange={(e) => setTripForm({ ...tripForm, return_flight: e.target.value })} />
                  <input style={inputStyle()} placeholder="Localizador volta/outro trecho" value={tripForm.return_booking_locator} onChange={(e) => setTripForm({ ...tripForm, return_booking_locator: e.target.value })} />
                </div>
              )}

              <h3>Hotel</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={inputStyle()} placeholder="Hotel" value={tripForm.hotel_name} onChange={(e) => setTripForm({ ...tripForm, hotel_name: e.target.value })} />
                <input style={inputStyle()} placeholder="Endereço" value={tripForm.hotel_address} onChange={(e) => setTripForm({ ...tripForm, hotel_address: e.target.value })} />
                <label>Check-in<input style={inputStyle()} type="date" value={tripForm.hotel_checkin} onChange={(e) => setTripForm({ ...tripForm, hotel_checkin: e.target.value })} /></label>
                <label>Check-out<input style={inputStyle()} type="date" value={tripForm.hotel_checkout} onChange={(e) => setTripForm({ ...tripForm, hotel_checkout: e.target.value })} /></label>
                <input style={inputStyle()} placeholder="Confirmação hotel" value={tripForm.hotel_confirmation} onChange={(e) => setTripForm({ ...tripForm, hotel_confirmation: e.target.value })} />
              </div>

              <h3>Carro, seguro e ingressos</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={inputStyle()} placeholder="Locadora" value={tripForm.car_company} onChange={(e) => setTripForm({ ...tripForm, car_company: e.target.value })} />
                <input style={inputStyle()} placeholder="Confirmação carro" value={tripForm.car_confirmation} onChange={(e) => setTripForm({ ...tripForm, car_confirmation: e.target.value })} />
                <input style={inputStyle()} placeholder="Seguradora" value={tripForm.insurance_company} onChange={(e) => setTripForm({ ...tripForm, insurance_company: e.target.value })} />
                <input style={inputStyle()} placeholder="Apólice" value={tripForm.insurance_policy} onChange={(e) => setTripForm({ ...tripForm, insurance_policy: e.target.value })} />
              </div>
              <textarea style={inputStyle()} placeholder="Ingressos / reservas / observações da viagem" value={tripForm.tickets_notes} onChange={(e) => setTripForm({ ...tripForm, tickets_notes: e.target.value })} />

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {TRIP_STEPS.filter(([key]) => key !== "stage_created").map(([key, label]) => (
                  <label key={key} style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                    <input type="checkbox" checked={!!tripForm[key]} onChange={(e) => setTripForm({ ...tripForm, [key]: e.target.checked })} />
                    {label}
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={saveTrip} disabled={loading} style={{ background: "#ff9800", color: "#fff", border: 0, borderRadius: 12, padding: "13px 16px", fontWeight: 900 }}>{editingTripId ? "Salvar alterações" : "Criar viagem"}</button>
                {editingTripId && <button onClick={cancelEdit} style={{ background: "#eef2f7", color: "#1f2a60", border: 0, borderRadius: 12, padding: "13px 16px", fontWeight: 800 }}>Cancelar edição</button>}
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 18 }}>
            <h2 style={{ color: "#1f2a60", marginTop: 0 }}>Viagens cadastradas</h2>
            <input value={tripSearch} onChange={(e) => setTripSearch(e.target.value)} placeholder="Buscar viagem, destino, passageiro ou organizador..." style={{ ...inputStyle(), marginBottom: 14 }} />
            {filteredTrips.length === 0 && <p>Nenhuma viagem cadastrada.</p>}
            {filteredTrips.map((trip) => (
              <article key={trip.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <h3 style={{ margin: "0 0 6px" }}>{trip.title}</h3>
                <p style={{ margin: "0 0 8px", color: "#4b5563" }}>{trip.destination || "-"} · {trip.passenger_count || trip.passengers_list?.length || 1} passageiro(s) · {trip.services?.join(", ") || "sem serviços marcados"}</p>
                <p><strong>Organizador:</strong> {trip.organizer_name || "-"} {trip.organizer_email && `· ${trip.organizer_email}`} · <strong>Envio:</strong> {trip.email_recipient_mode === "organizer" ? "apenas organizador" : trip.email_recipient_mode === "passengers" ? "passageiros" : "passageiros + organizador"}</p>
                <p><strong>Automação:</strong> {trip.automation_enabled === false ? "desativada" : "ativada"}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, marginBottom: 10, fontSize: 13 }}>
                  <div><strong>Agenda:</strong><br />{emailStatusLabel(trip, "calendar_email_sent_at")}</div>
                  <div><strong>Oferta/checklist:</strong><br />{emailStatusLabel(trip, "offer_email_sent_at")}</div>
                  <div><strong>Check-in ida:</strong><br />{emailStatusLabel(trip, "checkin_outbound_email_sent_at")}</div>
                  <div><strong>Check-in volta:</strong><br />{emailStatusLabel(trip, "checkin_return_email_sent_at")}</div>
                  <div><strong>Dia do voo ida:</strong><br />{emailStatusLabel(trip, "airport_outbound_email_sent_at")}</div>
                  <div><strong>Dia do voo volta:</strong><br />{emailStatusLabel(trip, "airport_return_email_sent_at")}</div>
                </div>
                <details style={{ marginBottom: 8 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 800 }}>Passageiros</summary>
                  <ol>
                    {(trip.passengers_list || []).map((p) => <li key={p.id || p.passenger_order}>{p.name} {p.email && `— ${p.email}`}</li>)}
                  </ol>
                </details>
                <p><strong>Ida:</strong> {formatDateTime(trip.outbound_date)} {trip.outbound_airline && `· ${trip.outbound_airline}`} {trip.outbound_flight && `· ${trip.outbound_flight}`} {trip.booking_locator && `· Localizador ${trip.booking_locator}`}</p>
                {trip.has_return && <p><strong>Volta/outro trecho:</strong> {formatDateTime(trip.return_date)} {trip.return_airline && `· ${trip.return_airline}`} {trip.return_flight && `· ${trip.return_flight}`} {trip.return_booking_locator && `· Localizador ${trip.return_booking_locator}`}</p>}
                {trip.hotel_name && <p><strong>Hotel:</strong> {trip.hotel_name} · {formatDate(trip.hotel_checkin)} a {formatDate(trip.hotel_checkout)}</p>}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, marginBottom: 10 }}>
                  <button onClick={() => editTrip(trip)} style={{ border: 0, background: "#1f2a60", color: "#fff", borderRadius: 10, padding: "9px 12px", fontWeight: 800 }}>Editar viagem</button>
                  <button onClick={() => deleteTrip(trip)} style={{ border: 0, background: "#fee2e2", color: "#991b1b", borderRadius: 10, padding: "9px 12px", fontWeight: 800 }}>Excluir viagem</button>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, marginBottom: 10 }}>
                  {TRAVEL_EMAILS.map(([id, label]) => (
                    <button key={id} onClick={() => openTravelEmail(trip, id)} disabled={emailLoading} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 10, padding: "8px 10px", fontWeight: 700 }}>
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
                  {TRIP_STEPS.map(([key, label]) => (
                    <span key={key} style={{ padding: "6px 9px", borderRadius: 999, background: trip[key] ? "#dcfce7" : "#f1f5f9", color: trip[key] ? "#166534" : "#475569", fontSize: 12, fontWeight: 800 }}>
                      {trip[key] ? "✓ " : "○ "}{label}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {emailComposer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.56)", zIndex: 1000, overflow: "auto", padding: 24 }}>
          <div style={{ maxWidth: 1120, margin: "20px auto", background: "#fff", borderRadius: 22, padding: 22, boxShadow: "0 28px 80px rgba(0,0,0,.28)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, color: "#1f2a60" }}>Email da viagem</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>Destinatários ({emailComposer.recipientMode}): {emailComposer.to.join(", ") || "sem destinatários"}</p>
              </div>
              <button onClick={() => setEmailComposer(null)} style={{ border: 0, background: "#eef2f7", borderRadius: 12, padding: "10px 14px", fontWeight: 800 }}>Fechar</button>
            </div>

            <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>Assunto</label>
            <input style={{ ...inputStyle(), marginBottom: 12 }} value={emailComposer.subject} onChange={(e) => setEmailComposer({ ...emailComposer, subject: e.target.value })} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>Texto editável</label>
                <textarea
                  style={{ ...inputStyle(), minHeight: 520, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 15, lineHeight: 1.45 }}
                  value={emailComposer.bodyText}
                  onChange={(e) => setEmailComposer({ ...emailComposer, bodyText: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>Pré-visualização aproximada</label>
                <div style={{ height: 520, overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 14, background: "#f4f7fb", padding: 18 }}>
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, overflow: "hidden", boxShadow: "0 12px 28px rgba(15,23,42,.08)" }}>
                    <div style={{ background: "#1f2a60", color: "#fff", padding: 22 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#ffb233", letterSpacing: .8 }}>RESUMINDO VIAGENS</div>
                      <h2 style={{ margin: "8px 0 0", fontSize: 24 }}>{emailComposer.subject}</h2>
                    </div>
                    <div style={{ padding: 24, fontSize: 16, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                      {emailComposer.bodyText}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setEmailComposer(null)} style={{ border: 0, background: "#eef2f7", borderRadius: 12, padding: "12px 16px", fontWeight: 800 }}>Cancelar</button>
              <button onClick={sendTravelEmail} disabled={emailLoading} style={{ border: 0, background: "#1f2a60", color: "#fff", borderRadius: 12, padding: "12px 18px", fontWeight: 900 }}>{emailLoading ? "Enviando..." : "Enviar email"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
