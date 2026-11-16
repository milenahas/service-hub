import type { Chamado, Mensagem } from './snapshot.ts'
import type { StatusChamado } from './chamado.ts'

export type TipoEvento =
  | 'chamado.aberto'
  | 'chamado.atribuido'
  | 'mensagem.adicionada'
  | 'status.alterado'

export type EventoBase = {
  id: string
  tipo: TipoEvento
  ocorrido_em: string
}

export type EventoChamadoAberto = EventoBase & {
  tipo: 'chamado.aberto'
  payload: Chamado
}

export type EventoChamadoAtribuido = EventoBase & {
  tipo: 'chamado.atribuido'
  payload: {
    chamado_id: string
    consultor_id: string
  }
}

export type EventoMensagemAdicionada = EventoBase & {
  tipo: 'mensagem.adicionada'
  payload: Mensagem
}

export type EventoStatusAlterado = EventoBase & {
  tipo: 'status.alterado'
  payload: {
    chamado_id: string
    de: StatusChamado
    para: StatusChamado
    motivo: string
    usuario_id: string
  }
}

export type Evento =
  | EventoChamadoAberto
  | EventoChamadoAtribuido
  | EventoMensagemAdicionada
  | EventoStatusAlterado

export function criarIdEvento(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `evt-${Math.random().toString(36).slice(2)}-${Date.now()}`
}