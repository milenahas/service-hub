import type { StatusChamado } from './chamado.ts'
import type { Usuario } from './tipos.ts'

export type MetaSnapshot = {
  tenant: string
  gerado_em: string
  agora: string
  observacao?: string
  status_possiveis: StatusChamado[]
  prioridades: string[]
}

export type Chamado = {
  id: string
  numero: number
  titulo: string
  descricao: string
  categoria_id: string
  grupo_id: string
  prioridade: string
  status: StatusChamado
  solicitante_id: string
  responsavel_id: string | null
  aberto_em: string
  atualizado_em: string
  prazo_primeira_resposta: string
  prazo_resolucao: string
  sla_pausado: boolean
  primeira_resposta_em?: string | null
  resolvido_em?: string | null
  fechado_em?: string | null
}

export type Mensagem = {
  id: string
  chamado_id: string
  autor_id: string
  corpo: string
  criado_em: string
  interna: boolean
}

export type HistoricoEntrada = {
  id: string
  chamado_id: string
  tipo: string
  ocorrido_em: string
  usuario_id?: string | null
  detalhes?: Record<string, unknown>
}

export type SnapshotCompleto = {
  meta: MetaSnapshot
  grupos: { id: string; nome: string; gestor_id: string }[]
  categorias: { id: string; nome: string; grupo_id: string }[]
  sla: {
    prioridade: string
    primeira_resposta_horas: number
    resolucao_horas: number
  }[]
  usuarios: Usuario[]
  chamados: Chamado[]
  mensagens: Mensagem[]
  historico: HistoricoEntrada[]
}

export type TenantSessao = {
  meta: MetaSnapshot
  grupos: SnapshotCompleto['grupos']
  categorias: SnapshotCompleto['categorias']
  sla: SnapshotCompleto['sla']
  usuarios: Usuario[]
  chamados: Chamado[]
  mensagens: Mensagem[]
  historico: HistoricoEntrada[]
  /** Consultores sorteados no login do gestor (painel de equipe) */
  consultoresEquipeGestor?: string[]
}