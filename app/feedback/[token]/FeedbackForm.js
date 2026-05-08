"use client";

import { useState } from "react";

const pontos = [
  "organização do processo",
  "formulário inteligente",
  "orientações para entrevista",
  "videochamada individual",
  "suporte e atendimento",
  "agilidade",
  "outro"
];

export default function FeedbackForm({ token, clientName }) {
  const [auth, setAuth] = useState({ cpf: "", birth_date: "" });
  const [form, setForm] = useState({ nota_nps: "10", ponto_forte: "videochamada individual", comentario: "", autorizou_divulgacao: false });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitFeedback(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...auth, ...form, nota_nps: Number(form.nota_nps) })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Não foi possível enviar sua avaliação.");
        return;
      }

      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: 24, fontFamily: "Arial, Helvetica, sans-serif" }}>
        <section style={{ maxWidth: 680, margin: "30px auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 28 }}>
          <h1 style={{ color: "#1f2a60", marginTop: 0 }}>Obrigado pela sua avaliação.</h1>
          <p>Sua resposta foi registrada com segurança.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: 24, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <section style={{ maxWidth: 680, margin: "30px auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 28 }}>
        <h1 style={{ color: "#1f2a60", marginTop: 0 }}>Pesquisa de satisfação</h1>
        <p style={{ color: "#4b5563" }}>Olá, <strong>{clientName}</strong>. Sua opinião ajuda a aprimorar nosso atendimento. A pesquisa leva menos de 1 minuto.</p>

        <form onSubmit={submitFeedback} style={{ display: "grid", gap: 14, marginTop: 22 }}>
          <h3 style={{ color: "#1f2a60", marginBottom: 0 }}>Confirmação de segurança</h3>
          <input required placeholder="CPF" value={auth.cpf} onChange={(e) => setAuth({ ...auth, cpf: e.target.value })} style={{ padding: 13, borderRadius: 12, border: "1px solid #d1d5db" }} />
          <label style={{ color: "#4b5563", fontSize: 14 }}>Data de nascimento
            <input required type="date" value={auth.birth_date} onChange={(e) => setAuth({ ...auth, birth_date: e.target.value })} style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 6, padding: 13, borderRadius: 12, border: "1px solid #d1d5db" }} />
          </label>

          <h3 style={{ color: "#1f2a60", marginBottom: 0 }}>Avaliação</h3>
          <label>De 0 a 10, quanto você indicaria a Resumindo Viagens?
            <select value={form.nota_nps} onChange={(e) => setForm({ ...form, nota_nps: e.target.value })} style={{ display: "block", width: "100%", marginTop: 6, padding: 13, borderRadius: 12, border: "1px solid #d1d5db" }}>
              {Array.from({ length: 11 }).map((_, i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>

          <label>Qual parte do processo mais lhe ajudou?
            <select value={form.ponto_forte} onChange={(e) => setForm({ ...form, ponto_forte: e.target.value })} style={{ display: "block", width: "100%", marginTop: 6, padding: 13, borderRadius: 12, border: "1px solid #d1d5db" }}>
              {pontos.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>

          <label>Deseja deixar um comentário?
            <textarea required value={form.comentario} onChange={(e) => setForm({ ...form, comentario: e.target.value })} style={{ display: "block", width: "100%", minHeight: 120, boxSizing: "border-box", marginTop: 6, padding: 13, borderRadius: 12, border: "1px solid #d1d5db" }} />
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14 }}>
            <input type="checkbox" checked={form.autorizou_divulgacao} onChange={(e) => setForm({ ...form, autorizou_divulgacao: e.target.checked })} />
            Autorizo a utilização parcial do meu depoimento, sem exposição de dados sensíveis.
          </label>

          <button disabled={loading} style={{ background: "#1f2a60", color: "#fff", border: 0, borderRadius: 12, padding: 14, fontWeight: 700 }}>
            {loading ? "Enviando..." : "Enviar avaliação"}
          </button>
        </form>
      </section>
    </main>
  );
}
