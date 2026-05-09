export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export default async function FeedbackCardPage({ params }) {
  const resolvedParams = await params;
  const { data: f } = await supabaseAdmin
    .from("feedbacks")
    .select("*, clients(name)")
    .eq("id", resolvedParams.id)
    .maybeSingle();

  if (!f || !f.autorizou_divulgacao) {
    return <main style={{ padding: 30, fontFamily: "Arial" }}>Depoimento não encontrado ou não autorizado para divulgação.</main>;
  }

  const primeiroNome = (f.clients?.name || "Cliente").split(" ")[0];

  return (
    <main style={{ minHeight: "100vh", background: "#e5e7eb", padding: 30, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <p>Abra esta página e faça print/captura do card quadrado abaixo para postar no Instagram.</p>
      <div style={{ width: 1080, height: 1080, background: "#1f2a60", color: "#fff", boxSizing: "border-box", padding: 80, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 42, fontWeight: 800 }}>RESUMINDO VIAGENS</div>
          <div style={{ fontSize: 26, opacity: .9, marginTop: 8 }}>Assessoria para Visto Americano</div>
        </div>

        <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 34, padding: 60 }}>
          <div style={{ fontSize: 72, lineHeight: 1 }}>“</div>
          <div style={{ fontSize: 46, lineHeight: 1.2, fontWeight: 700 }}>{f.comentario}</div>
          <div style={{ fontSize: 28, marginTop: 34, opacity: .9 }}>— {primeiroNome}, cliente Resumindo Viagens</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28 }}>
          <div>Nota {f.nota_nps}/10</div>
          <div>@resumindoviagens</div>
        </div>
      </div>
    </main>
  );
}
