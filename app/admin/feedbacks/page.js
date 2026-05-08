export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export default async function AdminFeedbacksPage() {
  const { data: feedbacks, error } = await supabaseAdmin
    .from("feedbacks")
    .select("*, clients(name, email, phone)")
    .order("created_at", { ascending: false });

  if (error) {
    return <main style={{ padding: 30, fontFamily: "Arial, Helvetica, sans-serif" }}>Erro ao carregar feedbacks: {error.message}</main>;
  }

  return (
    <main style={{ padding: 30, fontFamily: "Arial, Helvetica, sans-serif", background: "#f6f8fb", minHeight: "100vh" }}>
      <h1 style={{ color: "#1f2a60" }}>Feedbacks</h1>
      <p>Aqui aparecem as pesquisas respondidas pelos clientes.</p>

      <div style={{ display: "grid", gap: 16, marginTop: 22 }}>
        {(feedbacks || []).length === 0 && <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 18 }}>Nenhuma avaliação recebida ainda.</div>}

        {(feedbacks || []).map((f) => (
          <section key={f.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 18 }}>
            <h2 style={{ margin: 0, color: "#1f2a60" }}>{f.clients?.name || "Cliente"}</h2>
            <p style={{ margin: "8px 0" }}><strong>Nota:</strong> {f.nota_nps}/10 | <strong>Tipo:</strong> {f.tipo_feedback} | <strong>Ponto forte:</strong> {f.ponto_forte}</p>
            <p style={{ whiteSpace: "pre-wrap" }}>{f.comentario}</p>
            <p><strong>Autorizou divulgação:</strong> {f.autorizou_divulgacao ? "Sim" : "Não"}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={`/admin/feedbacks/${f.id}/card`} target="_blank" style={{ pointerEvents: f.autorizou_divulgacao ? "auto" : "none", opacity: f.autorizou_divulgacao ? 1 : .45, background: "#1f2a60", color: "#fff", textDecoration: "none", padding: "10px 14px", borderRadius: 10, fontWeight: 700 }}>
                Gerar postagem Instagram
              </a>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
