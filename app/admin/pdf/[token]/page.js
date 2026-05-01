import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { isAdminAuthenticated } from "../../../../lib/auth";
import BrandHeader from "../../../../components/BrandHeader";
import { sections } from "../../../../lib/formSchema";

export default async function AdminPdfPage({ params }) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return (
      <main style={{ padding: 30, fontFamily: "Arial, Helvetica, sans-serif" }}>
        Acesso não autorizado. Entre no painel admin antes de abrir o PDF.
      </main>
    );
  }

  const resolvedParams = await params;
  const token = resolvedParams.token;

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();

  if (!client) {
    return <main style={{ padding: 30 }}>Cliente não encontrado.</main>;
  }

  const { data: response } = await supabaseAdmin
    .from("form_responses")
    .select("*")
    .eq("client_id", client.id)
    .maybeSingle();

  const answers = response?.answers || {};

  return (
    <main style={{ maxWidth: 980, margin: "30px auto", padding: 24 }}>
      <div className="no-print" style={{ marginBottom: 18 }}>
        <button className="btn-primary" id="printButton">
          Gerar PDF / imprimir
        </button>
      </div>

      <div className="card" style={{ padding: 34 }}>
        <BrandHeader clientName={client.name} />
        <h2 style={{ color: "var(--navy)", marginTop: 28 }}>Respostas do formulário</h2>

        {sections.map((section) => (
          <section key={section.title} style={{ breakInside: "avoid", marginTop: 28 }}>
            <h3 style={{ background: "var(--navy)", color: "#fff", padding: 12, borderRadius: 10 }}>{section.title}</h3>
            <div className="grid">
              {section.fields
                .filter((field) => answers[field.id])
                .map((field) => (
                  <div key={field.id} className={field.wide || field.full ? "wide" : ""} style={{ border: "1px solid #E4E8F0", borderRadius: 12, padding: 12 }}>
                    <b style={{ color: "var(--navy)" }}>{field.label}</b><br />
                    <span>{String(answers[field.id])}</span>
                  </div>
                ))}
            </div>
          </section>
        ))}

        <div className="print-footer">
          Resumindo Viagens • contato@resumindoviagens.com.br • Instagram: @resumindoviagens
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: "document.getElementById('printButton')?.addEventListener('click', () => window.print())" }} />
    </main>
  );
}
