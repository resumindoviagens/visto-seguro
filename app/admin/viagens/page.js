"use client";

import { useEffect, useMemo, useState } from "react";

const SERVICE_OPTIONS = ["Passagem aérea", "Hotel", "Seguro viagem", "Locação de carro", "Ingressos", "Cruzeiro", "Pacote"];

const TRAVEL_EMAILS = [
  ["travel_calendar", "Enviar agenda/calendário"],
  ["travel_confirmation", "Confirmação da compra/reserva"],
  ["travel_missing_services", "Oferecer seguro/hotel/carro/ingressos"],
  ["travel_checkin_outbound", "Check-in ida 48h"],
  ["travel_checkin_return", "Check-in volta/outro trecho 48h"],
  ["travel_airport_outbound", "Dia do voo ida"],
  ["travel_airport_return", "Dia do voo volta/outro trecho"],
  ["travel_week_before", "Uma semana antes: falta algo?"]
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
  try {
    return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return value;
  }
}

function formatDate(value) {
  if (!value) return "-";
  const [y, m, d] = String(value).split("T")[0].split("-");
  return y && m && d ? `${d}/${m}/${y}` : value;
}

function emptyCustomer() {
  return { name: "", email: "", phone: "", cpf: "", birth_date: "", alert_email: "", notes: "" };
}

function emptyTrip(customerId = "") {
  return {
    travel_customer_id: customerId,
    title: "",
    destination: "",
    passengers: "",
    services: [],
    buyer_name: "",
    buyer_email: "",
    buyer_phone: "",
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
    stage_docs_sent: false
  };
}

export default function AdminViagensPage() {
  const [customers, setCustomers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerForm, setCustomerForm] = useState(emptyCustomer());
  const [tripForm, setTripForm] = useState(emptyTrip());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!q) return customers;
    return customers.filter((item) => [item.name, item.email, item.phone, item.cpf].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [customers, search]);

  const selected = customers.find((item) => item.id === selectedCustomer);
  const customerTrips = trips.filter((trip) => trip.travel_customer_id === selectedCustomer);

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
      setSelectedCustomer(data.customer.id);
      setTripForm(emptyTrip(data.customer.id));
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function createTrip() {
    if (!selectedCustomer) return alert("Selecione um cliente.");
    if (!tripForm.title) return alert("Informe o título da viagem.");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/travel/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tripForm, travel_customer_id: selectedCustomer })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Erro ao criar viagem.");
      setTripForm(emptyTrip(selectedCustomer));
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function sendTravelEmail(trip, templateId) {
    const ok = confirm(`Enviar email "${templateId}" para ${selected?.name || "cliente"}?`);
    if (!ok) return;

    const res = await fetch("/api/admin/travel/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trip_id: trip.id, template_id: templateId })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao enviar email da viagem.");
      return;
    }
    alert(`Email enviado para ${data.sent || 0} destinatário(s).`);
    await load();
  }

  function toggleService(service) {
    const current = tripForm.services || [];
    const next = current.includes(service) ? current.filter((item) => item !== service) : [...current, service];
    setTripForm({ ...tripForm, services: next });
  }

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: 24, fontFamily: "Arial, Helvetica, sans-serif", color: "#1f2937" }}>
      <div style={{ background: "#1f2a60", color: "#fff", borderRadius: 24, padding: 26, marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontSize: 34 }}>Administração de Viagens</h1>
        <p style={{ margin: "8px 0 0", opacity: .95 }}>Controle inicial de clientes, passageiros, serviços e viagens da Resumindo Viagens.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", gap: 18, alignItems: "start" }}>
        <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 18 }}>
          <h2 style={{ color: "#1f2a60", marginTop: 0 }}>Clientes de viagem</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente, email, CPF..." style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #d1d5db", marginBottom: 12 }} />

          <div style={{ maxHeight: 420, overflow: "auto", display: "grid", gap: 8 }}>
            {filteredCustomers.map((customer) => (
              <button key={customer.id} onClick={() => { setSelectedCustomer(customer.id); setTripForm(emptyTrip(customer.id)); }} style={{
                textAlign: "left",
                border: selectedCustomer === customer.id ? "2px solid #1f2a60" : "1px solid #e5e7eb",
                background: selectedCustomer === customer.id ? "#eef2ff" : "#fff",
                borderRadius: 14,
                padding: 12,
                cursor: "pointer"
              }}>
                <strong>{customer.name}</strong>
                <div style={{ fontSize: 13, color: "#4b5563" }}>{customer.email || "sem email"} · {customer.phone || "sem telefone"}</div>
                {customer.alert_email && <div style={{ fontSize: 12, color: "#b45309" }}>Alerta extra: {customer.alert_email}</div>}
              </button>
            ))}
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "18px 0" }} />

          <h3>Novo cliente de viagem</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <input placeholder="Nome" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} />
            <input placeholder="Email principal" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
            <input placeholder="Email adicional para alertas / comprador" value={customerForm.alert_email} onChange={(e) => setCustomerForm({ ...customerForm, alert_email: e.target.value })} />
            <input placeholder="Telefone" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} />
            <input placeholder="CPF" value={customerForm.cpf} onChange={(e) => setCustomerForm({ ...customerForm, cpf: e.target.value })} />
            <label style={{ fontSize: 13 }}>Nascimento<input type="date" value={customerForm.birth_date} onChange={(e) => setCustomerForm({ ...customerForm, birth_date: e.target.value })} /></label>
            <textarea placeholder="Observações" value={customerForm.notes} onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })} />
            <button onClick={createCustomer} disabled={loading} style={{ background: "#1f2a60", color: "#fff", border: 0, borderRadius: 12, padding: "12px 14px", fontWeight: 800 }}>Cadastrar cliente de viagem</button>
          </div>
        </section>

        <section style={{ display: "grid", gap: 18 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 18 }}>
            <h2 style={{ color: "#1f2a60", marginTop: 0 }}>{selected ? selected.name : "Selecione um cliente"}</h2>
            {selected ? (
              <>
                <p style={{ color: "#4b5563" }}>{selected.email || "sem email"} · {selected.phone || "sem telefone"} · CPF {selected.cpf || "-"}</p>
                <p><strong>Email adicional de alertas:</strong> {selected.alert_email || "-"}</p>
              </>
            ) : (
              <p>Os clientes já existentes do módulo de vistos/passaportes aparecem aqui após rodar o SQL da V101.</p>
            )}
          </div>

          {selected && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 18 }}>
              <h2 style={{ color: "#1f2a60", marginTop: 0 }}>Cadastrar viagem</h2>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input placeholder="Título da viagem. Ex.: Orlando Julho 2027" value={tripForm.title} onChange={(e) => setTripForm({ ...tripForm, title: e.target.value })} />
                  <input placeholder="Destino" value={tripForm.destination} onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })} />
                </div>

                <textarea placeholder="Passageiros, um por linha ou separados por vírgula" value={tripForm.passengers} onChange={(e) => setTripForm({ ...tripForm, passengers: e.target.value })} />

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

                <h3>Comprador / responsável</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <input placeholder="Nome comprador" value={tripForm.buyer_name} onChange={(e) => setTripForm({ ...tripForm, buyer_name: e.target.value })} />
                  <input placeholder="Email comprador" value={tripForm.buyer_email} onChange={(e) => setTripForm({ ...tripForm, buyer_email: e.target.value })} />
                  <input placeholder="Telefone comprador" value={tripForm.buyer_phone} onChange={(e) => setTripForm({ ...tripForm, buyer_phone: e.target.value })} />
                </div>

                <h3>Passagem aérea</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                  <label>Ida<input type="datetime-local" value={tripForm.outbound_date} onChange={(e) => setTripForm({ ...tripForm, outbound_date: e.target.value })} /></label>
                  <input placeholder="Cia aérea ida" value={tripForm.outbound_airline} onChange={(e) => setTripForm({ ...tripForm, outbound_airline: e.target.value })} />
                  <input placeholder="Voo ida" value={tripForm.outbound_flight} onChange={(e) => setTripForm({ ...tripForm, outbound_flight: e.target.value })} />
                  <input placeholder="Localizador da reserva" value={tripForm.booking_locator} onChange={(e) => setTripForm({ ...tripForm, booking_locator: e.target.value })} />
                </div>

                <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={tripForm.has_return} onChange={(e) => setTripForm({ ...tripForm, has_return: e.target.checked })} />
                  Contém volta ou outro trecho na mesma reserva
                </label>

                {tripForm.has_return && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                    <label>Volta / outro trecho<input type="datetime-local" value={tripForm.return_date} onChange={(e) => setTripForm({ ...tripForm, return_date: e.target.value })} /></label>
                    <input placeholder="Cia aérea volta" value={tripForm.return_airline} onChange={(e) => setTripForm({ ...tripForm, return_airline: e.target.value })} />
                    <input placeholder="Voo volta" value={tripForm.return_flight} onChange={(e) => setTripForm({ ...tripForm, return_flight: e.target.value })} />
                    <input placeholder="Localizador volta/outro trecho" value={tripForm.return_booking_locator} onChange={(e) => setTripForm({ ...tripForm, return_booking_locator: e.target.value })} />
                  </div>
                )}

                <h3>Hotel</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input placeholder="Hotel" value={tripForm.hotel_name} onChange={(e) => setTripForm({ ...tripForm, hotel_name: e.target.value })} />
                  <input placeholder="Endereço" value={tripForm.hotel_address} onChange={(e) => setTripForm({ ...tripForm, hotel_address: e.target.value })} />
                  <label>Check-in<input type="date" value={tripForm.hotel_checkin} onChange={(e) => setTripForm({ ...tripForm, hotel_checkin: e.target.value })} /></label>
                  <label>Check-out<input type="date" value={tripForm.hotel_checkout} onChange={(e) => setTripForm({ ...tripForm, hotel_checkout: e.target.value })} /></label>
                  <input placeholder="Confirmação hotel" value={tripForm.hotel_confirmation} onChange={(e) => setTripForm({ ...tripForm, hotel_confirmation: e.target.value })} />
                </div>

                <h3>Carro, seguro e ingressos</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input placeholder="Locadora" value={tripForm.car_company} onChange={(e) => setTripForm({ ...tripForm, car_company: e.target.value })} />
                  <input placeholder="Confirmação carro" value={tripForm.car_confirmation} onChange={(e) => setTripForm({ ...tripForm, car_confirmation: e.target.value })} />
                  <input placeholder="Seguradora" value={tripForm.insurance_company} onChange={(e) => setTripForm({ ...tripForm, insurance_company: e.target.value })} />
                  <input placeholder="Apólice" value={tripForm.insurance_policy} onChange={(e) => setTripForm({ ...tripForm, insurance_policy: e.target.value })} />
                </div>
                <textarea placeholder="Ingressos / reservas / observações da viagem" value={tripForm.tickets_notes} onChange={(e) => setTripForm({ ...tripForm, tickets_notes: e.target.value })} />

                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {[
                    ["stage_air_issued", "Passagem emitida"],
                    ["stage_hotel_confirmed", "Hotel confirmado"],
                    ["stage_insurance_issued", "Seguro emitido"],
                    ["stage_car_confirmed", "Carro confirmado"],
                    ["stage_docs_sent", "Documentação enviada"]
                  ].map(([key, label]) => (
                    <label key={key} style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                      <input type="checkbox" checked={!!tripForm[key]} onChange={(e) => setTripForm({ ...tripForm, [key]: e.target.checked })} />
                      {label}
                    </label>
                  ))}
                </div>

                <button onClick={createTrip} disabled={loading} style={{ background: "#ff9800", color: "#fff", border: 0, borderRadius: 12, padding: "13px 16px", fontWeight: 900 }}>Cadastrar viagem</button>
              </div>
            </div>
          )}

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 18 }}>
            <h2 style={{ color: "#1f2a60", marginTop: 0 }}>Viagens cadastradas</h2>
            {customerTrips.length === 0 && <p>Nenhuma viagem cadastrada para este cliente.</p>}
            {customerTrips.map((trip) => (
              <article key={trip.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <h3 style={{ margin: "0 0 6px" }}>{trip.title}</h3>
                <p style={{ margin: "0 0 8px", color: "#4b5563" }}>{trip.destination || "-"} · {trip.services?.join(", ") || "sem serviços marcados"}</p>
                <p><strong>Ida:</strong> {formatDateTime(trip.outbound_date)} {trip.outbound_airline && `· ${trip.outbound_airline}`} {trip.outbound_flight && `· ${trip.outbound_flight}`} {trip.booking_locator && `· Localizador ${trip.booking_locator}`}</p>
                {trip.has_return && <p><strong>Volta/outro trecho:</strong> {formatDateTime(trip.return_date)} {trip.return_airline && `· ${trip.return_airline}`} {trip.return_flight && `· ${trip.return_flight}`} {trip.return_booking_locator && `· Localizador ${trip.return_booking_locator}`}</p>}
                {trip.hotel_name && <p><strong>Hotel:</strong> {trip.hotel_name} · {formatDate(trip.hotel_checkin)} a {formatDate(trip.hotel_checkout)}</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, marginBottom: 10 }}>
                  {TRAVEL_EMAILS.map(([id, label]) => (
                    <button key={id} onClick={() => sendTravelEmail(trip, id)} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 10, padding: "8px 10px", fontWeight: 700 }}>
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
    </main>
  );
}
