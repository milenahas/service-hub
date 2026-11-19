import { describe, expect, it } from 'vitest'
import type { Chamado } from '../../dominio/snapshot.ts'
import {
  filtrarChamadosCliente,
  ordenarChamadosCliente,
} from './lista-cliente.ts'

function chamadoComTitulo(numero: number, titulo: string): Chamado {
  return { ...chamado(numero, '2026-11-01T00:00:00Z'), titulo }
}

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

function chamadoFechado(numero: number, abertoEm: string): Chamado {
  return { ...chamado(numero, abertoEm), status: 'fechado' }
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

  it('coloca reaberto acima dos fechados, mesmo com abertura mais antiga', () => {
    const reaberto = {
      ...chamado(3, '2026-10-01T00:00:00Z'),
      status: 'aberto' as const,
    }
    const resolvido = {
      ...chamado(6, '2026-09-01T00:00:00Z'),
      status: 'resolvido' as const,
    }
    const lista = [
      chamado(1, '2026-11-01T00:00:00Z'),
      chamadoFechado(2, '2026-11-05T00:00:00Z'),
      reaberto,
      chamadoFechado(4, '2026-11-04T00:00:00Z'),
      resolvido,
    ]

    expect(ordenarChamadosCliente(lista).map((item) => item.numero)).toEqual([
      1, 3, 6, 2, 4,
    ])
  })
})

const amostra = [
  chamadoComTitulo(10, 'Rede lenta'),
  chamadoComTitulo(42, 'Porta bloqueada'),
]

describe('filtrarChamadosCliente', () => {
  it('termo vazio ou só espaços devolve a lista na mesma ordem', () => {
    expect(filtrarChamadosCliente(amostra, '   ').map((item) => item.numero)).toEqual([
      10, 42,
    ])
  })

  it.each([
    ['rede', [10]],
    ['PORTA', [42]],
    ['#42', [42]],
    ['42', [42]],
    ['10', [10]],
    ['4', [42]],
    ['zzz', []],
    ['leandro', []],
  ])('termo %s fica com os números %j', (termo, numeros) => {
    expect(filtrarChamadosCliente(amostra, termo).map((item) => item.numero)).toEqual(
      numeros,
    )
  })

  it('cerquilha sozinha encontra todos pelo número', () => {
    expect(filtrarChamadosCliente(amostra, '#').map((item) => item.numero)).toEqual([
      10, 42,
    ])
  })

  it('mantém a ordem recebida e o array original', () => {
    const lista = [
      chamadoComTitulo(42, 'Porta bloqueada'),
      chamadoComTitulo(10, 'Rede lenta'),
    ]
    expect(filtrarChamadosCliente(lista, 'a').map((item) => item.numero)).toEqual([
      42, 10,
    ])
    expect(lista.map((item) => item.numero)).toEqual([42, 10])
  })
})