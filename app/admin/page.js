"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase, getCurrentAdminSession } from "../../lib/supabaseAdminAuth";
import BrandHeader from "../../components/BrandHeader";
import { EMAIL_TEMPLATES } from "../../lib/emailTemplates";
import FamilyGroupSyncButton from "./components/FamilyGroupSyncButton";

function cleanCPF(value) {
  return (value || "").replace(/\D/g, "");
}

function formatDateBR(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatDateTimeBR(value) {
  if (!value) return "";
  const [datePart, timePartRaw] = String(value).split("T");
  const date = formatDateBR(datePart);
  if (!timePartRaw) return date;
  const [hour, minute] = timePartRaw.split(":");
  if (!hour || !minute) return date;
  return `${date} às ${hour}:${minute}`;
}

function toDatetimeLocal(value) {
  if (!value) return "";
  return String(value).slice(0, 16);
}

function statusLabel(status) {
  const labels = {
    not_started: "Não iniciado",
    in_progress: "Em preenchimento",
    submitted: "Enviado"
  };
  return labels[status] || status;
}

const PROCESS_STEPS = [
  ["status_not_started", "Não iniciado"],
  ["status_in_progress", "Em preenchimento"],
  ["status_submitted", "Preencher DS-160"],
  ["stage_ds160_completed", "PREENCHER DS-160 no consulado"],
  ["stage_fee_generated", "Taxa gerada"],
  ["stage_fee_paid", "Taxa paga"],
  ["stage_dates_scheduled", "Datas agendadas"],
  ["stage_video_call_scheduled", "Videochamada agendada"],
  ["stage_video_call_done", "Videochamada realizada"],
  ["stage_interview_done", "Entrevista realizada"],
  ["visa_result", "Visto aprovado ou negado"],
  ["stage_passport_returned", "Visto/passaporte devolvido"],
  ["stage_feedback_sent", "Pesquisa de satisfação enviada"],
  ["stage_feedback_answered", "Pesquisa de satisfação respondida"],
  ["stage_feedback_posted", "Pesquisa de satisfação postada"],
  ["stage_ready_to_archive", "Pronto para arquivar"]
];

function stepDone(client, key) {
  if (key === "status_not_started") return true;
  if (key === "status_in_progress") return ["in_progress", "submitted"].includes(client.status) || !!client.stage_ds160_completed || !!client.stage_fee_generated || !!client.stage_fee_paid || !!client.stage_dates_scheduled || !!client.stage_video_call_scheduled || !!client.stage_video_call_done || !!client.stage_interview_done || !!client.visa_result || !!client.stage_passport_returned;
  if (key === "status_submitted") return client.status === "submitted" || !!client.stage_ds160_completed || !!client.stage_fee_generated || !!client.stage_fee_paid || !!client.stage_dates_scheduled || !!client.stage_video_call_scheduled || !!client.stage_video_call_done || !!client.stage_interview_done || !!client.visa_result || !!client.stage_passport_returned;
  if (key === "visa_result") return !!client.visa_result;
  return !!client[key];
}

function processStepCount(client) {
  return PROCESS_STEPS.reduce((total, [key]) => total + (stepDone(client, key) ? 1 : 0), 0);
}

function currentStepKey(client) {
  let current = "status_not_started";
  for (const [key] of PROCESS_STEPS) {
    if (stepDone(client, key)) current = key;
  }
  return current;
}

function currentStepLabel(client) {
  const key = currentStepKey(client);
  const item = PROCESS_STEPS.find(([stepKey]) => stepKey === key);
  return item?.[1] || "Não iniciado";
}


const CRITICAL_ALERT_QUESTIONS = ["3.19", "3.20", "3.21", "6.9", "6.11", "8.8"];

const GROUP_CARD_COLORS = [
  "#fff1b8",
  "#c7f9cc",
  "#cde7ff",
  "#ffd6e7",
  "#e0d4ff",
  "#c6f6f1",
  "#ffd8a8",
  "#d9f99d",
  "#fecaca",
  "#bae6fd",
  "#fde68a",
  "#ddd6fe"
];

function groupColorFor(client) {
  const groupKey = String(
    client.group_process_id ||
    client.family_group ||
    client.process_group?.nome ||
    client.group_process_name ||
    ""
  );
  if (!groupKey) return "";
  let sum = 0;
  for (const ch of groupKey) sum += ch.charCodeAt(0);
  return GROUP_CARD_COLORS[sum % GROUP_CARD_COLORS.length];
}

function groupRowStyle(client) {
  const color = groupColorFor(client);
  return color ? { backgroundColor: color } : {};
}

function shouldDisableRenewalField(clientOrForm, field) {
  const isRenewal = !!clientOrForm?.is_renewal || clientOrForm?.tipo_processo === "Renovação";
  if (!isRenewal) return false;
  return field === "video_call_date" || field === "interview_date" || field === "consulate_city";
}



function canFillVisaExpiration(clientOrForm) {
  return clientOrForm?.visa_result === "approved" && !!clientOrForm?.stage_passport_returned;
}

function normalizeAnswer(value) {
  return String(value || "").trim().toLowerCase();
}

function buildQuestionNumberMap() {
  // Mantém o alerta correto mesmo que o ID interno dos campos seja diferente do número exibido.
  const map = {
    "3.20": "vistoCancelado",
    "3.21": "vistoNegado",
    "3.22": "pedidoImigracao",
    "6.9": "parenteEUA",
    "6.11": "familiaresEUA",
    "8.8": "organizacaoBeneficente"
  };
  return map;
}

const QUESTION_ID_BY_NUMBER = buildQuestionNumberMap();
const DISABLED_AUTO_EMAILS = new Set([]);
const CONSULATE_CITIES = ["Brasília", "São Paulo", "Rio de Janeiro", "Porto Alegre", "Recife"];

function correiosUrl(code) {
  const clean = String(code || "").trim();
  if (!clean) return "https://rastreamento.correios.com.br/app/index.php";
  return `https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(clean)}`;
}

function getCriticalAlerts(client) {
  const answers = client?.answers || {};
  return CRITICAL_ALERT_QUESTIONS.filter((number) => {
    const fieldId = QUESTION_ID_BY_NUMBER[number];
    return normalizeAnswer(answers[fieldId]) === "sim" || normalizeAnswer(answers[number]) === "sim";
  });
}

function isFilled(value) {
  if (value === true) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (value === null || value === undefined) return false;
  return String(value).trim() !== "";
}

function salaryMissingAlert(client) {
  const answers = client?.answers || {};
  const page7Started = ["ocupacao", "empregador", "enderecoEmpregador", "telefoneEmpregador", "dataInicioAtual", "atividades", "empregoAnterior", "dadosEmpregoAnterior", "estudoConcluido", "formacao"]
    .some((fieldId) => isFilled(answers[fieldId]));
  return page7Started && !isFilled(answers.salario);
}

function actionLabel(action) {
  const labels = {
    client_created: "Cliente cadastrado",
    client_opened_form: "Abriu o formulário",
    client_verified_identity: "Confirmou CPF e data",
    client_saved_form: "Salvou respostas",
    client_submitted_form: "Enviou o formulário",
    unlock: "Formulário desbloqueado",
    new_token: "Novo link gerado",
    client_updated: "Cliente atualizado",
    email_sent: "Email enviado",
    mark_completed: "Processo concluído",
    reopen: "Processo reaberto",
    update_tracking: "Rastreio atualizado",
    update_process: "Processo atualizado",
    client_sedex_tracking_sent: "Rastreio Sedex informado pelo cliente",
    internal_email_sent: "Alerta interno enviado",
    internal_email_failed: "Falha no alerta interno",
    update_process_steps: "Etapas do processo atualizadas",
    feedback_received: "Pesquisa de satisfação respondida"
  };
  return labels[action] || action;
}

const WHATSAPP_TEMPLATES = [
  {
    id: "triagem",
    label: "01 - Triagem inicial",
    text: `Olá! Tudo bem? 😊

Para te orientar da melhor forma sobre o visto americano, preciso entender rapidamente o seu caso.

Pode me informar, por favor:

1️⃣ O visto é para você ou mais pessoas da família?
2️⃣ Todos já possuem passaporte válido?
3️⃣ Já teve visto americano antes? Se sim, quando venceu?
4️⃣ Já teve algum visto negado?
5️⃣ Em qual cidade pretende fazer o processo?

Com essas informações consigo te orientar corretamente e te passar os valores 👍

Fico no aguardo!`
  },
  {
    id: "proposta",
    label: "02 - Proposta / valores",
    text: `Perfeito, entendi seu caso 👍

Eu realizo toda a assessoria do visto americano, cuidando do preenchimento completo do formulário, organização das informações, orientações e agendamento, instruções para documentação e entrevista e uma videochamada para tratarmos de eventuais dúvidas.

Todo o processo é feito diretamente por mim, com total cuidado e sigilo das suas informações.

💰 Valores por pessoa:
• Assessoria: R$ 400,00
• Taxa consular: USD 185
• Entrega do passaporte em casa (opcional): R$ 66,00

🔹 Serviços adicionais (se necessário):
• Renovação sem entrevista (por família): R$ 300,00, além do valor da assessoria.
• Alteração de cidade após formulário: R$ 150,00
• Tentativa de antecipação de agendamento: R$ 300,00

Caso ainda não possua passaporte válido, também posso te orientar ou cuidar dessa etapa para você, facilitando todo o processo.

Após o pagamento da taxa consular, realizo o agendamento conforme disponibilidade, e te acompanho até o final do processo.

Se quiser, posso dar andamento no seu caso 😊`
  },
  {
    id: "fechamento",
    label: "03 - Fechamento / confirmação",
    text: `Perfeito 😊

Posso dar andamento no seu processo sim.

O próximo passo é iniciarmos oficialmente a assessoria, para que eu possa cuidar de todo o seu processo com segurança e organização.

Assim que confirmarmos, eu te envio o acesso ao formulário completo, onde você poderá preencher com calma todas as informações necessárias.

A partir daí, sigo com o preenchimento, revisão e agendamento para você.

Me confirma se podemos prosseguir?`
  },
  {
    id: "pagamento_assessoria",
    label: "04 - Pagamento da assessoria",
    text: `Perfeito 😊

Para iniciarmos oficialmente a assessoria, o próximo passo é o pagamento do valor do serviço.

💰 Valor da assessoria: R$ 400,00 por pessoa.

Após a confirmação do pagamento, eu envio o link exclusivo do formulário para preenchimento, onde você poderá informar os dados necessários com calma e segurança.

Essas informações serão analisadas, organizadas e inseridas por mim no formulário oficial do consulado.

Depois que o formulário estiver completo e revisado, eu gero a taxa consular, que atualmente é de USD 185 por pessoa, paga diretamente por boleto ou QR Code.

Assim que realizar o pagamento da assessoria, pode me enviar o comprovante por aqui para que eu libere o próximo passo.`
  },
  {
    id: "coleta_dados",
    label: "05 - Comprovante recebido / coleta de dados",
    text: `Perfeito, recebi o comprovante 😊

Já vou dar andamento no seu processo.

Em breve vou te enviar o acesso ao formulário completo para preenchimento.

Para adiantar essa etapa, me envie por favor:

📄 Foto do passaporte válido (página de identificação)
📄 Foto do RG ou CNH

E também preciso dos seguintes dados de cada solicitante maior de idade:

• Nome completo
• CPF
• Data de nascimento
• Email
• Telefone

Essas informações são necessárias para gerar o acesso individual de cada solicitante ao formulário.

Caso uma única pessoa vá preencher para todos, não tem problema — eu envio os links separados para cada integrante da família, identificando corretamente cada um.

Assim que me enviar tudo, já deixo preparado para te encaminhar os acessos 👍`
  },
  {
    id: "taxa_consular",
    label: "06 - Taxa consular / forma de pagamento",
    text: `Perfeito 😊

Seu formulário já foi finalizado e podemos seguir para a próxima etapa.

Agora é necessário realizar o pagamento da taxa consular para que eu consiga acessar as datas disponíveis e realizar o agendamento.

Como você prefere fazer esse pagamento:

• Boleto bancário
ou
• Pix (QR Code)?

Me informa a opção que você prefere que eu já te envio na sequência 👍`
  },
  {
    id: "taxa_boleto",
    label: "06A - Resposta: boleto",
    text: `Perfeito, já vou gerar o boleto e te envio na sequência.

Assim que realizar o pagamento, me envie o comprovante por aqui para que eu acompanhe a liberação e já possamos seguir com o agendamento.`
  },
  {
    id: "taxa_pix",
    label: "06B - Resposta: Pix / QR Code",
    text: `Perfeito, vou gerar o QR Code e te envio agora.

⚠️ Lembrando que ele tem validade curta, então o ideal é realizar o pagamento logo após o envio.

Assim que realizar o pagamento, me envie o comprovante por aqui para que eu acompanhe a liberação e já possamos seguir com o agendamento.`
  },
  {
    id: "entrega_passaporte",
    label: "07 - Oferta entrega do passaporte",
    text: `Perfeito, já vou realizar o agendamento 👍

Antes de concluir, você deseja que o passaporte seja entregue na sua residência após a aprovação?

Essa opção costuma ser mais prática, evitando deslocamento posterior.

Se quiser, já posso incluir essa modalidade para você.`
  },
  {
    id: "entrega_sim",
    label: "07A - Cliente aceitou entrega",
    text: `Perfeito 😊

Vou incluir essa opção no seu processo.

Assim que finalizar o agendamento, te passo as orientações para pagamento dessa taxa junto com os demais documentos.`
  },
  {
    id: "agendar_videochamada",
    label: "08 - Agendar videochamada",
    text: `Perfeito 😊

Como sua entrevista está se aproximando, vamos fazer uma videochamada rápida para alinharmos os pontos finais e tirar eventuais dúvidas.

Qual desses horários funciona melhor para você?

[INSERIR 2 OU 3 OPÇÕES DE HORÁRIO]

Se nenhum desses horários for bom, pode me sugerir outro 👍`
  },
  {
    id: "confirmar_videochamada",
    label: "08A - Confirmar videochamada",
    text: `Perfeito, então fechamos para [DIA] às [HORÁRIO] 👍

Se possível, entre já com o vídeo assistido e com os documentos separados para aproveitarmos melhor o tempo da chamada.`
  },
  {
    id: "pos_videochamada",
    label: "09 - Pós-videochamada",
    text: `Perfeito 😊

Foi um prazer falar com você.

Fica tranquilo(a), seu caso está bem alinhado e você está preparado(a) para a entrevista.

Agora é seguir o combinado e manter a calma no dia.

Qualquer dúvida até lá, me chama por aqui 👍

Estarei torcendo por você!`
  },
  {
    id: "boa_sorte",
    label: "10 - Boa sorte amanhã",
    text: `Boa sorte amanhã 😊

Vai com calma, responda com objetividade e siga exatamente o que alinhamos.

Depois me conta como foi 👍`
  }
];

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const supabase = createBrowserSupabase();

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const session = await getCurrentAdminSession();

        if (!active) return;

        if (!session) {
          window.location.replace("/admin/login");
          return;
        }

        const bridge = await fetch("/api/admin/supabase-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: session.access_token })
        });

        if (!bridge.ok) {
          window.location.replace("/admin/login");
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error("Falha na autenticação do admin:", error);
        window.location.replace("/admin/login");
      } finally {
        if (active) setChecking(false);
      }
    }

    checkAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user?.email) {
        window.location.replace("/admin/login");
        return;
      }

      setAuthorized(true);
      setChecking(false);
    });

    return () => {
      active = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.replace("/admin/login");
  }

  if (checking) {
    return (
      <main style={{ padding: 30, fontFamily: "Arial, Helvetica, sans-serif" }}>
        Verificando acesso...
      </main>
    );
  }

  if (!authorized) {
    return (
      <main style={{ padding: 30, fontFamily: "Arial, Helvetica, sans-serif" }}>
        Redirecionando para o login...
      </main>
    );
  }

  return <Dashboard logout={logout} />;
}

function Dashboard({ logout }) {
  const supabase = createBrowserSupabase();
  const [clients, setClients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logClient, setLogClient] = useState(null);
  const [logLoading, setLogLoading] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeMenu, setActiveMenu] = useState(null);
  const [groups, setGroups] = useState([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [processTab, setProcessTab] = useState("andamento");
  const [sortBy, setSortBy] = useState("created_desc");
  const [form, setForm] = useState({
    name: "",
    cpf: "",
    birth_date: "",
    phone: "",
    email: "",
    notes: "",
    group_process_id: "",
    no_form_required: false,
    is_renewal: false,
    tipo_processo: "Primeiro visto",
    passport_expiration_date: "",
    observacoes_gerais: ""
  });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://visto-seguro.vercel.app";

  async function loadClients() {
    const res = await fetch("/api/admin/clients");
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao carregar clientes.");
      return;
    }
    setClients(data.clients || []);
  }


  async function loadDismissedAlerts() {
    try {
      const res = await fetch("/api/admin/alerts/dismiss", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setDismissedAlerts(new Set(data.dismissed || []));
    } catch {}
  }

  async function dismissAlert(alertKey) {
    const res = await fetch("/api/admin/alerts/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alert_key: alertKey })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao baixar alerta.");
      return;
    }
    setDismissedAlerts((current) => new Set([...current, alertKey]));
  }

  async function loadGroups() {
    const res = await fetch("/api/admin/process-groups");
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao carregar grupos de processo.");
      return;
    }
    setGroups(data.groups || []);
  }

  async function createProcessGroup() {
    const nome = prompt("Nome do grupo de processo (ex.: Família Silva — entrevista filhos):");
    if (!nome) return;
    const res = await fetch("/api/admin/process-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao criar grupo de processo.");
      return;
    }
    await loadGroups();
    setForm((current) => ({ ...current, group_process_id: data.group?.id || "" }));
  }

  function groupById(id) {
    return groups.find((group) => group.id === id) || null;
  }

  function processInfo(client) {
    const group = client.process_group || groupById(client.group_process_id);
    return {
      group,
      groupName: group?.nome || client.family_group || "",
      consulate_city: group?.consulate_city || client.consulate_city || "",
      casv_date: group?.casv_date || client.casv_date || "",
      interview_date: group?.interview_date || client.interview_date || "",
      video_call_date: group?.video_call_date || client.video_call_date || "",
      passport_tracking_code: group?.passport_tracking_code || client.passport_tracking_code || "",
      data_inicio_processo: group?.data_inicio_processo || client.data_inicio_processo || ""
    };
  }

  function groupMasterName(client) {
    if (!client?.group_process_id) return "";
    const master = clients.find((item) =>
      item.group_process_id === client.group_process_id &&
      item.grupo_familiar_master
    );
    return master?.name || "solicitante principal";
  }

  function groupMasterAlert(client, area = "esta alteração") {
    const masterName = groupMasterName(client);
    return `Este cliente faz parte de um grupo familiar, mas não é o Contato principal. Para ${area}, altere pelo solicitante principal: ${masterName}.`;
  }

  async function syncFamilyGroup(masterClient, silent = true) {
    if (!masterClient?.grupo_familiar_master || !masterClient?.group_process_id) return;
    const syncRes = await fetch("/api/admin/sync-family-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ masterId: masterClient.id })
    });
    const syncData = await syncRes.json();
    if (!syncRes.ok) {
      alert(syncData.error || "Alteração salva, mas não foi possível sincronizar o grupo.");
      return;
    }
    if (!silent) alert(`Grupo sincronizado. ${syncData.updated || 0} membro(s) atualizado(s).`);
  }

  async function updateProcessSchedule(client, fields) {
    const info = processInfo(client);

    if (client.group_process_id && !client.grupo_familiar_master) {
      alert(groupMasterAlert(client, "vincular datas/rastreios a todos"));
      return;
    }

    if (client.group_process_id && client.grupo_familiar_master) {
      const res = await fetch(`/api/admin/process-groups/${client.group_process_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consulate_city: fields.consulate_city ?? info.consulate_city ?? "",
          casv_date: fields.casv_date ?? info.casv_date ?? "",
          interview_date: fields.interview_date ?? info.interview_date ?? "",
          video_call_date: fields.video_call_date ?? info.video_call_date ?? "",
          passport_tracking_code: fields.passport_tracking_code ?? info.passport_tracking_code ?? "",
          data_inicio_processo: fields.data_inicio_processo ?? info.data_inicio_processo ?? "",
          stage_dates_scheduled: !!((fields.casv_date ?? info.casv_date ?? "") || (fields.interview_date ?? info.interview_date ?? ""))
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const fallbackClientSchedule = await fetch(`/api/admin/clients/${client.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_schedule",
            consulate_city: fields.consulate_city ?? info.consulate_city ?? "",
            casv_date: fields.casv_date ?? info.casv_date ?? "",
            interview_date: fields.interview_date ?? info.interview_date ?? "",
            video_call_date: fields.video_call_date ?? info.video_call_date ?? "",
            passport_tracking_code: fields.passport_tracking_code ?? info.passport_tracking_code ?? "",
            data_inicio_processo: fields.data_inicio_processo ?? info.data_inicio_processo ?? ""
          })
        });
        const fallbackData = await fallbackClientSchedule.json();
        if (!fallbackClientSchedule.ok) { alert(fallbackData.error || data.error || "Erro ao salvar grupo de processo."); return; }
      }
      if ((fields.casv_date ?? info.casv_date ?? "") || (fields.interview_date ?? info.interview_date ?? "")) {
        await fetch(`/api/admin/clients/${client.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update_process_steps", stage_dates_scheduled: true })
        });
      }
      await syncFamilyGroup(client, true);
      await loadGroups();
      await loadClients();
      return;
    }

    await updateClientSchedule(client, fields);
  }

  function buildGlobalAlerts() {
    const alerts = [];
    const addedGroups = new Set();
    clients.forEach((client) => {
      const info = processInfo(client);
      const label = info.group ? info.groupName : client.name;
      const target = info.group ? `Grupo: ${label}` : `Cliente: ${label}`;
      if (info.group && addedGroups.has(info.group.id)) return;
      if (info.group) addedGroups.add(info.group.id);
      const base = { label: target, clientName: client.name, groupName: info.groupName };
      const interviewDays = daysUntil(info.interview_date);
      const videoDays = daysUntil(info.video_call_date);
      const casvDays = daysUntil(info.casv_date);
      if (interviewDays !== null && interviewDays >= 0 && interviewDays <= 7) alerts.push({ ...base, key: `interview-${info.group?.id || client.id}-${info.interview_date}`, text: `Entrevista em ${interviewDays === 0 ? "hoje" : `${interviewDays} dia(s)`}${info.consulate_city ? ` — ${info.consulate_city}` : ""}` });
      if (casvDays !== null && casvDays >= 0 && casvDays <= 3) alerts.push({ ...base, key: `casv-${info.group?.id || client.id}-${info.casv_date}`, text: `CASV em ${casvDays === 0 ? "hoje" : `${casvDays} dia(s)`}` });
      if (videoDays !== null && videoDays >= 0 && videoDays <= 2) alerts.push({ ...base, key: `video-${info.group?.id || client.id}-${info.video_call_date}`, text: `Videochamada em ${videoDays === 0 ? "hoje" : `${videoDays} dia(s)`}` });
    });
    clients.forEach((client) => {
      const formStarted = client.status === "in_progress";
      const formSubmitted = client.status === "submitted";
      if (formStarted) alerts.push({ key: `form-started-${client.id}`, label: `Cliente: ${client.name}`, text: "Formulário iniciado" });
      if (formSubmitted) alerts.push({ key: `form-submitted-${client.id}`, label: `Cliente: ${client.name}`, text: "Formulário concluído" });
      if (client.is_renewal && !client.client_sedex_tracking) alerts.push({ key: `renewal-sedex-${client.id}`, label: `Cliente: ${client.name}`, text: "Renovação sem rastreio Sedex informado" });
      if (salaryMissingAlert(client)) alerts.push({ key: `salary-missing-${client.id}`, label: `Cliente: ${client.name}`, text: "Deixou informação de salário em branco" });
      const critical = getCriticalAlerts(client);
      if (critical.length > 0) alerts.push({ key: `critical-${client.id}-${critical.join("-")}`, label: `Cliente: ${client.name}`, text: `Respondeu Sim na pergunta ${critical.join(", ")}` });
    });
    return alerts.filter((item) => !dismissedAlerts.has(item.key));
  }

  async function loadLogs(client) {
    setLogClient(client);
    setLogLoading(true);
    setLogs([]);

    const res = await fetch(`/api/admin/logs?client_id=${client.id}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao carregar log.");
      setLogLoading(false);
      return;
    }

    setLogs(data.logs || []);
    setLogLoading(false);
  }

  useEffect(() => {
    loadClients();
    loadGroups();
    loadDismissedAlerts();
  }, []);

  async function createClient() {
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao cadastrar cliente.");
      return;
    }

    setForm({ name: "", cpf: "", birth_date: "", phone: "", email: "", notes: "", group_process_id: "", no_form_required: false, is_renewal: false, tipo_processo: "Primeiro visto", data_inicio_processo: "", observacoes_gerais: "" });
    await loadClients();
  }

  async function actionClient(id, action) {
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro na ação.");
      return;
    }

    await loadClients();
  }

  function openEditClient(client) {
    setEditingClient(client);
    setEditForm({
      name: client.name || "",
      cpf: client.cpf || "",
      birth_date: client.birth_date || "",
      phone: client.phone || "",
      email: client.email || "",
      notes: client.notes || "",
      group_process_id: client.group_process_id || "",
      no_form_required: !!client.no_form_required,
      is_renewal: !!client.is_renewal,
      client_sedex_tracking: client.client_sedex_tracking || "",
      tipo_processo: client.tipo_processo || (client.is_renewal ? "Renovação" : "Primeiro visto"),
      passport_expiration_date: client.passport_expiration_date || "",
      visa_expiration_date: client.visa_expiration_date || "",
      visa_result: client.visa_result || "",
      stage_passport_returned: !!client.stage_passport_returned,
      observacoes_gerais: client.observacoes_gerais || "",
      grupo_familiar_master: !!client.grupo_familiar_master,
      sincronizar_com_grupo: client.sincronizar_com_grupo !== false
    });
  }

  async function saveClientDetails() {
    if (!editingClient) return;

    const res = await fetch(`/api/admin/clients/${editingClient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_details", ...editForm })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao editar cliente.");
      return;
    }

    setEditingClient(null);
    setEditForm({});
    await loadClients();
  }

  async function sendEmail(client, templateId) {
    if (DISABLED_AUTO_EMAILS.has(templateId)) {
      alert("Este modelo está marcado como não disponível para envio automático. Use o Gmail manualmente com os anexos necessários.");
      return;
    }

    if (!client.email) {
      alert("Este cliente não possui e-mail cadastrado.");
      return;
    }

    if (templateId === "rastreio" && !processInfo(client).passport_tracking_code) {
      alert("Informe o código de rastreio em Processo, datas e rastreios antes de enviar o Email 09.");
      return;
    }

    const template = EMAIL_TEMPLATES.find((item) => item.id === templateId);
    const ok = confirm(`Enviar o email "${template?.label || templateId}" para ${client.name} (${client.email})?`);
    if (!ok) return;

    const res = await fetch("/api/admin/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: client.id, template_id: templateId })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao enviar email.");
      return;
    }

    alert(data.message || "Email aceito pela Brevo. Confira a entrega nos logs da Brevo, se necessário.");
    await loadClients();
  }

  async function updateClientSchedule(client, fields) {
    const res = await fetch(`/api/admin/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_schedule",
        interview_date: fields.interview_date ?? client.interview_date ?? "",
        casv_date: fields.casv_date ?? client.casv_date ?? "",
        video_call_date: fields.video_call_date ?? client.video_call_date ?? "",
        consulate_city: fields.consulate_city ?? client.consulate_city ?? "",
        passport_tracking_code: fields.passport_tracking_code ?? client.passport_tracking_code ?? "",
        data_inicio_processo: fields.data_inicio_processo ?? client.data_inicio_processo ?? "",
        stage_dates_scheduled: !!((fields.casv_date ?? client.casv_date ?? "") || (fields.interview_date ?? client.interview_date ?? "")),
        client_sedex_tracking: fields.client_sedex_tracking ?? client.client_sedex_tracking ?? "",
        is_renewal: fields.is_renewal ?? client.is_renewal ?? false
      })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao salvar datas. Confira se as colunas novas foram criadas no Supabase.");
      return;
    }
    await loadClients();

  }

  function daysUntil(dateValue) {
    if (!dateValue) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${dateValue}T00:00:00`);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  }

  function scheduleAlerts(client) {
    const alerts = [];
    const info = processInfo(client);
    const interviewDays = daysUntil(info.interview_date);
    const videoDays = daysUntil(info.video_call_date);
    const casvDays = daysUntil(info.casv_date);

    if (interviewDays !== null && interviewDays >= 0 && interviewDays <= 2) alerts.push({ level: "danger", text: `Entrevista em ${interviewDays === 0 ? "hoje" : `${interviewDays} dia(s)`}${info.consulate_city ? ` — ${info.consulate_city}` : ""}` });
    else if (interviewDays !== null && interviewDays > 2 && interviewDays <= 7) alerts.push({ level: "warning", text: `Entrevista em ${interviewDays} dias${info.consulate_city ? ` — ${info.consulate_city}` : ""}` });

    if (casvDays !== null && casvDays >= 0 && casvDays <= 3) alerts.push({ level: "info", text: `CASV em ${casvDays === 0 ? "hoje" : `${casvDays} dia(s)`}` });
    if (videoDays !== null && videoDays >= 0 && videoDays <= 2) alerts.push({ level: "info", text: `Videochamada em ${videoDays === 0 ? "hoje" : `${videoDays} dia(s)`}` });

    return alerts;
  }

  function Thermometer({ client }) {
    const count = processStepCount(client);
    return (
      <div className="process-thermometer" title={`${count}/14 etapas concluídas`}>
        <div className="thermo-label">Etapa: {count}/14 — {currentStepLabel(client)}</div>
        <div className="thermo-bars">
          {PROCESS_STEPS.map(([key], index) => (
            <span key={key} className={index < count ? "filled" : ""}></span>
          ))}
        </div>
      </div>
    );
  }

  function buildStepUpdate(client, clickedKey, clickedValue, visaResultValue) {
    const update = {
      status: client.status || "not_started",
      stage_ds160_completed: !!client.stage_ds160_completed,
      stage_fee_generated: !!client.stage_fee_generated,
      stage_fee_paid: !!client.stage_fee_paid,
      stage_dates_scheduled: !!client.stage_dates_scheduled,
      stage_video_call_scheduled: !!client.stage_video_call_scheduled,
      stage_video_call_done: !!client.stage_video_call_done,
      stage_interview_done: !!client.stage_interview_done,
      visa_result: client.visa_result || "",
      stage_passport_returned: !!client.stage_passport_returned,
      stage_feedback_sent: !!client.stage_feedback_sent,
      stage_feedback_answered: !!client.stage_feedback_answered,
      stage_feedback_posted: !!client.stage_feedback_posted,
      stage_ready_to_archive: !!client.stage_ready_to_archive
    };

    const index = PROCESS_STEPS.findIndex(([key]) => key === clickedKey);

    if (clickedValue && index >= 0) {
      for (let i = 0; i <= index; i++) {
        const key = PROCESS_STEPS[i][0];
        if (key === "status_not_started") update.status = "not_started";
        else if (key === "status_in_progress") update.status = "in_progress";
        else if (key === "status_submitted") update.status = "submitted";
        else if (key === "visa_result") update.visa_result = visaResultValue || update.visa_result || "approved";
        else update[key] = true;
      }
    } else {
      if (clickedKey === "status_not_started") {
        update.status = "not_started";
      } else if (clickedKey === "status_in_progress") {
        update.status = clickedValue ? "in_progress" : "not_started";
      } else if (clickedKey === "status_submitted") {
        update.status = clickedValue ? "submitted" : "in_progress";
      } else if (clickedKey === "visa_result") {
        update.visa_result = visaResultValue || "";
      } else {
        update[clickedKey] = !!clickedValue;
      }
    }

    if (update.stage_ds160_completed || update.stage_fee_generated || update.stage_fee_paid || update.stage_dates_scheduled || update.stage_video_call_scheduled || update.stage_video_call_done || update.stage_interview_done || update.visa_result || update.stage_passport_returned || update.stage_feedback_sent || update.stage_feedback_answered || update.stage_feedback_posted || update.stage_ready_to_archive) {
      update.status = "submitted";
    }

    if (update.stage_ready_to_archive) {
      update.is_completed = true;
    }

    return update;
  }

  async function updateProcessSteps(client, clickedKey, clickedValue, visaResultValue = "") {
    const isIndividualVisaResult = clickedKey === "visa_result";

    if (client.group_process_id && !client.grupo_familiar_master && !isIndividualVisaResult) {
      alert(groupMasterAlert(client, "vincular etapas a todos"));
      return;
    }

    const fields = buildStepUpdate(client, clickedKey, clickedValue, visaResultValue);

    const res = await fetch(`/api/admin/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_process_steps",
        ...fields
      })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao atualizar etapas do processo.");
      return;
    }

    if (client.grupo_familiar_master && client.group_process_id && clickedKey !== "visa_result") {
      await syncFamilyGroup(client, true);
    }

    await loadClients();
  }

  async function deleteClient(client) {
    const confirmation = prompt(`Para excluir definitivamente o cadastro de ${client.name}, digite EXCLUIR:`);

    if (confirmation !== "EXCLUIR") {
      alert("Exclusão cancelada.");
      return;
    }

    const res = await fetch(`/api/admin/clients/${client.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erro ao excluir.");
      return;
    }

    alert("Cadastro excluído.");
    await loadClients();
  }

  function cleanPhoneForWhatsApp(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("55")) return digits;
    return `55${digits}`;
  }

  function openClientWhatsApp(client, templateId = "formulario") {
    const phone = cleanPhoneForWhatsApp(client.phone);
    if (!phone) {
      alert("Este cliente não possui celular cadastrado.");
      return;
    }

    const link = clientLink(client);
    const messages = {
      formulario: `Olá, ${client.name}! Tudo bem? Aqui é da Resumindo Viagens. Segue seu link seguro para preenchimento do formulário de visto americano: ${link}`,
      pendente: `Olá, ${client.name}! Passando para lembrar que seu formulário da Resumindo Viagens ainda está pendente. Você pode continuar pelo mesmo link: ${link}`,
      videochamada: `Olá, ${client.name}! Segue o link das orientações para preparação da videochamada: ${link.replace("/acesso/", "/preparacao/")}`
    };

    const text = encodeURIComponent(messages[templateId] || messages.formulario);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  }

  const filteredClients = useMemo(() => {
    const query = (search || "").trim().toLowerCase();
    const queryCpf = cleanCPF(search);

    function dateValue(value) {
      if (!value) return 9999999999999;
      const time = new Date(`${value}T00:00:00`).getTime();
      return Number.isFinite(time) ? time : 9999999999999;
    }

    function createdValue(client) {
      const time = new Date(client.created_at || 0).getTime();
      return Number.isFinite(time) ? time : 0;
    }

    return clients
      .filter((client) => {
        const haystack = [
          client.name,
          client.cpf,
          client.email,
          client.phone,
          processInfo(client).groupName,
          processInfo(client).consulate_city,
          processInfo(client).passport_tracking_code,
          client.client_sedex_tracking
        ].filter(Boolean).join(" ").toLowerCase();

        const matchesSearch = !query || haystack.includes(query) || (!!queryCpf && (client.cpf || "").includes(queryCpf));
        const matchesStatus = statusFilter === "all" || currentStepKey(client) === statusFilter;
        const matchesTab = processTab === "concluidos" ? !!client.is_completed : !client.is_completed;
        return matchesSearch && matchesStatus && matchesTab;
      })
      .sort((a, b) => {
        if (sortBy === "name") return (a.name || "").localeCompare(b.name || "", "pt-BR");
        if (sortBy === "created_asc") return createdValue(a) - createdValue(b);
        if (sortBy === "created_desc") return createdValue(b) - createdValue(a);
        if (sortBy === "interview_date") return dateValue(processInfo(a).interview_date) - dateValue(processInfo(b).interview_date) || (a.name || "").localeCompare(b.name || "", "pt-BR");
        if (sortBy === "casv_date") return dateValue(processInfo(a).casv_date) - dateValue(processInfo(b).casv_date) || (a.name || "").localeCompare(b.name || "", "pt-BR");
        if (sortBy === "video_call_date") return dateValue(processInfo(a).video_call_date) - dateValue(processInfo(b).video_call_date) || (a.name || "").localeCompare(b.name || "", "pt-BR");
        if (sortBy === "family_group") {
          const groupA = (processInfo(a).groupName || "zzzz").toLowerCase();
          const groupB = (processInfo(b).groupName || "zzzz").toLowerCase();
          if (groupA !== groupB) return groupA.localeCompare(groupB, "pt-BR");
        }
        return (a.name || "").localeCompare(b.name || "", "pt-BR");
      });
  }, [clients, groups, search, statusFilter, processTab, sortBy]);

  function clientLink(client) {
    if (client.no_form_required || !client.access_token) return "";
    return `${origin}/acesso/${client.access_token}`;
  }

  function isControlClient(client) {
    return !!client.no_form_required;
  }

  function templateNumber(template) {
    const match = String(template?.label || "").match(/^(\d+)/);
    return match ? Number(match[1]) : null;
  }

  function isInitialFormTemplate(template) {
    const n = templateNumber(template);
    return n === 1 || n === 2 || n === 3;
  }

  function isTemplateDisabledForClient(client, template) {
    return isControlClient(client) && isInitialFormTemplate(template);
  }

  async function copyText(text, message = "Copiado.") {
    await navigator.clipboard.writeText(text);
    alert(message);
  }

  async function ensureFeedbackLinkForClient(client) {
    const res = await fetch(`/api/admin/feedback-link/${client.id}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Não foi possível gerar o link da pesquisa.");
      return "";
    }
    await loadClients();
    return data.feedbackLink || "";
  }

  async function openFeedbackSurveyWhatsApp(client) {
    if (!client.stage_passport_returned) {
      alert("Disponível somente após marcar Visto/passaporte devolvido.");
      return;
    }

    const link = await ensureFeedbackLinkForClient(client);
    if (!link) return;

    const digits = cleanPhoneForWhatsApp(client.phone);
    if (!digits) {
      alert("Cliente sem celular cadastrado.");
      return;
    }

    const message = encodeURIComponent(`Olá, ${client.name}. Tudo bem?\n\nSeu processo com a Resumindo Viagens foi concluído e gostaríamos muito de ouvir sua opinião.\n\nA pesquisa é rápida e leva menos de 1 minuto:\n${link}\n\nSua resposta nos ajuda a aprimorar nosso atendimento. Muito obrigado pela confiança!`);
    window.open(`https://wa.me/${digits}?text=${message}`, "_blank");
  }

  function feedbackSurveyWhatsAppMessage(client, link = "") {
    return `Olá, ${client.name}. Tudo bem?

Seu processo com a Resumindo Viagens foi concluído e gostaríamos muito de ouvir sua opinião.

A pesquisa é rápida e leva menos de 1 minuto:
${link || "[link da pesquisa]"}

Sua resposta nos ajuda a aprimorar nosso atendimento. Muito obrigado pela confiança!`;
  }

  function feedbackSurveyWhatsAppUrl(client) {
    const digits = cleanPhoneForWhatsApp(client.phone);
    const message = encodeURIComponent(feedbackSurveyWhatsAppMessage(client));
    return digits ? `https://wa.me/${digits}?text=${message}` : "";
  }


  function whatsappMessage(client) {
    return `Olá, ${client.name}! Seu formulário da Resumindo Viagens já está pronto para preenchimento.\n\nAcesse seu link único e exclusivo:\n${clientLink(client)}\n\nPor segurança, o acesso será validado com CPF e data de nascimento.\n\nSe outros membros da família também estiverem preenchendo formulário, cada pessoa deverá acessar o próprio link individual.`;
  }


  function automaticProcessStatus(client) {
    if (client.stage_passport_returned) return "Concluído";
    if (client.visa_result === "approved") return "Visto aprovado";
    if (client.visa_result === "denied") return "Visto negado";
    if (client.stage_interview_done) return "Aguardando resultado";
    if (client.stage_dates_scheduled) return "Agendado";
    if (client.stage_fee_paid) return "Aguardando agendamento";
    if (client.stage_fee_generated) return "Taxa gerada";
    if (client.stage_ds160_completed || client.status === "submitted") return "PREENCHER DS-160 no consulado";
    if (client.status === "in_progress") return "Formulário em preenchimento";
    return "Iniciado";
  }

  function currentStepLabel(client) {
    if (client.stage_passport_returned) return "Visto/passaporte devolvido";
    if (client.visa_result) return client.visa_result === "approved" ? "Visto aprovado" : "Visto negado";
    if (client.stage_interview_done) return "Entrevista realizada";
    if (client.stage_dates_scheduled) return "Datas agendadas";
    if (client.stage_fee_paid) return "Taxa paga";
    if (client.stage_fee_generated) return "Taxa gerada";
    if (client.stage_ds160_completed || client.status === "submitted") return "PREENCHER DS-160 no consulado";
    if (client.status === "in_progress") return "Formulário iniciado";
    return "Cadastro iniciado";
  }

  function processDurationDays(client) {
    const start = client.data_inicio_processo || client.created_at?.slice(0, 10);
    if (!start) return "";
    const end = client.data_final_processo || new Date().toISOString().slice(0, 10);
    const startTime = new Date(`${start}T00:00:00`).getTime();
    const endTime = new Date(`${end}T00:00:00`).getTime();
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return "";
    return Math.max(0, Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)));
  }

  function reportRows() {
    return filteredClients.map((client) => {
      const info = processInfo(client);
      return {
        nome: client.name || "",
        cpf: client.cpf || "",
        grupo: info.groupName || "",
        tipo: client.tipo_processo || (client.is_renewal ? "Renovação" : "Primeiro visto"),
        status: automaticProcessStatus(client),
        etapa: currentStepLabel(client),
        inicio: formatDateBR(client.data_inicio_processo || client.created_at?.slice(0, 10)) || "",
        casv: formatDateBR(info.casv_date) || "",
        entrevista: formatDateBR(info.interview_date) || "",
        video: formatDateBR(info.video_call_date) || "",
        consulado: info.consulate_city || "",
        rastreio: info.passport_tracking_code || "",
        dias: processDurationDays(client),
        progresso: `${processStepCount(client)}/7`,
        resultado: client.visa_result === "approved" ? "Aprovado" : client.visa_result === "denied" ? "Negado" : "",
        observacoes: client.observacoes_gerais || client.notes || ""
      };
    });
  }

  function reportKpis() {
    const rows = reportRows();
    return {
      total: rows.length,
      andamento: rows.filter((row) => !["Concluído", "Visto aprovado", "Visto negado"].includes(row.status)).length,
      concluidos: rows.filter((row) => row.status === "Concluído" || row.status === "Visto aprovado" || row.status === "Visto negado").length,
      aprovados: rows.filter((row) => row.resultado === "Aprovado").length,
      negados: rows.filter((row) => row.resultado === "Negado").length
    };
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  }

  function exportReportCsv() {
    const headers = [
      "NOME", "CPF", "GRUPO DE PROCESSO", "TIPO", "STATUS ATUAL", "ETAPA ATUAL", "DATA INÍCIO", "DATA CASV", "DATA ENTREVISTA", "DATA VIDEOCHAMADA", "CIDADE CONSULADO", "RASTREIO PASSAPORTE", "DIAS DE PROCESSO", "PROGRESSO", "RESULTADO", "OBSERVAÇÕES",
      "COM ENTREVISTA?", "PGTO SERVIÇO", "ENVIO DE DOCS", "PASSAPORTE VÁLIDO EMITIDO", "DATA VALIDADE PASSAPORTE", "DS160 PREENCHIDO", "TAXA PAGA", "ENTREVISTA / ENTREGA PASSAPORTES AGENDADA", "ENTREGA / VISITA CASV AGENDADO", "CHAMADA DE VÍDEO", "ENTREVISTA REALIZADA", "APROVADO", "MODO RETIRADA OU CORREIOS", "SERVIÇO RETIRADA PAGO?", "ENVIO / RETIRADA PASSAPORTES", "ENTREGA DEFINITIVA", "VALIDADE VISTO", "VISTO CANADENSE OFERECIDO", "VISTO CANADENSE CONTRATADO E PAGO", "VISTO CANADENSE EMITIDO", "VALIDADE VISTO CANADENSE"
    ];
    const rows = filteredClients.map((client) => {
      const info = processInfo(client);
      const base = reportRows().find((row) => row.cpf === (client.cpf || "") && row.nome === (client.name || "")) || {};
      return [
        base.nome, base.cpf, base.grupo, base.tipo, base.status, base.etapa, base.inicio, base.casv, base.entrevista, base.video, base.consulado, base.rastreio, base.dias, base.progresso, base.resultado, base.observacoes,
        client.is_renewal ? "NÃO" : "SIM", "", "", "", "", (client.stage_ds160_completed || client.status === "submitted") ? "X" : "", client.stage_fee_paid ? "X" : "", info.interview_date ? "X" : "", info.casv_date ? "X" : "", info.video_call_date ? "X" : "", client.stage_interview_done ? "X" : "", client.visa_result === "approved" ? "X" : client.visa_result === "denied" ? "NEGADO" : "", "", "", info.passport_tracking_code ? "X" : "", client.stage_passport_returned ? "X" : "", "", "", "", "", ""
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-resumindo-viagens-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="admin-premium-page" style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
      <div className="card premium-header-card" style={{ padding: 22, marginBottom: 22 }}>
        <BrandHeader />
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div className="version-badge">v71 — balões aplicados no formulário</div><button className="btn-secondary" onClick={logout}>Sair</button></div>
      </div>

      <div className="card premium-header-card" style={{ padding: 22, marginBottom: 22 }}>
        <h2>Cadastrar cliente</h2>

        <div className="grid">
          <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="CPF" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
          <label className="admin-field-label"><span>Data de nascimento</span><input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></label>
        <label className="admin-field-label"><span>Validade do passaporte</span><input type="date" value={form.passport_expiration_date || ""} onChange={(e) => setForm({ ...form, passport_expiration_date: e.target.value })} /></label>
          <input placeholder="Celular" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label className="admin-field-label"><span>Tipo de processo</span><select value={form.tipo_processo} onChange={(e) => setForm({ ...form, tipo_processo: e.target.value })}><option value="Primeiro visto">Primeiro visto</option><option value="Renovação">Renovação</option><option value="Passaporte">Passaporte</option><option value="Canadá">Canadá</option><option value="Outro">Outro</option></select></label>
          <label className="admin-field-label"><span>Grupo de processo</span><select value={form.group_process_id} onChange={(e) => setForm({ ...form, group_process_id: e.target.value })}><option value="">Sem grupo</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.nome}</option>)}</select></label>
          <button type="button" className="btn-light" onClick={createProcessGroup}>+ Criar grupo de processo</button>
          <textarea className="wide" placeholder="Observações internas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <label className="admin-checkbox"><input type="checkbox" checked={!!form.no_form_required} onChange={(e) => setForm({ ...form, no_form_required: e.target.checked })} /> Cadastro de controle — não enviar formulário</label>
          <label className="admin-checkbox"><input type="checkbox" checked={!!form.is_renewal} onChange={(e) => setForm({ ...form, is_renewal: e.target.checked })} /> Processo de renovação sem entrevista</label>
        </div>

        <button className="btn-primary" onClick={createClient}>
          {form.no_form_required ? "Cadastrar controle sem link" : "Cadastrar cliente e gerar link seguro"}
        </button>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div className="admin-tabs" style={{ marginBottom: 16 }}>
          <button className={processTab === "andamento" ? "btn-primary" : "btn-light"} onClick={() => setProcessTab("andamento")}>Processos em andamento</button>
          <button className={processTab === "concluidos" ? "btn-primary" : "btn-light"} onClick={() => setProcessTab("concluidos")}>Processos concluídos</button>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => setAlertsOpen(true)}>Ver alertas</button>
          <a className="btn-light" href="/admin/feedbacks" target="_blank">Feedbacks</a>
          <button className="btn-light" onClick={() => setReportOpen(true)}>Relatórios</button>
          <a className="btn-light" href="/admin/baloes" target="_blank">Balões explicativos</a>
          <input placeholder="Buscar por nome, CPF, e-mail ou grupo de processo" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todas as etapas</option>
            {PROCESS_STEPS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="created_desc">Ordenar: cadastro mais recente</option>
            <option value="created_asc">Ordenar: cadastro mais antigo</option>
            <option value="name">Ordenar: ordem alfabética</option>
            <option value="family_group">Ordenar: grupo de processo</option>
            <option value="interview_date">Ordenar: data entrevista</option>
            <option value="casv_date">Ordenar: data CASV</option>
            <option value="video_call_date">Ordenar: data videochamada</option>
          </select>
        </div>

        <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th align="left">Cliente</th>
              <th align="left">Etapa</th>
              <th align="left">Link seguro</th>
              <th align="left">Ações</th>
            </tr>
          </thead>

          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id} className={processInfo(client).groupName ? "family-row" : ""} style={{ borderTop: "1px solid #e5e7eb", ...groupRowStyle(client) }}>
                <td style={{ backgroundColor: groupColorFor(client) || undefined }}>
                  <b style={{ textDecoration: client.grupo_familiar_master ? "underline" : "none", textDecorationThickness: client.grupo_familiar_master ? 2 : undefined }}>{client.name}</b><br />
                  <small>CPF: {client.cpf}</small><br />
                  <small>Nascimento: {formatDateBR(client.birth_date)}</small><br />
                  <small>Celular: {client.phone || "-"}</small><br />
                  <small>E-mail: {client.email || "-"}</small><br />
                  <small><b>Consulado:</b> {processInfo(client).consulate_city || "-"}</small><br />
                  <small>CASV: {formatDateBR(processInfo(client).casv_date) || "-"}</small><br />
                  <small>Entrevista: {formatDateBR(processInfo(client).interview_date) || "-"}</small><br />
                  <small>Videochamada: {formatDateTimeBR(processInfo(client).video_call_date) || "-"}</small><br />
                  <small>Grupo de processo: {processInfo(client).groupName || "-"}</small><br />
                  {client.grupo_familiar_master && <><small style={{ color: "#166534", fontWeight: 700 }}>Contato principal</small><br /></>}
                  <small><b>Rastreio passaporte:</b> {processInfo(client).passport_tracking_code || "-"}</small>
                  <Thermometer client={client} />
                  {client.client_sedex_tracking && <><br /><small>Sedex cliente: {client.client_sedex_tracking}</small></>}
                  {client.is_renewal && <div className="admin-renewal-alert">Renovação sem entrevista</div>}
                  {client.no_form_required && <div className="admin-renewal-alert muted">Cadastro de controle — sem formulário ao cliente</div>}
                  {scheduleAlerts(client).map((alert, index) => (
                    <div key={index} className={`admin-date-alert ${alert.level}`}>{alert.text}</div>
                  ))}
                  {getCriticalAlerts(client).length > 0 && (
                    <div className="admin-critical-alert">
                      Atenção: cliente respondeu <strong>Sim</strong> na pergunta {getCriticalAlerts(client).join(", ")}
                    </div>
                  )}
                  {salaryMissingAlert(client) && (
                    <div className="admin-date-alert warning">
                      Deixou informação de salário em branco
                    </div>
                  )}
                  {!client.passport_expiration_date && (
                    <div className="admin-date-alert warning">
                      Falta data de validade do passaporte
                    </div>
                  )}
                  {client.visa_result === "approved" && client.stage_passport_returned && !client.visa_expiration_date && (
                    <div className="admin-date-alert warning">
                      Falta data da validade do visto
                    </div>
                  )}
                  {client.feedback_answered_at && (
                    <div className="admin-date-alert info">
                      Avaliação recebida: nota {client.feedback_nota_nps ?? "-"} / 10
                    </div>
                  )}
                </td>

                <td>
                  <span className="status-pill" style={{ background: client.status === "submitted" ? "#dcfce7" : "#fff7e8", color: client.status === "submitted" ? "#166534" : "#92400e" }}>
                    {currentStepLabel(client)} {client.is_locked ? "🔒" : ""}
                  </span>
                </td>

                <td>
                  {isControlClient(client) ? (
                    <div className="copy-link muted">Cadastro de controle — sem link de formulário</div>
                  ) : (
                    <>
                      <div className="copy-link">{clientLink(client)}</div>
                      <button className="btn-light" disabled={!clientLink(client)} onClick={() => copyText(clientLink(client), "Link copiado.")} style={{ marginTop: 6 }}>
                        Copiar link
                      </button>
                    </>
                  )}
                </td>

                <td>
                  <div className="admin-actions">
                    {isControlClient(client) ? <button className="btn-light" disabled>Abrir</button> : <a className="btn-light" href={`/acesso/${client.access_token}`} target="_blank">Abrir</a>}
                    <button className="btn-light" onClick={() => openEditClient(client)}>Editar dados</button>
                    <button className="btn-light" onClick={() => setActiveMenu(activeMenu === `whatsapp-${client.id}` ? null : `whatsapp-${client.id}`)}>WhatsApp</button>

                    {activeMenu === `whatsapp-${client.id}` && (
                      <div className="admin-email-options whatsapp-panel" style={{ minWidth: 300 }}>
                        <button className="popup-close" onClick={() => setActiveMenu(null)}>×</button>
                        <h3 style={{ margin: "0 0 8px", color: "var(--navy)" }}>Enviar WhatsApp</h3>
                        <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 13 }}>Abre WhatsApp Web/App com mensagem pronta para o celular cadastrado.</p>
                        <button className="btn-light" onClick={() => openClientWhatsApp(client, "formulario")}>Formulário</button>
                        <button className="btn-light" onClick={() => openClientWhatsApp(client, "pendente")}>Lembrete de formulário</button>
                        <button className="btn-light" onClick={() => openClientWhatsApp(client, "videochamada")}>Videochamada</button>
                      </div>
                    )}

                    <button className="btn-light" onClick={() => setActiveMenu(activeMenu === `process-${client.id}` ? null : `process-${client.id}`)}>Processo, datas e rastreios</button>
                    {activeMenu === `process-${client.id}` && (
                      <div className="admin-email-options process-panel" style={{ minWidth: 380 }}>
                        <button className="popup-close" onClick={() => setActiveMenu(null)}>×</button>
                        <h3 style={{ margin: "0 0 8px", color: "var(--navy)" }}>Processo, datas e rastreios</h3>
                        <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 13 }}>Preencha ao longo do processo. Estes dados não fazem parte do cadastro inicial.</p>

                        <label><small>Data de início do processo</small><input type="date" defaultValue={processInfo(client).data_inicio_processo || ""} onBlur={(e) => updateProcessSchedule(client, { data_inicio_processo: e.target.value })} /></label>
                        <label><small>Cidade do consulado</small><select defaultValue={processInfo(client).consulate_city || ""} onChange={(e) => updateProcessSchedule(client, { consulate_city: e.target.value })}><option value="">Selecionar cidade</option>{CONSULATE_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></label>
                        <label><small>Data CASV</small><input type="date" defaultValue={processInfo(client).casv_date || ""} onBlur={(e) => updateProcessSchedule(client, { casv_date: e.target.value })} /></label>
                        <label><small>Data da entrevista no consulado</small><input disabled={shouldDisableRenewalField(client, "interview_date")} type="date" defaultValue={processInfo(client).interview_date || ""} onBlur={(e) => updateProcessSchedule(client, { interview_date: e.target.value })} /></label>
                        <label><small>Data da videochamada</small><input disabled={shouldDisableRenewalField(client, "video_call_date")} type="datetime-local" defaultValue={toDatetimeLocal(processInfo(client).video_call_date)} onBlur={(e) => updateProcessSchedule(client, { video_call_date: e.target.value })} /></label>

                        <hr style={{ width: "100%", border: 0, borderTop: "1px solid #e5e7eb", margin: "8px 0" }} />
                        <label><small>Rastreio do passaporte enviado ao cliente</small><input defaultValue={processInfo(client).passport_tracking_code || ""} placeholder="Ex.: AA123456789BR" onBlur={(e) => updateProcessSchedule(client, { passport_tracking_code: e.target.value })} /></label>
                        {processInfo(client).passport_tracking_code && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><a className="btn-light" href={correiosUrl(processInfo(client).passport_tracking_code)} target="_blank">Abrir rastreio nos Correios</a><button className="btn-light" onClick={() => copyText(processInfo(client).passport_tracking_code, "Código de rastreio copiado.")}>Copiar código</button></div>}

                        <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 12 }}>Renovação sem entrevista e rastreio Sedex enviado pelo cliente ficam em <strong>Editar dados</strong>.</p>
                      </div>
                    )}

                    <button className="btn-light" onClick={() => setActiveMenu(activeMenu === `steps-${client.id}` ? null : `steps-${client.id}`)}>Etapas do processo</button>
                    <button className={client.visa_result === "approved" ? "btn-primary" : "btn-light"} title="Marcar/desmarcar visto aprovado rapidamente" onClick={() => updateProcessSteps(client, "visa_result", client.visa_result !== "approved", client.visa_result === "approved" ? "" : "approved")}>☑ Visto aprovado rápido</button>
                    {activeMenu === `steps-${client.id}` && (
                      <div className="admin-email-options process-panel" style={{ minWidth: 420 }}>
                        <button className="popup-close" onClick={() => setActiveMenu(null)}>×</button>
                        <h3 style={{ margin: "0 0 8px", color: "var(--navy)" }}>Etapas do processo</h3>
                        <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 13 }}>Marque cada etapa concluída para acompanhar o andamento.</p>
                        {PROCESS_STEPS.map(([key, label]) => {
                          if (key === "visa_result") {
                            return (
                              <label key={key}>
                                <small>{label}</small>
                                <select value={client.visa_result || ""} onChange={(e) => updateProcessSteps(client, "visa_result", !!e.target.value, e.target.value)}>
                                  <option value="">Ainda sem resultado</option>
                                  <option value="approved">Visto aprovado</option>
                                  <option value="denied">Visto negado</option>
                                </select>
                              </label>
                            );
                          }
                          return (
                            <label key={key} className="admin-checkbox">
                              <input type="checkbox" checked={stepDone(client, key)} onChange={(e) => updateProcessSteps(client, key, e.target.checked)} />
                              {label}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <button className="btn-light" onClick={() => setActiveMenu(activeMenu === `copy-${client.id}` ? null : `copy-${client.id}`)}>Gerar modelos de email (copiar)</button>
                    {activeMenu === `copy-${client.id}` && (
                      <div className="admin-email-options">
                        <button className="popup-close" onClick={() => setActiveMenu(null)}>×</button>
                        {EMAIL_TEMPLATES.map((template) => {
                          const disabledForClient = isTemplateDisabledForClient(client, template);
                          return disabledForClient ? (
                            <button key={template.id} className="btn-light" disabled title="Indisponível para cadastro de controle">
                              {template.label} (indisponível)
                            </button>
                          ) : (
                            <a key={template.id} className="btn-light" href={template.id === "pesquisa_satisfacao" ? `/email-feedback/${client.id}` : `/email-preview/${client.id}?template=${template.id}`} target="_blank">
                              {template.label}
                            </a>
                          );
                        })}
                      </div>
                    )}

                    <button className="btn-primary" onClick={() => setActiveMenu(activeMenu === `send-${client.id}` ? null : `send-${client.id}`)}>Enviar emails automáticos</button>
                    {activeMenu === `send-${client.id}` && (
                      <div className="admin-email-options">
                        <button className="popup-close" onClick={() => setActiveMenu(null)}>×</button>
                        {EMAIL_TEMPLATES.map((template) => {
                          const disabled = DISABLED_AUTO_EMAILS.has(template.id) || isTemplateDisabledForClient(client, template);
                          const sentAt = client.email_sent_templates?.[template.id];
                          return (
                            <button key={template.id} className={sentAt ? "btn-success" : "btn-light"} disabled={disabled} onClick={() => sendEmail(client, template.id)} title={sentAt ? `Enviado em ${new Date(sentAt).toLocaleString("pt-BR")}` : ""}>
                              {sentAt ? "✅ " : "☐ "}{template.label}{disabled ? " (não disponível)" : ""}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {isControlClient(client) ? <button className="btn-light" disabled>Gerar PDF</button> : <a className="btn-light" href={`/admin/pdf/${client.access_token}`} target="_blank">Gerar PDF</a>}
                    {isControlClient(client) ? <button className="btn-light" disabled>PDF para preencher à mão</button> : <a className="btn-light" href={`/admin/pdf-manual/${client.access_token}`} target="_blank">PDF para preencher à mão</a>}
                    <a className="btn-light" href={`/foto-instrucoes/${client.access_token || client.id}`} target="_blank">Instruções Foto</a>
                    <button className="btn-light" onClick={() => loadLogs(client)}>Ver log</button>
                    <button className="btn-light" disabled={isControlClient(client)} title={isControlClient(client) ? "Cadastro de controle não possui formulário para desbloquear" : ""} onClick={() => actionClient(client.id, "unlock")}>Desbloquear</button>
                    <button className="btn-light" disabled={isControlClient(client)} title={isControlClient(client) ? "Cadastro de controle não possui link de formulário" : ""} onClick={() => actionClient(client.id, "new_token")}>Novo link</button>
                    <button className="btn-light" onClick={() => actionClient(client.id, client.is_completed ? "reopen" : "mark_completed")}>{client.is_completed ? "Reabrir processo" : "Marcar concluído"}</button>
                    <button className="btn-light" onClick={() => deleteClient(client)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {editingClient && (
        <div className="modal-backdrop" onClick={() => setEditingClient(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Editar dados do cliente</h2>
              <button className="btn-light" onClick={() => setEditingClient(null)}>Fechar</button>
            </div>
            <p style={{ color: "var(--muted)" }}>Corrija dados básicos, inclusive CPF, data de nascimento, e-mail e telefone.</p>
            <div className="grid" style={{ marginTop: 16 }}>
              <input placeholder="Nome" value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <input placeholder="CPF" value={editForm.cpf || ""} onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })} />
              <label className="admin-field-label"><span>Data de nascimento</span><input type="date" value={editForm.birth_date || ""} onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })} /></label>
              <label className="admin-field-label"><span>Validade do passaporte</span><input type="date" value={editForm.passport_expiration_date || ""} onChange={(e) => setEditForm({ ...editForm, passport_expiration_date: e.target.value })} /></label>
              <label className="admin-field-label"><span>Validade do visto</span><input type="date" disabled={!canFillVisaExpiration(editForm)} value={editForm.visa_expiration_date || ""} onChange={(e) => setEditForm({ ...editForm, visa_expiration_date: e.target.value })} /></label>
              {!canFillVisaExpiration(editForm) && <small className="wide" style={{ color: "#64748b" }}>A validade do visto fica disponível somente após marcar Visto aprovado e Visto/passaporte devolvido.</small>}
              <input placeholder="Celular" value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              <input placeholder="E-mail" type="email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              <label className="admin-field-label"><span>Tipo de processo</span><select value={editForm.tipo_processo || "Primeiro visto"} onChange={(e) => setEditForm({ ...editForm, tipo_processo: e.target.value })}><option value="Primeiro visto">Primeiro visto</option><option value="Renovação">Renovação</option><option value="Passaporte">Passaporte</option><option value="Canadá">Canadá</option><option value="Outro">Outro</option></select></label>
              <label className="admin-field-label"><span>Grupo de processo</span><select value={editForm.group_process_id || ""} onChange={(e) => setEditForm({ ...editForm, group_process_id: e.target.value })}><option value="">Sem grupo</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.nome}</option>)}</select></label>
              <label className="admin-checkbox"><input type="checkbox" checked={!!editForm.grupo_familiar_master} onChange={(e) => setEditForm({ ...editForm, grupo_familiar_master: e.target.checked })} /> Contato principal do grupo familiar</label>
              <label className="admin-checkbox"><input type="checkbox" checked={editForm.sincronizar_com_grupo !== false} onChange={(e) => setEditForm({ ...editForm, sincronizar_com_grupo: e.target.checked })} /> Sincronizar este membro com o grupo</label>
              <button type="button" className="btn-light" onClick={createProcessGroup}>+ Criar grupo de processo</button>
              <label className="admin-checkbox"><input type="checkbox" checked={!!editForm.no_form_required} onChange={(e) => setEditForm({ ...editForm, no_form_required: e.target.checked })} /> Cadastro de controle — não enviar formulário</label>
              <label className="admin-checkbox"><input type="checkbox" checked={!!editForm.is_renewal} onChange={(e) => setEditForm({ ...editForm, is_renewal: e.target.checked })} /> Processo de renovação sem entrevista</label>
              {editForm.is_renewal && <input className="wide" placeholder="Rastreio Sedex enviado pelo cliente para a Resumindo" value={editForm.client_sedex_tracking || ""} onChange={(e) => setEditForm({ ...editForm, client_sedex_tracking: e.target.value })} />}
              <textarea className="wide" placeholder="Observações gerais para relatórios" value={editForm.observacoes_gerais || ""} onChange={(e) => setEditForm({ ...editForm, observacoes_gerais: e.target.value })} />
              <textarea className="wide" placeholder="Observações internas" value={editForm.notes || ""} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
            <button className="btn-primary" onClick={saveClientDetails} style={{ marginTop: 14 }}>Salvar alterações</button>
          </div>
        </div>
      )}





      {reportOpen && (
        <div className="modal-backdrop" onClick={() => setReportOpen(false)}>
          <div className="modal-card report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1180 }}>
            <button className="popup-close" onClick={() => setReportOpen(false)}>×</button>
            <h2 style={{ marginTop: 0 }}>Relatório geral</h2>
            <p style={{ color: "var(--muted)" }}>Relatório operacional baseado nos clientes atualmente exibidos pelos filtros e pela aba selecionada.</p>
            <div className="report-kpis">
              <div><strong>{reportKpis().total}</strong><span>Total</span></div>
              <div><strong>{reportKpis().andamento}</strong><span>Em andamento</span></div>
              <div><strong>{reportKpis().concluidos}</strong><span>Concluídos</span></div>
              <div><strong>{reportKpis().aprovados}</strong><span>Aprovados</span></div>
              <div><strong>{reportKpis().negados}</strong><span>Negados</span></div>
            </div>
            <button className="btn-primary" onClick={exportReportCsv} style={{ margin: "12px 0" }}>Exportar relatório CSV/Excel</button>
            <div style={{ overflowX: "auto", maxHeight: "65vh" }}>
              <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ background: "#f1f5f9" }}><th align="left">Nome</th><th align="left">Grupo</th><th align="left">Tipo</th><th align="left">Etapa</th><th align="left">Etapa</th><th align="left">Início</th><th align="left">CASV</th><th align="left">Entrevista</th><th align="left">Progresso</th><th align="left">Dias</th></tr></thead>
                <tbody>
                  {reportRows().map((row, index) => (
                    <tr key={`${row.cpf}-${index}`} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td>{row.nome}</td><td>{row.grupo || "-"}</td><td>{row.tipo}</td><td>{row.status}</td><td>{row.etapa}</td><td>{row.inicio || "-"}</td><td>{row.casv || "-"}</td><td>{row.entrevista || "-"}</td><td>{row.progresso}</td><td>{row.dias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {alertsOpen && (
        <div className="modal-backdrop" onClick={() => setAlertsOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setAlertsOpen(false)}>×</button>
            <h2 style={{ marginTop: 0 }}>Alertas do dia</h2>
            {buildGlobalAlerts().length === 0 && <p style={{ color: "var(--muted)" }}>Nenhum alerta no momento.</p>}
            {buildGlobalAlerts().map((alert, index) => (
              <div key={alert.key || index} style={{ borderTop: "1px solid #e5e7eb", padding: "12px 0", display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <b style={{ color: "var(--navy)" }}>{alert.label}</b><br />
                  <span>{alert.text}</span>
                </div>
                <button className="btn-light" onClick={() => dismissAlert(alert.key)}>Dar baixa</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {logClient && (
        <div className="modal-backdrop" onClick={() => setLogClient(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Log de atividade</h2>
              <button className="btn-light" onClick={() => setLogClient(null)}>Fechar</button>
            </div>

            <p style={{ color: "var(--muted)" }}>{logClient.name}</p>

            {logLoading && <p>Carregando log...</p>}

            {!logLoading && logs.length === 0 && (
              <p style={{ color: "var(--muted)" }}>Nenhuma atividade registrada.</p>
            )}

            {!logLoading && logs.map((log) => (
              <div key={log.id} style={{ borderTop: "1px solid #e5e7eb", padding: "12px 0" }}>
                <b style={{ color: "var(--navy)" }}>{actionLabel(log.action)}</b><br />
                <small>{new Date(log.created_at).toLocaleString("pt-BR")}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}


