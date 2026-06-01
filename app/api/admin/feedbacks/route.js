export const dynamic = "force-dynamic";

import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../lib/auth";

const FEEDBACK_TEMPLATE_IDS = ["pesquisa_satisfacao", "passaporte_pesquisa", "canada_pesquisa"];

function serviceFromClient(client = {}) {
  if (client.feedback_service) return client.feedback_service;
  const tipo = String(client.tipo_processo || "").toLowerCase();
  if (tipo.includes("passaporte")) return "passaporte";
  if (tipo.includes("canad")) return "canadense";
  return "visto";
}

function latestDate(values = []) {
  const sorted = values.filter(Boolean).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return sorted[0] || null;
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { data: feedbackRows, error: feedbackError } = await supabaseAdmin
    .from("feedbacks")
    .select("*, client:clients(id,name,email,phone,tipo_processo,feedback_service,feedback_token,feedback_token_expires_at,feedback_liberado,stage_feedback_sent,stage_feedback_answered,stage_feedback_posted,feedback_answered_at,updated_at)")
    .order("created_at", { ascending: false });

  if (feedbackError) return Response.json({ error: feedbackError.message }, { status: 500 });

  const { data: sentClients, error: clientsError } = await supabaseAdmin
    .from("clients")
    .select("id,name,email,phone,tipo_processo,feedback_service,feedback_token,feedback_token_expires_at,feedback_liberado,stage_feedback_sent,stage_feedback_answered,stage_feedback_posted,feedback_answered_at,updated_at")
    .or("stage_feedback_sent.eq.true,feedback_liberado.eq.true,feedback_token.not.is.null");

  if (clientsError) return Response.json({ error: clientsError.message }, { status: 500 });

  const clientIds = [...new Set([...(feedbackRows || []).map((f) => f.client_id), ...(sentClients || []).map((c) => c.id)].filter(Boolean))];

  let logsByClient = {};
  if (clientIds.length > 0) {
    const { data: logs } = await supabaseAdmin
      .from("audit_logs")
      .select("client_id,action,details,created_at")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false });

    logsByClient = (logs || []).reduce((acc, log) => {
      if (!acc[log.client_id]) acc[log.client_id] = [];
      acc[log.client_id].push(log);
      return acc;
    }, {});
  }

  const answeredClientIds = new Set((feedbackRows || []).map((item) => item.client_id).filter(Boolean));

  function enrichFeedback(item) {
    const client = item.client || {};
    const logs = logsByClient[item.client_id] || [];
    const sentDates = logs
      .filter((log) => {
        const template = log?.details?.template_id;
        return log.action === "feedback_link_generated" ||
          template === "pesquisa_satisfacao" ||
          template === "passaporte_pesquisa" ||
          template === "canada_pesquisa" ||
          (log.action === "email_editor_sent" && FEEDBACK_TEMPLATE_IDS.includes(template));
      })
      .map((log) => log.created_at);

    return {
      ...item,
      item_type: "answered",
      status_feedback: client.stage_feedback_posted ? "arquivado" : "respondido",
      service: item.service || serviceFromClient(client),
      feedback_sent_at: latestDate(sentDates) || client.updated_at || item.created_at,
      feedback_answered_at: client.feedback_answered_at || item.created_at,
      resend_count: sentDates.length > 0 ? Math.max(0, sentDates.length - 1) : 0
    };
  }

  const answeredItems = (feedbackRows || []).map(enrichFeedback);

  const pendingItems = (sentClients || [])
    .filter((client) => !answeredClientIds.has(client.id))
    .map((client) => {
      const logs = logsByClient[client.id] || [];
      const sentDates = logs
        .filter((log) => {
          const template = log?.details?.template_id;
          return log.action === "feedback_link_generated" ||
            template === "pesquisa_satisfacao" ||
            template === "passaporte_pesquisa" ||
            template === "canada_pesquisa" ||
            (log.action === "email_editor_sent" && FEEDBACK_TEMPLATE_IDS.includes(template));
        })
        .map((log) => log.created_at);

      return {
        id: `pending-${client.id}`,
        client_id: client.id,
        item_type: "pending",
        status_feedback: "pendente",
        service: serviceFromClient(client),
        feedback_sent_at: latestDate(sentDates) || client.updated_at || null,
        feedback_answered_at: null,
        resend_count: sentDates.length > 0 ? Math.max(0, sentDates.length - 1) : 0,
        nota_nps: null,
        ponto_forte: "",
        comentario: "",
        autorizou_divulgacao: false,
        client
      };
    });

  const items = [...answeredItems, ...pendingItems]
    .sort((a, b) => new Date(b.feedback_answered_at || b.feedback_sent_at || 0).getTime() - new Date(a.feedback_answered_at || a.feedback_sent_at || 0).getTime());

  return Response.json({ feedbacks: items }, { headers: { "Cache-Control": "no-store" } });
}
