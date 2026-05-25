"use client";

import { useEffect, useMemo, useState } from "react";

function cleanPhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function dateBR(value) {
  if (!value) return "-";
  try { return new Date(value).toLocaleDateString("pt-BR"); } catch { return value; }
}

export default function FeedbackAgendaPage() {
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState("pendentes");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/clients", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao carregar clientes.");
      setLoading(false);
      return;
    }
    setClients(data.clients || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    return clients
      .filter((client) => client.stage_feedback_sent || client.feedback_token || client.feedback_answered_at)
      .filter((client) => {
        if (filter === "enviadas") return !!client.stage_feedback_sent && !client.feedback_answered_at && !client.stage_feedback_posted;
        if (filter === "respondidas") return !!client.feedback_answered_at && !client.stage_feedback_posted;
        if (filter === "postadas") return !!client.stage_feedback_posted;
        return !!client.stage_feedback_sent && !client.feedback_answered_at && !client.stage_feedback_posted;
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
  }, [clients, filter]);

  async function ensureFeedbackLink(client) {
    const res = await fetch(`/api/admin/feedback-link/${client.id}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao gerar pesquisa.");
    await load();
    return data.feedbackLink;
  }

  async function whatsappReminder(client) {
    try {
      const link = await ensureFeedbackLink(client);
      const phone = cleanPhone(client.phone);
      if (!phone) {
        alert("Cliente sem telefone.");
        return;
      }
      const message = encodeURIComponent(`Olá, ${client.name}. Tudo bem?\n\nPassando para lembrar da nossa pesquisa rápida de satisfação da Resumindo Viagens.\n\nVocê pode responder por aqui:\n${link}\n\nMuito obrigado!`);
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank", "noopener,noreferrer");
    } catch (err) {
      alert(err.message);
    }
  }

  async function emailReminder(client) {
    const res = await fetch("/api/admin/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: client.id, template_id: "pesquisa_satisfacao" })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao enviar email.");
      return;
    }
    alert("Lembrete enviado por email.");
    await load();
  }

  async function markPosted(client) {
    const res = await fetch(`/api/admin/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_process_steps", stage_feedback_posted: true })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao marcar como postado.");
      return;
    }
    await load();
  }

  return (
    <main style={{ maxWidth: 1180, margin: "30px auto", padding: 24, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <h1 style={{ color: "#1f2a60" }}>Agenda de pesquisas de satisfação</h1>
      <p>Controle quem recebeu a pesquisa, quem respondeu, quem ainda está pendente e quais avaliações já foram postadas.</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "18px 0" }}>
        <button onClick={() => setFilter("pendentes")} style={{ padding: "10px 14px", borderRadius: 10, border: 0, background: filter === "pendentes" ? "#1f2a60" : "#e5e7eb", color: filter === "pendentes" ? "#fff" : "#111827" }}>Pendentes</button>
        <button onClick={() => setFilter("enviadas")} style={{ padding: "10px 14px", borderRadius: 10, border: 0, background: filter === "enviadas" ? "#1f2a60" : "#e5e7eb", color: filter === "enviadas" ? "#fff" : "#111827" }}>Enviadas não respondidas</button>
        <button onClick={() => setFilter("respondidas")} style={{ padding: "10px 14px", borderRadius: 10, border: 0, background: filter === "respondidas" ? "#1f2a60" : "#e5e7eb", color: filter === "respondidas" ? "#fff" : "#111827" }}>Respondidas</button>
        <button onClick={() => setFilter("postadas")} style={{ padding: "10px 14px", borderRadius: 10, border: 0, background: filter === "postadas" ? "#1f2a60" : "#e5e7eb", color: filter === "postadas" ? "#fff" : "#111827" }}>Postadas</button>
      </div>

      {loading ? <p>Carregando...</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th align="left" style={{ padding: 10 }}>Cliente</th>
              <th align="left" style={{ padding: 10 }}>Email</th>
              <th align="left" style={{ padding: 10 }}>WhatsApp</th>
              <th align="left" style={{ padding: 10 }}>Respondida</th>
              <th align="left" style={{ padding: 10 }}>Nota</th>
              <th align="left" style={{ padding: 10 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((client) => (
              <tr key={client.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={{ padding: 10 }}><strong>{client.name}</strong></td>
                <td style={{ padding: 10 }}>{client.email || "-"}</td>
                <td style={{ padding: 10 }}>{client.phone || "-"}</td>
                <td style={{ padding: 10 }}>{dateBR(client.feedback_answered_at)}</td>
                <td style={{ padding: 10 }}>{client.feedback_nota_nps ?? "-"}</td>
                <td style={{ padding: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => whatsappReminder(client)}>WhatsApp lembrete</button>
                  <button onClick={() => emailReminder(client)} disabled={!client.email}>Email lembrete</button>
                  {client.feedback_answered_at && !client.stage_feedback_posted && <button onClick={() => markPosted(client)}>Marcar postado</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && rows.length === 0 && <p>Nenhum registro nesta visão.</p>}
    </main>
  );
}
