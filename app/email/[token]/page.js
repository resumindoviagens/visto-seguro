import { headers } from "next/headers";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default async function EmailModelPage({ params }) {
  const resolvedParams = await params;
  const token = resolvedParams.token;

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("name, access_token")
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
  const link = `${siteUrl}/acesso/${client.access_token}`;
  const logoUrl = `${siteUrl}/logo.png`;
  const whatsappIconUrl = `${siteUrl}/whatsapp.svg`;
  const instagramIconUrl = `${siteUrl}/instagram.svg`;
  const whatsappLink = "https://wa.me/5511981210932";
  const instagramLink = "https://www.instagram.com/resumindoviagens";
  const name = escapeHtml(client.name);

  return (
    <div style={{ margin: 0, padding: 0, background: "#f6f8fb", fontFamily: "Arial, Helvetica, sans-serif", color: "#1f2937" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px" }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ background: "#f6f8fb", padding: "20px 0" }}>
          <tbody>
            <tr>
              <td align="center">
                <table width="660" cellPadding="0" cellSpacing="0" style={{ background: "#ffffff", borderRadius: 24, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 18px 40px rgba(37,42,85,.12)" }}>
                  <tbody>
                    <tr>
                      <td style={{ background: "#252A55", padding: "34px 34px 30px", textAlign: "center" }}>
                        <img src={logoUrl} alt="Resumindo Viagens" style={{ maxWidth: 255, height: "auto", marginBottom: 18, background: "#ffffff", borderRadius: 16, padding: 10 }} />

                        <h1 style={{ margin: 0, color: "#ffffff", fontSize: 30 }}>
                          Resumindo Viagens
                        </h1>

                        <p style={{ margin: "11px 0 0", color: "#FF9F00", fontWeight: "bold", fontSize: 16 }}>
                          Formulário para solicitação de visto
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: "38px 42px" }}>
                        <p style={{ fontSize: 18, lineHeight: 1.6, margin: "0 0 10px" }}>Olá,</p>

                        <p style={{ fontSize: 26, lineHeight: 1.25, margin: "0 0 24px", color: "#252A55", fontWeight: "bold" }}>
                          {name}
                        </p>

                        <p style={{ fontSize: 16, lineHeight: 1.7 }}>
                          Seu formulário da <strong>Resumindo Viagens</strong> já está pronto para preenchimento.
                        </p>

                        <p style={{ fontSize: 16, lineHeight: 1.7 }}>
                          Este não é o formulário do consulado, suas informações serão analisadas, traduzidas para inglês e inseridas no formulário oficial do consulado.
                        </p>

                        <p style={{ fontSize: 16, lineHeight: 1.7 }}>
                          Este é um <strong>link único e exclusivo</strong>. Para sua segurança, o acesso será validado com <strong>CPF e data de nascimento</strong>.
                        </p>

                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, margin: "24px 0" }}>
                          <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.65 }}>
                            Você pode interromper o preenchimento a qualquer momento, clicar em <strong>Salvar e continuar depois</strong> e retornar posteriormente pelo mesmo link.
                          </p>

                          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65 }}>
                            Ao finalizar, clique em <strong>Enviar definitivamente</strong> quando estiver com tudo completo ou, ao menos, com todas as informações que conseguiu reunir. Após esse envio, o preenchimento ficará bloqueado, mas será possível gerar um <strong>PDF das respostas</strong>.
                          </p>
                        </div>

                        <div style={{ textAlign: "center", margin: "32px 0" }}>
                          <a href={link} style={{ display: "inline-block", background: "#FF9F00", color: "#ffffff", textDecoration: "none", padding: "17px 30px", borderRadius: 15, fontWeight: "bold", fontSize: 16 }}>
                            Acessar meu formulário
                          </a>
                        </div>

                        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 16, padding: 18, margin: "24px 0" }}>
                          <p style={{ margin: "0 0 9px", fontSize: 14, color: "#9a3412", fontWeight: "bold" }}>
                            Copiar o link aqui:
                          </p>

                          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#252A55", wordBreak: "break-all" }}>
                            {link}
                          </p>
                        </div>

                        <p style={{ fontSize: 14, lineHeight: 1.65, color: "#64748b" }}>
                          Caso outros membros da família também estejam preenchendo formulário, cada pessoa deverá acessar o próprio link individual.
                        </p>

                        <p style={{ fontSize: 14, lineHeight: 1.65, color: "#64748b" }}>
                          Se tiver qualquer dificuldade durante o preenchimento, entre em contato com a Resumindo Viagens.
                        </p>

                        <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "32px 0" }} />

                        <div style={{ textAlign: "center", fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>
                          <p style={{ margin: "0 0 12px" }}>
                            Em caso de qualquer dúvida, fale com a Resumindo Viagens:
                          </p>

                          <p style={{ margin: "0 0 14px", color: "#252A55", fontWeight: "bold" }}>
                            WhatsApp: (11) 98121-0932
                          </p>

                          <a href={whatsappLink} style={{ display: "inline-block", margin: "0 8px 10px", textDecoration: "none", color: "#252A55", fontWeight: "bold" }}>
                            <img src={whatsappIconUrl} alt="WhatsApp" width="26" height="26" style={{ verticalAlign: "middle", marginRight: 6 }} />
                            Falar pelo WhatsApp
                          </a>

                          <a href={instagramLink} style={{ display: "inline-block", margin: "0 8px 10px", textDecoration: "none", color: "#252A55", fontWeight: "bold" }}>
                            <img src={instagramIconUrl} alt="Instagram" width="26" height="26" style={{ verticalAlign: "middle", marginRight: 6 }} />
                            Seguir @resumindoviagens
                          </a>

                          <p style={{ margin: "8px 0 0" }}>
                            contato@resumindoviagens.com.br
                          </p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
