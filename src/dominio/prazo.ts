import type { FaixaPrazo } from '../shared/components/tipos.ts'
import type { Chamado } from './snapshot.ts'
import type { StatusChamado } from './chamado.ts'

const HORA_MS = 60 * 60 * 1000
const MINUTO_MS = 60 * 1000

/** Cor da faixa vertical (3px) na linha da fila do consultor. */
export type FaixaBarraItemFila = 'urgente' | 'alerta' | 'neutro'

export function faixaBarraItemFila(
  status: StatusChamado,
  faixa: FaixaPrazo,
): FaixaBarraItemFila {
  if (status === 'aguardando_cliente') {
    return 'neutro'
  }
  if (faixa === 'vencido' || faixa === 'urgente') {
    return 'urgente'
  }
  if (faixa === 'alerta') {
    return 'alerta'
  }
  return 'neutro'
}

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
    return 'vencido'
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

/**
 * Texto legível do prazo de resolução no selo da fila e do painel do consultor.
 * Compara `prazoResolucao` com `agora` (relógio do tenant, não o do navegador).
 * Chamado inativo (resolvido/fechado) → `"—"`; senão, por exemplo:
 * `Vencido há 2h`, `Vence em 45min` (menos de 4h), `Prazo em 5h` (acima de 4h).
 */
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
    return `Vencido há ${duracao}`
  }
  if (restante < HORA_MS) {
    return `Vence em ${duracao}`
  }
  if (restante < 4 * HORA_MS) {
    return `Vence em ${duracao}`
  }
  return `Prazo em ${duracao}`
}

/** Converte `dataHora` do chamado em milissegundos; ausente ou vazia vira 0 (não entra no `Math.max`). */
function msDeDataOpcional(
  dataHora: string | null | undefined,
): number {
  if (!dataHora) {
    return 0
  }
  return new Date(dataHora).getTime()
}

/**
 * “Quando esse chamado encerrou”, em milissegundos, para ordenar a aba Concluídos.
 * Usa o instante mais recente entre `resolvido_em`, `fechado_em` e `atualizado_em`
 * (campos opcionais que não existem contam como 0 e não vencem o `Math.max`).
 */
export function dataConclusaoChamado(chamado: Chamado): number {
  const resolvido = msDeDataOpcional(chamado.resolvido_em)
  const fechado = msDeDataOpcional(chamado.fechado_em)
  const atualizado = new Date(chamado.atualizado_em).getTime()
  return Math.max(resolvido, fechado, atualizado)
}