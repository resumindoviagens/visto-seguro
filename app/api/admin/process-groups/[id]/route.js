import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../../lib/auth";

export async function PATCH(request, context) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const params = await context.params;
  const body = await request.json();

  const updates = {
    nome: body.nome,
    consulate_city: body.consulate_city || "",
    casv_date: body.casv_date || null,
    interview_date: body.interview_date || null,
    video_call_date: body.video_call_date || null,
    passport_tracking_code: body.passport_tracking_code || "",
    updated_at: new Date().toISOString()
  };
  Object.keys(updates).forEach((key) => typeof updates[key] === "undefined" && delete updates[key]);

  const { data, error } = await supabaseAdmin
    .from("grupos_processo")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ group: data });
}

export async function DELETE(request, context) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const params = await context.params;

  await supabaseAdmin.from("clients").update({ group_process_id: null }).eq("group_process_id", params.id);
  const { error } = await supabaseAdmin.from("grupos_processo").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
