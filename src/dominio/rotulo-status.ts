import type { StatusChamado } from './chamado.ts'

const ROTULOS: Record<StatusChamado, string> = {
  aberto: 'Aberto',
  em_atendimento: 'Em atendimento',
  aguardando_cliente: 'Aguardando cliente',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
}

export function formatarRotuloStatus(status: StatusChamado): string {
  return ROTULOS[status]
}