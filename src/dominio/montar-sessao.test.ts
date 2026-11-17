import { describe, expect, it } from 'vitest'
import { montarSessao } from './montar-sessao.ts'
import type { Chamado, SnapshotCompleto } from './snapshot.ts'
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

const felipe: Usuario = {
  id: '85d44809-37ca-4797-8fbf-53f112ebe792',
  nome: 'Felipe Gomes',
  email: 'felipe@example',
  perfil: 'consultor',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
  grupo_id: 'grupo-apps',
}

const ricardo: Usuario = {
  id: '875d257a-0dff-4428-a233-5332d0e67b86',
  nome: 'Ricardo Monteiro',
  email: 'ricardo@example',
  perfil: 'gestor',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
}

function criarChamado(
  campos: Pick<Chamado, 'id' | 'numero' | 'titulo' | 'status' | 'solicitante_id' | 'grupo_id'>,
): Chamado {
  return {
    descricao: 'd',
    categoria_id: 'cat1',
    prioridade: 'media',
    responsavel_id: null,
    aberto_em: '2026-01-01T00:00:00Z',
    atualizado_em: '2026-01-01T00:00:00Z',
    prazo_primeira_resposta: '2026-01-01T08:00:00Z',
    prazo_resolucao: '2026-01-02T00:00:00Z',
    sla_pausado: false,
    ...campos,
  }
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
    grupos: [
      { id: 'grupo-infra', nome: 'Infra', gestor_id: 'g1' },
      { id: 'grupo-apps', nome: 'Apps', gestor_id: 'g1' },
    ],
    categorias: [{ id: 'cat1', nome: 'Rede', grupo_id: 'grupo-infra' }],
    sla: [
      {
        prioridade: 'media',
        primeira_resposta_horas: 8,
        resolucao_horas: 24,
      },
    ],
    usuarios: [leandro, thiago, felipe, ricardo],
    chamados: [
      criarChamado({
        id: 'c1',
        numero: 1,
        titulo: 'A',
        status: 'aberto',
        solicitante_id: leandro.id,
        grupo_id: 'grupo-infra',
      }),
      criarChamado({
        id: 'c2',
        numero: 2,
        titulo: 'B',
        status: 'aberto',
        solicitante_id: 'outro',
        grupo_id: 'grupo-infra',
      }),
      criarChamado({
        id: 'c3',
        numero: 3,
        titulo: 'C',
        status: 'aguardando_cliente',
        solicitante_id: 'outro',
        grupo_id: 'grupo-infra',
      }),
      criarChamado({
        id: 'c4',
        numero: 4,
        titulo: 'D',
        status: 'em_atendimento',
        solicitante_id: 'outro',
        grupo_id: 'grupo-apps',
      }),
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
      {
        id: 'm4',
        chamado_id: 'c4',
        autor_id: leandro.id,
        corpo: 'apps',
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
    expect(tenant.usuarios).toHaveLength(4)
  })

  it('consultor carrega todos os chamados do grupo em qualquer status', () => {
    const tenant = montarSessao(criarSnapshotMinimo(), thiago)
    expect(tenant.chamados.map((c) => c.id)).toEqual(['c1', 'c2', 'c3'])
    expect(tenant.chamados.every((c) => c.grupo_id === 'grupo-infra')).toBe(true)
    expect(tenant.mensagens.map((m) => m.id)).toEqual(['m1', 'm2'])
  })

  it('gestor carrega todos os consultores e chamados dos grupos', () => {
    const tenant = montarSessao(criarSnapshotMinimo(), ricardo)
    expect(tenant.consultoresEquipeGestor).toEqual([thiago.id, felipe.id])
    expect(tenant.chamados.map((c) => c.id)).toEqual(['c1', 'c2', 'c3', 'c4'])
    expect(tenant.mensagens.map((m) => m.id)).toEqual(['m1', 'm2', 'm4'])
  })
})
