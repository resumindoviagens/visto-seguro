import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../lib/auth";
import { createAccessToken } from "../../../../lib/tokens";

function cleanCPF(value) {
  return (value || "").replace(/\D/g, "");
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ clients: data || [] });
}

export async function POST(request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();

  if (!body.name || !body.cpf || !body.birth_date) {
    return Response.json({ error: "Nome, CPF e data de nascimento são obrigatórios." }, { status: 400 });
  }

  const accessToken = createAccessToken();

  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert({
      name: body.name,
      cpf: cleanCPF(body.cpf),
      birth_date: body.birth_date,
      phone: body.phone || "",
      email: body.email || "",
      notes: body.notes || "",
      access_token: accessToken,
      status: "not_started",
      is_locked: false
    })
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    client_id: data.id,
    action: "client_created",
    details: { name: data.name }
  });

  return Response.json({ client: data });
}
