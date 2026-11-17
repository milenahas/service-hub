import type { GeradorAleatorio } from './aleatorio.ts'
import { inteiroAleatorio } from './aleatorio.ts'
import type { StatusChamado } from './chamado.ts'
import type { Evento, EventoChamadoAberto, EventoMensagemAdicionada, EventoStatusAlterado } from './evento.ts'
import { criarIdEvento } from './evento.ts'
import { chamadoAtivo } from './prazo.ts'
import { selecionarTransicoesStatus } from './selecionar-transicoes-status.ts'
import type { Chamado, TenantSessao } from './snapshot.ts'
import type { Usuario } from './tipos.ts'

export type Relogio = {
  agoraIso: () => string
  setTimeout: typeof globalThis.setTimeout
  clearTimeout: typeof globalThis.clearTimeout
}

export const relogioPadrao: Relogio = {
  agoraIso: () => new Date().toISOString(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
}

const INTERVALO_CHAMADO_MS = 7_000
const INTERVALO_MENSAGEM_MS = 12_000
const INTERVALO_STATUS_MS = 14_000

const MOTIVO_STATUS_SIMULADO = 'Simulação da fila.'

function maiorNumeroChamado(chamados: Chamado[]): number {
  return chamados.reduce((max, c) => Math.max(max, c.numero), 0)
}

function sortearPrioridade(aleatorio: GeradorAleatorio): string {
  const r = aleatorio()
  if (r < 0.7) return 'media'
  if (r < 0.85) return 'alta'
  if (r < 0.95) return 'baixa'
  return 'critica'
}

export function gerarChamadoInjetado(
  tenant: TenantSessao,
  consultor: Usuario,
  aleatorio: GeradorAleatorio = Math.random,
): EventoChamadoAberto {
  const agora = tenant.meta.agora
  const grupoId = consultor.grupo_id!
  const prioridade = sortearPrioridade(aleatorio)
  const linhaSla = tenant.sla.find((s) => s.prioridade === prioridade) ??
    tenant.sla.find((s) => s.prioridade === 'media')!
  const agoraMs = new Date(agora).getTime()
  const prazoPrimeira = new Date(
    agoraMs + linhaSla.primeira_resposta_horas * 3_600_000,
  ).toISOString()
  const prazoResolucao = new Date(
    agoraMs + linhaSla.resolucao_horas * 3_600_000,
  ).toISOString()

  const clientes = tenant.usuarios.filter((u) => u.perfil === 'cliente')
  const solicitante =
    clientes[inteiroAleatorio(0, clientes.length - 1, aleatorio)] ?? clientes[0]

  const categoriasGrupo = tenant.categorias.filter((c) => c.grupo_id === grupoId)
  const categoria =
    categoriasGrupo[inteiroAleatorio(0, categoriasGrupo.length - 1, aleatorio)] ??
    categoriasGrupo[0]

  const sufixo = inteiroAleatorio(1000, 9999, aleatorio)
  const numero = maiorNumeroChamado(tenant.chamados) + 1
  const id = criarIdEvento()

  const chamado: Chamado = {
    id,
    numero,
    titulo: `Chamado simulado · ${sufixo}`,
    descricao: `Solicitação gerada automaticamente para demonstração (#${sufixo}).`,
    categoria_id: categoria.id,
    grupo_id: grupoId,
    prioridade,
    status: 'aberto',
    solicitante_id: solicitante.id,
    responsavel_id: null,
    aberto_em: agora,
    atualizado_em: agora,
    prazo_primeira_resposta: prazoPrimeira,
    prazo_resolucao: prazoResolucao,
    sla_pausado: false,
    primeira_resposta_em: null,
    resolvido_em: null,
    fechado_em: null,
  }

  return {
    id: criarIdEvento(),
    tipo: 'chamado.aberto',
    ocorrido_em: agora,
    payload: chamado,
  }
}

function idsConsultoresDoGrupo(tenant: TenantSessao, grupoId: string): Set<string> {
  return new Set(
    tenant.usuarios
      .filter((u) => u.perfil === 'consultor' && u.grupo_id === grupoId)
      .map((u) => u.id),
  )
}

/** Minha fila e Fila do grupo, sem o chamado selecionado na hora do disparo. */
export function listarChamadosSimulaveis(
  tenant: TenantSessao,
  consultor: Usuario,
  chamadoSelecionadoId: string | null,
): Chamado[] {
  const grupoId = consultor.grupo_id
  if (!grupoId) return []
  const consultores = idsConsultoresDoGrupo(tenant, grupoId)
  return tenant.chamados.filter((chamado) => {
    const dono = chamado.responsavel_id
    return (
      chamado.id !== chamadoSelecionadoId &&
      chamado.grupo_id === grupoId &&
      chamadoAtivo(chamado.status) &&
      dono !== null &&
      (dono === consultor.id || consultores.has(dono))
    )
  })
}

function sortearChamado(
  chamados: Chamado[],
  aleatorio: GeradorAleatorio,
): Chamado | undefined {
  if (chamados.length === 0) return undefined
  return chamados[inteiroAleatorio(0, chamados.length - 1, aleatorio)]
}

export function gerarMensagemSimulada(
  tenant: TenantSessao,
  chamado: Chamado,
  aleatorio: GeradorAleatorio = Math.random,
): EventoMensagemAdicionada {
  const sufixo = inteiroAleatorio(1000, 9999, aleatorio)
  const mensagemId = criarIdEvento()
  return {
    id: criarIdEvento(),
    tipo: 'mensagem.adicionada',
    ocorrido_em: tenant.meta.agora,
    payload: {
      id: mensagemId,
      chamado_id: chamado.id,
      autor_id: chamado.solicitante_id,
      corpo: `Mensagem simulada do cliente · ${sufixo}`,
      criado_em: tenant.meta.agora,
      interna: false,
    },
  }
}

function destinosSimulados(status: StatusChamado): StatusChamado[] {
  return selecionarTransicoesStatus(status).filter((destino) => chamadoAtivo(destino))
}

export function gerarMudancaStatusSimulada(
  tenant: TenantSessao,
  chamado: Chamado,
  aleatorio: GeradorAleatorio = Math.random,
): EventoStatusAlterado | null {
  const responsavelId = chamado.responsavel_id
  const destinos = destinosSimulados(chamado.status)
  if (!responsavelId || !chamadoAtivo(chamado.status) || destinos.length === 0) return null
  const para = destinos[inteiroAleatorio(0, destinos.length - 1, aleatorio)]!
  return {
    id: criarIdEvento(),
    tipo: 'status.alterado',
    ocorrido_em: tenant.meta.agora,
    payload: {
      chamado_id: chamado.id,
      de: chamado.status,
      para,
      motivo: MOTIVO_STATUS_SIMULADO,
      usuario_id: responsavelId,
    },
  }
}

export type ControleSimulacao = {
  parar: () => void
}

type OpcoesSimulacao = {
  relogio?: Relogio
  aleatorio?: GeradorAleatorio
  obterChamadoSelecionadoId?: () => string | null
}

export function iniciarSimulacaoConsultor(
  consultor: Usuario,
  obterTenant: () => TenantSessao | null,
  aplicar: (evento: Evento) => void,
  opcoes: OpcoesSimulacao = {},
): ControleSimulacao {
  const relogio = opcoes.relogio ?? relogioPadrao
  const aleatorio = opcoes.aleatorio ?? Math.random
  const obterChamadoSelecionadoId = opcoes.obterChamadoSelecionadoId ?? (() => null)
  const timeouts: ReturnType<typeof globalThis.setTimeout>[] = []
  let ativa = true

  const agendar = (fn: () => void, ms: number) => {
    const id = relogio.setTimeout(fn, ms)
    timeouts.push(id)
  }

  const agendarCiclo = (intervalo: number, disparar: () => void) => {
    const passo = () => {
      if (!ativa) return
      disparar()
      if (ativa) agendar(passo, intervalo)
    }
    agendar(passo, intervalo)
  }

  const dispararChamado = () => {
    const tenant = obterTenant()
    if (!tenant || !consultor.grupo_id) return
    aplicar(gerarChamadoInjetado(tenant, consultor, aleatorio))
  }

  const dispararNaFila = (montar: (tenant: TenantSessao, chamado: Chamado) => Evento | null) => {
    const tenant = obterTenant()
    if (!tenant || !consultor.grupo_id) return
    const alvo = sortearChamado(
      listarChamadosSimulaveis(tenant, consultor, obterChamadoSelecionadoId()),
      aleatorio,
    )
    if (!alvo) return
    const evento = montar(tenant, alvo)
    if (!evento) return
    aplicar(evento)
  }

  agendarCiclo(INTERVALO_CHAMADO_MS, dispararChamado)
  agendarCiclo(INTERVALO_MENSAGEM_MS, () => {
    dispararNaFila((tenant, chamado) => gerarMensagemSimulada(tenant, chamado, aleatorio))
  })
  agendarCiclo(INTERVALO_STATUS_MS, () => {
    dispararNaFila((tenant, chamado) => gerarMudancaStatusSimulada(tenant, chamado, aleatorio))
  })

  return {
    parar: () => {
      ativa = false
      for (const id of timeouts) {
        relogio.clearTimeout(id)
      }
      timeouts.length = 0
    },
  }
}
