import { describe, expect, it, vi } from 'vitest'
import { aplicarEvento } from './aplicar-evento.ts'
import type { Chamado, TenantSessao } from './snapshot.ts'
import {
  gerarChamadoInjetadoGestor,
  gruposDaEquipe,
  iniciarSimulacaoGestor,
  listarChamadosSimulaveisGestor,
} from './simulacao-gestor.ts'
import type { Usuario } from './tipos.ts'

const infra: Usuario = {
  id: 'c1',
  nome: 'Marina',
  email: 'm',
  perfil: 'consultor',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
  grupo_id: 'g-infra',
}

const aplicacoes: Usuario = {
  id: 'c2',
  nome: 'Felipe',
  email: 'f',
  perfil: 'consultor',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
  grupo_id: 'g-app',
}

const fora: Usuario = {
  id: 'c3',
  nome: 'Outro',
  email: 'o',
  perfil: 'consultor',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
  grupo_id: 'g-outro',
}

const cliente: Usuario = {
  id: 'cli',
  nome: 'Leandro',
  email: 'l',
  perfil: 'cliente',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
}

const gestor: Usuario = {
  id: 'g',
  nome: 'Ricardo',
  email: 'r',
  perfil: 'gestor',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
}

function chamadoBase(
  parcial: Partial<Chamado> & Pick<Chamado, 'id' | 'status' | 'responsavel_id' | 'grupo_id'>,
): Chamado {
  return {
    numero: 5,
    titulo: parcial.id,
    descricao: 'd',
    categoria_id: 'cat1',
    prioridade: 'media',
    solicitante_id: 'cli',
    aberto_em: '2026-01-01T00:00:00Z',
    atualizado_em: '2026-01-01T00:00:00Z',
    prazo_primeira_resposta: '2026-01-02T00:00:00Z',
    prazo_resolucao: '2026-01-03T00:00:00Z',
    sla_pausado: false,
    ...parcial,
  }
}

const equipe = [infra.id, aplicacoes.id]

const tenant: TenantSessao = {
  meta: {
    tenant: 't',
    gerado_em: '2026-01-01T00:00:00Z',
    agora: '2026-01-01T12:00:00Z',
    status_possiveis: ['aberto'],
    prioridades: ['media', 'alta'],
  },
  grupos: [
    { id: 'g-infra', nome: 'Infraestrutura', gestor_id: 'g' },
    { id: 'g-app', nome: 'Aplicações', gestor_id: 'g' },
  ],
  categorias: [
    { id: 'cat1', nome: 'Rede', grupo_id: 'g-infra' },
    { id: 'cat2', nome: 'ERP', grupo_id: 'g-app' },
  ],
  sla: [
    {
      prioridade: 'media',
      primeira_resposta_horas: 8,
      resolucao_horas: 24,
    },
  ],
  usuarios: [gestor, infra, aplicacoes, fora, cliente],
  chamados: [
    chamadoBase({
      id: 'infra',
      status: 'em_atendimento',
      responsavel_id: 'c1',
      grupo_id: 'g-infra',
      numero: 1,
    }),
    chamadoBase({
      id: 'app',
      status: 'aberto',
      responsavel_id: 'c2',
      grupo_id: 'g-app',
      numero: 2,
    }),
    chamadoBase({
      id: 'solto',
      status: 'aberto',
      responsavel_id: null,
      grupo_id: 'g-infra',
      numero: 3,
    }),
    chamadoBase({
      id: 'feito',
      status: 'resolvido',
      responsavel_id: 'c1',
      grupo_id: 'g-infra',
      numero: 4,
    }),
    chamadoBase({
      id: 'alheio',
      status: 'em_atendimento',
      responsavel_id: 'c3',
      grupo_id: 'g-outro',
      numero: 5,
    }),
  ],
  mensagens: [],
  historico: [],
  consultoresEquipeGestor: equipe,
}

describe('simulacao-gestor', () => {
  it('lista os grupos da equipe na ordem dos usuários', () => {
    expect(gruposDaEquipe(tenant, equipe)).toEqual(['g-infra', 'g-app'])
    expect(gruposDaEquipe(tenant, [])).toEqual([])
  })

  it('gera chamado sem responsável no primeiro grupo da equipe', () => {
    const evento = gerarChamadoInjetadoGestor(tenant, equipe, () => 0)
    expect(evento?.payload.grupo_id).toBe('g-infra')
    expect(evento?.payload.responsavel_id).toBeNull()
    expect(evento?.payload.numero).toBe(6)
    expect(evento?.payload.titulo).toMatch(/Chamado simulado/)
  })

  it('gera chamado sem responsável no segundo grupo da equipe', () => {
    const evento = gerarChamadoInjetadoGestor(tenant, equipe, () => 0.99)
    expect(evento?.payload.grupo_id).toBe('g-app')
    expect(evento?.payload.responsavel_id).toBeNull()
  })

  it('não gera chamado quando a equipe não tem grupo', () => {
    expect(gerarChamadoInjetadoGestor(tenant, [], () => 0)).toBeNull()
  })

  it('sorteia ativos da equipe e deixa de fora conversa, sem dono, resolvido e alheio', () => {
    expect(listarChamadosSimulaveisGestor(tenant, equipe, null).map((c) => c.id)).toEqual([
      'infra',
      'app',
    ])
    expect(listarChamadosSimulaveisGestor(tenant, equipe, 'infra').map((c) => c.id)).toEqual([
      'app',
    ])
  })

  it('dispara chamado, mensagem e status fora do chamado aberto na conversa', () => {
    vi.useFakeTimers()
    let estado: TenantSessao = {
      ...tenant,
      chamados: [...tenant.chamados],
      mensagens: [],
      historico: [],
    }
    let aberto = 'infra'
    const eventos = new Set<string>()
    const controle = iniciarSimulacaoGestor(
      () => estado,
      (e) => {
        estado = aplicarEvento(estado, e, eventos)
      },
      { aleatorio: () => 0, obterChamadoAbertoId: () => aberto },
    )

    vi.advanceTimersByTime(12_000)
    const mensagens = estado.mensagens.filter((m) =>
      m.corpo.startsWith('Mensagem simulada do cliente'),
    )
    expect(mensagens).toHaveLength(1)
    expect(mensagens[0]?.chamado_id).toBe('app')
    expect(mensagens[0]?.autor_id).toBe('cli')
    expect(mensagens[0]?.interna).toBe(false)
    expect(estado.chamados.find((c) => c.id === 'infra')?.status).toBe('em_atendimento')
    expect(estado.chamados.filter((c) => c.titulo.includes('Chamado simulado'))).toHaveLength(1)
    expect(
      estado.chamados.find((c) => c.titulo.includes('Chamado simulado'))?.grupo_id,
    ).toBe('g-infra')
    expect(
      estado.chamados.find((c) => c.titulo.includes('Chamado simulado'))?.responsavel_id,
    ).toBeNull()

    aberto = 'app'
    vi.advanceTimersByTime(2_000)
    expect(estado.chamados.find((c) => c.id === 'infra')?.status).toBe('aberto')
    expect(estado.chamados.find((c) => c.id === 'app')?.status).toBe('aberto')
    expect(estado.chamados.find((c) => c.id === 'solto')?.status).toBe('aberto')
    expect(estado.historico.find((h) => h.tipo === 'status')?.usuario_id).toBe('c1')
    expect(estado.mensagens.find((m) => m.corpo.includes('Simulação da fila.'))?.corpo).toBe(
      'Status: Em atendimento → Aberto. Motivo: Simulação da fila.',
    )
    expect(estado.chamados.filter((c) => c.titulo.includes('Chamado simulado'))).toHaveLength(2)

    controle.parar()
    vi.advanceTimersByTime(30_000)
    expect(estado.chamados.filter((c) => c.titulo.includes('Chamado simulado'))).toHaveLength(2)
    vi.useRealTimers()
  })

  it('pula mensagem e status quando o único ativo da equipe está na conversa', () => {
    vi.useFakeTimers()
    const soInfra: TenantSessao = {
      ...tenant,
      chamados: [tenant.chamados[0]!],
    }
    let estado = soInfra
    const eventos = new Set<string>()
    const controle = iniciarSimulacaoGestor(
      () => estado,
      (e) => {
        estado = aplicarEvento(estado, e, eventos)
      },
      { aleatorio: () => 0, obterChamadoAbertoId: () => 'infra' },
    )

    vi.advanceTimersByTime(14_000)
    expect(estado.mensagens).toHaveLength(0)
    expect(estado.chamados.find((c) => c.id === 'infra')?.status).toBe('em_atendimento')
    expect(estado.chamados.filter((c) => c.titulo.includes('Chamado simulado'))).toHaveLength(2)

    controle.parar()
    vi.useRealTimers()
  })
})
