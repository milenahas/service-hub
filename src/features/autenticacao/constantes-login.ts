export const ERRO_LOGIN_INVALIDO =
  'Usuário não encontrado. Use cliente, consultor-infraestrutura, consultor-aplicacoes ou gestor.'

/** Ordem obrigatória — PRD tela-login §5.6 */
export const PERFIS_DISPONIVEIS = [
  'gestor',
  'consultor-infraestrutura',
  'consultor-aplicacoes',
  'cliente',
] as const