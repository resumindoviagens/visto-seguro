import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";
import { setClientAccess } from "../../../../../lib/clientAuth";

function cleanCPF(value) {
  return (value || "").replace(/\D/g, "");
}

export async function POST(request, context) {
  const params = await context.params;
  const token = params.token;
  const body = await request.json();

  const cpf = cleanCPF(body.cpf);
  const birthDate = body.birth_date;

  if (!cpf || !birthDate) {
    return Response.json({ error: "Informe CPF e data de nascimento." }, { status: 400 });
  }

  const { data: client, error } = await supabaseAdmin
    .from("clients")
    .select("id, name, cpf, birth_date")
    .eq("access_token", token)
    .maybeSingle();

  if (error || !client) {
    return Response.json({ error: "Link inválido ou expirado." }, { status: 404 });
  }

  if (client.cpf !== cpf || client.birth_date !== birthDate) {
    return Response.json({ error: "CPF ou data de nascimento não conferem com este link." }, { status: 403 });
  }

  await setClientAccess(token);

  await supabaseAdmin.from("audit_logs").insert({
    client_id: client.id,
    action: "client_verified_identity",
    details: {}
  });

  return Response.json({ ok: true });
}
