export function brevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  const fromName = process.env.EMAIL_FROM_NAME || "Resumindo Viagens";
  const replyToEmail = process.env.EMAIL_REPLY_TO || fromEmail;

  if (!apiKey) throw new Error("Brevo não configurado. Configure BREVO_API_KEY nas variáveis de ambiente da Vercel.");
  if (!fromEmail) throw new Error("Remetente não configurado. Configure EMAIL_FROM, por exemplo: contato@resumindoviagens.com.br.");

  return { apiKey, fromEmail, fromName, replyToEmail };
}

export async function sendWithBrevo({ toEmail, toName, subject, html, text, tags = ["resumindo-viagens", "visto-americano"], fromEmail: overrideFromEmail, fromName: overrideFromName, replyToEmail: overrideReplyToEmail }) {
  const config = brevoConfig();
  const apiKey = config.apiKey;
  const fromEmail = overrideFromEmail || config.fromEmail;
  const fromName = overrideFromName || config.fromName;
  const replyToEmail = overrideReplyToEmail || config.replyToEmail;

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: toEmail, name: toName || toEmail }],
    replyTo: { email: replyToEmail, name: fromName },
    subject,
    htmlContent: html,
    textContent: text || subject,
    tags
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "api-key": apiKey },
    body: JSON.stringify(payload)
  });

  const resultText = await response.text();
  let result = {};
  try { result = resultText ? JSON.parse(resultText) : {}; } catch { result = { raw: resultText }; }

  if (!response.ok) {
    const message = result?.message || result?.error || "Erro ao enviar email pela Brevo.";
    throw new Error(`Brevo: ${message}`);
  }
  return result;
}

export function simpleHtml(title, paragraphs = []) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.55;max-width:720px;margin:0 auto;background:#fff;padding:26px;border:1px solid #e5e7eb;border-radius:14px;">
    <h2 style="color:#1f2a60;margin-top:0;">${title}</h2>
    ${paragraphs.map((p) => `<p>${p}</p>`).join("\n")}
    <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p><strong>Resumindo Viagens</strong></p>
  </div>`;
}


export function internalAlertFrom() {
  return {
    fromEmail: process.env.ALERT_EMAIL_FROM || process.env.EMAIL_FROM || "alertas@resumindoviagens.com.br",
    fromName: process.env.ALERT_EMAIL_FROM_NAME || "Resumindo Viagens - Alertas",
    replyToEmail: process.env.ALERT_EMAIL_REPLY_TO || process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || "contato@resumindoviagens.com.br"
  };
}

export async function sendInternalAlert({ subject, html, text, tags = ["resumindo-viagens", "alerta-interno"] }) {
  const toEmail = process.env.ALERT_EMAIL_TO || "contato@resumindoviagens.com.br";
  return sendWithBrevo({
    toEmail,
    toName: "Resumindo Viagens",
    subject,
    html,
    text,
    tags,
    ...internalAlertFrom()
  });
}
