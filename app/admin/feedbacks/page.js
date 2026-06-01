"use client";

import { useEffect, useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function serviceLabel(service) {
  if (service === "passaporte") return "Passaporte";
  if (service === "canadense") return "Visto Canadense";
  return "Visto Americano";
}

function statusLabel(status) {
  if (status === "pendente") return "🟡 Pendente";
  if (status === "respondido") return "🟢 Respondido";
  if (status === "arquivado") return "🔵 Arquivado/Postado";
  return status || "—";
}

function statusStyle(status) {
  const base = { display: "inline-block", borderRadius: 999, padding: "7px 11px", fontWeight: 900, fontSize: 13 };
  if (status === "pendente") return { ...base, background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" };
  if (status === "respondido") return { ...base, background: "#ecfdf5", color: "#166534", border: "1px solid #bbf7d0" };
  if (status === "arquivado") return { ...base, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
  return { ...base, background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" };
}

function metricBox(label, value, note = "") {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 16, boxShadow: "0 12px 28px rgba(15,23,42,.06)" }}>
      <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>{label}</div>
      <div style={{ color: "#1f2a60", fontSize: 30, fontWeight: 950, marginTop: 4 }}>{value}</div>
      {note && <div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>{note}</div>}
    </div>
  );
}

export default function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [serviceFilter, setServiceFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/feedbacks", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao carregar feedbacks.");
      return;
    }
    setFeedbacks(data.feedbacks || []);
  }

  useEffect(() => { load(); }, []);

  async function markPosted(item) {
    const clientId = item.client_id || item.client?.id;
    if (!clientId) return;
    const res = await fetch(`/api/admin/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_process_steps", stage_feedback_posted: true })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao arquivar feedback.");
      return;
    }
    await load();
  }

  async function resendSurvey(item) {
    const clientId = item.client_id || item.client?.id;
    if (!clientId) return;
    const ok = confirm(`Reenviar pesquisa para ${item.client?.name || "este cliente"}?`);
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/feedbacks/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao reenviar pesquisa.");
        return;
      }
      alert(data.message || "Pesquisa reenviada.");
      await load();
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const sent = feedbacks.filter((f) => f.feedback_sent_at).length;
    const answered = feedbacks.filter((f) => f.status_feedback === "respondido" || f.status_feedback === "arquivado").length;
    const pending = feedbacks.filter((f) => f.status_feedback === "pendente").length;
    const archived = feedbacks.filter((f) => f.status_feedback === "arquivado").length;
    const responseRate = sent ? Math.round((answered / sent) * 100) : 0;

    const services = {
      visto: feedbacks.filter((f) => (f.service || "visto") === "visto").length,
      passaporte: feedbacks.filter((f) => f.service === "passaporte").length,
      canadense: feedbacks.filter((f) => f.service === "canadense").length
    };

    return { sent, answered, pending, archived, responseRate, services };
  }, [feedbacks]);

  const visible = feedbacks.filter((item) => {
    const serviceOk = serviceFilter === "todos" || (item.service || "visto") === serviceFilter;
    const statusOk = statusFilter === "todos" || item.status_feedback === statusFilter;
    return serviceOk && statusOk;
  });

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 14px 70px", fontFamily: "Arial, Helvetica, sans-serif", color: "#1f2937" }}>
      <h1 style={{ color: "#1f2a60", fontSize: 34, margin: "0 0 8px" }}>Gestão de Feedbacks</h1>
      <p style={{ color: "#4b5563", marginTop: 0 }}>
        Controle pesquisas enviadas, pendentes, respondidas, postadas/arquivadas e reenvie lembretes quando necessário.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, margin: "20px 0" }}>
        {metricBox("Pesquisas enviadas", stats.sent)}
        {metricBox("Respondidas", stats.answered)}
        {metricBox("Taxa de resposta", `${stats.responseRate}%`)}
        {metricBox("Pendentes", stats.pending)}
        {metricBox("Arquivadas/Postadas", stats.archived)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
        {metricBox("Visto Americano", stats.services.visto, "pesquisas no serviço")}
        {metricBox("Passaporte", stats.services.passaporte, "pesquisas no serviço")}
        {metricBox("Visto Canadense", stats.services.canadense, "pesquisas no serviço")}
      </div>

      <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end", marginBottom: 18 }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 800, color: "#1f2a60" }}>
          Serviço
          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} style={{ padding: 11, borderRadius: 10, border: "1px solid #d1d5db" }}>
            <option value="todos">Todos</option>
            <option value="visto">Visto Americano</option>
            <option value="passaporte">Passaporte</option>
            <option value="canadense">Visto Canadense</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6, fontWeight: 800, color: "#1f2a60" }}>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: 11, borderRadius: 10, border: "1px solid #d1d5db" }}>
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="respondido">Respondidos</option>
            <option value="arquivado">Arquivados/Postados</option>
          </select>
        </label>

        <button onClick={load} style={{ border: 0, background: "#eef2f7", color: "#1f2a60", borderRadius: 12, padding: "12px 16px", fontWeight: 900 }}>
          Atualizar
        </button>
      </section>

      {visible.map((item) => {
        const answered = item.item_type === "answered";
        const canGenerate = answered && item.autorizou_divulgacao !== false && item.status_feedback !== "pendente";
        const clientName = item.client?.name || item.client_name || "Cliente";

        return (
          <section key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 20, padding: 18, marginBottom: 14, background: "#fff", boxShadow: "0 12px 30px rgba(15,23,42,.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}>
              <div>
                <h3 style={{ margin: "0 0 8px", color: "#111827", fontSize: 23 }}>{clientName}</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={statusStyle(item.status_feedback)}>{statusLabel(item.status_feedback)}</span>
                  <span style={{ display: "inline-block", borderRadius: 999, padding: "7px 11px", fontWeight: 900, fontSize: 13, background: "#f8fafc", color: "#1f2a60", border: "1px solid #e2e8f0" }}>
                    Serviço: {serviceLabel(item.service || "visto")}
                  </span>
                  {item.resend_count > 0 && (
                    <span style={{ display: "inline-block", borderRadius: 999, padding: "7px 11px", fontWeight: 900, fontSize: 13, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                      Reenvios: {item.resend_count}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.5, minWidth: 230 }}>
                <div><strong>Pesquisa enviada:</strong> {formatDate(item.feedback_sent_at)}</div>
                <div><strong>Respondida:</strong> {formatDate(item.feedback_answered_at)}</div>
                <div><strong>Email:</strong> {item.client?.email || "—"}</div>
              </div>
            </div>

            {answered ? (
              <div style={{ marginTop: 14 }}>
                <p style={{ margin: "8px 0" }}><strong>Nota:</strong> {item.nota_nps ?? item.nota ?? "-"}/10</p>
                <p style={{ margin: "8px 0" }}><strong>Ponto forte:</strong> {item.ponto_forte || "-"}</p>
                <p style={{ margin: "8px 0 14px" }}><strong>Comentário:</strong> {item.comentario || item.depoimento || "-"}</p>
              </div>
            ) : (
              <div style={{ marginTop: 14, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", borderRadius: 14, padding: 12, fontWeight: 700 }}>
                Pesquisa enviada, mas ainda sem resposta registrada.
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
              <button
                disabled={loading || !item.client?.email}
                onClick={() => resendSurvey(item)}
                style={{ border: 0, background: "#0f766e", color: "#fff", borderRadius: 12, padding: "11px 15px", fontWeight: 900, opacity: loading ? .7 : 1 }}
              >
                Reenviar pesquisa
              </button>

              {canGenerate && (
                <>
                  <a href={`/admin/feedbacks/${item.id}/card`} target="_blank" style={{ background: "#1f2a60", color: "#fff", borderRadius: 12, padding: "11px 15px", fontWeight: 900, textDecoration: "none", display: "inline-block" }}>
                    Gerar postagem
                  </a>

                  <a href={`/admin/feedbacks/${item.id}/card?story=1`} target="_blank" style={{ background: "#ff9800", color: "#fff", borderRadius: 12, padding: "11px 15px", fontWeight: 900, textDecoration: "none", display: "inline-block" }}>
                    Gerar story
                  </a>
                </>
              )}

              {item.status_feedback === "arquivado" ? (
                <span style={{ color: "#1d4ed8", fontWeight: 800 }}>Arquivado/Postado</span>
              ) : answered ? (
                <button onClick={() => markPosted(item)} style={{ border: 0, background: "#eef2f7", color: "#1f2a60", borderRadius: 12, padding: "11px 15px", fontWeight: 900 }}>
                  Arquivar / marcar postado
                </button>
              ) : null}
            </div>
          </section>
        );
      })}

      {visible.length === 0 && (
        <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 22 }}>
          Nenhum feedback nesta visão.
        </section>
      )}
    </main>
  );
}
