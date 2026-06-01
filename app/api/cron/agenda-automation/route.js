export const dynamic = "force-dynamic";

import { loadFutureClientsForAgenda, sendClientAgendaEmail, sendClientReminders } from "../../../../lib/agendaAutomation";

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
  const vercelCron = request.headers.get("x-vercel-cron");
  return !secret || provided === secret || !!vercelCron;
}

function pendingOlderThan20h(client) {
  if (!client.agenda_email_pending_at) return false;
  const pending = new Date(client.agenda_email_pending_at).getTime();
  if (!Number.isFinite(pending)) return false;
  return Date.now() - pending >= 20 * 60 * 60 * 1000;
}

export async function GET(request) {
  if (!authorized(request)) return Response.json({ error: "Não autorizado." }, { status: 401 });

  const clients = await loadFutureClientsForAgenda();
  const results = [];

  for (const client of clients) {
    try {
      if (pendingOlderThan20h(client)) {
        const agenda = await sendClientAgendaEmail(client, { mode: "auto", onlyMissing: true });
        results.push({ client_id: client.id, name: client.name, type: "agenda_cliente", result: agenda });
      }

      const reminder = await sendClientReminders(client, { mode: "auto" });
      results.push({ client_id: client.id, name: client.name, type: "lembrete_cliente", result: reminder });
    } catch (error) {
      results.push({ client_id: client.id, name: client.name, error: error?.message || String(error) });
    }
  }

  return Response.json({ ok: true, processed: clients.length, results });
}
