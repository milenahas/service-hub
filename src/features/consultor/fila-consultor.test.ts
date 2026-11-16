import { describe, expect, it } from 'vitest'
import { filtrarPorAba, listarChamadosFila } from './fila-consultor.ts'
import type { TenantSessao } from '../../dominio/snapshot.ts'
import type { Usuario } from '../../dominio/tipos.ts'

const consultor: Usuario = {
  id: 'cons',
  nome: 'Marina',
  email: 'm',
  perfil: 'consultor',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
  grupo_id: 'g1',
}

const tenant: TenantSessao = {
  meta: {
    tenant: 't',
    gerado_em: '2026-01-01T00:00:00Z',
    agora: '2026-01-01T12:00:00Z',
    status_possiveis: ['aberto', 'em_atendimento', 'resolvido'],
    prioridades: ['media'],
  },
  grupos: [{ id: 'g1', nome: 'Infra', gestor_id: 'gest' }],
  categorias: [],
  sla: [],
  usuarios: [
    consultor,
    {
      id: 'outro',
      nome: 'Colega',
      email: 'o',
      perfil: 'consultor',
      locale: 'pt-BR',
      zoneinfo: 'America/Sao_Paulo',
      grupo_id: 'g1',
    },
    {
      id: 'cli',
      nome: 'Cliente',
      email: 'c',
      perfil: 'cliente',
      locale: 'pt-BR',
      zoneinfo: 'America/Sao_Paulo',
    },
  ],
  chamados: [
    {
      id: 'a',
      numero: 10,
      titulo: 'Rede lenta',
      descricao: '',
      categoria_id: 'c',
      grupo_id: 'g1',
      prioridade: 'media',
      status: 'em_atendimento',
      solicitante_id: 'cli',
      responsavel_id: 'cons',
      aberto_em: '2026-01-01T00:00:00Z',
      atualizado_em: '2026-01-01T00:00:00Z',
      prazo_primeira_resposta: '2026-01-02T00:00:00Z',
      prazo_resolucao: '2026-01-01T12:20:00Z',
      sla_pausado: false,
    },
    {
      id: 'b',
      numero: 20,
      titulo: 'Sem dono',
      descricao: '',
      categoria_id: 'c',
      grupo_id: 'g1',
      prioridade: 'media',
      status: 'aberto',
      solicitante_id: 'cli',
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

describe('fila-consultor', () => {
  it('filtra minha fila e sem dono', () => {
    const minha = filtrarPorAba(tenant.chamados, 'minha', consultor, tenant)
    expect(minha.map((c) => c.id)).toEqual(['a'])
    const semDono = filtrarPorAba(tenant.chamados, 'sem_dono', consultor, tenant)
    expect(semDono.map((c) => c.id)).toEqual(['b'])
  })

  it('busca por número e cliente', () => {
    const porNumero = listarChamadosFila(
      tenant,
      consultor,
      'minha',
      '#10',
      'todos',
    )
    expect(porNumero).toHaveLength(1)
    const porCliente = listarChamadosFila(
      tenant,
      consultor,
      'sem_dono',
      'Cliente',
      'todos',
    )
    expect(porCliente).toHaveLength(1)
  })
})