import { describe, expect, it } from 'vitest'
import type { Chamado } from '../../dominio/snapshot.ts'
import { ordenarChamadosCliente } from './lista-cliente.ts'

function chamado(numero: number, abertoEm: string): Chamado {
  return {
    id: `c-${numero}`,
    numero,
    titulo: `Chamado ${numero}`,
    descricao: '',
    categoria_id: 'cat',
    grupo_id: 'grupo',
    prioridade: 'media',
    status: 'aberto',
    solicitante_id: 'cli',
    responsavel_id: null,
    aberto_em: abertoEm,
    atualizado_em: abertoEm,
    prazo_primeira_resposta: abertoEm,
    prazo_resolucao: abertoEm,
    sla_pausado: false,
  }
}

describe('ordenarChamadosCliente', () => {
  it('coloca o mais novo primeiro e, na mesma data, o número maior', () => {
    const lista = [
      chamado(1, '2026-11-01T00:00:00Z'),
      chamado(2, '2026-11-03T00:00:00Z'),
      chamado(5, '2026-11-03T00:00:00Z'),
    ]

    expect(ordenarChamadosCliente(lista).map((item) => item.numero)).toEqual([
      5, 2, 1,
    ])
    expect(lista.map((item) => item.numero)).toEqual([1, 2, 5])
  })
})