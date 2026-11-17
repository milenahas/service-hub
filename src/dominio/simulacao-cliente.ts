import type { GeradorAleatorio } from './aleatorio.ts'
import { inteiroAleatorio } from './aleatorio.ts'
import type { EventoMensagemAdicionada } from './evento.ts'
import { criarIdEvento } from './evento.ts'
import type { Chamado, TenantSessao } from './snapshot.ts'
import type { Usuario } from './tipos.ts'
import {
  relogioPadrao,
  type Relogio,
} from './simulacao-consultor.ts'

const INTERVALO_MENSAGEM_MS = 12_000
const INTERVALO_MENSAGEM_SELECIONADO_MS = 20_000

export type ControleSimulacaoCliente = {
  parar: () => void
  definirChamadoSelecionado: (id: string | null) => void
}

type OpcoesSimulacaoCliente = {
  relogio?: Relogio
  aleatorio?: GeradorAleatorio
  obterChamadoSelecionadoId?: () => string | null
}

function emAndamento(chamado: Chamado): boolean {
  return chamado.status === 'em_atendimento' || chamado.status === 'aguardando_cliente'
}

function sortearChamado(
  chamados: Chamado[],
  aleatorio: GeradorAleatorio,
): Chamado | undefined {
  if (chamados.length === 0) return undefined
  return chamados[inteiroAleatorio(0, chamados.length - 1, aleatorio)]
}

/** Chamados do cliente em andamento, com responsável, fora da conversa aberta. */
export function listarChamadosSimulaveisCliente(
  tenant: TenantSessao,
  clienteId: string,
  chamadoAbertoId: string | null,
): Chamado[] {
  return tenant.chamados.filter((chamado) => {
    return (
      chamado.solicitante_id === clienteId &&
      chamado.id !== chamadoAbertoId &&
      emAndamento(chamado) &&
      chamado.responsavel_id !== null
    )
  })
}

/**
 * Mensagem pública do responsável. Sem responsável, ou fora de
 * `em_atendimento` e `aguardando_cliente`, não há evento.
 */
export function gerarMensagemConsultor(
  tenant: TenantSessao,
  chamado: Chamado,
  aleatorio: GeradorAleatorio = Math.random,
): EventoMensagemAdicionada | null {
  const responsavelId = chamado.responsavel_id
  if (!responsavelId || !emAndamento(chamado)) return null
  const sufixo = inteiroAleatorio(1000, 9999, aleatorio)
  const mensagemId = criarIdEvento()
  return {
    id: criarIdEvento(),
    tipo: 'mensagem.adicionada',
    ocorrido_em: tenant.meta.agora,
    payload: {
      id: mensagemId,
      chamado_id: chamado.id,
      autor_id: responsavelId,
      corpo: `Mensagem simulada do consultor · ${sufixo}`,
      criado_em: tenant.meta.agora,
      interna: false,
    },
  }
}

/** Mensagem do consultor no chamado aberto na conversa, se ele ainda é elegível. */
export function gerarMensagemConsultorNoSelecionado(
  tenant: TenantSessao,
  clienteId: string,
  chamadoSelecionadoId: string | null,
  aleatorio: GeradorAleatorio = Math.random,
): EventoMensagemAdicionada | null {
  if (!chamadoSelecionadoId) return null
  const chamado = tenant.chamados.find((item) => item.id === chamadoSelecionadoId)
  if (!chamado || chamado.solicitante_id !== clienteId) return null
  return gerarMensagemConsultor(tenant, chamado, aleatorio)
}

/**
 * Agenda a mensagem do consultor na conversa aberta (20s) e uma mensagem
 * em outro chamado do cliente (12s) enquanto a tela está montada. O ciclo
 * de 20s começa e recomeça em `definirChamadoSelecionado`; seleção nula
 * o interrompe. O de 12s não zera ao trocar de chamado. Não desenha:
 * quem liga e desliga é `TelaCliente.tsx`; a store em `app/store.ts`
 * aplica o evento e publica o id da conversa.
 */
export function iniciarSimulacaoCliente(
  cliente: Usuario,
  obterTenant: () => TenantSessao | null,
  aplicar: (evento: EventoMensagemAdicionada) => void,
  opcoes: OpcoesSimulacaoCliente = {},
): ControleSimulacaoCliente {
  const relogio = opcoes.relogio ?? relogioPadrao
  const aleatorio = opcoes.aleatorio ?? Math.random
  const obterChamadoSelecionadoId = opcoes.obterChamadoSelecionadoId ?? (() => null)
  const timeouts: ReturnType<typeof globalThis.setTimeout>[] = []
  let timeoutMensagemSelecionada: ReturnType<typeof globalThis.setTimeout> | null = null
  let chamadoDoCiclo: string | null = null
  let cicloSelecionadoArmado = false
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

  const dispararNosDemais = () => {
    const tenant = obterTenant()
    if (!tenant) return

    const chamadoAbertoId = obterChamadoSelecionadoId()
    const candidatos = listarChamadosSimulaveisCliente(tenant, cliente.id, chamadoAbertoId)
    const alvo = sortearChamado(candidatos, aleatorio)
    if (!alvo) return

    const evento = gerarMensagemConsultor(tenant, alvo, aleatorio)
    if (!evento) return
    aplicar(evento)
  }

  const cancelarMensagemSelecionada = () => {
    if (timeoutMensagemSelecionada === null) return
    relogio.clearTimeout(timeoutMensagemSelecionada)
    timeoutMensagemSelecionada = null
  }

  const agendarMensagemSelecionada = () => {
    cancelarMensagemSelecionada()
    timeoutMensagemSelecionada = relogio.setTimeout(() => {
      timeoutMensagemSelecionada = null
      if (!ativa) return
      const tenant = obterTenant()
      if (tenant) {
        const evento = gerarMensagemConsultorNoSelecionado(
          tenant,
          cliente.id,
          obterChamadoSelecionadoId(),
          aleatorio,
        )
        if (evento) aplicar(evento)
      }
      if (ativa) agendarMensagemSelecionada()
    }, INTERVALO_MENSAGEM_SELECIONADO_MS)
  }

  const definirChamadoSelecionado = (id: string | null) => {
    if (!ativa) return
    if (cicloSelecionadoArmado && id === chamadoDoCiclo) return
    cicloSelecionadoArmado = true
    chamadoDoCiclo = id
    if (id === null) {
      cancelarMensagemSelecionada()
      return
    }
    agendarMensagemSelecionada()
  }

  agendarCiclo(INTERVALO_MENSAGEM_MS, dispararNosDemais)

  return {
    definirChamadoSelecionado,
    parar: () => {
      ativa = false
      for (const id of timeouts) {
        relogio.clearTimeout(id)
      }
      timeouts.length = 0
      cancelarMensagemSelecionada()
    },
  }
}
