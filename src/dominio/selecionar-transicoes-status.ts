import type { StatusChamado } from './chamado.ts'

const TRANSICOES: Record<StatusChamado, StatusChamado[]> = {
  aberto: ['em_atendimento', 'aguardando_cliente', 'resolvido', 'fechado'],
  em_atendimento: ['aberto', 'aguardando_cliente', 'resolvido', 'fechado'],
  aguardando_cliente: ['em_atendimento', 'resolvido', 'fechado'],
  resolvido: ['aberto'],
  fechado: ['aberto'],
}

export function selecionarTransicoesStatus(atual: StatusChamado): StatusChamado[] {
  return TRANSICOES[atual] ?? []
}