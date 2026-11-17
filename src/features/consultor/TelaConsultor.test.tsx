import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TelaConsultor } from './TelaConsultor.tsx'
import { montarSecoesFilaVisivel } from './fila-consultor.ts'
import { useStore, resetarStoreParaTestes } from '../../app/store.ts'
import { montarSessao } from '../../dominio/montar-sessao.ts'
import { snapshotInicial } from '../../data/snapshot-inicial.ts'

const thiago = snapshotInicial.usuarios.find(
  (u) => u.id === '50039fe7-2ddf-4a02-8045-c635a4c724f6',
)!

function montar() {
  return render(
    <MemoryRouter>
      <TelaConsultor />
    </MemoryRouter>,
  )
}

describe('TelaConsultor', () => {
  beforeEach(() => {
    resetarStoreParaTestes()
    const tenant = montarSessao(snapshotInicial, thiago)
    useStore.setState({
      usuarioLogado: thiago,
      tenant,
      eventosAplicados: new Set(),
    })
  })

  afterEach(() => {
    useStore.getState().pararSimulacaoConsultor()
    resetarStoreParaTestes()
  })

  it('renderiza fila e abas', () => {
    montar()
    expect(screen.getByRole('heading', { name: 'Fila' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Minha fila/ })).toBeInTheDocument()
  })

  it('exibe a descrição do chamado no topo da conversa', () => {
    const tenant = useStore.getState().tenant!
    const usuario = useStore.getState().usuarioLogado!
    const secoes = montarSecoesFilaVisivel(tenant, usuario, 'minha', '', 'todos')
    const primeiro = secoes[0]!.chamados[0]!
    montar()
    expect(screen.getByLabelText('Descrição do chamado')).toBeInTheDocument()
    expect(screen.getByText(primeiro.descricao)).toBeInTheDocument()
  })

  it('fecha notas ao trocar de chamado', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: /^Notas/ }))
    expect(screen.getByLabelText('Notas internas')).toBeInTheDocument()

    const itens = within(screen.getByRole('tabpanel')).getAllByRole('button')
    expect(itens.length).toBeGreaterThan(1)
    fireEvent.click(itens[0]!)

    expect(screen.queryByLabelText('Notas internas')).not.toBeInTheDocument()
  })

  it('fecha e limpa o formulário de status ao trocar de chamado', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Status' }))
    const selectStatus = screen.getByLabelText('Novo status')
    const valorStatus = Array.from(
      (selectStatus as HTMLSelectElement).options,
    ).find((opcao) => opcao.value)?.value
    fireEvent.change(selectStatus, { target: { value: valorStatus } })
    fireEvent.change(screen.getByLabelText('Motivo (obrigatório)'), {
      target: { value: 'Aguardando evidência' },
    })
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeEnabled()

    const outro = within(screen.getByRole('tabpanel'))
      .getAllByRole('button')
      .find((item) => item.getAttribute('aria-current') !== 'true')
    expect(outro).toBeDefined()
    fireEvent.click(outro!)

    expect(screen.queryByLabelText('Novo status')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Motivo (obrigatório)')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Status' }))
    expect(screen.getByLabelText('Novo status')).toHaveValue('')
    expect(screen.getByLabelText('Motivo (obrigatório)')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  })

  it('nota interna não aparece na conversa pública', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: /^Notas/ }))
    const area = screen.getByPlaceholderText('Anotar para os colegas…')
    fireEvent.change(area, { target: { value: 'Segredo da equipe' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nota' }))
    expect(screen.getByText('Segredo da equipe')).toBeInTheDocument()
    const conversa = document.querySelector('.painel-chamado__conversa')
    expect(conversa?.textContent).not.toContain('Segredo da equipe')
  })

  it('formulário de status exige motivo', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Status' }))
    const confirmar = screen.getByRole('button', { name: 'Confirmar' })
    expect(confirmar).toBeDisabled()
  })
})