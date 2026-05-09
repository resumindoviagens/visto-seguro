import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

const SYNC_FIELDS = [
  "process_steps",
  "current_step",
  "etapa_atual",
  "data_inicio_processo",
  "data_final_processo",
  "observacoes_gerais",
  "tipo_processo",
  "grupo_processo",
  "rastreio_passaporte",
  "data_casv",
  "data_entrevista",
  "data_videochamada"
];

function pickSyncData(client) {
  const data = {};
  for (const field of SYNC_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(client, field)) {
      data[field] = client[field];
    }
  }
  return data;
}

export async function POST(request) {
  try {
    const { masterId } = await request.json();

    if (!masterId) {
      return Response.json({ error: "masterId obrigatório." }, { status: 400 });
    }

    const { data: master, error: masterError } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("id", masterId)
      .single();

    if (masterError || !master) {
      return Response.json({ error: "Contato principal não encontrado." }, { status: 404 });
    }

    const grupoId = master.grupo_familiar_id || master.grupo_processo;

    if (!grupoId) {
      return Response.json({
        error: "Este cliente não possui grupo familiar/grupo de processo preenchido."
      }, { status: 400 });
    }

    const syncData = pickSyncData(master);

    const { data: members, error: membersError } = await supabaseAdmin
      .from("clients")
      .select("id, name, nome, grupo_familiar_id, grupo_processo, sincronizar_com_grupo")
      .neq("id", masterId)
      .or(`grupo_familiar_id.eq.${grupoId},grupo_processo.eq.${grupoId}`);

    if (membersError) {
      return Response.json({ error: membersError.message }, { status: 500 });
    }

    const targetIds = (members || [])
      .filter((m) => m.sincronizar_com_grupo !== false)
      .map((m) => m.id);

    if (targetIds.length === 0) {
      return Response.json({
        ok: true,
        updated: 0,
        message: "Nenhum membro vinculado encontrado para sincronizar."
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("clients")
      .update({
        ...syncData,
        grupo_familiar_id: grupoId,
        grupo_familiar_nome: master.grupo_familiar_nome || master.grupo_processo || grupoId,
        grupo_familiar_master: false,
        grupo_familiar_master_id: master.id
      })
      .in("id", targetIds);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    try {
      await supabaseAdmin.from("audit_logs").insert({
        client_id: master.id,
        action: "family_group_synced",
        details: {
          grupoId,
          updated: targetIds.length,
          fields: SYNC_FIELDS
        }
      });
    } catch (err) {
      console.warn("Log de sincronização não gravado:", err?.message || err);
    }

    return Response.json({
      ok: true,
      updated: targetIds.length,
      memberIds: targetIds
    });
  } catch (error) {
    return Response.json({
      error: error.message || "Erro ao sincronizar grupo familiar."
    }, { status: 500 });
  }
}
