function firstName(name = "") {
  return String(name).trim().split(/\s+/)[0] || "";
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const CONTACTS = {
  whatsapp: "https://wa.me/5511981210932",
  whatsappLabel: "WhatsApp: (11) 98121-0932",
  instagram: "https://www.instagram.com/resumindoviagens",
  instagramLabel: "Instagram: @resumindoviagens",
  email: "mailto:contato@resumindoviagens.com.br",
  emailLabel: "contato@resumindoviagens.com.br"
};

export const EMAIL_TEMPLATES = [
  { id: "proposta", label: "01 - Proposta / apresentação" },
  { id: "contratacao", label: "02 - Serviço fechado / próximos passos" },
  { id: "formulario", label: "03 - Enviar link do formulário" },
  { id: "formulario_pendente", label: "04 - Lembrete de formulário pendente" },
  { id: "taxa", label: "05 - Enviar taxa / boleto" },
  { id: "taxa_paga", label: "06 - Taxa paga / escolher datas" },
  { id: "agendamento", label: "07 - Agendamento confirmado" },
  { id: "entrega_passaporte", label: "08 - Oferta entrega do passaporte" },
  { id: "instrucoes", label: "09 - Instruções completas" },
  { id: "pre_entrevista", label: "10 - Preparação para videochamada" },
  { id: "boa_sorte", label: "11 - Boa sorte na semana" },
  { id: "aprovado", label: "12 - Visto aprovado" },
  { id: "negado", label: "13 - Visto não aprovado" },
  { id: "rastreio", label: "14 - Enviar rastreio" },
  { id: "passaporte_recebido", label: "15 - Passaporte recebido / encerramento" },
  { id: "pos_venda", label: "16 - Pós-venda / próximos serviços" }
];

function paragraph(content) {
  return `<p style="margin:0 0 14px;">${content}</p>`;
}

function cta(label, url) {
  if (!url) return "";
  return `
    <p style="margin:22px 0;text-align:left;">
      <a href="${escapeHtml(url)}" style="background:#1f2a60;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:700;">${escapeHtml(label)}</a>
    </p>`;
}

function plainLinkBlock(label, url) {
  if (!url) return "";
  const safeUrl = escapeHtml(url);
  return `
    <p style="margin:16px 0 14px;">
      <strong>${escapeHtml(label)}</strong><br />
      <a href="${safeUrl}" style="color:#1f2a60;word-break:break-all;">${safeUrl}</a>
    </p>`;
}

function contactsBlock() {
  return `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
      <p style="margin:0 0 8px;">Se tiver qualquer dúvida, entre em contato com a Resumindo Viagens:</p>
      <p style="margin:0 0 6px;"><a href="${CONTACTS.email}" style="color:#1f2a60;text-decoration:underline;">${CONTACTS.emailLabel}</a></p>
      <p style="margin:0 0 6px;"><a href="${CONTACTS.whatsapp}" style="color:#1f2a60;text-decoration:underline;">${CONTACTS.whatsappLabel}</a></p>
      <p style="margin:0;"><a href="${CONTACTS.instagram}" style="color:#1f2a60;text-decoration:underline;">${CONTACTS.instagramLabel}</a></p>
    </div>`;
}

function layout({ heading, greetingName, body, ctaLabel, ctaUrl, extraLinks = "" }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.55;max-width:680px;margin:0 auto;background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-radius:14px;">
    <div style="margin-bottom:22px;">
      <div style="font-size:22px;font-weight:700;color:#1f2a60;margin-bottom:4px;">Resumindo Viagens</div>
      <div style="font-size:16px;color:#4b5563;">${escapeHtml(heading)}</div>
    </div>
    <p style="margin:0 0 4px;">Olá,</p>
    <p style="margin:0 0 18px;font-size:18px;font-weight:700;color:#1f2a60;">${escapeHtml(greetingName)}</p>
    ${body}
    ${cta(ctaLabel, ctaUrl)}
    ${extraLinks}
    ${contactsBlock()}
  </div>`;
}

function videoText(url, fallback = "[INSERIR LINK DO VÍDEO]") {
  return url ? escapeHtml(url) : fallback;
}

export function getEmailTemplate(templateId, client, options = {}) {
  const nome = escapeHtml(firstName(client.name));
  const nomeCompleto = client.name || "";
  const formLink = options.formLink || "";
  const videoProposta = options.videoProposta || process.env.NEXT_PUBLIC_VIDEO_PROPOSTA || "";
  const videoFormulario = options.videoFormulario || process.env.NEXT_PUBLIC_VIDEO_FORMULARIO || "";
  const videoEntrevista = options.videoEntrevista || process.env.NEXT_PUBLIC_VIDEO_ENTREVISTA || "";
  const videoPosVenda = options.videoPosVenda || process.env.NEXT_PUBLIC_VIDEO_POS_VENDA || "";
  const rastreio = options.rastreio || client.tracking_code || "[INSERIR CÓDIGO DE RASTREIO]";
  const correiosUrl = process.env.NEXT_PUBLIC_CORREIOS_RASTREIO_URL || "https://rastreamento.correios.com.br/app/index.php";

  const templates = {
    proposta: {
      subject: "01 - Assessoria para visto americano - Resumindo Viagens",
      html: layout({
        heading: "Assessoria para solicitação de visto americano",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Conforme conversamos, a Resumindo Viagens pode auxiliar no processo de solicitação do visto americano com análise prévia, organização das informações, preenchimento do formulário DS-160, orientação para pagamento da taxa consular, agendamento e preparação para o comparecimento.`)}
          ${paragraph(`Nosso trabalho não é apenas preencher um formulário. A assessoria existe para conduzir o processo com cuidado, estratégia e atenção aos detalhes, organizando as informações para que tudo seja apresentado da forma mais clara e coerente possível.`)}
          ${paragraph(`É importante reforçar que a aprovação do visto é sempre uma decisão soberana do consulado americano. A assessoria não garante resultado, mas trabalha para preparar o processo com responsabilidade e reduzir riscos evitáveis.`)}
          ${paragraph(`Caso queira assistir a explicação em vídeo, acesse: <a href="${videoText(videoProposta)}" style="color:#1f2a60;text-decoration:underline;">${videoText(videoProposta)}</a>`)}
          ${paragraph(`Se desejar seguir com a contratação, estou à disposição para orientar os próximos passos.`)}`,
        ctaLabel: "Falar pelo WhatsApp",
        ctaUrl: CONTACTS.whatsapp
      })
    },
    contratacao: {
      subject: "02 - Próximos passos do seu processo de visto americano",
      html: layout({
        heading: "Serviço fechado / próximos passos",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Obrigado pela confiança na Resumindo Viagens. A partir de agora, iniciaremos a organização do seu processo de solicitação de visto americano.`)}
          ${paragraph(`Para começarmos corretamente, preciso receber as cópias dos documentos pessoais solicitados, especialmente passaporte e documento de identificação. Após a conferência inicial, será enviado o link individual para preenchimento das informações necessárias.`)}
          ${paragraph(`O preenchimento deve ser feito com calma e atenção, pois essas informações serão analisadas, traduzidas para o inglês e utilizadas como base para o formulário oficial do consulado americano.`)}
          ${paragraph(`Caso existam outros membros da família no mesmo processo, cada solicitante terá seu próprio link individual.`)}`
      })
    },
    formulario: {
      subject: "03 - Formulário para solicitação de visto - Resumindo Viagens",
      html: layout({
        heading: "Formulário para solicitação de visto",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Seu formulário da Resumindo Viagens já está pronto para preenchimento.`)}
          ${paragraph(`Este não é o formulário do consulado. Suas informações serão analisadas, traduzidas para inglês e inseridas no formulário oficial do consulado.`)}
          ${paragraph(`Este é um link único e exclusivo. Para sua segurança, o acesso será validado com CPF e data de nascimento.`)}
          ${paragraph(`Você pode interromper o preenchimento a qualquer momento, clicar em Salvar e continuar depois, retornando posteriormente pelo mesmo link.`)}
          ${paragraph(`Ao finalizar, clique em Enviar definitivamente quando estiver com tudo completo ou, ao menos, com todas as informações que conseguiu reunir. Após esse envio, o preenchimento ficará bloqueado, mas será possível gerar um PDF das respostas.`)}`,
        ctaLabel: "Acessar meu formulário",
        ctaUrl: formLink,
        extraLinks: `${plainLinkBlock("Copiar o link aqui:", formLink)}${paragraph(`Caso outros membros da família também estejam preenchendo formulário, cada pessoa deverá acessar o próprio link individual.`)}`
      })
    },
    formulario_pendente: {
      subject: "04 - Lembrete de preenchimento do formulário de visto",
      html: layout({
        heading: "Lembrete de formulário pendente",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Passando apenas para lembrar que o preenchimento do formulário ainda está pendente.`)}
          ${paragraph(`Quanto antes as informações forem enviadas, mais rápido consigo analisar o conteúdo, esclarecer eventuais dúvidas e avançar para a etapa oficial do DS-160.`)}
          ${paragraph(`Recomendo preencher com calma, conferindo documentos, evitando abreviações e salvando o progresso sempre que necessário.`)}`,
        ctaLabel: "Acessar meu formulário",
        ctaUrl: formLink,
        extraLinks: `${plainLinkBlock("Copiar o link aqui:", formLink)}`
      })
    },
    taxa: {
      subject: "05 - Taxa consular do visto americano",
      html: layout({
        heading: "Envio da taxa consular / boleto",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`O formulário DS-160 foi concluído e agora é necessário realizar o pagamento da taxa consular para que possamos avançar para a etapa de agendamento.`)}
          ${paragraph(`Estou encaminhando as informações de pagamento da taxa. Após a compensação, será possível consultar as datas disponíveis e prosseguir com o agendamento.`)}
          ${paragraph(`Assim que efetuar o pagamento, por favor me envie o comprovante para acompanhamento.`)}
          ${paragraph(`A compensação da taxa pode não ser imediata. Assim que estiver liberada no sistema, seguimos para a escolha das datas.`)}`
      })
    },
    taxa_paga: {
      subject: "06 - Taxa consular compensada - escolha das datas",
      html: layout({
        heading: "Taxa paga / escolher datas",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`A taxa consular já foi paga/compensada e agora podemos avançar para a escolha das datas disponíveis.`)}
          ${paragraph(`Vou verificar as opções de agendamento conforme a cidade escolhida, disponibilidade do sistema e formato do atendimento.`)}
          ${paragraph(`Assim que você escolher a melhor opção entre as datas disponíveis, realizarei o agendamento e enviarei a confirmação com as orientações correspondentes.`)}`
      })
    },
    agendamento: {
      subject: "07 - Agendamento do visto americano confirmado",
      html: layout({
        heading: "Agendamento confirmado",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Seu agendamento foi realizado com sucesso.`)}
          ${paragraph(`Na próxima etapa, serão encaminhados os documentos gerados pelo sistema da embaixada, especialmente Confirmation, Application e Agendamento.`)}
          ${paragraph(`Guarde esses documentos com atenção. O Confirmation e o Agendamento serão necessários no comparecimento.`)}
          ${paragraph(`Também enviarei as instruções completas para o dia do CASV e/ou da entrevista consular.`)}`
      })
    },
    entrega_passaporte: {
      subject: "08 - Entrega do passaporte após o visto americano",
      html: layout({
        heading: "Oferta de entrega do passaporte",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Após a entrevista, caso o visto seja aprovado, o passaporte permanece com o consulado para emissão do visto e depois é disponibilizado conforme a modalidade escolhida.`)}
          ${paragraph(`Existe a possibilidade de contratar a entrega do passaporte na residência, o que costuma ser mais prático para a maioria dos clientes.`)}
          ${paragraph(`Se desejar contratar essa modalidade, me avise para que eu possa orientar e realizar os próximos passos.`)}`,
        ctaLabel: "Solicitar orientação sobre entrega",
        ctaUrl: CONTACTS.whatsapp
      })
    },
    instrucoes: {
      subject: "09 - Instruções para CASV e entrevista do visto americano",
      html: layout({
        heading: "Instruções completas do agendamento",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Estou encaminhando as orientações gerais sobre documentos, CASV, consulado/embaixada, entrevista e cuidados no dia do comparecimento.`)}
          ${paragraph(`Leia tudo com atenção. O documento Confirmation deve estar em mãos junto ao passaporte durante o comparecimento. O documento de Agendamento também deve ser levado para conferência de data, horário e endereço.`)}
          ${paragraph(`Para processos em duas etapas, atenção especial: em alguns agendamentos o documento apresenta primeiro as informações do consulado/embaixada e depois as informações do CASV. Verifique cuidadosamente qual é o compromisso do primeiro dia.`)}
          ${paragraph(`No CASV, normalmente são necessários apenas documentos essenciais. Na entrevista, além dos essenciais, leve documentos comprobatórios relacionados a renda, profissão, estudo, vínculo familiar e demais pontos relevantes do seu caso.`)}
          ${paragraph(`Vídeo explicativo: <a href="${videoText(videoEntrevista)}" style="color:#1f2a60;text-decoration:underline;">${videoText(videoEntrevista)}</a>`)}
          ${paragraph(`Em caso de dúvida, me avise antes da data do comparecimento para alinharmos tudo com tranquilidade.`)}`
      })
    },
    pre_entrevista: {
      subject: "10 - Preparação para sua videochamada do visto americano",
      html: layout({
        heading: "Preparação para videochamada",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Como sua entrevista está se aproximando, este é o momento de revisarmos os pontos principais do seu processo e alinharmos eventuais dúvidas.`)}
          ${paragraph(`Antes da videochamada, recomendo assistir ao vídeo de preparação e separar os documentos que pretende levar.`)}
          ${paragraph(`Vídeo de preparação: <a href="${videoText(videoEntrevista)}" style="color:#1f2a60;text-decoration:underline;">${videoText(videoEntrevista)}</a>`)}
          ${paragraph(`Na videochamada, vamos focar nos pontos específicos do seu perfil e nas dúvidas que permanecerem.`)}`
      })
    },
    boa_sorte: {
      subject: "11 - Estamos na torcida pelo seu visto americano",
      html: layout({
        heading: "Boa sorte na semana do agendamento",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Passando para desejar tranquilidade no seu comparecimento ao CASV e/ou consulado.`)}
          ${paragraph(`Lembre-se de conferir passaporte, Confirmation, Agendamento e, no dia da entrevista, os documentos comprobatórios que conversamos.`)}
          ${paragraph(`Responda apenas o que for perguntado, com clareza e objetividade.`)}
          ${paragraph(`Estou na torcida para que tudo corra bem.`)}`
      })
    },
    aprovado: {
      subject: "12 - Parabéns pela aprovação do visto americano",
      html: layout({
        heading: "Visto aprovado",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Que ótima notícia! Fico muito feliz pela aprovação do seu visto americano.`)}
          ${paragraph(`Obrigado pela confiança em nosso trabalho durante esse processo.`)}
          ${paragraph(`Agora é necessário aguardar a liberação e entrega/retirada do passaporte conforme a modalidade escolhida.`)}
          ${paragraph(`Assim que houver atualização de rastreio ou retirada, seguimos acompanhando os próximos passos.`)}`
      })
    },
    negado: {
      subject: "13 - Sobre o resultado da entrevista do visto americano",
      html: layout({
        heading: "Visto não aprovado",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Sinto muito pelo resultado da entrevista. Sei que é uma situação frustrante, especialmente depois de todo o cuidado com a preparação.`)}
          ${paragraph(`A decisão final é sempre do consulado americano e, em regra, não há recurso simples dentro do próprio processo.`)}
          ${paragraph(`Se desejar, podemos conversar com calma sobre o que foi perguntado, como foi a entrevista e se faz sentido pensar em uma nova tentativa no futuro, em momento mais adequado.`)}`
      })
    },
    rastreio: {
      subject: "14 - Rastreio do seu passaporte",
      html: layout({
        heading: "Enviar rastreio",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Segue o código de rastreio referente ao envio do passaporte:`)}
          <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1f2a60;">${escapeHtml(rastreio)}</p>
          ${paragraph(`Você pode acompanhar a entrega pelo site dos Correios. Assim que receber o passaporte, por favor me avise.`)}`,
        ctaLabel: "Acompanhar nos Correios",
        ctaUrl: correiosUrl
      })
    },
    passaporte_recebido: {
      subject: "15 - Passaporte recebido - obrigado pela confiança",
      html: layout({
        heading: "Passaporte recebido / encerramento",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Fico feliz em saber que o passaporte chegou corretamente.`)}
          ${paragraph(`Obrigado pela confiança na Resumindo Viagens durante esse processo. É sempre uma satisfação participar de uma etapa tão importante dos planos de viagem dos nossos clientes.`)}
          ${paragraph(`Quando precisar de apoio com a próxima viagem, conte conosco.`)}`
      })
    },
    pos_venda: {
      subject: "16 - Próximos serviços para sua viagem - Resumindo Viagens",
      html: layout({
        heading: "Pós-venda / próximos serviços",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Com o visto aprovado/emitido, você também pode contar com a Resumindo Viagens para a próxima etapa: planejamento da viagem.`)}
          ${paragraph(`Podemos auxiliar com passagens, seguro viagem, locação de carro, ingressos e demais itens da sua viagem.`)}
          ${paragraph(`Além disso, quem possui visto americano válido pode, em muitos casos, solicitar o visto eletrônico canadense, que costuma ser um processo mais simples e sem entrevista presencial.`)}
          ${paragraph(`Vídeo sobre próximos serviços: <a href="${videoText(videoPosVenda)}" style="color:#1f2a60;text-decoration:underline;">${videoText(videoPosVenda)}</a>`)}
          ${paragraph(`Quando quiser seguir com qualquer uma dessas próximas etapas, será um prazer ajudar.`)}`,
        ctaLabel: "Falar com a Resumindo Viagens",
        ctaUrl: CONTACTS.whatsapp
      })
    }
  };

  const selected = templates[templateId];
  if (!selected) throw new Error("Modelo de email não encontrado.");

  const text = selected.html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
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
