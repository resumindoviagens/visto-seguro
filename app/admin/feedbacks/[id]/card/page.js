export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

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
    return <main style={{ padding: 30 }}>Depoimento indisponível.</main>;
  }

  const primeiroNome = (f.clients?.name || "Cliente").split(" ")[0];

  return (
    <main style={{ minHeight: "100vh", background: "#dfe6f1", padding: 20, fontFamily: "Arial" }}>
      <div style={{ marginBottom: 12 }}>
        <strong>Postagem pronta:</strong> faça print/salve a imagem abaixo.
      </div>

      <div
        style={{
          width: 1080,
          height: story ? 1920 : 1350,
          margin: "0 auto",
          background: "linear-gradient(135deg,#10245f,#1f2a60 60%,#ff9800)",
          color: "#fff",
          padding: story ? 80 : 60,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(255,255,255,.22), transparent 25%)" }} />

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
            background: "rgba(255,255,255,.14)",
            borderRadius: 38,
            padding: story ? 64 : 52
          }}
        >
          <div style={{ fontSize: story ? 80 : 66, color: "#ffb233" }}>“</div>

          <div
            style={{
              fontSize: story ? 54 : 42,
              lineHeight: 1.18,
              fontWeight: 800
            }}
          >
            {f.comentario}
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
            alignItems: "center"
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,.15)",
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
