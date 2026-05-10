import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

const SYNC_FIELDS = [
  // 10 etapas unificadas / barra de progresso
  "status",
  "stage_ds160_completed",
  "stage_fee_generated",
  "stage_fee_paid",
  "stage_dates_scheduled",
  "stage_interview_done",
  "stage_passport_returned",
  "stage_feedback_sent",
  "stage_feedback_posted",
  "stage_ready_to_archive",
  "is_completed",

  // Processo, datas e rastreios
  "interview_date",
  "casv_date",
  "video_call_date",
  "consulate_city",
  "passport_tracking_code",
  "data_inicio_processo",

  // Dados operacionais internos do processo
  "data_final_processo",
  "observacoes_gerais",
  "tipo_processo"
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

    if (!master.grupo_familiar_master) {
      return Response.json({
        error: "Este cliente não está marcado como Contato principal do grupo."
      }, { status: 400 });
    }

    const groupId = master.group_process_id;

    if (!groupId) {
      return Response.json({
        error: "Este cliente não possui Grupo de processo preenchido."
      }, { status: 400 });
    }

    const syncData = pickSyncData(master);

    const { data: members, error: membersError } = await supabaseAdmin
      .from("clients")
      .select("id, name, sincronizar_com_grupo")
      .eq("group_process_id", groupId)
      .neq("id", masterId);

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
        message: "Nenhum outro membro do grupo encontrado para sincronizar."
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("clients")
      .update({
        ...syncData,
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
          group_process_id: groupId,
          updated: targetIds.length,
          fields: SYNC_FIELDS
        }
      });
    } catch {}

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
