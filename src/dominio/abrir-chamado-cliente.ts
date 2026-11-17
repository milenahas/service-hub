import type { Chamado, Mensagem, TenantSessao } from './snapshot.ts'

const NOME_GRUPO_INFRAESTRUTURA = 'Infraestrutura'
const PRIORIDADE_ABERTURA = 'media'
const HORA_MS = 60 * 60 * 1000

export type IdsAberturaChamado = {
  chamadoId: string
  mensagemId: string
}

export type AberturaChamadoCliente = {
  chamado: Chamado
  mensagem: Mensagem
}

/**
 * Monta o chamado novo e a primeira mensagem pública do cliente.
 * Não aplica evento: a store emite `chamado.aberto` e `mensagem.adicionada`.
 * Sem grupo Infraestrutura, categoria desse grupo ou SLA `media`, devolve null.
 */
export function montarAberturaChamadoCliente(
  tenant: TenantSessao,
  solicitanteId: string,
  titulo: string,
  descricao: string,
  ids: IdsAberturaChamado,
): AberturaChamadoCliente | null {
  const tituloLimpo = titulo.trim()
  const descricaoLimpa = descricao.trim()
  if (!tituloLimpo || !descricaoLimpa) {
    return null
  }

  const grupo = tenant.grupos.find((item) => item.nome === NOME_GRUPO_INFRAESTRUTURA)
  const categoria = tenant.categorias.find((item) => item.grupo_id === grupo?.id)
  const sla = tenant.sla.find((item) => item.prioridade === PRIORIDADE_ABERTURA)
  if (!grupo || !categoria || !sla) {
    return null
  }

  const agora = tenant.meta.agora
  const agoraMs = new Date(agora).getTime()
  const numero = tenant.chamados.reduce(
    (max, chamado) => Math.max(max, chamado.numero),
    0,
  ) + 1

  const chamado: Chamado = {
    id: ids.chamadoId,
    numero,
    titulo: tituloLimpo,
    descricao: descricaoLimpa,
    categoria_id: categoria.id,
    grupo_id: grupo.id,
    prioridade: PRIORIDADE_ABERTURA,
    status: 'aberto',
    solicitante_id: solicitanteId,
    responsavel_id: null,
    aberto_em: agora,
    atualizado_em: agora,
    prazo_primeira_resposta: new Date(
      agoraMs + sla.primeira_resposta_horas * HORA_MS,
    ).toISOString(),
    prazo_resolucao: new Date(
      agoraMs + sla.resolucao_horas * HORA_MS,
    ).toISOString(),
    sla_pausado: false,
    primeira_resposta_em: null,
    resolvido_em: null,
    fechado_em: null,
  }

  const mensagem: Mensagem = {
    id: ids.mensagemId,
    chamado_id: chamado.id,
    autor_id: solicitanteId,
    corpo: descricaoLimpa,
    criado_em: agora,
    interna: false,
  }

  return { chamado, mensagem }
}
