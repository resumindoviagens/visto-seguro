import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

function cleanCPF(value) {
  return String(value || "").replace(/\D/g, "");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, cpf, birth_date, nota_nps, ponto_forte, comentario, autorizou_divulgacao } = body;

    if (!token || !cpf || !birth_date) {
      return Response.json({ error: "Dados de autenticação obrigatórios." }, { status: 400 });
    }

    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("feedback_token", token)
      .maybeSingle();

    if (clientError || !client) {
      return Response.json({ error: "Pesquisa não encontrada." }, { status: 404 });
    }

    if (cleanCPF(client.cpf) !== cleanCPF(cpf) || String(client.birth_date) !== String(birth_date)) {
      return Response.json({ error: "CPF ou data de nascimento não conferem." }, { status: 403 });
    }

    const already = await supabaseAdmin
      .from("feedbacks")
      .select("id")
      .eq("client_id", client.id)
      .limit(1);

    if (already.data && already.data.length > 0) {
      return Response.json({ error: "Esta pesquisa já foi respondida." }, { status: 409 });
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
    const userAgent = request.headers.get("user-agent") || "";

    const tipo_feedback = client.visa_result === "denied" ? "negado" : "aprovado";

    const { error: insertError } = await supabaseAdmin.from("feedbacks").insert({
      client_id: client.id,
      tipo_feedback,
      nota_nps,
      ponto_forte,
      comentario,
      autorizou_divulgacao: !!autorizou_divulgacao,
      ip,
      user_agent: userAgent
    });

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    await supabaseAdmin
      .from("clients")
      .update({
        feedback_answered_at: new Date().toISOString(),
        feedback_nota_nps: nota_nps
      })
      .eq("id", client.id);

    await supabaseAdmin.from("audit_logs").insert({
      client_id: client.id,
      action: "feedback_received",
      details: { nota_nps, ponto_forte, autorizou_divulgacao: !!autorizou_divulgacao }
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message || "Erro ao enviar feedback." }, { status: 500 });
  }
}
