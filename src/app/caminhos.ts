/** Paths públicos da aplicação — contrato com PRD tela-login §7.4 */
export const CAMINHOS = {
  login: '/',
  cliente: '/cliente',
  consultor: '/consultor',
  gestor: '/gestor',
} as const

export type CaminhoAplicacao = (typeof CAMINHOS)[keyof typeof CAMINHOS]