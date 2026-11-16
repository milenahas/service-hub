import { describe, expect, it, vi } from 'vitest'
import { aplicarEvento } from './aplicar-evento.ts'
import { gerarChamadoInjetado, iniciarSimulacaoConsultor } from './simulacao-consultor.ts'
import type { TenantSessao } from './snapshot.ts'
import type { Usuario } from './tipos.ts'

const consultor: Usuario = {
  id: 'c1',
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
    status_possiveis: ['aberto'],
    prioridades: ['media', 'alta'],
  },
  grupos: [{ id: 'g1', nome: 'Infra', gestor_id: 'gest' }],
  categorias: [{ id: 'cat1', nome: 'Rede', grupo_id: 'g1' }],
  sla: [
    {
      prioridade: 'media',
      primeira_resposta_horas: 4,
      resolucao_horas: 24,
    },
  ],
  usuarios: [
    consultor,
    {
      id: 'cli',
      nome: 'Leandro',
      email: 'l',
      perfil: 'cliente',
      locale: 'pt-BR',
      zoneinfo: 'America/Sao_Paulo',
    },
  ],
  chamados: [
    {
      id: 'x',
      numero: 5,
      titulo: 'Existente',
      descricao: 'd',
      categoria_id: 'cat1',
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

describe('simulacao-consultor', () => {
  it('gera chamado com grupo e numero sequencial', () => {
    const evento = gerarChamadoInjetado(tenant, consultor, () => 0.5)
    expect(evento.payload.grupo_id).toBe('g1')
    expect(evento.payload.numero).toBe(6)
    expect(evento.payload.titulo).toMatch(/Chamado simulado/)
  })

  it('roteiro de demo dispara eventos com fake timers', () => {
    vi.useFakeTimers()
    let estado = { ...tenant, chamados: [...tenant.chamados] }
    const eventos = new Set<string>()
    const controle = iniciarSimulacaoConsultor(
      consultor,
      () => estado,
      (e) => {
        estado = aplicarEvento(estado, e, eventos)
      },
      { modoDemonstracao: true, aleatorio: () => 0.1 },
    )
    vi.advanceTimersByTime(15_000)
    const injetados = estado.chamados.filter((c) =>
      c.titulo.includes('Chamado simulado'),
    )
    expect(injetados).toHaveLength(1)
    controle.parar()
    vi.useRealTimers()
  })
})