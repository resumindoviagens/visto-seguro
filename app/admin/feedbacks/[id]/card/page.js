export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

function fitText(text, max = 230) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1).trim() + "…" : text;
}

function backgroundById(id) {
  let sum = 0;
  for (const ch of String(id || "")) sum += ch.charCodeAt(0);
  const n = (sum % 10) + 1;
  return `/feedback-backgrounds/feedback-bg-${String(n).padStart(2, "0")}.jpg`;
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

  if (!f || !f.autorizou_divulgacao) {
    return <main style={{ padding: 30, fontFamily: "Arial" }}>Depoimento indisponível ou não autorizado.</main>;
  }

  const primeiroNome = (f.clients?.name || "Cliente").split(" ")[0];
  const width = 1080;
  const height = story ? 1920 : 1350;
  const comentario = fitText(f.comentario, story ? 280 : 230);
  const bg = backgroundById(f.id);

  return (
    <main style={{ minHeight: "100vh", background: "#dfe6f1", padding: 20, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto 14px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <strong>Postagem pronta:</strong>
        <span>no celular, segure/salve a imagem ou capture a tela. No computador, use print/captura.</span>
        <a href="/admin/feedbacks" style={{ marginLeft: "auto", color: "#1f2a60", fontWeight: 700 }}>Voltar</a>
      </div>

      <div
        style={{
          width,
          height,
          margin: "0 auto",
          color: "#fff",
          padding: story ? 80 : 60,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          backgroundImage: `linear-gradient(180deg, rgba(4,14,35,.32), rgba(4,14,35,.80)), url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(255,152,0,.25), transparent 36%)" }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: story ? 58 : 46, fontWeight: 900 }}>RESUMINDO</div>
          <div style={{ fontSize: story ? 54 : 42, fontWeight: 900, color: "#ffb233" }}>VIAGENS</div>
          <div style={{ marginTop: 10, fontSize: story ? 28 : 22 }}>
            Assessoria para Visto Americano
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            background: "rgba(5,18,44,.64)",
            border: "1px solid rgba(255,255,255,.24)",
            borderRadius: 38,
            padding: story ? 64 : 52,
            boxShadow: "0 30px 80px rgba(0,0,0,.35)"
          }}
        >
          <div style={{ fontSize: story ? 80 : 66, color: "#ffb233", lineHeight: .75 }}>“</div>

          <div
            style={{
              fontSize: story ? 54 : 42,
              lineHeight: 1.18,
              fontWeight: 800
            }}
          >
            {comentario}
          </div>

          <div style={{ marginTop: 30, fontSize: story ? 30 : 26 }}>
            — {primeiroNome}, cliente Resumindo Viagens
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20
          }}
        >
          <div
            style={{
              background: "rgba(255,152,0,.95)",
              color: "#fff",
              borderRadius: 999,
              padding: story ? "18px 28px" : "14px 22px",
              fontSize: story ? 34 : 28,
              fontWeight: 900
            }}
          >
            Nota {f.nota_nps}/10
          </div>

          <div style={{ fontSize: story ? 34 : 28, fontWeight: 800 }}>
            @resumindoviagens
          </div>
        </div>
      </div>
    </main>
  );
}
