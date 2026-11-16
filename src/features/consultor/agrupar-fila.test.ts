import { describe, expect, it } from 'vitest'
import { agruparFila } from './agrupar-fila.ts'
import type { Chamado } from '../../dominio/snapshot.ts'

describe('agrupar-fila', () => {
  const agora = '2026-01-01T12:00:00Z'
  const chamados: Chamado[] = [
    {
      id: '1',
      numero: 1,
      titulo: 'Urgente',
      descricao: '',
      categoria_id: 'c',
      grupo_id: 'g',
      prioridade: 'media',
      status: 'em_atendimento',
      solicitante_id: 's',
      responsavel_id: 'cons',
      aberto_em: agora,
      atualizado_em: agora,
      prazo_primeira_resposta: agora,
      prazo_resolucao: '2026-01-01T12:30:00Z',
      sla_pausado: false,
    },
    {
      id: '2',
      numero: 2,
      titulo: 'Aguardando',
      descricao: '',
      categoria_id: 'c',
      grupo_id: 'g',
      prioridade: 'media',
      status: 'aguardando_cliente',
      solicitante_id: 's',
      responsavel_id: 'cons',
      aberto_em: agora,
      atualizado_em: agora,
      prazo_primeira_resposta: agora,
      prazo_resolucao: '2026-01-05T00:00:00Z',
      sla_pausado: false,
    },
  ]

  it('agrupa urgentes antes e aguardando cliente por último', () => {
    const secoes = agruparFila(chamados, 'minha', agora)
    expect(secoes[0].grupo).toBe('urgentes')
    expect(secoes.at(-1)?.grupo).toBe('aguardando_cliente')
  })
})