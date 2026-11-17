import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TelaGestor } from './TelaGestor.tsx'
import { useStore, resetarStoreParaTestes } from '../../app/store.ts'
import { criarGeradorComSemente } from '../../dominio/aleatorio.ts'
import { montarSessao } from '../../dominio/montar-sessao.ts'
import { snapshotInicial } from '../../data/snapshot-inicial.ts'

const ricardo = snapshotInicial.usuarios.find(
  (u) => u.id === '875d257a-0dff-4428-a233-5332d0e67b86',
)!

function montar() {
  return render(
    <MemoryRouter>
      <TelaGestor />
    </MemoryRouter>,
  )
}

describe('TelaGestor', () => {
  beforeEach(() => {
    resetarStoreParaTestes()
    const tenant = montarSessao(snapshotInicial, ricardo, criarGeradorComSemente(42))
    useStore.setState({
      usuarioLogado: ricardo,
      tenant,
      eventosAplicados: new Set(),
    })
  })

  afterEach(() => {
    resetarStoreParaTestes()
  })

  it('renderiza saudação, cards e cabeçalhos da equipe', () => {
    montar()
    expect(screen.getByRole('heading', { name: /Bom dia, Ricardo/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SLA em até 4h/i })).toBeInTheDocument()
    expect(screen.getByText('Consultor')).toBeInTheDocument()
    expect(screen.queryByText(/Carga/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Sobrecarregado/i)).not.toBeInTheDocument()
  })

  it('selo do cabeçalho é Gestor sem sufixo', () => {
    montar()
    expect(screen.getByText('Gestor')).toBeInTheDocument()
    expect(screen.queryByText(/Gestor ·/)).not.toBeInTheDocument()
  })

  it('card SLA abre lista com subtítulo', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: /SLA em até 4h/i }))
    expect(
      screen.getByRole('heading', { name: 'SLA nas próximas 4h' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Estourados ou perto do prazo, por ordem de urgência.'),
    ).toBeInTheDocument()
  })

  it('card Sem responsável abre subtítulo de atribuição', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Sem responsável' }))
    expect(
      screen.getByText('Ninguém pegou ainda. Atribua pelo seletor.'),
    ).toBeInTheDocument()
  })

  it('card Ociosos ativa chip Ociosos', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: /Ociosos agora/i }))
    const grupo = screen.getByRole('radiogroup', { name: 'Filtrar equipe' })
    const ociosos = within(grupo).getByRole('radio', { name: 'Ociosos' })
    expect(ociosos).toHaveAttribute('aria-checked', 'true')
  })

  it('Ver chamados mostra nome e voltar à equipe', () => {
    montar()
    const ver = screen.getAllByRole('button', { name: 'Ver chamados' })[0]!
    fireEvent.click(ver)
    expect(screen.getByRole('button', { name: /Voltar à equipe/i })).toBeInTheDocument()
    expect(screen.getByText(/Chamados ativos/)).toBeInTheDocument()
  })

  it('Conversa a partir do detalhe mostra voltar com primeiro nome', () => {
    montar()
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver chamados' })[0]!)
    const nomeConsultor = screen
      .getAllByRole('heading', { level: 2 })
      .find((h) => h.textContent && !h.textContent.includes('Chamados'))!
      .textContent!
    const primeiro = nomeConsultor.split(' ')[0]
    const conversa = screen
      .getAllByRole('button', { name: 'Conversa' })
      .find((botao) => (botao as HTMLButtonElement).disabled === false)
    expect(conversa).toBeDefined()
    fireEvent.click(conversa!)
    expect(
      screen.getByRole('button', { name: `< Voltar a ${primeiro}` }),
    ).toBeInTheDocument()
  })

  it('Conversa a partir da lista mostra voltar à lista', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: /SLA em até 4h/i }))
    const conversa = screen
      .getAllByRole('button', { name: 'Conversa' })
      .find((botao) => (botao as HTMLButtonElement).disabled === false)
    expect(conversa).toBeDefined()
    fireEvent.click(conversa!)
    expect(screen.getByRole('button', { name: '< Voltar à lista' })).toBeInTheDocument()
  })

  it('desabilita Conversa em chamados sem responsável', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Sem responsável' }))
    const conversas = screen.getAllByRole('button', { name: 'Conversa' })
    expect(conversas.length).toBeGreaterThan(0)
    conversas.forEach((botao) => {
      expect(botao).toBeDisabled()
    })
  })

  it('atribuir chama store com consultor escolhido', () => {
    const spy = vi.spyOn(useStore.getState(), 'atribuirChamado')
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Sem responsável' }))
    const selects = screen.getAllByRole('combobox')
    const select = selects.find((el) => el.id.startsWith('responsavel-'))
    expect(select).toBeTruthy()
    const opcoes = within(select!.closest('.campo')!).getAllByRole('option')
    const consultor = opcoes.find((o) => {
      const valor = o.getAttribute('value')
      return valor !== null && valor !== ''
    })
    expect(consultor).toBeTruthy()
    fireEvent.change(select!, {
      target: { value: consultor!.getAttribute('value') },
    })
    expect(spy).toHaveBeenCalled()
    const [, consultorId] = spy.mock.calls[0]!
    expect(consultorId).not.toBe(ricardo.id)
    spy.mockRestore()
  })

  it('salvar nota desabilita com textarea vazio', () => {
    montar()
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver chamados' })[0]!)
    const conversa = screen
      .getAllByRole('button', { name: 'Conversa' })
      .find((botao) => (botao as HTMLButtonElement).disabled === false)
    expect(conversa).toBeDefined()
    fireEvent.click(conversa!)
    const salvar = screen.getByRole('button', { name: 'Salvar nota interna' })
    expect(salvar).toBeDisabled()
  })

  it('busca zzz exibe vazio na equipe', () => {
    montar()
    fireEvent.change(screen.getByPlaceholderText('Buscar consultor'), {
      target: { value: 'zzz' },
    })
    expect(screen.getByText('Nenhum consultor com esses filtros.')).toBeInTheDocument()
  })
})