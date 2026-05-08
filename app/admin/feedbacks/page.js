export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export default async function AdminFeedbacksPage() {
  const { data: feedbacks } = await supabaseAdmin
    .from("feedbacks")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: 30, background: "#f6f8fb", minHeight: "100vh", fontFamily: "Arial" }}>
      <h1 style={{ color: "#1f2a60" }}>Feedbacks / Avaliações</h1>

      <div style={{ display: "grid", gap: 18, marginTop: 24 }}>
        {(feedbacks || []).map((f) => (
          <section key={f.id} style={{ background: "#fff", borderRadius: 18, padding: 20, border: "1px solid #e5e7eb" }}>
            <h2 style={{ marginTop: 0 }}>{f.clients?.name || "Cliente"}</h2>

            <p>
              <strong>Nota:</strong> {f.nota_nps}/10
            </p>

            <p>
              <strong>Ponto forte:</strong> {f.ponto_forte}
            </p>

            <div style={{ background: "#f9fafb", borderRadius: 12, padding: 14 }}>
              {f.comentario}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <a
                href={`/admin/feedbacks/${f.id}/card`}
                target="_blank"
                style={{
                  background: "#1f2a60",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: 12,
                  fontWeight: 800,
                  opacity: f.autorizou_divulgacao ? 1 : .45,
                  pointerEvents: f.autorizou_divulgacao ? "auto" : "none"
                }}
              >
                Gerar imagem Instagram
              </a>

              <a
                href={`/admin/feedbacks/${f.id}/card?story=1`}
                target="_blank"
                style={{
                  background: "#ff9800",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: 12,
                  fontWeight: 800,
                  opacity: f.autorizou_divulgacao ? 1 : .45,
                  pointerEvents: f.autorizou_divulgacao ? "auto" : "none"
                }}
              >
                Gerar story
              </a>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
