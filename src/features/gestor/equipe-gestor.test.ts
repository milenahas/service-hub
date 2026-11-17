import { describe, expect, it } from 'vitest'
import type { TenantSessao } from '../../dominio/snapshot.ts'
import {
  calcularHorasOciosidade,
  formatarTextoOciosidade,
  montarLinhasEquipe,
  ordenarLinhasEquipe,
} from './equipe-gestor.ts'

const tenantVazio: TenantSessao = {
  meta: {
    tenant: 't',
    gerado_em: '2026-01-01T00:00:00Z',
    agora: '2026-01-01T12:00:00Z',
    status_possiveis: ['aberto'],
    prioridades: ['media'],
  },
  grupos: [{ id: 'g', nome: 'Infra', gestor_id: 'gest' }],
  categorias: [],
  sla: [],
  usuarios: [
    {
      id: 'c1',
      nome: 'Ana Silva',
      email: 'a',
      perfil: 'consultor',
      locale: 'pt-BR',
      zoneinfo: 'America/Sao_Paulo',
      grupo_id: 'g',
    },
    {
      id: 'c2',
      nome: 'Bruno Lima',
      email: 'b',
      perfil: 'consultor',
      locale: 'pt-BR',
      zoneinfo: 'America/Sao_Paulo',
      grupo_id: 'g',
    },
  ],
  chamados: [],
  mensagens: [],
  historico: [],
  consultoresEquipeGestor: ['c1', 'c2'],
}

describe('equipe-gestor', () => {
  it('histórico ausente exibe traço', () => {
    expect(formatarTextoOciosidade(null)).toBe('—')
    expect(calcularHorasOciosidade('c1', tenantVazio)).toBeNull()
  })

  it('ordenar por ativos coloca maior primeiro', () => {
    const tenant: TenantSessao = {
      ...tenantVazio,
      chamados: [
        {
          id: 'a',
          numero: 1,
          titulo: 'A',
          descricao: '',
          categoria_id: 'cat',
          grupo_id: 'g',
          prioridade: 'media',
          status: 'em_atendimento',
          solicitante_id: 'cli',
          responsavel_id: 'c1',
          aberto_em: '2026-01-01T00:00:00Z',
          atualizado_em: '2026-01-01T00:00:00Z',
          prazo_primeira_resposta: '2026-01-02T00:00:00Z',
          prazo_resolucao: '2026-01-05T00:00:00Z',
          sla_pausado: false,
        },
        {
          id: 'b',
          numero: 2,
          titulo: 'B',
          descricao: '',
          categoria_id: 'cat',
          grupo_id: 'g',
          prioridade: 'media',
          status: 'em_atendimento',
          solicitante_id: 'cli',
          responsavel_id: 'c2',
          aberto_em: '2026-01-01T00:00:00Z',
          atualizado_em: '2026-01-01T00:00:00Z',
          prazo_primeira_resposta: '2026-01-02T00:00:00Z',
          prazo_resolucao: '2026-01-05T00:00:00Z',
          sla_pausado: false,
        },
        {
          id: 'c',
          numero: 3,
          titulo: 'C',
          descricao: '',
          categoria_id: 'cat',
          grupo_id: 'g',
          prioridade: 'media',
          status: 'em_atendimento',
          solicitante_id: 'cli',
          responsavel_id: 'c2',
          aberto_em: '2026-01-01T00:00:00Z',
          atualizado_em: '2026-01-01T00:00:00Z',
          prazo_primeira_resposta: '2026-01-02T00:00:00Z',
          prazo_resolucao: '2026-01-05T00:00:00Z',
          sla_pausado: false,
        },
      ],
    }
    const linhas = montarLinhasEquipe(tenant, ['c1', 'c2'])
    const ordenadas = ordenarLinhasEquipe(linhas, 'ativos')
    expect(ordenadas[0]!.consultorId).toBe('c2')
    expect(ordenadas[0]!.ativos).toBe(2)
  })
})