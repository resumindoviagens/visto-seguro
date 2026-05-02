import { headers } from "next/headers";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { EMAIL_TEMPLATES, getEmailTemplate } from "../../../lib/emailTemplates";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default async function EmailModelPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const token = resolvedParams.token;
  const templateId = resolvedSearchParams?.template || "formulario";

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();

  if (!client) {
    return (
      <main style={{ fontFamily: "Arial, Helvetica, sans-serif", padding: 30 }}>
        Link inválido.
      </main>
    );
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") || "https";
  const currentSiteUrl = host ? `${protocol}://${host}` : "";
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const siteUrl = envSiteUrl || currentSiteUrl;
  const formLink = `${siteUrl}/acesso/${client.access_token}`;

  let selectedTemplate;
  try {
    selectedTemplate = getEmailTemplate(templateId, client, { formLink });
  } catch (error) {
    selectedTemplate = getEmailTemplate("formulario", client, { formLink });
  }

  const selectedLabel = EMAIL_TEMPLATES.find((template) => template.id === templateId)?.label || "Enviar link do formulário";

  return (
    <main style={{ margin: 0, padding: 24, background: "#f6f8fb", fontFamily: "Arial, Helvetica, sans-serif", color: "#1f2937" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 22, marginBottom: 18 }}>
          <h1 style={{ margin: "0 0 8px", color: "#252A55" }}>Modelo de email para copiar</h1>
          <p style={{ margin: "0 0 14px", color: "#64748b" }}>
            Cliente: <strong>{client.name}</strong> · Modelo: <strong>{selectedLabel}</strong>
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {EMAIL_TEMPLATES.map((template) => (
              <a
                key={template.id}
                href={`/email/${client.access_token}?template=${template.id}`}
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: template.id === templateId ? "#252A55" : "#f8fafc",
                  color: template.id === templateId ? "#ffffff" : "#252A55",
                  fontSize: 13,
                  fontWeight: 700
                }}
              >
                {template.label}
              </a>
            ))}
          </div>

          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 14, padding: 14 }}>
            <p style={{ margin: "0 0 8px", color: "#9a3412", fontWeight: 700 }}>Assunto:</p>
            <p style={{ margin: 0, color: "#252A55", fontSize: 18 }}>{escapeHtml(selectedTemplate.subject)}</p>
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 22, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0, color: "#252A55" }}>Pré-visualização do corpo do email</h2>
          <p style={{ color: "#64748b" }}>
            Use esta tela para manter o método antigo de gerar/copiar modelos. Os botões SMTP do admin enviam emails reais em separado.
          </p>
          <div dangerouslySetInnerHTML={{ __html: selectedTemplate.html }} />
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 22 }}>
          <h2 style={{ marginTop: 0, color: "#252A55" }}>HTML do email</h2>
          <p style={{ color: "#64748b" }}>Copie o HTML abaixo se quiser colar manualmente em outra ferramenta.</p>
          <textarea
            readOnly
            value={selectedTemplate.html}
            style={{ width: "100%", minHeight: 260, border: "1px solid #cbd5e1", borderRadius: 12, padding: 14, fontFamily: "Consolas, monospace", fontSize: 13 }}
          />
        </div>
      </div>
    </main>
  );
}
