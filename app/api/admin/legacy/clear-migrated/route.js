export const dynamic = "force-dynamic";

import { requireAdmin } from "../../../../../lib/auth";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function POST() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { data, error } = await supabaseAdmin
    .from("clients")
    .update({
      legacy_import: false,
      updated_at: new Date().toISOString()
    })
    .eq("legacy_import", true)
    .eq("is_completed", true)
    .eq("visa_result", "approved")
    .eq("stage_passport_returned", true)
    .select("id");

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    action: "legacy_migrated_cleared_from_old_list",
    details: { count: (data || []).length }
  });

  return Response.json({ ok: true, updated: (data || []).length });
}
