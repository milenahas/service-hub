import type { FaixaPrazo } from '../shared/components/tipos.ts'
import type { Chamado } from './snapshot.ts'
import type { StatusChamado } from './chamado.ts'

const HORA_MS = 60 * 60 * 1000
const MINUTO_MS = 60 * 1000

export function chamadoAtivo(status: StatusChamado): boolean {
  return status !== 'resolvido' && status !== 'fechado'
}

export function classificarFaixaPrazo(
  prazoResolucao: string,
  agora: string,
  status: StatusChamado,
): FaixaPrazo {
  if (!chamadoAtivo(status)) {
    return 'neutro'
  }
  const restante = new Date(prazoResolucao).getTime() - new Date(agora).getTime()
  if (restante < 0) {
    return 'estourado'
  }
  if (restante < HORA_MS) {
    return 'urgente'
  }
  if (restante < 4 * HORA_MS) {
    return 'alerta'
  }
  return 'neutro'
}

function formatarDuracao(ms: number): string {
  const totalMin = Math.floor(Math.abs(ms) / MINUTO_MS)
  const horas = Math.floor(totalMin / 60)
  const minutos = totalMin % 60
  if (horas > 0 && minutos > 0) {
    return `${horas}h ${minutos}min`
  }
  if (horas > 0) {
    return `${horas}h`
  }
  return `${minutos}min`
}

export function formatarTextoPrazoConsultor(
  prazoResolucao: string,
  agora: string,
  status: StatusChamado,
): string {
  if (!chamadoAtivo(status)) {
    return '—'
  }
  const restante = new Date(prazoResolucao).getTime() - new Date(agora).getTime()
  const duracao = formatarDuracao(restante)
  if (restante < 0) {
    return `Estourado há ${duracao}`
  }
  if (restante < HORA_MS) {
    return `Vence em ${duracao}`
  }
  if (restante < 4 * HORA_MS) {
    return `Vence em ${duracao}`
  }
  return `Prazo em ${duracao}`
}

export function dataConclusaoChamado(chamado: Chamado): number {
  const resolvido = chamado.resolvido_em
    ? new Date(chamado.resolvido_em).getTime()
    : 0
  const fechado = chamado.fechado_em
    ? new Date(chamado.fechado_em).getTime()
    : 0
  const atualizado = new Date(chamado.atualizado_em).getTime()
  return Math.max(resolvido, fechado, atualizado)
}