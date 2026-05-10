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

const inputStyle = {
  padding: 13,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  width: "100%",
  boxSizing: "border-box"
};

export default function FeedbackForm({ token, clientName }) {
  const [auth, setAuth] = useState({ cpf: "", birth_date: "" });
  const [authenticated, setAuthenticated] = useState(false);
  const [form, setForm] = useState({
    nota_nps: "10",
    ponto_forte: "videochamada individual",
    comentario: "",
    autorizou_divulgacao: false,
    instagram_usuario: ""
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function entrar(e) {
    e.preventDefault();

    if (!auth.cpf || !auth.birth_date) {
      alert("Informe CPF e data de nascimento para acessar a pesquisa.");
      return;
    }

    setAuthenticated(true);
  }

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

  if (!authenticated) {
    return (
      <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: 24, fontFamily: "Arial, Helvetica, sans-serif" }}>
        <section style={{ maxWidth: 560, margin: "40px auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 28, boxShadow: "0 18px 45px rgba(15,23,42,.08)" }}>
          <h1 style={{ color: "#1f2a60", marginTop: 0 }}>Acesso seguro</h1>
          <p style={{ color: "#4b5563" }}>
            Olá, <strong>{clientName}</strong>. Para acessar sua pesquisa de satisfação, confirme seus dados abaixo.
          </p>

          <form onSubmit={entrar} style={{ display: "grid", gap: 14, marginTop: 22 }}>
            <input
              required
              placeholder="CPF"
              value={auth.cpf}
              onChange={(e) => setAuth({ ...auth, cpf: e.target.value })}
              style={inputStyle}
            />

            <label style={{ color: "#4b5563", fontSize: 14 }}>
              Data de nascimento
              <input
                required
                type="date"
                value={auth.birth_date}
                onChange={(e) => setAuth({ ...auth, birth_date: e.target.value })}
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </label>

            <button style={{ background: "#1f2a60", color: "#fff", border: 0, borderRadius: 12, padding: 14, fontWeight: 800 }}>
              Entrar
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: 24, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <section style={{ maxWidth: 720, margin: "30px auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 28 }}>
        <h1 style={{ color: "#1f2a60", marginTop: 0 }}>Pesquisa de satisfação</h1>
        <p style={{ color: "#4b5563" }}>
          Sua opinião ajuda a aprimorar nosso atendimento. A pesquisa leva menos de 1 minuto.
        </p>

        <form onSubmit={submitFeedback} style={{ display: "grid", gap: 14, marginTop: 22 }}>
          <h3 style={{ color: "#1f2a60", marginBottom: 0 }}>Avaliação</h3>

          <label>
            De 0 a 10, quanto você indicaria a Resumindo Viagens?
            <select
              value={form.nota_nps}
              onChange={(e) => setForm({ ...form, nota_nps: e.target.value })}
              style={{ ...inputStyle, marginTop: 6 }}
            >
              {Array.from({ length: 11 }).map((_, i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>

          <label>
            Qual parte do processo mais lhe ajudou?
            <select
              value={form.ponto_forte}
              onChange={(e) => setForm({ ...form, ponto_forte: e.target.value })}
              style={{ ...inputStyle, marginTop: 6 }}
            >
              {pontos.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>

          <label>
            Deseja deixar um comentário?
            <textarea
              required
              value={form.comentario}
              onChange={(e) => setForm({ ...form, comentario: e.target.value })}
              style={{ ...inputStyle, minHeight: 120, marginTop: 6 }}
            />
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={form.autorizou_divulgacao}
              onChange={(e) => setForm({ ...form, autorizou_divulgacao: e.target.checked })}
            />
            Autorizo a utilização parcial do meu depoimento, sem exposição de dados sensíveis.
          </label>

          {form.autorizou_divulgacao && (
            <label>
              Gostaria de ser marcado na postagem do comentário? Se positivo, coloque aqui seu usuário do Instagram:
              <input
                placeholder="@seuusuario"
                value={form.instagram_usuario || ""}
                onChange={(e) => setForm({ ...form, instagram_usuario: e.target.value })}
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </label>
          )}

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#f9fafb" }}>
            <strong>Prévia aproximada da postagem:</strong>

            <div
              style={{
                marginTop: 10,
                borderRadius: 18,
                overflow: "hidden",
                color: "#fff",
                minHeight: 520,
                padding: 26,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backgroundImage: "linear-gradient(180deg, rgba(4,14,35,.28), rgba(4,14,35,.84)), url('/feedback-backgrounds/feedback-bg-01.png')",
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: 900, fontSize: 25 }}>RESUMINDO</div>
                <div style={{ fontWeight: 900, fontSize: 23, color: "#ffb233", marginTop: -4 }}>VIAGENS</div>
              </div>

              <div style={{ background: "rgba(5,18,44,.64)", borderRadius: 22, padding: 22 }}>
                <div style={{ color: "#ffb233", fontSize: 42, lineHeight: .7 }}>“</div>
                <div style={{ marginTop: 8, fontSize: 23, lineHeight: 1.18, fontWeight: 800 }}>
                  {form.comentario || "Seu comentário aparecerá aqui."}
                </div>
                <div style={{ marginTop: 16, opacity: .9 }}>— Cliente Resumindo Viagens</div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ background: "#ff9800", borderRadius: 999, padding: "9px 14px", fontWeight: 900 }}>
                  Nota {form.nota_nps}/10
                </div>
                <div style={{ fontWeight: 800 }}>
                  {form.instagram_usuario || "@resumindoviagens"}
                </div>
              </div>
            </div>
          </div>

          <button disabled={loading} style={{ background: "#1f2a60", color: "#fff", border: 0, borderRadius: 12, padding: 14, fontWeight: 700 }}>
            {loading ? "Enviando..." : "Enviar avaliação"}
          </button>
        </form>
      </section>
    </main>
  );
}
