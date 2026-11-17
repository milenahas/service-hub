import { describe, expect, it } from 'vitest'
import type { Chamado, Mensagem, TenantSessao } from '../../dominio/snapshot.ts'
import {
  chamadoPermiteConversaGestor,
  filtrarChamadosGestor,
  listarChamadosModoIndicador,
  ordenarChamadosPorPrazo,
} from './lista-chamados-gestor.ts'

const agora = '2026-01-01T12:00:00Z'

const base: Chamado = {
  id: '1',
  numero: 1,
  titulo: 'T',
  descricao: '',
  categoria_id: 'c',
  grupo_id: 'g',
  prioridade: 'media',
  status: 'aberto',
  solicitante_id: 'cli',
  responsavel_id: null,
  aberto_em: '2026-01-01T00:00:00Z',
  atualizado_em: '2026-01-01T00:00:00Z',
  prazo_primeira_resposta: '2026-01-02T00:00:00Z',
  prazo_resolucao: '2026-01-01T13:00:00Z',
  sla_pausado: false,
}

const tenantMin: TenantSessao = {
  meta: {
    tenant: 't',
    gerado_em: '2026-01-01T00:00:00Z',
    agora,
    status_possiveis: ['aberto'],
    prioridades: ['media'],
  },
  grupos: [],
  categorias: [],
  sla: [],
  usuarios: [],
  chamados: [base],
  mensagens: [],
  historico: [],
  consultoresEquipeGestor: [],
}

describe('lista-chamados-gestor', () => {
  it('lista sla-4h inclui ativo em risco', () => {
    const lista = listarChamadosModoIndicador(tenantMin.chamados, 'sla-4h', agora)
    expect(lista).toHaveLength(1)
  })

  it('lista sem responsável', () => {
    const lista = listarChamadosModoIndicador(
      tenantMin.chamados,
      'sem-responsavel',
      agora,
    )
    expect(lista[0]!.responsavel_id).toBeNull()
  })

  it('ordena por prazo crescente', () => {
    const a = { ...base, id: 'a', prazo_resolucao: '2026-01-01T14:00:00Z' }
    const b = { ...base, id: 'b', prazo_resolucao: '2026-01-01T11:00:00Z' }
    const ordenados = ordenarChamadosPorPrazo([a, b])
    expect(ordenados[0]!.id).toBe('b')
  })

  it('filtro aguardando cliente', () => {
    const aguardando = { ...base, status: 'aguardando_cliente' as const }
    const lista = filtrarChamadosGestor([base, aguardando], 'aguardando_cliente', agora)
    expect(lista).toHaveLength(1)
    expect(lista[0]!.status).toBe('aguardando_cliente')
  })

  const mensagemPublica: Mensagem = {
    id: 'm1',
    chamado_id: '1',
    autor_id: 'cli',
    corpo: 'olá',
    criado_em: agora,
    interna: false,
  }
  const notaInterna: Mensagem = {
    ...mensagemPublica,
    id: 'm2',
    interna: true,
  }

  it.each([
    {
      nome: 'sem responsável',
      chamado: base,
      mensagens: [mensagemPublica],
      esperado: false,
    },
    {
      nome: 'com responsável sem mensagem',
      chamado: { ...base, responsavel_id: 'c1' },
      mensagens: [],
      esperado: false,
    },
    {
      nome: 'só nota interna',
      chamado: { ...base, responsavel_id: 'c1' },
      mensagens: [notaInterna],
      esperado: false,
    },
    {
      nome: 'com responsável e mensagem pública',
      chamado: { ...base, responsavel_id: 'c1' },
      mensagens: [mensagemPublica],
      esperado: true,
    },
  ])('conversa $nome → $esperado', ({ chamado, mensagens, esperado }) => {
    expect(chamadoPermiteConversaGestor(chamado, mensagens)).toBe(esperado)
  })
})