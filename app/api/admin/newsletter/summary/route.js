export const dynamic = "force-dynamic";

import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../../lib/auth";

function hasEmail(client) {
  return client?.email && String(client.email).trim() !== "";
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { data: clients, error } = await supabaseAdmin
    .from("clients")
    .select("id,name,email,phone,is_completed,visa_result,newsletter_opt_out,created_at")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const all = clients || [];
  const withEmail = all.filter(hasEmail);
  const optOut = withEmail.filter((c) => c.newsletter_opt_out);
  const eligible = withEmail.filter((c) => !c.newsletter_opt_out);
  const approvedOrDone = eligible.filter((c) => c.is_completed || c.visa_result === "approved");

  const { data: campaigns } = await supabaseAdmin
    .from("newsletter_campaigns")
    .select("id,subject,status,audience,total_recipients,sent_count,failed_count,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return Response.json({
    counts: {
      total_clients: all.length,
      with_email: withEmail.length,
      without_email: all.length - withEmail.length,
      opt_out: optOut.length,
      eligible: eligible.length,
      approved_or_done: approvedOrDone.length
    },
    campaigns: campaigns || []
  }, { headers: { "Cache-Control": "no-store" } });
}
