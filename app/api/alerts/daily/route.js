import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendWithBrevo, simpleHtml } from "../../../../lib/brevoEmail";

function daysUntil(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function fmtDays(days) {
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
  const vercelCron = request.headers.get("x-vercel-cron");
  if (secret && provided !== secret && !vercelCron) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { data: clients, error: clientsError } = await supabaseAdmin.from("clients").select("*");
  if (clientsError) return Response.json({ error: clientsError.message }, { status: 500 });

  const { data: groups } = await supabaseAdmin.from("grupos_processo").select("*");
  const groupsById = (groups || []).reduce((acc, group) => { acc[group.id] = group; return acc; }, {});

  const alerts = [];
  const usedGroups = new Set();

  for (const client of clients || []) {
    const group = client.group_process_id ? groupsById[client.group_process_id] : null;
    const label = group ? `Grupo de processo: ${group.nome}` : `Cliente: ${client.name}`;

    if (group) {
      if (!usedGroups.has(group.id)) {
        usedGroups.add(group.id);
        const interview = daysUntil(group.interview_date);
        const casv = daysUntil(group.casv_date);
        const video = daysUntil(group.video_call_date);
        if (interview !== null && interview >= 0 && interview <= 7) alerts.push(`${label} — entrevista ${fmtDays(interview)}${group.consulate_city ? ` — ${group.consulate_city}` : ""}`);
        if (casv !== null && casv >= 0 && casv <= 3) alerts.push(`${label} — CASV ${fmtDays(casv)}`);
        if (video !== null && video >= 0 && video <= 2) alerts.push(`${label} — videochamada ${fmtDays(video)}`);
      }
    } else {
      const interview = daysUntil(client.interview_date);
      const casv = daysUntil(client.casv_date);
      const video = daysUntil(client.video_call_date);
      if (interview !== null && interview >= 0 && interview <= 7) alerts.push(`${label} — entrevista ${fmtDays(interview)}${client.consulate_city ? ` — ${client.consulate_city}` : ""}`);
      if (casv !== null && casv >= 0 && casv <= 3) alerts.push(`${label} — CASV ${fmtDays(casv)}`);
      if (video !== null && video >= 0 && video <= 2) alerts.push(`${label} — videochamada ${fmtDays(video)}`);
    }

    // Alertas individuais de formulário, sempre por cliente.
    if (client.status === "in_progress") alerts.push(`Cliente: ${client.name} — formulário iniciado`);
    if (client.status === "submitted") alerts.push(`Cliente: ${client.name} — formulário concluído`);
    if (client.is_renewal && !client.client_sedex_tracking) alerts.push(`Cliente: ${client.name} — renovação sem rastreio Sedex informado`);
  }

  const toEmail = process.env.ALERT_EMAIL_TO || process.env.EMAIL_FROM || "contato@resumindoviagens.com.br";
  if (alerts.length > 0) {
    await sendWithBrevo({
      toEmail,
      toName: "Resumindo Viagens",
      subject: "Alertas do dia — Resumindo Viagens",
      html: simpleHtml("Alertas do dia — Resumindo Viagens", alerts.map((item) => `• ${item}`)),
      text: alerts.join("\n"),
      tags: ["resumindo-viagens", "alertas-diarios"]
    });
  }

  return Response.json({ ok: true, alerts });
}
