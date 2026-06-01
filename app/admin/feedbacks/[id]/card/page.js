export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import TrocarImagemButton from "./TrocarImagemButton";

function fitText(text, max = 190) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1).trim() + "…" : text;
}

function backgroundById(feedback) {
  if (feedback?.background_index) {
    const n = Math.max(1, Math.min(30, Number(feedback.background_index)));
    return `/feedback-backgrounds/feedback-bg-${String(n).padStart(2, "0")}.png`;
  }

  let sum = 0;
  for (const ch of String(feedback?.id || "")) sum += ch.charCodeAt(0);
  const n = (sum % 30) + 1;
  return `/feedback-backgrounds/feedback-bg-${String(n).padStart(2, "0")}.png`;
}

export default async function FeedbackCardPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const story = resolvedSearch?.story === "1";

  const { data: f } = await supabaseAdmin
    .from("feedbacks")
    .select("*, clients(name)")
    .eq("id", resolvedParams.id)
    .maybeSingle();

  if (!f) {
    return <main style={{ padding: 30, fontFamily: "Arial" }}>Depoimento não encontrado.</main>;
  }

  const primeiroNome = (f.clients?.name || "Cliente").split(" ")[0];
  const comentario = fitText(f.comentario, story ? 210 : 180);
  const pontoForte = fitText(f.ponto_forte || "", 55);
  const bg = backgroundById(f);
  const service = f.service === "passaporte" ? "Assessoria para Passaporte" : f.service === "canadense" ? "Assessoria para Visto Canadense" : "Assessoria para Visto Americano";

  return (
    <main style={{ minHeight: "100vh", background: "#dfe6f1", padding: "10px 8px 40px", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 460, margin: "0 auto 10px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
        <strong>Postagem pronta</strong>
        <a href={`?story=${story ? "0" : "1"}`} style={{ background: "#1f2a60", color: "#fff", borderRadius: 10, padding: "9px 12px", textDecoration: "none", fontWeight: 800 }}>{story ? "Ver feed" : "Ver story"}</a>
        <TrocarImagemButton feedbackId={f.id} />
        <a href="/admin/feedbacks" style={{ marginLeft: "auto", color: "#1f2a60", fontWeight: 700 }}>Voltar</a>
      </div>

      <div style={{
        maxWidth: story ? 390 : 420,
        width: "100%",
        margin: "0 auto",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(15,23,42,.24)",
        background: "#111827"
      }}>
        <div
          id="postagem-feedback"
          style={{
            aspectRatio: story ? "9 / 16" : "4 / 5",
            width: "100%",
            color: "#fff",
            padding: story ? "30px 24px" : "27px 24px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
            backgroundImage: `linear-gradient(180deg, rgba(4,14,35,.28), rgba(4,14,35,.86)), url(${bg})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(255,152,0,.32), transparent 38%)" }} />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ fontSize: story ? 26 : 24, fontWeight: 900 }}>RESUMINDO</div>
            <div style={{ fontSize: story ? 25 : 23, fontWeight: 900, color: "#ffb233" }}>VIAGENS</div>
            <div style={{ marginTop: 7, fontSize: story ? 13 : 12 }}>{service}</div>
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              background: "rgba(5,18,44,.69)",
              border: "1px solid rgba(255,255,255,.24)",
              borderRadius: 24,
              padding: story ? 25 : 22,
              boxShadow: "0 20px 50px rgba(0,0,0,.35)"
            }}
          >
            <div style={{ fontSize: story ? 40 : 34, color: "#ffb233", lineHeight: .75 }}>“</div>

            <div style={{ fontSize: story ? 23 : 21, lineHeight: 1.16, fontWeight: 850 }}>
              {comentario}
            </div>

            {pontoForte && (
              <div style={{
                marginTop: 16,
                display: "inline-block",
                background: "rgba(255,178,51,.18)",
                border: "1px solid rgba(255,178,51,.45)",
                borderRadius: 999,
                padding: "8px 11px",
                fontSize: story ? 13 : 12,
                fontWeight: 800
              }}>
                Ponto forte: {pontoForte}
              </div>
            )}

            <div style={{ marginTop: 17, fontSize: story ? 15 : 14 }}>
              — {primeiroNome}, cliente Resumindo Viagens
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ background: "rgba(255,152,0,.95)", color: "#fff", borderRadius: 999, padding: "9px 13px", fontSize: story ? 16 : 15, fontWeight: 900 }}>
              Nota {f.nota_nps}/10
            </div>

            <div style={{ fontSize: story ? 15 : 14, fontWeight: 800 }}>
              {f.instagram_usuario || "@resumindoviagens"}
            </div>
          </div>
        </div>
      </div>

      <p style={{ maxWidth: 430, margin: "10px auto 0", color: "#475569", fontSize: 13, textAlign: "center" }}>
        No celular, a arte já cabe na tela. Tire print desta área ou use a opção Story/Feed.
      </p>
    </main>
  );
}
