import type { Chamado, HistoricoEntrada, TenantSessao } from '../../dominio/snapshot.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import { chamadoAtivo } from '../../dominio/prazo.ts'
import {
  chamadoEmRisco,
  consultorOcioso,
} from './indicadores-gestor.ts'

const HORA_MS = 60 * 60 * 1000

/**
 * Monta as linhas da tabela de equipe (ativos, risco, ociosidade), filtra e
 * ordena. Também formata a data da saudação e a linha de meta do dashboard.
 * Quem está ocioso e o chamado em risco vêm de `indicadores-gestor.ts`.
 * Não desenha a tabela — isso fica em `PainelEquipe.tsx`; estado de filtro,
 * busca e ordenação, em `TelaGestor`.
 */
export type FiltroEquipeGestor = 'todos' | 'ociosos' | 'com_risco'
export type OrdenacaoEquipeGestor = 'ativos' | 'risco' | 'ociosidade'

export type LinhaEquipeGestor = {
  consultorId: string
  nome: string
  grupoNome: string
  ocioso: boolean
  ativos: number
  emRisco: number
  textoOciosidade: string
  horasOciosidade: number
}

export function primeiroNome(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  return partes[0] ?? nome
}

export function iniciaisDoNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0]!.charAt(0).toUpperCase()
  const primeira = partes[0]!.charAt(0)
  const ultima = partes[partes.length - 1]!.charAt(0)
  return `${primeira}${ultima}`.toUpperCase()
}

function instanteUltimaAtividadeConsultor(
  consultorId: string,
  historico: HistoricoEntrada[],
  chamados: Chamado[],
): number | null {
  let maxMs = 0
  let encontrou = false

  for (const entrada of historico) {
    if (entrada.usuario_id === consultorId) {
      const ms = new Date(entrada.ocorrido_em).getTime()
      if (ms > maxMs) {
        maxMs = ms
        encontrou = true
      }
    }
  }

  for (const chamado of chamados) {
    if (chamado.responsavel_id === consultorId) {
      const ms = new Date(chamado.atualizado_em).getTime()
      if (ms > maxMs) {
        maxMs = ms
        encontrou = true
      }
    }
  }

  if (!encontrou) {
    return null
  }
  return maxMs
}

export function calcularHorasOciosidade(
  consultorId: string,
  tenant: Pick<TenantSessao, 'historico' | 'chamados' | 'meta'>,
): number | null {
  const instante = instanteUltimaAtividadeConsultor(
    consultorId,
    tenant.historico,
    tenant.chamados,
  )
  if (instante === null) {
    return null
  }
  const diff = new Date(tenant.meta.agora).getTime() - instante
  return Math.floor(diff / HORA_MS)
}

export function formatarTextoOciosidade(horas: number | null): string {
  if (horas === null) {
    return '—'
  }
  return `${horas}h`
}

function contarAtivosDoConsultor(
  consultorId: string,
  chamados: Chamado[],
): number {
  return chamados.filter(
    (c) =>
      chamadoAtivo(c.status) && c.responsavel_id === consultorId,
  ).length
}

function contarEmRiscoDoConsultor(
  consultorId: string,
  chamados: Chamado[],
  agora: string,
): number {
  return chamados.filter(
    (c) =>
      chamadoAtivo(c.status) &&
      c.responsavel_id === consultorId &&
      chamadoEmRisco(c, agora),
  ).length
}

export function montarLinhasEquipe(
  tenant: TenantSessao,
  consultorIds: string[],
): LinhaEquipeGestor[] {
  const agora = tenant.meta.agora
  const linhas: LinhaEquipeGestor[] = []

  for (const consultorId of consultorIds) {
    const consultor = tenant.usuarios.find((u) => u.id === consultorId)
    if (!consultor) continue
    const grupo = tenant.grupos.find((g) => g.id === consultor.grupo_id)
    const ocioso = consultorOcioso(consultorId, tenant.chamados)
    const horas = calcularHorasOciosidade(consultorId, tenant)
    linhas.push({
      consultorId,
      nome: consultor.nome,
      grupoNome: grupo?.nome ?? '—',
      ocioso,
      ativos: contarAtivosDoConsultor(consultorId, tenant.chamados),
      emRisco: contarEmRiscoDoConsultor(consultorId, tenant.chamados, agora),
      textoOciosidade: formatarTextoOciosidade(horas),
      horasOciosidade: horas ?? -1,
    })
  }

  return linhas
}

export function filtrarLinhasEquipe(
  linhas: LinhaEquipeGestor[],
  filtro: FiltroEquipeGestor,
  busca: string,
): LinhaEquipeGestor[] {
  const termo = busca.trim().toLowerCase()
  return linhas.filter((linha) => {
    if (filtro === 'ociosos' && !linha.ocioso) return false
    if (filtro === 'com_risco' && linha.emRisco === 0) return false
    if (termo && !linha.nome.toLowerCase().includes(termo)) return false
    return true
  })
}

function compararNome(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR')
}

export function ordenarLinhasEquipe(
  linhas: LinhaEquipeGestor[],
  ordenacao: OrdenacaoEquipeGestor,
): LinhaEquipeGestor[] {
  const copia = [...linhas]
  copia.sort((a, b) => {
    if (ordenacao === 'ativos') {
      const diff = b.ativos - a.ativos
      if (diff !== 0) return diff
      return compararNome(a.nome, b.nome)
    }
    if (ordenacao === 'risco') {
      const diff = b.emRisco - a.emRisco
      if (diff !== 0) return diff
      return compararNome(a.nome, b.nome)
    }
    if (a.ocioso !== b.ocioso) {
      return a.ocioso ? -1 : 1
    }
    const horasA = a.horasOciosidade
    const horasB = b.horasOciosidade
    if (horasA !== horasB) {
      return horasB - horasA
    }
    return compararNome(a.nome, b.nome)
  })
  return copia
}

export function formatarDataSaudacaoGestor(
  agora: string,
  usuario: Usuario,
): string {
  return new Intl.DateTimeFormat(usuario.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: usuario.zoneinfo,
  }).format(new Date(agora))
}

export function formatarLinhaMetaDashboard(
  dataTexto: string,
  totalAtivos: number,
  totalConsultores: number,
): string {
  const textoChamados =
    totalAtivos === 1 ? '1 chamado ativo' : `${totalAtivos} chamados ativos`
  const textoConsultores =
    totalConsultores === 1
      ? '1 consultor'
      : `${totalConsultores} consultores`
  return `${dataTexto} · ${textoChamados} · ${textoConsultores}`
}