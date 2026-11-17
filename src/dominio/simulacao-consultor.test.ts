import { describe, expect, it, vi } from 'vitest'
import { aplicarEvento } from './aplicar-evento.ts'
import {
  gerarChamadoInjetado,
  gerarMensagemDoSelecionado,
  gerarMensagemSimulada,
  gerarMudancaStatusSimulada,
  iniciarSimulacaoConsultor,
  listarChamadosSimulaveis,
} from './simulacao-consultor.ts'
import type { Chamado, TenantSessao } from './snapshot.ts'
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

const colega: Usuario = {
  id: 'c2',
  nome: 'Felipe',
  email: 'f',
  perfil: 'consultor',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
  grupo_id: 'g1',
}

const cliente: Usuario = {
  id: 'cli',
  nome: 'Leandro',
  email: 'l',
  perfil: 'cliente',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
}

function chamadoBase(parcial: Partial<Chamado> & Pick<Chamado, 'id' | 'status' | 'responsavel_id'>): Chamado {
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
  usuarios: [consultor, colega, cliente],
  chamados: [
    chamadoBase({ id: 'minha', status: 'em_atendimento', responsavel_id: 'c1', numero: 1 }),
    chamadoBase({ id: 'grupo', status: 'aberto', responsavel_id: 'c2', numero: 2 }),
    chamadoBase({ id: 'solto', status: 'aberto', responsavel_id: null, numero: 3 }),
    chamadoBase({ id: 'feito', status: 'resolvido', responsavel_id: 'c1', numero: 4 }),
    chamadoBase({
      id: 'fora',
      status: 'em_atendimento',
      responsavel_id: 'c3',
      grupo_id: 'g2',
      numero: 5,
    }),
  ],
  mensagens: [],
  historico: [],
}

function sessaoDaSimulacao(): TenantSessao {
  return {
    ...tenant,
    chamados: tenant.chamados.map((c) => ({ ...c })),
    mensagens: [],
    historico: [],
  }
}

function ligarSimulacao(estadoInicial: TenantSessao, selecionadoInicial: string | null) {
  let estado = estadoInicial
  let selecionado = selecionadoInicial
  const eventos = new Set<string>()
  const controle = iniciarSimulacaoConsultor(
    consultor,
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

describe('simulacao-consultor', () => {
  it('gera chamado com grupo e numero sequencial', () => {
    const evento = gerarChamadoInjetado(tenant, consultor, () => 0.5)
    expect(evento.payload.grupo_id).toBe('g1')
    expect(evento.payload.numero).toBe(6)
    expect(evento.payload.responsavel_id).toBeNull()
    expect(evento.payload.titulo).toMatch(/Chamado simulado/)
  })

  it('sorteia só Minha fila e Fila do grupo, sem o selecionado', () => {
    expect(listarChamadosSimulaveis(tenant, consultor, null).map((c) => c.id)).toEqual([
      'minha',
      'grupo',
    ])
    expect(listarChamadosSimulaveis(tenant, consultor, 'minha').map((c) => c.id)).toEqual([
      'grupo',
    ])
    expect(listarChamadosSimulaveis(tenant, consultor, 'grupo').map((c) => c.id)).toEqual([
      'minha',
    ])
  })

  it('gera mensagem pública do solicitante', () => {
    const evento = gerarMensagemSimulada(tenant, tenant.chamados[1]!, () => 0)
    expect(evento.payload.chamado_id).toBe('grupo')
    expect(evento.payload.autor_id).toBe('cli')
    expect(evento.payload.interna).toBe(false)
    expect(evento.payload.corpo).toBe('Mensagem simulada do cliente · 1000')
  })

  it('muda status aberto para em atendimento', () => {
    const evento = gerarMudancaStatusSimulada(tenant, tenant.chamados[1]!, () => 0)
    expect(evento?.payload.para).toBe('em_atendimento')
    expect(evento?.payload.motivo).toBe('Simulação da fila.')
    expect(evento?.payload.usuario_id).toBe('c2')
  })

  it('muda status aberto para aguardando cliente', () => {
    const evento = gerarMudancaStatusSimulada(tenant, tenant.chamados[1]!, () => 0.99)
    expect(evento?.payload.para).toBe('aguardando_cliente')
  })

  it('muda status em atendimento para aberto', () => {
    const evento = gerarMudancaStatusSimulada(tenant, tenant.chamados[0]!, () => 0)
    expect(evento?.payload.de).toBe('em_atendimento')
    expect(evento?.payload.para).toBe('aberto')
  })

  it('muda status aguardando cliente para em atendimento', () => {
    const aguardando = chamadoBase({
      id: 'espera',
      status: 'aguardando_cliente',
      responsavel_id: 'c1',
    })
    const evento = gerarMudancaStatusSimulada(tenant, aguardando, () => 0)
    expect(evento?.payload.para).toBe('em_atendimento')
  })

  it('não muda status de chamado resolvido nem sem responsável', () => {
    expect(gerarMudancaStatusSimulada(tenant, tenant.chamados[3]!, () => 0)).toBeNull()
    expect(gerarMudancaStatusSimulada(tenant, tenant.chamados[2]!, () => 0)).toBeNull()
  })

  it('dispara chamado, mensagem e status e troca o alvo se a seleção mudar', () => {
    vi.useFakeTimers()
    let estado: TenantSessao = {
      ...tenant,
      chamados: [...tenant.chamados],
      mensagens: [],
      historico: [],
    }
    let selecionado = 'minha'
    const eventos = new Set<string>()
    const controle = iniciarSimulacaoConsultor(
      consultor,
      () => estado,
      (e) => {
        estado = aplicarEvento(estado, e, eventos)
      },
      { aleatorio: () => 0, obterChamadoSelecionadoId: () => selecionado },
    )

    vi.advanceTimersByTime(12_000)
    const mensagens = estado.mensagens.filter((m) =>
      m.corpo.startsWith('Mensagem simulada do cliente'),
    )
    expect(mensagens).toHaveLength(1)
    expect(mensagens[0]?.chamado_id).toBe('grupo')
    expect(mensagens[0]?.autor_id).toBe('cli')
    expect(estado.chamados.filter((c) => c.titulo.includes('Chamado simulado'))).toHaveLength(1)
    expect(estado.chamados.find((c) => c.id === 'minha')?.status).toBe('em_atendimento')
    expect(estado.chamados.find((c) => c.id === 'grupo')?.status).toBe('aberto')

    selecionado = 'grupo'
    vi.advanceTimersByTime(2_000)
    expect(estado.chamados.find((c) => c.id === 'minha')?.status).toBe('aberto')
    expect(estado.chamados.find((c) => c.id === 'grupo')?.status).toBe('aberto')
    expect(estado.chamados.find((c) => c.id === 'solto')?.status).toBe('aberto')
    expect(estado.mensagens.find((m) => m.corpo.includes('Simulação da fila.'))?.corpo).toBe(
      'Status: Em atendimento → Aberto. Motivo: Simulação da fila.',
    )
    expect(estado.historico.find((h) => h.tipo === 'status')?.usuario_id).toBe('c1')
    expect(estado.chamados.filter((c) => c.titulo.includes('Chamado simulado'))).toHaveLength(2)

    controle.parar()
    vi.advanceTimersByTime(30_000)
    expect(estado.chamados.filter((c) => c.titulo.includes('Chamado simulado'))).toHaveLength(2)
    vi.useRealTimers()
  })

  it('repete mensagem e status no ciclo seguinte, fora do selecionado', () => {
    vi.useFakeTimers()
    let estado: TenantSessao = {
      ...tenant,
      chamados: [...tenant.chamados],
      mensagens: [],
      historico: [],
    }
    const eventos = new Set<string>()
    const controle = iniciarSimulacaoConsultor(
      consultor,
      () => estado,
      (e) => {
        estado = aplicarEvento(estado, e, eventos)
      },
      { aleatorio: () => 0, obterChamadoSelecionadoId: () => 'minha' },
    )

    vi.advanceTimersByTime(24_000)
    const mensagens = estado.mensagens.filter((m) =>
      m.corpo.startsWith('Mensagem simulada do cliente'),
    )
    expect(mensagens).toHaveLength(2)
    expect(mensagens.every((m) => m.chamado_id === 'grupo')).toBe(true)
    expect(estado.chamados.find((c) => c.id === 'grupo')?.status).toBe('em_atendimento')
    expect(estado.chamados.find((c) => c.id === 'minha')?.status).toBe('em_atendimento')
    expect(estado.mensagens.some((m) => m.chamado_id === 'minha')).toBe(false)
    expect(estado.mensagens.some((m) => m.chamado_id === 'solto')).toBe(false)
    expect(estado.mensagens.some((m) => m.chamado_id === 'feito')).toBe(false)
    expect(estado.chamados.filter((c) => c.titulo.includes('Chamado simulado'))).toHaveLength(3)

    controle.parar()
    vi.useRealTimers()
  })

  it('não gera mensagem sem seleção nem em chamado concluído', () => {
    expect(gerarMensagemDoSelecionado(tenant, null, () => 0)).toBeNull()
    expect(gerarMensagemDoSelecionado(tenant, 'feito', () => 0)).toBeNull()
    expect(gerarMensagemDoSelecionado(tenant, 'ausente', () => 0)).toBeNull()
    const fechado = chamadoBase({
      id: 'fim',
      status: 'fechado',
      responsavel_id: 'c1',
    })
    const sessao: TenantSessao = { ...tenant, chamados: [fechado] }
    expect(gerarMensagemDoSelecionado(sessao, 'fim', () => 0)).toBeNull()
  })

  it('gera mensagem pública no selecionado ativo sem dono', () => {
    const evento = gerarMensagemDoSelecionado(tenant, 'solto', () => 0)
    expect(evento?.payload.chamado_id).toBe('solto')
    expect(evento?.payload.autor_id).toBe('cli')
    expect(evento?.payload.interna).toBe(false)
    expect(evento?.payload.corpo).toBe('Mensagem simulada do cliente · 1000')
  })

  it('grava mensagem no selecionado a cada 20s e mantém o ciclo de 12s fora dele', () => {
    vi.useFakeTimers()
    const sim = ligarSimulacao(sessaoDaSimulacao(), 'minha')
    try {
      vi.advanceTimersByTime(12_000)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'minha')).toHaveLength(0)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'grupo')).toHaveLength(1)

      vi.advanceTimersByTime(8_000)
      const noSelecionado = sim.ler().mensagens.filter((m) => m.chamado_id === 'minha')
      expect(noSelecionado).toHaveLength(1)
      expect(noSelecionado[0]?.autor_id).toBe('cli')
      expect(noSelecionado[0]?.interna).toBe(false)
      expect(noSelecionado[0]?.corpo).toBe('Mensagem simulada do cliente · 1000')

      vi.advanceTimersByTime(20_000)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'minha')).toHaveLength(2)
    } finally {
      sim.controle.parar()
      vi.useRealTimers()
    }
  })

  it('recomeça os 20s ao trocar o chamado selecionado', () => {
    vi.useFakeTimers()
    const sim = ligarSimulacao(sessaoDaSimulacao(), 'minha')
    try {
      vi.advanceTimersByTime(19_000)
      sim.definirSelecionado('grupo')
      vi.advanceTimersByTime(1_000)
      const simuladas = () =>
        sim.ler().mensagens.filter((m) => m.corpo.startsWith('Mensagem simulada do cliente'))
      expect(simuladas().filter((m) => m.chamado_id === 'minha')).toHaveLength(0)
      expect(simuladas().filter((m) => m.chamado_id === 'grupo')).toHaveLength(1)

      vi.advanceTimersByTime(19_000)
      expect(simuladas().filter((m) => m.chamado_id === 'grupo')).toHaveLength(2)
    } finally {
      sim.controle.parar()
      vi.useRealTimers()
    }
  })

  it('não reinicia a espera quando o selecionado continua o mesmo', () => {
    vi.useFakeTimers()
    const sim = ligarSimulacao(sessaoDaSimulacao(), 'minha')
    try {
      vi.advanceTimersByTime(19_000)
      sim.definirSelecionado('minha')
      vi.advanceTimersByTime(1_000)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'minha')).toHaveLength(1)
    } finally {
      sim.controle.parar()
      vi.useRealTimers()
    }
  })

  it('não grava no selecionado resolvido e retoma quando ele volta a ficar ativo', () => {
    vi.useFakeTimers()
    const sim = ligarSimulacao(sessaoDaSimulacao(), 'feito')
    try {
      vi.advanceTimersByTime(20_000)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'feito')).toHaveLength(0)

      const feito = sim.ler().chamados.find((c) => c.id === 'feito')!
      feito.status = 'em_atendimento'
      vi.advanceTimersByTime(20_000)
      const noFeito = sim.ler().mensagens.filter((m) => m.chamado_id === 'feito')
      expect(noFeito).toHaveLength(1)
      expect(noFeito[0]?.interna).toBe(false)
    } finally {
      sim.controle.parar()
      vi.useRealTimers()
    }
  })

  it('não grava mensagem de 20s sem chamado selecionado', () => {
    vi.useFakeTimers()
    const sim = ligarSimulacao(sessaoDaSimulacao(), null)
    try {
      vi.advanceTimersByTime(20_000)
      const simuladas = sim.ler().mensagens.filter((m) =>
        m.corpo.startsWith('Mensagem simulada do cliente'),
      )
      expect(simuladas).toHaveLength(1)
      expect(simuladas[0]?.chamado_id).toBe('minha')
    } finally {
      sim.controle.parar()
      vi.useRealTimers()
    }
  })

  it('parar impede a mensagem no chamado selecionado', () => {
    vi.useFakeTimers()
    const sim = ligarSimulacao(sessaoDaSimulacao(), 'minha')
    try {
      vi.advanceTimersByTime(10_000)
      sim.controle.parar()
      vi.advanceTimersByTime(20_000)
      expect(sim.ler().mensagens.filter((m) => m.chamado_id === 'minha')).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('pula mensagem e status quando o único da fila é o selecionado', () => {
    vi.useFakeTimers()
    const soMinha: TenantSessao = {
      ...tenant,
      chamados: [tenant.chamados[0]!],
    }
    let estado = soMinha
    const eventos = new Set<string>()
    const controle = iniciarSimulacaoConsultor(
      consultor,
      () => estado,
      (e) => {
        estado = aplicarEvento(estado, e, eventos)
      },
      { aleatorio: () => 0, obterChamadoSelecionadoId: () => 'minha' },
    )

    vi.advanceTimersByTime(14_000)
    expect(estado.mensagens).toHaveLength(0)
    expect(estado.chamados.find((c) => c.id === 'minha')?.status).toBe('em_atendimento')
    expect(estado.chamados.filter((c) => c.titulo.includes('Chamado simulado'))).toHaveLength(2)

    controle.parar()
    vi.useRealTimers()
  })
})
