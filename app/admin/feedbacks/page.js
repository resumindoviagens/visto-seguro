"use client";

import { useEffect, useState } from "react";

export default function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [showPosted, setShowPosted] = useState(false);

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
      alert(data.error || "Erro ao marcar postado.");
      return;
    }
    await load();
  }

  const visible = feedbacks.filter((item) => showPosted || !item.client?.stage_feedback_posted);

  return (
    <main style={{ maxWidth: 1100, margin: "30px auto", padding: 24, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <h1 style={{ color: "#1f2a60" }}>Feedbacks recebidos</h1>
      <p>Avaliações postadas podem ser baixadas da lista principal.</p>
      <label style={{ display: "inline-flex", gap: 8, alignItems: "center", marginBottom: 18 }}>
        <input type="checkbox" checked={showPosted} onChange={(e) => setShowPosted(e.target.checked)} />
        Mostrar feedbacks já postados
      </label>

      {visible.map((item) => (
        <section key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, marginBottom: 14, background: "#fff" }}>
          <h3 style={{ margin: 0 }}>{item.client?.name || item.client_name || "Cliente"}</h3>
          <p><strong>Nota:</strong> {item.nota_nps ?? item.nota ?? "-"}/10</p>
          <p><strong>Ponto forte:</strong> {item.ponto_forte || "-"}</p>
          <p><strong>Comentário:</strong> {item.comentario || item.depoimento || "-"}</p>
          {item.client?.stage_feedback_posted ? (
            <span style={{ color: "#166534", fontWeight: 700 }}>Postado</span>
          ) : (
            <button onClick={() => markPosted(item)}>Marcar postado / baixar da lista</button>
          )}
        </section>
      ))}

      {visible.length === 0 && <p>Nenhum feedback nesta visão.</p>}
    </main>
  );
}
