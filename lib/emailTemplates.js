function firstName(name = "") {
  return String(name).trim().split(/\s+/)[0] || "";
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const CONTACTS = {
  whatsapp: process.env.NEXT_PUBLIC_RV_WHATSAPP || "https://wa.me/5511981210932",
  instagram: process.env.NEXT_PUBLIC_RV_INSTAGRAM || "https://www.instagram.com/resumindoviagens",
  email: process.env.NEXT_PUBLIC_RV_EMAIL_LINK || "mailto:contato@resumindoviagens.com.br"
};

function goldenTrio() {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:22px 0 6px;">
      <tr>
        <td align="center" style="padding:6px;">
          <a href="${CONTACTS.whatsapp}" style="background:#0f2a44;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:10px;display:inline-block;font-weight:700;min-width:120px;">WhatsApp</a>
        </td>
        <td align="center" style="padding:6px;">
          <a href="${CONTACTS.instagram}" style="background:#f3f4f6;color:#0f2a44;text-decoration:none;padding:12px 16px;border-radius:10px;display:inline-block;font-weight:700;min-width:120px;">Instagram</a>
        </td>
        <td align="center" style="padding:6px;">
          <a href="${CONTACTS.email}" style="background:#f3f4f6;color:#0f2a44;text-decoration:none;padding:12px 16px;border-radius:10px;display:inline-block;font-weight:700;min-width:120px;">Email</a>
        </td>
      </tr>
    </table>`;
}

function layout({ title, body, ctaLabel, ctaUrl, logoUrl }) {
  const logo = logoUrl || process.env.NEXT_PUBLIC_LOGO_URL || "";
  const cta = ctaLabel && ctaUrl ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0 8px;">
      <tr>
        <td align="center">
          <a href="${ctaUrl}" style="background:#252A55;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;display:inline-block;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(37,42,85,.18);">${ctaLabel}</a>
        </td>
      </tr>
    </table>` : "";

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f8fb;margin:0;padding:24px 0;color:#1f2937;line-height:1.6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:0 14px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:720px;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(15,42,68,.08);">
            <tr>
              <td style="background:#252A55;padding:22px 26px;text-align:center;">
                ${logo ? `<img src="${logo}" alt="Resumindo Viagens" style="max-width:190px;height:auto;display:inline-block;background:#ffffff;border-radius:12px;padding:8px;" />` : `<div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:.3px;">Resumindo Viagens</div>`}
              </td>
            </tr>
            <tr>
              <td style="padding:30px 30px 18px;">
                <h2 style="color:#252A55;margin:0 0 18px;font-size:26px;line-height:1.25;">${title}</h2>
                <div style="font-size:16px;color:#1f2937;">${body}</div>
                ${cta}
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 28px;">
                <div style="border-top:1px solid #e5e7eb;margin:10px 0 20px;"></div>
                <p style="margin:0 0 4px;font-size:16px;color:#252A55;"><strong>Resumindo Viagens</strong></p>
                <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Assessoria para solicitação de visto americano</p>
                ${goldenTrio()}
                <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;text-align:center;">Você recebeu este email porque iniciou atendimento com a Resumindo Viagens.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

function videoBlock(label, url) {
  if (!url) return "";
  const safe = escapeHtml(url);
  return `
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:18px 0;">
      <p style="margin:0 0 8px;"><strong>${label}</strong></p>
      <p style="margin:0;color:#4b5563;">Clique no botão abaixo para assistir ao vídeo explicativo.</p>
      <p style="margin:14px 0 0;"><a href="${safe}" style="background:#0f2a44;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:10px;display:inline-block;font-weight:700;">Assistir vídeo</a></p>
    </div>`;
}

export const EMAIL_TEMPLATES = [
  { id: "proposta", label: "Proposta / apresentação" },
  { id: "contratacao", label: "Serviço fechado / próximos passos" },
  { id: "formulario", label: "Enviar link do formulário" },
  { id: "formulario_pendente", label: "Lembrete de formulário pendente" },
  { id: "taxa", label: "Enviar taxa / boleto" },
  { id: "taxa_paga", label: "Taxa paga / escolher datas" },
  { id: "agendamento", label: "Agendamento confirmado" },
  { id: "entrega_passaporte", label: "Oferta entrega do passaporte" },
  { id: "instrucoes", label: "Instruções completas" },
  { id: "pre_entrevista", label: "Preparação para videochamada" },
  { id: "boa_sorte", label: "Boa sorte na semana" },
  { id: "aprovado", label: "Visto aprovado" },
  { id: "negado", label: "Visto não aprovado" },
  { id: "rastreio", label: "Enviar rastreio" },
  { id: "passaporte_recebido", label: "Passaporte recebido / encerramento" },
  { id: "pos_venda", label: "Pós-venda / próximos serviços" }
];

export function getEmailTemplate(templateId, client, options = {}) {
  const nome = escapeHtml(firstName(client.name));
  const nomeCompleto = escapeHtml(client.name || "");
  const formLink = options.formLink || "";
  const videoProposta = options.videoProposta || process.env.NEXT_PUBLIC_VIDEO_PROPOSTA || "";
  const videoFormulario = options.videoFormulario || process.env.NEXT_PUBLIC_VIDEO_FORMULARIO || "";
  const videoEntrevista = options.videoEntrevista || process.env.NEXT_PUBLIC_VIDEO_ENTREVISTA || "";
  const videoPosVenda = options.videoPosVenda || process.env.NEXT_PUBLIC_VIDEO_POS_VENDA || "";
  const emailLogoUrl = options.logoUrl || (options.siteUrl ? `${options.siteUrl}/logo.png` : (process.env.NEXT_PUBLIC_LOGO_URL || ""));
  const L = (args) => layout({ ...args, logoUrl: emailLogoUrl });
  const rastreio = options.rastreio || client.tracking_code || "";
  const correiosUrl = process.env.NEXT_PUBLIC_CORREIOS_RASTREIO_URL || "https://rastreamento.correios.com.br/app/index.php";

  const templates = {
    proposta: {
      subject: "Assessoria para visto americano - Resumindo Viagens",
      html: L({
        title: "Assessoria para visto americano",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Conforme conversamos, a Resumindo Viagens pode auxiliar no processo de solicitação do visto americano com análise prévia, organização das informações, preenchimento do formulário DS-160, orientação para pagamento da taxa consular, agendamento e preparação para o comparecimento.</p>
          <p>Nosso trabalho não é apenas preencher um formulário: é conduzir o processo com cuidado, estratégia e atenção aos detalhes para reduzir riscos e preparar o solicitante da melhor forma possível.</p>
          <p>É importante reforçar que a aprovação do visto é sempre uma decisão soberana do consulado americano. A assessoria atua para organizar corretamente o processo e orientar o cliente com responsabilidade.</p>
          ${videoBlock("Vídeo explicativo sobre o serviço", videoProposta)}
          <p>Se desejar seguir com a contratação, estou à disposição para orientar os próximos passos.</p>`,
        ctaLabel: "Falar pelo WhatsApp",
        ctaUrl: CONTACTS.whatsapp
      })
    },
    contratacao: {
      subject: "Próximos passos do seu processo de visto americano",
      html: L({
        title: "Próximos passos do atendimento",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Obrigado pela confiança na Resumindo Viagens. A partir de agora, iniciaremos a organização do seu processo de solicitação de visto americano.</p>
          <p>Para começarmos corretamente, preciso das cópias dos documentos pessoais solicitados, especialmente passaporte e documento de identificação. Após isso, será enviado o link individual para preenchimento das informações necessárias.</p>
          <p>O preenchimento deve ser feito com calma e atenção, pois essas informações serão usadas como base para o formulário oficial da embaixada.</p>
          <p>Qualquer dúvida durante o processo, pode me chamar pelos canais abaixo.</p>`
      })
    },
    formulario: {
      subject: "Seu formulário de visto americano - Resumindo Viagens",
      html: L({
        title: "Seu formulário já está disponível",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Segue o link individual e seguro para preenchimento das informações necessárias para o processo de solicitação do visto americano.</p>
          <p>Preencha com calma e atenção. As informações devem ser completas, sem abreviações e compatíveis com os documentos pessoais e profissionais.</p>
          <p><strong>Importante:</strong> se houver mais de um solicitante na família, cada pessoa deverá preencher seu próprio formulário individual.</p>
          ${videoBlock("Vídeo com instruções de preenchimento", videoFormulario)}
          <p>Após o envio, farei a análise das informações e darei sequência ao preenchimento oficial junto ao sistema da embaixada.</p>`,
        ctaLabel: "Acessar formulário",
        ctaUrl: formLink
      })
    },
    formulario_pendente: {
      subject: "Lembrete: preenchimento do formulário de visto americano",
      html: L({
        title: "Lembrete de preenchimento",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Passando apenas para lembrar que o preenchimento do formulário ainda está pendente.</p>
          <p>Quanto antes as informações forem enviadas, mais rápido consigo avançar para a etapa oficial do DS-160 e, depois, para pagamento da taxa e agendamento.</p>
          <p>Recomendo preencher com calma, conferindo documentos e evitando abreviações.</p>
          ${videoBlock("Vídeo com instruções de preenchimento", videoFormulario)}`,
        ctaLabel: "Acessar formulário",
        ctaUrl: formLink
      })
    },
    taxa: {
      subject: "Taxa consular do visto americano",
      html: L({
        title: "Orientações para pagamento da taxa consular",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>O formulário DS-160 foi concluído e agora é necessário realizar o pagamento da taxa consular para permitir o agendamento.</p>
          <p>Estou encaminhando as informações de pagamento da taxa. Após a compensação, será possível verificar as datas disponíveis e prosseguir com o agendamento.</p>
          <p>Assim que efetuar o pagamento, por favor me envie o comprovante para acompanhamento.</p>`
      })
    },
    taxa_paga: {
      subject: "Taxa consular compensada - escolha das datas",
      html: L({
        title: "Vamos escolher as datas do agendamento",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>A taxa consular já foi paga/compensada e agora podemos avançar para a escolha das datas disponíveis.</p>
          <p>Vou verificar as opções de agendamento e encaminhar as melhores alternativas para sua escolha, considerando cidade, disponibilidade e formato do atendimento.</p>
          <p>Assim que você escolher, realizarei o agendamento e enviarei a confirmação com as instruções correspondentes.</p>`
      })
    },
    agendamento: {
      subject: "Agendamento do visto americano confirmado",
      html: L({
        title: "Agendamento confirmado",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Seu agendamento foi realizado com sucesso.</p>
          <p>Na próxima etapa, enviarei os documentos gerados pelo sistema da embaixada, especialmente <strong>Confirmation</strong>, <strong>Application</strong> e <strong>Agendamento</strong>.</p>
          <p>Guarde esses documentos com atenção, pois o Confirmation e o Agendamento serão necessários no comparecimento.</p>
          <p>Também enviarei as instruções completas para o dia do CASV e/ou entrevista consular.</p>`
      })
    },
    entrega_passaporte: {
      subject: "Entrega do passaporte após o visto americano",
      html: L({
        title: "Entrega do passaporte",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Após a entrevista, caso o visto seja aprovado, o passaporte permanece com o consulado para emissão do visto e depois é disponibilizado conforme a modalidade escolhida.</p>
          <p>Existe a possibilidade de contratar a entrega do passaporte na residência, o que costuma ser mais prático para a maioria dos clientes.</p>
          <p>Se desejar contratar essa modalidade, me avise para que eu possa orientar e realizar os próximos passos.</p>`
      })
    },
    instrucoes: {
      subject: "Instruções para o CASV e entrevista do visto americano",
      html: L({
        title: "Instruções importantes para seu agendamento",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Estou encaminhando as orientações gerais sobre documentos, CASV, consulado/embaixada, entrevista e cuidados no dia do comparecimento.</p>
          <p>Leia tudo com atenção. O documento <strong>Confirmation</strong> deve estar em mãos junto ao passaporte durante o comparecimento. O documento de <strong>Agendamento</strong> também deve ser levado para conferência de data, horário e endereço.</p>
          <p>Para processos em duas etapas, atenção especial: em alguns agendamentos o documento apresenta primeiro as informações do consulado/embaixada e depois as informações do CASV. Verifique cuidadosamente qual é o compromisso do primeiro dia.</p>
          <p>No CASV, normalmente são necessários apenas documentos essenciais. Na entrevista, além dos essenciais, leve documentos comprobatórios relacionados a renda, profissão, estudo, vínculo familiar e demais pontos relevantes do seu caso.</p>
          ${videoBlock("Vídeo com orientações para CASV e entrevista", videoEntrevista)}
          <p>Em caso de dúvida, me avise antes da data do comparecimento para alinharmos tudo com tranquilidade.</p>`
      })
    },
    pre_entrevista: {
      subject: "Preparação para sua entrevista do visto americano",
      html: L({
        title: "Preparação para a entrevista",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Como sua entrevista está se aproximando, este é o momento de revisarmos os pontos principais do seu processo e alinharmos eventuais dúvidas.</p>
          <p>Antes da videochamada, recomendo assistir ao vídeo de preparação e separar os documentos que pretende levar.</p>
          ${videoBlock("Vídeo de preparação para entrevista", videoEntrevista)}
          <p>Na videochamada, vamos focar nos pontos específicos do seu perfil e nas dúvidas que permanecerem.</p>`
      })
    },
    boa_sorte: {
      subject: "Estamos na torcida pelo seu visto americano",
      html: L({
        title: "Boa sorte no seu agendamento",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Passando para desejar tranquilidade no seu comparecimento ao CASV e/ou consulado.</p>
          <p>Lembre-se de conferir passaporte, Confirmation, Agendamento e, no dia da entrevista, os documentos comprobatórios que conversamos.</p>
          <p>Responda apenas o que for perguntado, com clareza e objetividade.</p>
          <p>Estou na torcida para que tudo corra bem.</p>`
      })
    },
    aprovado: {
      subject: "Parabéns pela aprovação do visto americano",
      html: L({
        title: "Parabéns pela aprovação!",
        body: `
          <p>Olá, ${nome}. Que ótima notícia!</p>
          <p>Fico muito feliz pela aprovação do seu visto americano. Obrigado pela confiança em nosso trabalho.</p>
          <p>Agora é necessário aguardar a liberação e entrega/retirada do passaporte conforme a modalidade escolhida.</p>
          <p>Assim que houver atualização de rastreio ou retirada, seguimos acompanhando os próximos passos.</p>`
      })
    },
    negado: {
      subject: "Sobre o resultado da entrevista do visto americano",
      html: L({
        title: "Sobre o resultado da entrevista",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Sinto muito pelo resultado da entrevista. Sei que é uma situação frustrante, especialmente depois de todo o cuidado com a preparação.</p>
          <p>A decisão final é sempre do consulado americano e, em regra, não há recurso simples dentro do próprio processo.</p>
          <p>Se desejar, podemos conversar com calma sobre o que foi perguntado, como foi a entrevista e se faz sentido pensar em uma nova tentativa no futuro, em momento mais adequado.</p>`
      })
    },
    rastreio: {
      subject: "Rastreio do seu passaporte",
      html: L({
        title: "Rastreio do passaporte",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Segue o código de rastreio referente ao envio do passaporte:</p>
          <p style="font-size:20px;"><strong>${escapeHtml(rastreio || "[INSERIR CÓDIGO DE RASTREIO]")}</strong></p>
          <p>Você pode acompanhar a entrega pelo site dos Correios. Assim que receber o passaporte, por favor me avise.</p>`,
        ctaLabel: "Acompanhar nos Correios",
        ctaUrl: correiosUrl
      })
    },
    passaporte_recebido: {
      subject: "Passaporte recebido - obrigado pela confiança",
      html: L({
        title: "Obrigado pela confiança",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Fico feliz em saber que o passaporte chegou corretamente.</p>
          <p>Obrigado pela confiança na Resumindo Viagens durante esse processo. É sempre uma satisfação participar de uma etapa tão importante dos planos de viagem dos nossos clientes.</p>
          <p>Quando precisar de apoio com a próxima viagem, conte conosco.</p>`
      })
    },
    pos_venda: {
      subject: "Próximos passos para sua viagem - Resumindo Viagens",
      html: L({
        title: "Agora vamos planejar a viagem?",
        body: `
          <p>Olá, ${nome}. Tudo bem?</p>
          <p>Com o visto aprovado/emitido, você também pode contar com a Resumindo Viagens para a próxima etapa: planejamento da viagem.</p>
          <p>Podemos auxiliar com passagens, seguro viagem, locação de carro, ingressos e demais itens da sua viagem.</p>
          <p>Além disso, quem possui visto americano válido pode, em muitos casos, solicitar o visto eletrônico canadense, que costuma ser um processo mais simples e sem entrevista presencial.</p>
          ${videoBlock("Vídeo com próximos serviços da Resumindo Viagens", videoPosVenda)}
          <p>Quando quiser seguir com qualquer uma dessas próximas etapas, será um prazer ajudar.</p>`,
        ctaLabel: "Falar com a Resumindo Viagens",
        ctaUrl: CONTACTS.whatsapp
      })
    }
  };

  const selected = templates[templateId];
  if (!selected) throw new Error("Modelo de email não encontrado.");

  const text = selected.html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { ...selected, text, toName: nomeCompleto };
}
