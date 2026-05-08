export interface Feedback {
  id: string;
  client_id: string;
  tipo_feedback: 'aprovado' | 'negado';
  nota_nps: number;
  ponto_forte: string;
  comentario: string;
  autorizou_divulgacao: boolean;
  ip: string;
  user_agent: string;
  created_at: string;
}