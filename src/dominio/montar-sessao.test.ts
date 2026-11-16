import { describe, expect, it } from 'vitest'
import { criarGeradorComSemente } from './aleatorio.ts'
import { montarSessao } from './montar-sessao.ts'
import type { SnapshotCompleto } from './snapshot.ts'
import type { Usuario } from './tipos.ts'

const leandro: Usuario = {
  id: '7a853f14-c064-4dc4-bb24-8e8fdce4ccd4',
  nome: 'Leandro Mendes',
  email: 'leandro@example',
  perfil: 'cliente',
  locale: 'pt-PT',
  zoneinfo: 'Europe/Lisbon',
}

const thiago: Usuario = {
  id: '50039fe7-2ddf-4a02-8045-c635a4c724f6',
  nome: 'Thiago Nascimento',
  email: 'thiago@example',
  perfil: 'consultor',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
  grupo_id: 'grupo-infra',
}

function criarSnapshotMinimo(): SnapshotCompleto {
  return {
    meta: {
      tenant: 'Teste',
      gerado_em: '2026-01-01T00:00:00Z',
      agora: '2026-01-01T00:00:00Z',
      status_possiveis: [
        'aberto',
        'em_atendimento',
        'aguardando_cliente',
        'resolvido',
        'fechado',
      ],
      prioridades: ['media'],
    },
    grupos: [{ id: 'grupo-infra', nome: 'Infra', gestor_id: 'g1' }],
    categorias: [{ id: 'cat1', nome: 'Rede', grupo_id: 'grupo-infra' }],
    sla: [
      {
        prioridade: 'media',
        primeira_resposta_horas: 8,
        resolucao_horas: 24,
      },
    ],
    usuarios: [leandro, thiago],
    chamados: [
      {
        id: 'c1',
        numero: 1,
        titulo: 'A',
        descricao: 'd',
        categoria_id: 'cat1',
        grupo_id: 'grupo-infra',
        prioridade: 'media',
        status: 'aberto',
        solicitante_id: leandro.id,
        responsavel_id: null,
        aberto_em: '2026-01-01T00:00:00Z',
        atualizado_em: '2026-01-01T00:00:00Z',
        prazo_primeira_resposta: '2026-01-01T08:00:00Z',
        prazo_resolucao: '2026-01-02T00:00:00Z',
        sla_pausado: false,
      },
      {
        id: 'c2',
        numero: 2,
        titulo: 'B',
        descricao: 'd',
        categoria_id: 'cat1',
        grupo_id: 'grupo-infra',
        prioridade: 'media',
        status: 'aberto',
        solicitante_id: 'outro',
        responsavel_id: null,
        aberto_em: '2026-01-01T00:00:00Z',
        atualizado_em: '2026-01-01T00:00:00Z',
        prazo_primeira_resposta: '2026-01-01T08:00:00Z',
        prazo_resolucao: '2026-01-02T00:00:00Z',
        sla_pausado: false,
      },
    ],
    mensagens: [
      {
        id: 'm1',
        chamado_id: 'c1',
        autor_id: leandro.id,
        corpo: 'oi',
        criado_em: '2026-01-01T00:00:00Z',
        interna: false,
      },
      {
        id: 'm2',
        chamado_id: 'c2',
        autor_id: leandro.id,
        corpo: 'oi',
        criado_em: '2026-01-01T00:00:00Z',
        interna: false,
      },
    ],
    historico: [
      {
        id: 'h1',
        chamado_id: 'c1',
        tipo: 'abertura',
        ocorrido_em: '2026-01-01T00:00:00Z',
      },
    ],
  }
}

describe('montarSessao', () => {
  it('cliente carrega todos os chamados do solicitante', () => {
    const tenant = montarSessao(criarSnapshotMinimo(), leandro)
    expect(tenant.chamados).toHaveLength(1)
    expect(tenant.chamados[0]?.id).toBe('c1')
    expect(tenant.mensagens).toHaveLength(1)
    expect(tenant.historico).toHaveLength(1)
    expect(tenant.usuarios).toHaveLength(2)
  })

  it('consultor sorteia entre 20 e 50 chamados do grupo', () => {
    const aleatorio = criarGeradorComSemente(42)
    const snapshot = criarSnapshotMinimo()
    const chamadosExtras = Array.from({ length: 40 }, (_, indice) => ({
      ...snapshot.chamados[0]!,
      id: `extra-${indice}`,
      numero: indice + 10,
      status: 'fechado' as const,
    }))
    snapshot.chamados.push(...chamadosExtras)

    const tenant = montarSessao(snapshot, thiago, aleatorio)
    expect(tenant.chamados.length).toBeGreaterThanOrEqual(20)
    expect(tenant.chamados.length).toBeLessThanOrEqual(50)
    expect(tenant.chamados.every((c) => c.grupo_id === 'grupo-infra')).toBe(true)
  })
})