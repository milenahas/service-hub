import type { GeradorAleatorio } from './aleatorio.ts'
import { inteiroAleatorio } from './aleatorio.ts'
import type { Evento } from './evento.ts'
import { chamadoAtivo } from './prazo.ts'
import type { Chamado, TenantSessao } from './snapshot.ts'
import {
  gerarChamadoInjetado,
  gerarMensagemSimulada,
  gerarMudancaStatusSimulada,
  relogioPadrao,
  type ControleSimulacao,
  type Relogio,
} from './simulacao-consultor.ts'

/** Grupos dos consultores da equipe, na ordem em que aparecem no tenant. */
export function gruposDaEquipe(
  tenant: TenantSessao,
  consultorIds: readonly string[],
): string[] {
  const equipe = new Set(consultorIds)
  const vistos = new Set<string>()
  const grupos: string[] = []
  for (const usuario of tenant.usuarios) {
    const grupoId = usuario.grupo_id
    if (usuario.perfil !== 'consultor' || !grupoId || !equipe.has(usuario.id)) {
      continue
    }
    if (vistos.has(grupoId)) {
      continue
    }
    vistos.add(grupoId)
    grupos.push(grupoId)
  }
  return grupos
}

/**
 * Chamado novo sem responsável, no grupo sorteado da equipe.
 * Devolve null quando a equipe não tem grupo.
 */
export function gerarChamadoInjetadoGestor(
  tenant: TenantSessao,
  consultorIds: readonly string[],
  aleatorio: GeradorAleatorio = Math.random,
) {
  const grupos = gruposDaEquipe(tenant, consultorIds)
  if (grupos.length === 0) return null
  const grupoId = grupos[inteiroAleatorio(0, grupos.length - 1, aleatorio)]!
  const consultor = tenant.usuarios.find(
    (usuario) =>
      usuario.perfil === 'consultor' &&
      usuario.grupo_id === grupoId &&
      consultorIds.includes(usuario.id),
  )
  if (!consultor) return null
  return gerarChamadoInjetado(tenant, consultor, aleatorio)
}

/** Ativos com responsável na equipe, sem o chamado aberto na conversa. */
export function listarChamadosSimulaveisGestor(
  tenant: TenantSessao,
  consultorIds: readonly string[],
  chamadoAbertoId: string | null,
): Chamado[] {
  const equipe = new Set(consultorIds)
  return tenant.chamados.filter((chamado) => {
    const dono = chamado.responsavel_id
    return (
      chamado.id !== chamadoAbertoId &&
      chamadoAtivo(chamado.status) &&
      dono !== null &&
      equipe.has(dono)
    )
  })
}

type OpcoesSimulacaoGestor = {
  relogio?: Relogio
  aleatorio?: GeradorAleatorio
  obterChamadoAbertoId?: () => string | null
}

const INTERVALO_CHAMADO_MS = 7_000
const INTERVALO_MENSAGEM_MS = 12_000
const INTERVALO_STATUS_MS = 14_000

/**
 * Agenda os três ciclos da equipe do gestor (chamado novo, mensagem e status)
 * enquanto a tela está montada. Não desenha: quem liga e desliga é
 * `TelaGestor.tsx`; a store em `app/store.ts` aplica o evento e guarda o
 * chamado aberto na conversa.
 */
export function iniciarSimulacaoGestor(
  obterTenant: () => TenantSessao | null,
  aplicar: (evento: Evento) => void,
  opcoes: OpcoesSimulacaoGestor = {},
): ControleSimulacao {
  const relogio = opcoes.relogio ?? relogioPadrao
  const aleatorio = opcoes.aleatorio ?? Math.random
  const obterChamadoAbertoId = opcoes.obterChamadoAbertoId ?? (() => null)
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

  const consultorIdsDo = (tenant: TenantSessao) =>
    tenant.consultoresEquipeGestor ?? []

  const dispararChamado = () => {
    const tenant = obterTenant()
    if (!tenant) return
    const evento = gerarChamadoInjetadoGestor(
      tenant,
      consultorIdsDo(tenant),
      aleatorio,
    )
    if (!evento) return
    aplicar(evento)
  }

  const dispararNaEquipe = (
    montar: (tenant: TenantSessao, chamado: Chamado) => Evento | null,
  ) => {
    const tenant = obterTenant()
    if (!tenant) return
    const ids = consultorIdsDo(tenant)
    const alvo = listarChamadosSimulaveisGestor(
      tenant,
      ids,
      obterChamadoAbertoId(),
    )
    if (alvo.length === 0) return
    const chamado = alvo[inteiroAleatorio(0, alvo.length - 1, aleatorio)]!
    const evento = montar(tenant, chamado)
    if (!evento) return
    aplicar(evento)
  }

  agendarCiclo(INTERVALO_CHAMADO_MS, dispararChamado)
  agendarCiclo(INTERVALO_MENSAGEM_MS, () => {
    dispararNaEquipe((tenant, chamado) =>
      gerarMensagemSimulada(tenant, chamado, aleatorio),
    )
  })
  agendarCiclo(INTERVALO_STATUS_MS, () => {
    dispararNaEquipe((tenant, chamado) =>
      gerarMudancaStatusSimulada(tenant, chamado, aleatorio),
    )
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
