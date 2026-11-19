import { describe, expect, it } from 'vitest'
import type { Chamado, TenantSessao } from './snapshot.ts'
import { montarAberturaChamadoCliente } from './abrir-chamado-cliente.ts'

const chamadoExistente: Chamado = {
  id: 'antigo',
  numero: 40,
  titulo: 'Já existia no tenant',
  descricao: 'Texto antigo que não pode ser copiado',
  categoria_id: 'c-app',
  grupo_id: 'g-app',
  prioridade: 'alta',
  status: 'fechado',
  solicitante_id: 'outra-pessoa',
  responsavel_id: 'consultor',
  aberto_em: '2026-10-01T00:00:00Z',
  atualizado_em: '2026-10-01T00:00:00Z',
  prazo_primeira_resposta: '2026-10-01T08:00:00Z',
  prazo_resolucao: '2026-10-02T00:00:00Z',
  sla_pausado: false,
}

function tenantBase(parcial: Partial<TenantSessao> = {}): TenantSessao {
  return {
    meta: {
      tenant: 't',
      gerado_em: '2026-11-03T13:00:00Z',
      agora: '2026-11-03T13:00:00Z',
      status_possiveis: ['aberto'],
      prioridades: ['media'],
    },
    grupos: [
      { id: 'g-app', nome: 'Aplicações', gestor_id: 'gestor' },
      { id: 'g-infra', nome: 'Infraestrutura', gestor_id: 'gestor' },
    ],
    categorias: [
      { id: 'c-app', nome: 'ERP', grupo_id: 'g-app' },
      { id: 'c-infra', nome: 'Rede e VPN', grupo_id: 'g-infra' },
      { id: 'c-infra-2', nome: 'E-mail', grupo_id: 'g-infra' },
    ],
    sla: [{ prioridade: 'media', primeira_resposta_horas: 8, resolucao_horas: 24 }],
    usuarios: [],
    chamados: [chamadoExistente],
    mensagens: [],
    historico: [],
    ...parcial,
  }
}

describe('montarAberturaChamadoCliente', () => {
  it('abre sem dono, prioridade média, no grupo Infraestrutura e com número seguinte', () => {
    const chamado = montarAberturaChamadoCliente(
      tenantBase(),
      'leandro',
      '  Teclado falhou  ',
      '  Não digita  ',
      'novo-id',
    )!

    expect(chamado.id).toBe('novo-id')
    expect(chamado.status).toBe('aberto')
    expect(chamado.prioridade).toBe('media')
    expect(chamado.responsavel_id).toBeNull()
    expect(chamado.grupo_id).toBe('g-infra')
    expect(chamado.categoria_id).toBe('c-infra')
    expect(chamado.numero).toBe(41)
    expect(chamado.titulo).toBe('Teclado falhou')
    expect(chamado.descricao).toBe('Não digita')
    expect(chamado.titulo).not.toBe(chamadoExistente.titulo)
    expect(chamado.descricao).not.toBe(chamadoExistente.descricao)
    expect(chamado.solicitante_id).toBe('leandro')
    expect(chamado.aberto_em).toBe('2026-11-03T13:00:00Z')
    expect(chamado.prazo_primeira_resposta).toBe('2026-11-03T21:00:00.000Z')
    expect(chamado.prazo_resolucao).toBe('2026-11-04T13:00:00.000Z')
    expect(chamado.sla_pausado).toBe(false)
  })

  it('começa no número 1 quando ainda não há chamados', () => {
    const chamado = montarAberturaChamadoCliente(
      tenantBase({ chamados: [] }),
      'leandro',
      'Primeiro',
      'Descrição',
      'novo-id',
    )

    expect(chamado!.numero).toBe(1)
  })

  it('não monta com texto vazio', () => {
    expect(
      montarAberturaChamadoCliente(tenantBase(), 'leandro', '   ', 'Algo', 'novo-id'),
    ).toBeNull()
  })

  it('não monta sem o grupo Infraestrutura', () => {
    const tenant = tenantBase({
      grupos: [{ id: 'g-app', nome: 'Aplicações', gestor_id: 'gestor' }],
    })

    expect(
      montarAberturaChamadoCliente(tenant, 'leandro', 'Assunto', 'Descrição', 'novo-id'),
    ).toBeNull()
  })
})
