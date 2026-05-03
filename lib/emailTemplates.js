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
  { id: "formulario", label: "01 - Envio do formulário" },
  { id: "formulario_pendente", label: "02 - Formulário pendente" },
  { id: "formulario_recebido", label: "03 - Formulário recebido" },
  { id: "taxa_paga", label: "04 - Taxa compensada / próximas datas" },
  { id: "instrucoes", label: "05 - Agendamento confirmado / instruções" },
  { id: "pre_entrevista", label: "06 - Preparação para videochamada" },
  { id: "aprovado", label: "07 - Visto aprovado" },
  { id: "negado", label: "08 - Visto não aprovado" },
  { id: "rastreio", label: "09 - Enviar rastreio" },
  { id: "passaporte_recebido", label: "10 - Passaporte recebido / encerramento" }
];

function paragraph(content) {
  return `<p style="margin:0 0 14px;">${content}</p>`;
}

function cta(label, url) {
  if (!url) return "";
  return `
    <p style="margin:22px 0;text-align:left;">
      <a href="${escapeHtml(url)}" style="background:#1f2a60;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;display:inline-block;font-weight:700;">${escapeHtml(label)}</a>
    </p>`;
}

function plainLinkBlock(label, url) {
  if (!url) return "";
  return `
    <p style="margin:14px 0 6px;color:#4b5563;"><strong>${escapeHtml(label)}</strong></p>
    <p style="margin:0 0 16px;word-break:break-all;"><a href="${escapeHtml(url)}" style="color:#1f2a60;text-decoration:underline;">${escapeHtml(url)}</a></p>`;
}

function contactFooter() {
  return `
    <div style="border-top:1px solid #e5e7eb;margin-top:26px;padding-top:18px;">
      <p style="margin:0 0 8px;color:#374151;">Se precisar de qualquer coisa, conte comigo:</p>
      <p style="margin:0 0 6px;">📧 <a href="${CONTACTS.email}" style="color:#1f2a60;text-decoration:underline;">${CONTACTS.emailLabel}</a></p>
      <p style="margin:0 0 6px;">📱 <a href="${CONTACTS.whatsapp}" style="color:#1f2a60;text-decoration:underline;">${CONTACTS.whatsappLabel}</a></p>
      <p style="margin:0 0 14px;">📸 <a href="${CONTACTS.instagram}" style="color:#1f2a60;text-decoration:underline;">${CONTACTS.instagramLabel}</a></p>
      <p style="margin:18px 0 0;">Atenciosamente,<br /><strong>Resumindo Viagens</strong></p>
    </div>`;
}

function logoUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://visto-seguro.vercel.app");
  return process.env.NEXT_PUBLIC_LOGO_URL || `${site}/logo.png`;
}

function layout({ heading, greetingName, body, ctaLabel, ctaUrl, extraLinks }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.62;max-width:720px;margin:0 auto;background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-radius:14px;">
    <div style="text-align:center;margin-bottom:20px;">
      <img src="${logoUrl()}" alt="Resumindo Viagens" style="max-width:190px;height:auto;display:inline-block;" />
    </div>
    <p style="margin:0 0 4px;color:#1f2a60;font-weight:700;font-size:15px;">Resumindo Viagens</p>
    <h2 style="color:#1f2a60;margin:0 0 20px;font-size:24px;line-height:1.25;">${heading}</h2>
    <p style="margin:0 0 16px;">Olá,</p>
    <p style="margin:0 0 18px;font-size:18px;"><strong>${escapeHtml(greetingName || "")}</strong></p>
    ${body}
    ${cta(ctaLabel, ctaUrl)}
    ${extraLinks || ""}
    ${contactFooter()}
  </div>`;
}

function videoText(url) {
  return escapeHtml(url || "[INSERIR LINK DO VÍDEO]");
}

export function getEmailTemplate(templateId, client, options = {}) {
  const nomeCompleto = client?.name || "";
  const formLink = options.formLink || "[INSERIR LINK DO FORMULÁRIO]";
  const rastreio = options.rastreio || "[INSERIR CÓDIGO DE RASTREIO]";
  const correiosUrl = options.correiosUrl || "https://rastreamento.correios.com.br/app/index.php";
  const videoFormulario = options.videoFormulario || process.env.NEXT_PUBLIC_VIDEO_FORMULARIO || "[INSERIR LINK DO VÍDEO]";
  const videoEntrevista = options.videoEntrevista || process.env.NEXT_PUBLIC_VIDEO_ENTREVISTA || "[INSERIR LINK DO VÍDEO]";

  const templates = {
    formulario: {
      subject: "01 - Acesso ao seu formulário de visto americano",
      html: layout({
        heading: "Acesso ao seu formulário de visto americano",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Seu formulário da Resumindo Viagens já está disponível para preenchimento.`)}
          ${paragraph(`Este não é o formulário do consulado. As informações enviadas por você serão analisadas, organizadas e traduzidas para o inglês antes de serem inseridas no sistema oficial.`)}
          ${paragraph(`<strong>🔐 Segurança</strong><br />O acesso é individual e protegido. Para entrar, será necessário informar CPF e data de nascimento.`)}
          ${paragraph(`<strong>📝 Preenchimento</strong><br />Você pode preencher com calma, salvar e continuar depois pelo mesmo link. Não é necessário finalizar de uma vez.`)}
          ${paragraph(`<strong>🎥 Orientações importantes</strong><br />Na primeira página do formulário você encontrará instruções detalhadas e um vídeo explicativo com todas as orientações para o preenchimento correto.`)}
          ${paragraph(`Recomendo assistir antes de iniciar — isso ajuda a evitar dúvidas e garante que o processo seja feito da melhor forma possível.`)}
          ${paragraph(`Ao concluir, clique em <strong>“Enviar definitivamente”</strong>. Após esse envio, o formulário será bloqueado para edição, mas será possível gerar um PDF com suas respostas.`)}
          ${paragraph(`<strong>👨‍👩‍👧‍👦 Processos em família</strong><br />Cada solicitante possui um link individual. Caso uma única pessoa esteja preenchendo para todos, basta acessar cada link correspondente.`)}`,
        ctaLabel: "Acessar meu formulário",
        ctaUrl: formLink,
        extraLinks: plainLinkBlock("Se preferir, copie e cole o link no navegador:", formLink)
      })
    },
    formulario_pendente: {
      subject: "02 - Lembrete de preenchimento do formulário de visto",
      html: layout({
        heading: "Lembrete de formulário pendente",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Passando apenas para lembrar que o preenchimento do formulário ainda está pendente.`)}
          ${paragraph(`Quanto antes as informações forem enviadas, mais rápido consigo analisar o conteúdo, esclarecer eventuais dúvidas e avançar para a etapa oficial do DS-160.`)}
          ${paragraph(`Recomendo preencher com calma, conferindo documentos, evitando abreviações e salvando o progresso sempre que necessário.`)}`,
        ctaLabel: "Acessar meu formulário",
        ctaUrl: formLink,
        extraLinks: plainLinkBlock("Se preferir, copie e cole o link no navegador:", formLink)
      })
    },
    formulario_recebido: {
      subject: "03 - Recebimento do seu formulário de visto",
      html: layout({
        heading: "Formulário recebido / em análise",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Recebi o seu formulário preenchido e já estou iniciando a análise das informações.`)}
          ${paragraph(`Agora vou organizar os dados, revisar os pontos necessários e realizar o preenchimento do formulário oficial do consulado.`)}
          ${paragraph(`Caso seja necessário complementar alguma informação ou esclarecer algum detalhe, entro em contato com você.`)}
          ${paragraph(`Assim que essa etapa estiver concluída, seguiremos para a emissão da taxa consular e agendamento do processo.`)}`
      })
    },
    taxa_paga: {
      subject: "04 - Taxa consular confirmada — próxima etapa do seu processo",
      html: layout({
        heading: "Taxa consular confirmada — próxima etapa",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`A taxa consular já foi identificada no sistema e agora podemos avançar para a próxima etapa do seu processo.`)}
          ${paragraph(`Vou verificar as datas disponíveis conforme a cidade escolhida e a disponibilidade do sistema.`)}
          ${paragraph(`Em seguida, entro em contato com você por WhatsApp para te apresentar as opções e realizarmos a escolha da melhor data.`)}
          ${paragraph(`Após a sua confirmação, o agendamento será realizado e você receberá as orientações completas para o comparecimento.`)}`
      })
    },
    instrucoes: {
      subject: "05 - Agendamento confirmado — orientações importantes para seu comparecimento",
      html: layout({
        heading: "Agendamento confirmado — orientações importantes",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Seu agendamento foi realizado com sucesso.`)}
          ${paragraph(`Neste momento, estou te encaminhando os documentos do seu processo, que deverão ser utilizados nos dias de comparecimento:`)}
          ${paragraph(`• <strong>Confirmation</strong> — documento principal, deve estar sempre com o passaporte<br />• <strong>Agendamento</strong> — contém datas, horários e endereços<br />• <strong>Application</strong> — apenas para referência, não é necessário levar`)}
          ${paragraph(`<strong>📌 Muito importante</strong><br />Leia atentamente o material de orientações enviado em anexo. Ele contém todas as instruções sobre documentos, comparecimento ao CASV/consulado, entrevista e cuidados importantes para o seu caso.`)}
          ${paragraph(`<strong>🎥 Vídeo explicativo</strong><br />Também preparei um vídeo com orientações detalhadas para te ajudar a entender melhor todo o processo:<br /><a href="${videoText(videoEntrevista)}" style="color:#1f2a60;text-decoration:underline;">${videoText(videoEntrevista)}</a>`)}
          ${paragraph(`Recomendo fortemente assistir ao vídeo antes do comparecimento.`)}
          ${paragraph(`<strong>⚠️ Atenção especial</strong><br />Dependendo da cidade escolhida, o processo pode ocorrer em uma ou duas etapas (CASV + consulado). Verifique com atenção os endereços, datas e a ordem dos compromissos no documento de agendamento.`)}
          ${paragraph(`Caso surja qualquer dúvida, me avise antes da data do comparecimento para alinharmos tudo com tranquilidade.`)}`
      })
    },
    pre_entrevista: {
      subject: "06 - Preparação para sua entrevista — próximos passos",
      html: layout({
        heading: "Preparação para sua entrevista — próximos passos",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Como a sua entrevista está se aproximando, entramos agora na etapa de preparação final.`)}
          ${paragraph(`Este é o momento de revisarmos os principais pontos do seu processo e alinharmos eventuais dúvidas antes do comparecimento.`)}
          ${paragraph(`<strong>🎥 Preparação</strong><br />Recomendo assistir ao vídeo de preparação com atenção e já ir separando os documentos que pretende levar:<br /><a href="${videoText(videoEntrevista)}" style="color:#1f2a60;text-decoration:underline;">${videoText(videoEntrevista)}</a>`)}
          ${paragraph(`<strong>🤝 Videochamada</strong><br />Vou entrar em contato com você por WhatsApp para combinarmos o melhor dia e horário para realizarmos uma videochamada.`)}
          ${paragraph(`Nesse encontro, vamos focar nos pontos específicos do seu perfil e esclarecer quaisquer dúvidas que ainda existirem, garantindo que você vá para a entrevista com segurança e tranquilidade.`)}`
      })
    },
    aprovado: {
      subject: "07 - Parabéns! Seu visto americano foi aprovado",
      html: layout({
        heading: "Parabéns! Seu visto americano foi aprovado",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Que ótima notícia! Fico muito feliz pela aprovação do seu visto americano 😊`)}
          ${paragraph(`Obrigado pela confiança no meu trabalho durante todo esse processo.`)}
          ${paragraph(`Agora é necessário aguardar a emissão do visto e a entrega ou retirada do passaporte, conforme a modalidade escolhida.`)}
          ${paragraph(`Assim que houver atualização de rastreio ou liberação, seguimos acompanhando juntos os próximos passos.`)}
          ${paragraph(`<strong>✈️ Próximos planos</strong><br />Quando começar a organizar sua viagem, posso te auxiliar também com passagens, hospedagem, ingressos e outros serviços para que tudo seja feito com segurança e tranquilidade.`)}`
      })
    },
    negado: {
      subject: "08 - Sobre o resultado da sua entrevista de visto",
      html: layout({
        heading: "Sobre o resultado da sua entrevista de visto",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Sinto muito pelo resultado da sua entrevista.`)}
          ${paragraph(`Sei que é uma situação frustrante, principalmente após todo o cuidado com a preparação.`)}
          ${paragraph(`A decisão final é sempre do consulado americano e, na maioria dos casos, não há possibilidade de recurso dentro do próprio processo.`)}
          ${paragraph(`Se você quiser, podemos conversar com calma sobre como foi a entrevista, quais perguntas foram feitas e avaliar juntos se faz sentido uma nova tentativa no futuro, em um momento mais adequado.`)}
          ${paragraph(`Cada caso pode evoluir com o tempo, e uma nova solicitação bem planejada pode trazer um resultado diferente.`)}`
      })
    },
    rastreio: {
      subject: "09 - Rastreio do seu passaporte — acompanhe a entrega",
      html: layout({
        heading: "Rastreio do seu passaporte",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`O seu passaporte já foi enviado e você pode acompanhar a entrega pelo código de rastreio abaixo:`)}
          <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1f2a60;">📦 ${escapeHtml(rastreio)}</p>
          ${paragraph(`Assim que receber o passaporte, por favor me avise por aqui 👍`)}`,
        ctaLabel: "Acompanhar entrega",
        ctaUrl: correiosUrl
      })
    },
    passaporte_recebido: {
      subject: "10 - Passaporte recebido — conte conosco para os próximos passos",
      html: layout({
        heading: "Passaporte recebido — próximos passos",
        greetingName: nomeCompleto,
        body: `
          ${paragraph(`Fico muito feliz em saber que o seu passaporte foi recebido corretamente 😊`)}
          ${paragraph(`Obrigado pela confiança na Resumindo Viagens durante todo esse processo. É uma satisfação poder participar de um momento tão importante dos seus planos.`)}
          ${paragraph(`<strong>✈️ Próximos passos</strong><br />Quando começar a organizar sua viagem, posso te auxiliar também com passagens, hospedagem, ingressos e outros serviços, garantindo praticidade e segurança em cada etapa.`)}
          ${paragraph(`<strong>🌎 Outras oportunidades</strong><br />Agora que você possui o visto americano, também é possível solicitar o visto eletrônico canadense, de forma mais simples e sem necessidade de entrevista.`)}
          ${paragraph(`<strong>🤝 Indicações</strong><br />Se conhecer alguém que esteja pensando em tirar o visto, fico à disposição para ajudar. A sua indicação é sempre muito bem-vinda.`)}`
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
