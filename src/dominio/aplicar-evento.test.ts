import { describe, expect, it } from 'vitest'
import { aplicarEvento } from './aplicar-evento.ts'
import type { TenantSessao } from './snapshot.ts'
import type { EventoChamadoAberto } from './evento.ts'
import { AUTOR_SISTEMA_ID } from './mensagens-sistema.ts'

const tenantBase: TenantSessao = {
  meta: {
    tenant: 't',
    gerado_em: '2026-01-01T00:00:00Z',
    agora: '2026-01-01T12:00:00Z',
    status_possiveis: ['aberto', 'em_atendimento', 'resolvido', 'fechado'],
    prioridades: ['media'],
  },
  grupos: [],
  categorias: [],
  sla: [],
  usuarios: [
    {
      id: 'c1',
      nome: 'Marina',
      email: 'm@e',
      perfil: 'consultor',
      locale: 'pt-BR',
      zoneinfo: 'America/Sao_Paulo',
      grupo_id: 'g1',
    },
  ],
  chamados: [
    {
      id: 'ch1',
      numero: 1,
      titulo: 'Teste',
      descricao: 'd',
      categoria_id: 'cat',
      grupo_id: 'g1',
      prioridade: 'media',
      status: 'aberto',
      solicitante_id: 's1',
      responsavel_id: null,
      aberto_em: '2026-01-01T00:00:00Z',
      atualizado_em: '2026-01-01T00:00:00Z',
      prazo_primeira_resposta: '2026-01-02T00:00:00Z',
      prazo_resolucao: '2026-01-03T00:00:00Z',
      sla_pausado: false,
    },
  ],
  mensagens: [],
  historico: [],
}

describe('aplicarEvento', () => {
  it('insere chamado.aberto e ignora duplicata de evento', () => {
    const eventos = new Set<string>()
    const evento: EventoChamadoAberto = {
      id: 'evt-1',
      tipo: 'chamado.aberto',
      ocorrido_em: '2026-01-01T12:00:00Z',
      payload: {
        ...tenantBase.chamados[0],
        id: 'ch-novo',
        numero: 2,
      },
    }
    const t1 = aplicarEvento(tenantBase, evento, eventos)
    expect(t1.chamados).toHaveLength(2)
    const t2 = aplicarEvento(t1, evento, eventos)
    expect(t2.chamados).toHaveLength(2)
  })

  it('atribui consultor e cria mensagem de sistema', () => {
    const eventos = new Set<string>()
    const t = aplicarEvento(tenantBase, {
      id: 'evt-a',
      tipo: 'chamado.atribuido',
      ocorrido_em: '2026-01-01T12:00:00Z',
      payload: { chamado_id: 'ch1', consultor_id: 'c1' },
    }, eventos)
    expect(t.chamados[0].responsavel_id).toBe('c1')
    expect(t.chamados[0].status).toBe('em_atendimento')
    expect(t.mensagens.some((m) => m.autor_id === AUTOR_SISTEMA_ID)).toBe(true)
    expect(t.historico.some((h) => h.tipo === 'atribuicao')).toBe(true)
  })

  it('desatribui consultor e volta em_atendimento para aberto', () => {
    const eventos = new Set<string>()
    const tenant = {
      ...tenantBase,
      chamados: [
        {
          ...tenantBase.chamados[0],
          status: 'em_atendimento' as const,
          responsavel_id: 'c1',
        },
      ],
    }

    const desatribuido = aplicarEvento(tenant, {
      id: 'evt-d',
      tipo: 'chamado.atribuido',
      ocorrido_em: '2026-01-01T12:05:00Z',
      payload: { chamado_id: 'ch1', consultor_id: null },
    }, eventos)
    expect(desatribuido.chamados[0].responsavel_id).toBeNull()
    expect(desatribuido.chamados[0].status).toBe('aberto')
    expect(
      desatribuido.mensagens.some((m) => m.corpo === 'Chamado sem responsável'),
    ).toBe(true)
  })

  it('mensagem.adicionada ignora id duplicado', () => {
    const eventos = new Set<string>()
    const evento = {
      id: 'evt-m',
      tipo: 'mensagem.adicionada' as const,
      ocorrido_em: '2026-01-01T12:00:00Z',
      payload: {
        id: 'msg1',
        chamado_id: 'ch1',
        autor_id: 'c1',
        corpo: 'Oi',
        criado_em: '2026-01-01T12:00:00Z',
        interna: false,
      },
    }
    const t1 = aplicarEvento(tenantBase, evento, eventos)
    expect(t1.mensagens).toHaveLength(1)
    const t2 = aplicarEvento(t1, evento, eventos)
    expect(t2.mensagens).toHaveLength(1)
  })

  it('status.alterado atualiza chamado e historico', () => {
    const eventos = new Set<string>()
    const tenant = {
      ...tenantBase,
      chamados: [
        {
          ...tenantBase.chamados[0],
          status: 'em_atendimento' as const,
          responsavel_id: 'c1',
        },
      ],
    }
    const t = aplicarEvento(tenant, {
      id: 'evt-s',
      tipo: 'status.alterado',
      ocorrido_em: '2026-01-01T13:00:00Z',
      payload: {
        chamado_id: 'ch1',
        de: 'em_atendimento',
        para: 'resolvido',
        motivo: 'ok',
        usuario_id: 'c1',
      },
    }, eventos)
    expect(t.chamados[0].status).toBe('resolvido')
    expect(t.historico.some((h) => h.tipo === 'status')).toBe(true)
  })
})