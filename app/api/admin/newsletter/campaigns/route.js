export const dynamic = "force-dynamic";

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../../lib/auth";

function hasEmail(client) {
  return client?.email && String(client.email).trim() !== "";
}

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  const audience = body.audience || "eligible_all";

  if (!subject) return Response.json({ error: "Assunto obrigatório." }, { status: 400 });
  if (!message) return Response.json({ error: "Mensagem obrigatória." }, { status: 400 });

  const { data: clients, error } = await supabaseAdmin
    .from("clients")
    .select("id,name,email,is_completed,visa_result,newsletter_opt_out")
    .not("email", "is", null);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  let recipients = (clients || []).filter((c) => hasEmail(c) && !c.newsletter_opt_out);
  if (audience === "approved_or_done") {
    recipients = recipients.filter((c) => c.is_completed || c.visa_result === "approved");
  }

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from("newsletter_campaigns")
    .insert({
      subject,
      message,
      audience,
      status: "draft",
      total_recipients: recipients.length,
      sent_count: 0,
      failed_count: 0
    })
    .select("id")
    .single();

  if (campaignError) return Response.json({ error: campaignError.message }, { status: 500 });

  if (recipients.length > 0) {
    const rows = recipients.map((client) => ({
      campaign_id: campaign.id,
      client_id: client.id,
      email: client.email,
      name: client.name,
      status: "queued"
    }));
    const { error: recError } = await supabaseAdmin.from("newsletter_recipients").insert(rows);
    if (recError) return Response.json({ error: recError.message }, { status: 500 });
  }

  return Response.json({ ok: true, campaign_id: campaign.id, total_recipients: recipients.length });
}
