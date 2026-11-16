import type { GeradorAleatorio } from './aleatorio.ts'
import { inteiroAleatorio } from './aleatorio.ts'
import type { Chamado, TenantSessao } from './snapshot.ts'
import type { Usuario } from './tipos.ts'
import type { Evento, EventoChamadoAberto } from './evento.ts'
import { criarIdEvento } from './evento.ts'

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

const MIN_INTERVALO_MS = 60_000
const MAX_INTERVALO_MS = 180_000

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

export type ControleSimulacao = {
  parar: () => void
}

type OpcoesSimulacao = {
  relogio?: Relogio
  aleatorio?: GeradorAleatorio
  modoDemonstracao?: boolean
}

export function iniciarSimulacaoConsultor(
  consultor: Usuario,
  obterTenant: () => TenantSessao | null,
  aplicar: (evento: Evento) => void,
  opcoes: OpcoesSimulacao = {},
): ControleSimulacao {
  const relogio = opcoes.relogio ?? relogioPadrao
  const aleatorio = opcoes.aleatorio ?? Math.random
  const timeouts: ReturnType<typeof globalThis.setTimeout>[] = []

  const agendar = (fn: () => void, ms: number) => {
    const id = relogio.setTimeout(fn, ms)
    timeouts.push(id)
  }

  const agendarProximoInjecao = () => {
    const intervalo = inteiroAleatorio(
      MIN_INTERVALO_MS,
      MAX_INTERVALO_MS,
      aleatorio,
    )
    agendar(() => {
      const tenant = obterTenant()
      if (tenant && consultor.grupo_id) {
        aplicar(gerarChamadoInjetado(tenant, consultor, aleatorio))
      }
      agendarProximoInjecao()
    }, intervalo)
  }

  agendarProximoInjecao()

  if (opcoes.modoDemonstracao) {
    let eventoDemoAberto: EventoChamadoAberto | undefined

    agendar(() => {
      const tenant = obterTenant()
      if (!tenant) return
      eventoDemoAberto = gerarChamadoInjetado(tenant, consultor, aleatorio)
      aplicar(eventoDemoAberto)
    }, 7_000)

    agendar(() => {
      const tenant = obterTenant()
      if (!tenant) return
      const chamado =
        tenant.chamados.find((c) => c.id !== eventoDemoAberto?.payload.id) ??
        tenant.chamados[0]
      if (!chamado) return
      const mensagemId = criarIdEvento()
      aplicar({
        id: criarIdEvento(),
        tipo: 'mensagem.adicionada',
        ocorrido_em: tenant.meta.agora,
        payload: {
          id: mensagemId,
          chamado_id: chamado.id,
          autor_id: chamado.solicitante_id,
          corpo: 'Mensagem simulada do cliente para teste de não lido.',
          criado_em: tenant.meta.agora,
          interna: false,
        },
      })
    }, 12_000)

    agendar(() => {
      if (eventoDemoAberto) {
        aplicar(eventoDemoAberto)
      }
    }, 14_000)
  }

  return {
    parar: () => {
      for (const id of timeouts) {
        relogio.clearTimeout(id)
      }
      timeouts.length = 0
    },
  }
}