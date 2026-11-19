import { chamadoAtivo, classificarFaixaPrazo } from '../../dominio/prazo.ts'
import type { Chamado } from '../../dominio/snapshot.ts'
import type { StatusChamado } from '../../dominio/chamado.ts'

/**
 * Conta ativos, SLA em risco, sem responsável e consultores ociosos, e
 * rotula prioridade e status. Não desenha os cards — isso fica em
 * `PainelIndicadores.tsx`. Risco e ociosidade também alimentam
 * `equipe-gestor.ts` e `lista-chamados-gestor.ts`.
 */
export function chamadoEmRisco(
  chamado: Chamado,
  agora: string,
): boolean {
  if (!chamadoAtivo(chamado.status)) {
    return false
  }
  const faixa = classificarFaixaPrazo(
    chamado.prazo_resolucao,
    agora,
    chamado.status,
  )
  return faixa === 'vencido' || faixa === 'urgente' || faixa === 'alerta'
}

export function contarChamadosAtivos(chamados: Chamado[]): number {
  return chamados.filter((c) => chamadoAtivo(c.status)).length
}

export function contarChamadosEmRisco(
  chamados: Chamado[],
  agora: string,
): number {
  return chamados.filter((c) => chamadoEmRisco(c, agora)).length
}

export function contarChamadosSemResponsavel(chamados: Chamado[]): number {
  return chamados.filter(
    (c) => chamadoAtivo(c.status) && c.responsavel_id === null,
  ).length
}

export function consultorOcioso(
  consultorId: string,
  chamados: Chamado[],
): boolean {
  return !chamados.some(
    (c) =>
      chamadoAtivo(c.status) && c.responsavel_id === consultorId,
  )
}

export function contarConsultoresOciosos(
  consultorIds: string[],
  chamados: Chamado[],
): number {
  return consultorIds.filter((id) => consultorOcioso(id, chamados)).length
}

export function rotuloPrioridade(prioridade: string): string {
  const mapa: Record<string, string> = {
    baixa: 'baixa',
    media: 'média',
    alta: 'alta',
    critica: 'crítica',
  }
  return mapa[prioridade] ?? prioridade
}

export function textoStatusColunaGestor(status: StatusChamado): string {
  const mapa: Record<StatusChamado, string> = {
    aberto: 'Aberto',
    em_atendimento: 'Em atendimento',
    aguardando_cliente: 'Aguardando cliente',
    resolvido: 'Resolvido',
    fechado: 'Fechado',
  }
  return mapa[status]
}