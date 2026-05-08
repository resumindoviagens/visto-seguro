export function gerarTokenPesquisa(): string {
  const random = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(random, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function gerarCodigoPesquisa(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const PONTOS_FORTES_FEEDBACK = [
  'organização do processo',
  'formulário inteligente',
  'orientações para entrevista',
  'videochamada individual',
  'suporte e atendimento',
  'agilidade',
  'outro',
];
