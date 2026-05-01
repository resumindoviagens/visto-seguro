export const UF = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
export const SOCIAL = ["Instagram","Facebook","LinkedIn","TikTok","X/Twitter","YouTube","Google/YouTube","Pinterest","Outra"];

const helpTexts = {
  cidadeEntrevista: "Escolha o consulado mais conveniente. A escolha não garante disponibilidade imediata de agenda.",
  quemPreenche: "Informe quem está preenchendo os dados. As informações devem corresponder ao solicitante do visto.",
  sobrenome: "Preencha exatamente como está no passaporte, sem abreviações.",
  nome: "Preencha exatamente como está no passaporte, sem abreviações.",
  nomeCompleto: "Informe o nome completo do solicitante, sem abreviações.",
  alterouNome: "Inclui mudança por casamento, divórcio ou alteração judicial. Se sim, detalhe no campo seguinte.",
  cpf: "Informe apenas números, sem pontos ou traços.",
  proposito: "Informe o motivo principal da viagem. Exemplo: turismo, negócios ou visita familiar.",
  periodo: "Informe a quantidade aproximada de dias que pretende permanecer nos Estados Unidos.",
  enderecoEUA: "Informe hotel, endereço de familiar/amigo ou endereço aproximado onde ficará.",
  pagador: "Selecione quem será responsável pelos custos da viagem.",
  jaViajouEUA: "Inclua viagens anteriores aos Estados Unidos, mesmo que antigas.",
  vistoNegado: "Negativas anteriores devem ser informadas obrigatoriamente.",
  telefonePrincipal: "Informe telefone principal com DDD. Exemplo: 11999999999.",
  email: "Informe um e-mail ativo e acessado com frequência.",
  temRedeSocial: "Informe se possui ou possuiu contas em mídias sociais nos últimos cinco anos.",
  numeroPassaporte: "Informe o número do passaporte sem espaços ou caracteres especiais.",
  dataVencimento: "Informe a data de vencimento conforme consta no passaporte.",
  parenteEUA: "Inclui pais, filhos, irmãos, cônjuge ou noivo(a) nos Estados Unidos.",
  ocupacao: "Selecione a atividade principal atual do solicitante.",
  empregador: "Informe nome da empresa, escola ou empresa da qual é sócio.",
  atividades: "Descreva objetivamente as atividades desempenhadas.",
  posGraduacaoConcluida: "Preencha apenas se a pós-graduação, mestrado ou doutorado já estiver concluído.",
  paisesVisitados: "Liste apenas países visitados nos últimos cinco anos.",
  obsSeguranca: "Se respondeu SIM em qualquer pergunta de segurança, explique detalhadamente.",
  responsabilidade: "Ao marcar, você declara que as informações fornecidas são verdadeiras e completas."
};

const f = (id, label, type = "text", options = [], config = {}) => ({
  id,
  label,
  type,
  options,
  help: config.help || helpTexts[id] || "Balão explicativo editável futuramente.",
  wide: !!config.wide,
  full: !!config.full
});

export const sections = [
  {
    title: "1. Início e Dados do Solicitante",
    fields: [
      f("cidadeEntrevista","Onde deseja realizar a entrevista?","select",["São Paulo","Rio de Janeiro","Recife","Brasília","Porto Alegre"]),
      f("quemPreenche","Quem está preenchendo este formulário?","select",["O próprio solicitante","Familiar","Responsável legal","Terceiro autorizado"]),
      f("sobrenome","SOBRENOME (como está em seu passaporte)"),
      f("nome","NOME (como está em seu passaporte)"),
      f("nomeCompleto","NOME COMPLETO","text",[],{wide:true}),
      f("alterouNome","O solicitante já teve alteração no nome?","radio",["Sim","Não"]),
      f("nomeAnterior","Se positivo, informe nome/sobrenome anterior e razão da alteração","textarea",[],{wide:true}),
      f("sexo","Sexo","select",["Masculino","Feminino"]),
      f("estadoCivil","Estado Civil","select",["Solteiro(a)","Casado(a)","União estável","Divorciado(a)","Viúvo(a)"]),
      f("dataNascimento","Data de nascimento","date"),
      f("cidadeNascimento","Cidade de nascimento"),
      f("estadoNascimento","Estado de nascimento","select",UF),
      f("paisNascimento","País de nascimento"),
      f("nacionalidades","Nacionalidade(s), além da brasileira"),
      f("cpf","CPF"),
      f("ssn","Possui Social Security Number?","radio",["Sim","Não"]),
      f("taxId","Possui U.S. Taxpayer ID?","radio",["Sim","Não"])
    ]
  },
  {
    title: "2. Viagem e Pagamento",
    fields: [
      f("proposito","Propósito da viagem"),
      f("planosEspecificos","Você já fez planos específicos para sua viagem?","radio",["Sim","Não"]),
      f("dataPretendida","Se negativo, qual data pretende viajar?","date"),
      f("periodo","Por qual período?"),
      f("dataChegada","Se positivo, qual a data da chegada?","date"),
      f("vooChegada","Número do voo de chegada"),
      f("cidadeChegada","Cidade da chegada"),
      f("dataPartida","Data da partida","date"),
      f("vooPartida","Número do voo de partida"),
      f("locaisVisitar","Informe os locais que pretende visitar","textarea",[],{wide:true}),
      f("enderecoEUA","Endereço onde ficará nos Estados Unidos","textarea",[],{wide:true}),
      f("pagador","Pessoa que pagará por sua viagem","select",["O próprio solicitante","Outra pessoa","Empresa/organização"]),
      f("pagadorSobrenome","SOBRENOME DA PESSOA QUE PAGARÁ"),
      f("pagadorNome","NOME DA PESSOA QUE PAGARÁ"),
      f("pagadorTelefone","TELEFONE","tel"),
      f("pagadorEmail","EMAIL","email"),
      f("pagadorRelacao","Relação com o solicitante?","select",["Pai","Parente","Empregador","Atual"]),
      f("pagadorEndereco","Endereço do pagador","textarea",[],{wide:true}),
      f("viajaComAlguem","Alguém viajará com você?","radio",["Sim","Não"]),
      f("companheiros","Informe companheiros de viagem: sobrenome, nome e relacionamento","textarea",[],{wide:true})
    ]
  },
  {
    title: "3. Histórico com os Estados Unidos",
    fields: [
      f("jaViajouEUA","Você já viajou aos Estados Unidos antes?","radio",["Sim","Não"],{full:true}),
      ...Array.from({length:5},(_,i)=>[
        f(`viagemEUA${i+1}Data`,`Viagem ${i+1} - data estimada (DD/MM/AAAA)`,"date"),
        f(`viagemEUA${i+1}Dias`,`Viagem ${i+1} - quantidade de dias estimados?`)
      ]).flat(),
      f("carteiraMotoristaEUA","Emitiu carteira de motorista nos EUA?","radio",["Sim","Não"]),
      f("dadosCarteira","Número da carteira e Estado de emissão"),
      f("vistoEmitido","Você já teve visto americano emitido?","radio",["Sim","Não"]),
      f("dataUltimoVisto","Data do último visto emitido","date"),
      f("numeroVisto","Número do visto"),
      f("mesmoTipoVisto","Está solicitando o mesmo tipo de visto?","radio",["Sim","Não","Não sei"]),
      f("digitais","Teve digitais dos dez dedos colhidas?","radio",["Sim","Não","Não sei"]),
      f("vistoCancelado","Já teve visto americano cancelado ou revogado?","radio",["Sim","Não"]),
      f("vistoNegado","Já teve solicitação de visto americano negada?","radio",["Sim","Não"]),
      f("pedidoImigracao","Alguém já solicitou pedido de imigração em seu favor?","radio",["Sim","Não","Não sei"]),
      f("explicacaoHistoricoEUA","Explique vistos cancelados, recusas ou imigração, se houver","textarea",[],{wide:true})
    ]
  },
  {
    title: "4. Endereço, Contatos e Redes Sociais",
    fields: [
      f("enderecoBrasil","Nome da rua, número da casa, quadra e bloco","text",[],{wide:true}),
      f("bairro","Bairro"),
      f("cidadeEndereco","Cidade"),
      f("estadoEndereco","Estado","select",UF),
      f("cep","CEP"),
      f("paisEndereco","País"),
      f("correspondenciaIgual","Endereço de correspondência é o mesmo da residência?","radio",["Sim","Não"]),
      f("enderecoCorrespondencia","Se diferente, informe endereço completo de correspondência","textarea",[],{wide:true}),
      f("telefonePrincipal","Telefone principal com DDD","tel"),
      f("telefoneSecundario","Telefone secundário","tel"),
      f("telefoneServico","Telefone do serviço","tel"),
      f("outrosTelefones","Já utilizou outros telefones nos últimos cinco anos?","radio",["Sim","Não"]),
      f("listaTelefones","Informe outros números utilizados","textarea",[],{wide:true}),
      f("email","E-mail","email"),
      f("outrosEmails","Já utilizou outro e-mail nos últimos cinco anos?","radio",["Sim","Não"]),
      f("listaEmails","Informe outros e-mails utilizados","textarea",[],{wide:true}),
      f("temRedeSocial","Você possui contas em mídias sociais?","radio",["Sim","Não"],{full:true}),
      ...Array.from({length:8},(_,i)=>[
        f(`redeSocial${i+1}`,`Rede social ${i+1}`,"select",SOCIAL),
        f(`usuarioRedeSocial${i+1}`,`Nome de usuário ${i+1}`)
      ]).flat()
    ]
  },
  {
    title: "5. Passaporte e Contato nos EUA",
    fields: [
      f("tipoPassaporte","Tipo de passaporte","select",["Regular","Oficial","Diplomático","Outro"]),
      f("numeroPassaporte","Número do passaporte"),
      f("paisEmissor","País emissor"),
      f("cidadeEmissao","Cidade onde foi emitido"),
      f("estadoEmissao","Estado onde foi emitido","select",UF),
      f("dataEmissao","Data da emissão","date"),
      f("dataVencimento","Data do vencimento","date"),
      f("passaportePerdido","Você já perdeu ou teve algum passaporte roubado?","radio",["Sim","Não"]),
      f("detalhePassaportePerdido","Informe número do passaporte perdido/roubado e explique","textarea",[],{wide:true}),
      f("contatoEUA","Pessoa de contato nos Estados Unidos"),
      f("organizacaoEUA","Nome da organização/hotel"),
      f("relacaoContatoEUA","Relação com você","select",["Hotel","Parente","Amigo","Empresa","Escola","Outros"]),
      f("enderecoContatoEUA","Endereço completo do ponto de contato","textarea",[],{wide:true}),
      f("telefoneContatoEUA","Telefone do contato","tel"),
      f("emailContatoEUA","E-mail do contato","email")
    ]
  },
  {
    title: "6. Familiares e Estado Civil",
    fields: [
      f("paiSobrenome","Sobrenome do pai"), f("paiNome","Nome do pai"), f("paiNascimento","Data de nascimento do pai","date"), f("paiEUA","Seu pai se encontra nos Estados Unidos?","radio",["Sim","Não"]),
      f("maeSobrenome","Sobrenome da mãe"), f("maeNome","Nome da mãe"), f("maeNascimento","Data de nascimento da mãe","date"), f("maeEUA","Sua mãe se encontra nos Estados Unidos?","radio",["Sim","Não"]),
      f("parenteEUA","Possui parente imediato nos Estados Unidos?","radio",["Sim","Não"]), f("detalheParenteEUA","Informe nome, parentesco e status dos parentes imediatos","textarea",[],{wide:true}),
      f("outroParenteEUA","Possui algum outro parente que reside nos Estados Unidos?","radio",["Sim","Não"]),
      f("conjugeSobrenome","Cônjuge - sobrenome"), f("conjugeNome","Cônjuge - nome"), f("conjugeNascimento","Cônjuge - data de nascimento","date"), f("conjugeNacionalidade","Cônjuge - nacionalidade"),
      f("conjugeCidadeNascimento","Cônjuge - cidade de nascimento"), f("conjugeEstadoNascimento","Cônjuge - Estado de nascimento","select",UF), f("conjugePaisNascimento","Cônjuge - país de nascimento"), f("conjugeEndereco","Cônjuge - endereço completo","textarea",[],{wide:true}),
      f("exConjugeQuantidade","Quantidade de ex-cônjuges"), f("exConjugeSobrenome","Ex-cônjuge - sobrenome"), f("exConjugeNome","Ex-cônjuge - nome"), f("exConjugeNascimento","Ex-cônjuge - data de nascimento","date"),
      f("exConjugeNacionalidade","Ex-cônjuge - nacionalidade"), f("exConjugeCidadeNascimento","Ex-cônjuge - cidade de nascimento"), f("exConjugeEstadoNascimento","Ex-cônjuge - Estado de nascimento","select",UF), f("exConjugePaisNascimento","Ex-cônjuge - país de nascimento"),
      f("exConjugeDataCasamento","Data do casamento","date"), f("exConjugeDataTermino","Data do término do casamento","date"), f("exConjugeComoTerminou","Como ocorreu o término do casamento"), f("exConjugePaisTermino","País onde ocorreu o término do casamento"),
      f("falecidoSobrenome","Cônjuge falecido - sobrenome"), f("falecidoNome","Cônjuge falecido - nome"), f("falecidoNascimento","Cônjuge falecido - data de nascimento","date"), f("falecidoNacionalidade","Cônjuge falecido - nacionalidade"),
      f("falecidoCidade","Cidade de falecimento"), f("falecidoEstado","Estado de falecimento","select",UF), f("falecidoPais","País de falecimento")
    ]
  },
  {
    title: "7. Trabalho, Educação e Formação",
    fields: [
      f("ocupacao","Ocupação primária","select",["Empregado","Empresário","Autônomo","Estudante","Aposentado","Não empregado","Outro"]),
      f("empregador","Nome do empregador, escola ou empresa que é sócio"),
      f("enderecoEmpregador","Endereço completo do empregador/escola","textarea",[],{wide:true}),
      f("telefoneEmpregador","Telefone","tel"),
      f("dataInicioAtual","Data de início","date"),
      f("salario","Salário bruto"),
      f("atividades","Descreva as atividades realizadas","textarea",[],{wide:true}),
      f("empregoAnterior","Já foi empregado anteriormente, já teve outras atividades, sócio de outras empresas?","radio",["Sim","Não"]),
      f("dadosEmpregoAnterior","Informe dados do último emprego anterior ou atividade anterior","textarea",[],{wide:true}),
      f("estudoConcluido","Você concluiu estudo de nível médio e/ou superior?","radio",["Sim","Não"]),
      f("formacao","Informe instituição, endereço, formação, início e conclusão","textarea",[],{wide:true}),
      f("posGraduacaoConcluida","Tem Pós-graduação, Mestrado ou Doutorado JÁ CONCLUÍDO? Informar título, curso, nome da instituição, endereço, início e conclusão do curso.","textarea",[],{wide:true})
    ]
  },
  {
    title: "8. Informações Adicionais",
    fields: [
      f("claTribo","Você pertence a algum clã ou tribo?","radio",["Sim","Não"]),
      f("nomeClaTribo","Se positivo, qual o nome?"),
      f("idiomas","Informe os idiomas que você fala, excluindo português"),
      f("viagensOutrosPaises","Viajou para outro país nos últimos cinco anos?","radio",["Sim","Não"]),
      f("paisesVisitados","Informe os países visitados apenas nos últimos 5 anos a contar da data do preenchimento deste formulário.","textarea",[],{wide:true}),
      f("organizacoes","Pertence, contribuiu ou trabalhou para organização profissional/social/caridade?","radio",["Sim","Não"]),
      f("listaOrganizacoes","Informe o nome das organizações","textarea",[],{wide:true}),
      f("treinamentoArmas","Tem treinamento para armas de fogo, explosivos ou outro material?","radio",["Sim","Não"]),
      f("detalheTreinamento","Explique o treinamento","textarea",[],{wide:true}),
      f("serviuForcas","Apenas para homens: já serviu às Forças Armadas?","radio",["Sim","Não","Não se aplica"]),
      f("dadosForcas","Informe país, ramo, patente, especialidade, início e término","textarea",[],{wide:true})
    ]
  },
  {
    title: "9. Perguntas de Segurança Americana",
    fields: [
      ...[
        ["paramilitar","Já participou de forças paramilitares, grupo rebelde ou guerrilha?"],
        ["doencaContagiosa","Possui doença contagiosa significativa do ponto de vista de saúde pública?"],
        ["incapacidadeAmeaca","É portador de incapacidade física ou mental que possa representar ameaça?"],
        ["drogas","É ou já foi usuário ou viciado em drogas?"],
        ["presoCondenado","Já foi preso ou condenado por alguma ofensa ou crime?"],
        ["substancias","Já violou lei referente a substâncias controladas?"],
        ["prostituicao","Está indo aos EUA para prostituição ou já se prostituiu/agenciou?"],
        ["lavagem","Já se envolveu ou busca se envolver em lavagem de dinheiro?"],
        ["traficoHumano","Já se envolveu com tráfico humano ou ajudou alguém envolvido?"],
        ["espionagem","Busca se envolver em espionagem, sabotagem ou outra atividade ilegal nos EUA?"],
        ["terrorismo","Já se envolveu ou pretende se envolver em atividades terroristas?"],
        ["genocidioTortura","Já participou de genocídio, tortura, mortes extrajudiciais ou atos similares?"],
        ["criancasSoldados","Já participou no recrutamento ou uso de crianças como soldados?"],
        ["controlePopulacional","Já se envolveu em aborto/esterilização forçada?"],
        ["orgaosCoercao","Já se envolveu em transplante de órgãos/tecidos por coerção?"],
        ["fraudeVisto","Buscou obter visto/entrada/benefício de imigração por fraude?"],
        ["deportado","Já foi removido ou deportado de algum país?"],
        ["criancaAmericana","Já manteve criança cidadã americana fora dos EUA contra guarda legal?"],
        ["votouEUA","Já votou nos Estados Unidos violando lei ou regulamento?"],
        ["renunciouCidadania","Já renunciou cidadania americana para evitar impostos?"]
      ].map(([id,label]) => f(id,label,"radio",["Sim","Não"])),
      f("obsSeguranca","Se respondeu SIM para qualquer pergunta de segurança, explique detalhadamente","textarea",[],{wide:true})
    ]
  },
  {
    title: "10. Revisão, Responsabilidade e Envio",
    fields: [
      f("observacoes","Observações gerais","textarea",[],{wide:true}),
      f("responsabilidade","Declaro que sou responsável por todas as informações fornecidas","checkbox",[],{wide:true})
    ]
  }
];
