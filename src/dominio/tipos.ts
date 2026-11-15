/** Perfil de acesso — alinhado a `dados.json` e AGENTS.md */
export type Perfil = 'cliente' | 'consultor' | 'gestor'

export type Usuario = {
  id: string
  nome: string
  email: string
  perfil: Perfil
  locale: string
  zoneinfo: string
  grupo_id?: string
  grupos_ids?: string[]
  empresa?: string
}