import { describe, expect, it, vi } from 'vitest'
import { aplicarEvento } from './aplicar-evento.ts'
import {
  gerarMensagemConsultor,
  gerarMensagemConsultorNoSelecionado,
  iniciarSimulacaoCliente,
  listarChamadosSimulaveisCliente,
} from './simulacao-cliente.ts'
import type { Chamado, TenantSessao } from './snapshot.ts'
import type { Usuario } from './tipos.ts'

const cliente: Usuario = {
  id: 'cli',
  nome: 'Leandro',
  email: 'l',
  perfil: 'cliente',
  locale: 'pt-BR',
  zoneinfo: 'Europe/Lisbon',
}

const consultor: Usuario = {
  id: 'r1',
  nome: 'Thiago',
  email: 't',
  perfil: 'consultor',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
  grupo_id: 'g1',
}

function chamadoBase(
  parcial: Partial<Chamado> & Pick<Chamado, 'id' | 'status' | 'responsavel_id'>,
): Chamado {
  return {
    numero: 5,
    titulo: parcial.id,
    descricao: 'd',
    categoria_id: 'cat1',
    grupo_id: 'g1',
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

const tenant: TenantSessao = {
  meta: {
    tenant: 't',
    gerado_em: '2026-01-01T00:00:00Z',
    agora: '2026-01-01T12:00:00Z',
    status_possiveis: ['aberto'],
    prioridades: ['media'],
  },
  grupos: [{ id: 'g1', nome: 'Infra', gestor_id: 'gest' }],
  categorias: [{ id: 'cat1', nome: 'Rede', grupo_id: 'g1' }],
  sla: [{ prioridade: 'media', primeira_resposta_horas: 4, resolucao_horas: 24 }],
  usuarios: [cliente, consultor],
  chamados: [
    chamadoBase({ id: 'fila', status: 'aguardando_cliente', responsavel_id: 'r1', numero: 1 }),
    chamadoBase({ id: 'conversa', status: 'em_atendimento', responsavel_id: 'r1', numero: 2 }),
    chamadoBase({ id: 'status-aberto', status: 'aberto', responsavel_id: 'r1', numero: 3 }),
    chamadoBase({ id: 'feito', status: 'resolvido', responsavel_id: 'r1', numero: 4 }),
    chamadoBase({ id: 'fim', status: 'fechado', responsavel_id: 'r1', numero: 5 }),
    chamadoBase({ id: 'sem-dono', status: 'em_atendimento', responsavel_id: null, numero: 6 }),
    chamadoBase({
      id: 'alheio',
      status: 'em_atendimento',
      responsavel_id: 'r1',
      solicitante_id: 'outro',
      numero: 7,
    }),
  ],
  mensagens: [],
  historico: [],
}

function sessaoDaSimulacao(): TenantSessao {
  return {
    ...tenant,
    chamados: tenant.chamados.map((chamado) => ({ ...chamado })),
    mensagens: [],
    historico: [],
  }
}

function ligarSimulacao(selecionadoInicial: string | null) {
  let estado = sessaoDaSimulacao()
  let selecionado = selecionadoInicial
  const eventos = new Set<string>()
  const controle = iniciarSimulacaoCliente(
    cliente,
    () => estado,
    (evento) => {
      estado = aplicarEvento(estado, evento, eventos)
    },
    { aleatorio: () => 0, obterChamadoSelecionadoId: () => selecionado },
  )
  controle.definirChamadoSelecionado(selecionadoInicial)
  return {
    controle,
    ler: () => estado,
    definirSelecionado: (id: string | null) => {
      selecionado = id
      controle.definirChamadoSelecionado(id)
    },
  }
}

describe('simulacao-cliente', () => {
  it('sorteia só chamados em andamento do cliente, com responsável, fora da conversa', () => {
    expect(listarChamadosSimulaveisCliente(tenant, 'cli', 'conversa').map((c) => c.id)).toEqual([
      'fila',
    ])
    expect(listarChamadosSimulaveisCliente(tenant, 'cli', null).map((c) => c.id)).toEqual([
      'fila',
      'conversa',
    ])
  })

  it('gera mensagem pública do responsável no relógio do snapshot', () => {
    const evento = gerarMensagemConsultor(tenant, tenant.chamados[0]!, () => 0)
    expect(evento?.payload.autor_id).toBe('r1')
    expect(evento?.payload.interna).toBe(false)
    expect(evento?.payload.corpo).toBe('Mensagem simulada do consultor · 1000')
    expect(evento?.payload.criado_em).toBe('2026-01-01T12:00:00Z')
    expect(evento?.ocorrido_em).toBe('2026-01-01T12:00:00Z')
    expect(evento?.payload.chamado_id).toBe('fila')
  })

  it('não gera mensagem sem responsável, fora de andamento ou sem conversa', () => {
    expect(gerarMensagemConsultor(tenant, tenant.chamados[2]!, () => 0)).toBeNull()
    expect(gerarMensagemConsultor(tenant, tenant.chamados[3]!, () => 0)).toBeNull()
    expect(gerarMensagemConsultor(tenant, tenant.chamados[5]!, () => 0)).toBeNull()
    expect(gerarMensagemConsultorNoSelecionado(tenant, 'cli', null, () => 0)).toBeNull()
    expect(gerarMensagemConsultorNoSelecionado(tenant, 'cli', 'ausente', () => 0)).toBeNull()
    expect(gerarMensagemConsultorNoSelecionado(tenant, 'cli', 'sem-dono', () => 0)).toBeNull()
    expect(gerarMensagemConsultorNoSelecionado(tenant, 'cli', 'alheio', () => 0)).toBeNull()
  })

  it('grava a cada 12s em outro chamado e a cada 20s na conversa', () => {
    vi.useFakeTimers()
    const sim = ligarSimulacao('conversa')
    try {
      vi.advanceTimersByTime(12_000)
      const naFila = sim.ler().mensagens.filter((m) => m.chamado_id === 'fila')
      expect(naFila).toHaveLength(1)
      expect(naFila[0]?.autor_id).toBe('r1')
      expect(naFila[0]?.corpo).toBe('Mensagem simulada do consultor · 1000')
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'conversa')).toHaveLength(0)

      vi.advanceTimersByTime(8_000)
      const naConversa = sim.ler().mensagens.filter((m) => m.chamado_id === 'conversa')
      expect(naConversa).toHaveLength(1)
      expect(naConversa[0]?.autor_id).toBe('r1')
      expect(naConversa[0]?.interna).toBe(false)

      vi.advanceTimersByTime(4_000)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'fila')).toHaveLength(2)
    } finally {
      sim.controle.parar()
      vi.useRealTimers()
    }
  })

  it('recomeça os 20s ao trocar a conversa e mantém o relógio de 12s', () => {
    vi.useFakeTimers()
    const sim = ligarSimulacao('conversa')
    try {
      vi.advanceTimersByTime(11_000)
      sim.definirSelecionado('fila')
      vi.advanceTimersByTime(1_000)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'conversa')).toHaveLength(1)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'fila')).toHaveLength(0)

      vi.advanceTimersByTime(8_000)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'fila')).toHaveLength(0)

      vi.advanceTimersByTime(11_000)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'fila')).toHaveLength(1)
    } finally {
      sim.controle.parar()
      vi.useRealTimers()
    }
  })

  it('não reinicia a espera quando a conversa continua a mesma', () => {
    vi.useFakeTimers()
    const sim = ligarSimulacao('conversa')
    try {
      vi.advanceTimersByTime(19_000)
      sim.definirSelecionado('conversa')
      vi.advanceTimersByTime(1_000)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'conversa')).toHaveLength(1)
    } finally {
      sim.controle.parar()
      vi.useRealTimers()
    }
  })

  it('com o formulário aberto não publica aos 20s e retoma ao voltar a conversa', () => {
    vi.useFakeTimers()
    const sim = ligarSimulacao(null)
    try {
      vi.advanceTimersByTime(12_000)
      expect(sim.ler().mensagens.map((m) => m.chamado_id)).toEqual(['fila'])

      vi.advanceTimersByTime(8_000)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'conversa')).toHaveLength(0)

      sim.definirSelecionado('conversa')
      vi.advanceTimersByTime(20_000)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'conversa')).toHaveLength(1)
    } finally {
      sim.controle.parar()
      vi.useRealTimers()
    }
  })

  it('parar impede os dois ciclos', () => {
    vi.useFakeTimers()
    const sim = ligarSimulacao('conversa')
    try {
      vi.advanceTimersByTime(10_000)
      sim.controle.parar()
      vi.advanceTimersByTime(30_000)
      expect(sim.ler().mensagens).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
