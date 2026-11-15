/** Status possíveis de um chamado — alinhado a `dados.json` e AGENTS.md */
export type StatusChamado =
  | 'aberto'
  | 'em_atendimento'
  | 'aguardando_cliente'
  | 'resolvido'
  | 'fechado'