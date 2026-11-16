import type { Chamado, HistoricoEntrada, Mensagem, TenantSessao } from './snapshot.ts'
import type { StatusChamado } from './chamado.ts'
import type {
  Evento,
  EventoChamadoAberto,
  EventoChamadoAtribuido,
  EventoMensagemAdicionada,
  EventoStatusAlterado,
} from './evento.ts'
import { criarIdEvento } from './evento.ts'
import {
  AUTOR_SISTEMA_ID,
  textoAtribuicao,
  textoMudancaStatus,
} from './mensagens-sistema.ts'
import { formatarRotuloStatus } from './rotulo-status.ts'

type FatiaTenant = Pick<TenantSessao, 'chamados' | 'mensagens' | 'historico'>

function atualizarChamado(
  chamados: Chamado[],
  id: string,
  patch: Partial<Chamado>,
): Chamado[] {
  return chamados.map((chamado) => {
    if (chamado.id === id) {
      return { ...chamado, ...patch }
    }
    return chamado
  })
}

function nomeUsuario(tenant: TenantSessao, usuarioId: string): string {
  return tenant.usuarios.find((u) => u.id === usuarioId)?.nome ?? 'Consultor'
}

function criarMensagemSistema(
  chamadoId: string,
  corpo: string,
  ocorridoEm: string,
): Mensagem {
  return {
    id: criarIdEvento(),
    chamado_id: chamadoId,
    autor_id: AUTOR_SISTEMA_ID,
    corpo,
    criado_em: ocorridoEm,
    interna: false,
  }
}

function aplicarStatusNoChamado(
  para: StatusChamado,
  ocorridoEm: string,
): Partial<Chamado> {
  const patch: Partial<Chamado> = {
    status: para,
    atualizado_em: ocorridoEm,
  }
  if (para === 'resolvido') {
    patch.resolvido_em = ocorridoEm
  }
  if (para === 'fechado') {
    patch.fechado_em = ocorridoEm
  }
  if (para === 'aberto' || para === 'em_atendimento') {
    patch.resolvido_em = null
    patch.fechado_em = null
  }
  return patch
}

function aplicarChamadoAberto(
  fatia: FatiaTenant,
  evento: EventoChamadoAberto,
): FatiaTenant {
  const jaExiste = fatia.chamados.some((chamado) => chamado.id === evento.payload.id)
  if (jaExiste) {
    return fatia
  }
  return {
    ...fatia,
    chamados: [...fatia.chamados, evento.payload],
  }
}

function aplicarChamadoAtribuido(
  tenant: TenantSessao,
  fatia: FatiaTenant,
  evento: EventoChamadoAtribuido,
): FatiaTenant {
  const { chamado_id, consultor_id } = evento.payload
  const chamado = fatia.chamados.find((item) => item.id === chamado_id)
  if (!chamado) {
    return fatia
  }

  const patch: Partial<Chamado> = {
    responsavel_id: consultor_id,
    atualizado_em: evento.ocorrido_em,
  }
  if (chamado.status === 'aberto') {
    patch.status = 'em_atendimento'
  }

  const entradaAtribuicao: HistoricoEntrada = {
    id: criarIdEvento(),
    chamado_id,
    tipo: 'atribuicao',
    ocorrido_em: evento.ocorrido_em,
    usuario_id: consultor_id,
    detalhes: { de: null, para: null, motivo: null },
  }

  const msg = criarMensagemSistema(
    chamado_id,
    textoAtribuicao(nomeUsuario(tenant, consultor_id)),
    evento.ocorrido_em,
  )

  return {
    chamados: atualizarChamado(fatia.chamados, chamado_id, patch),
    mensagens: [...fatia.mensagens, msg],
    historico: [...fatia.historico, entradaAtribuicao],
  }
}

function aplicarMensagemAdicionada(
  fatia: FatiaTenant,
  evento: EventoMensagemAdicionada,
): FatiaTenant {
  const jaExiste = fatia.mensagens.some((mensagem) => mensagem.id === evento.payload.id)
  if (jaExiste) {
    return fatia
  }

  let chamados = fatia.chamados
  const chamado = chamados.find((item) => item.id === evento.payload.chamado_id)
  if (chamado) {
    chamados = atualizarChamado(chamados, evento.payload.chamado_id, {
      atualizado_em: evento.ocorrido_em,
    })
  }

  return {
    ...fatia,
    chamados,
    mensagens: [...fatia.mensagens, evento.payload],
  }
}

function aplicarStatusAlterado(
  fatia: FatiaTenant,
  evento: EventoStatusAlterado,
): FatiaTenant {
  const { chamado_id, de, para, motivo, usuario_id } = evento.payload
  const chamado = fatia.chamados.find((item) => item.id === chamado_id)
  if (!chamado || chamado.status !== de) {
    return fatia
  }

  const entradaStatus: HistoricoEntrada = {
    id: criarIdEvento(),
    chamado_id,
    tipo: 'status',
    ocorrido_em: evento.ocorrido_em,
    usuario_id,
    detalhes: { de, para, motivo },
  }

  const msg = criarMensagemSistema(
    chamado_id,
    textoMudancaStatus(
      motivo,
      formatarRotuloStatus(de),
      formatarRotuloStatus(para),
    ),
    evento.ocorrido_em,
  )

  return {
    chamados: atualizarChamado(
      fatia.chamados,
      chamado_id,
      aplicarStatusNoChamado(para, evento.ocorrido_em),
    ),
    mensagens: [...fatia.mensagens, msg],
    historico: [...fatia.historico, entradaStatus],
  }
}

function aplicarPorTipo(
  tenant: TenantSessao,
  fatia: FatiaTenant,
  evento: Evento,
): FatiaTenant {
  if (evento.tipo === 'chamado.aberto') {
    return aplicarChamadoAberto(fatia, evento)
  }
  if (evento.tipo === 'chamado.atribuido') {
    return aplicarChamadoAtribuido(tenant, fatia, evento)
  }
  if (evento.tipo === 'mensagem.adicionada') {
    return aplicarMensagemAdicionada(fatia, evento)
  }
  return aplicarStatusAlterado(fatia, evento)
}

export function aplicarEvento(
  tenant: TenantSessao,
  evento: Evento,
  eventosAplicados: Set<string>,
): TenantSessao {
  if (eventosAplicados.has(evento.id)) {
    return tenant
  }

  const fatiaInicial: FatiaTenant = {
    chamados: tenant.chamados,
    mensagens: tenant.mensagens,
    historico: tenant.historico,
  }
  const fatia = aplicarPorTipo(tenant, fatiaInicial, evento)

  eventosAplicados.add(evento.id)

  return { ...tenant, ...fatia }
}