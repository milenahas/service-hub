import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { CAMINHOS } from '../../app/caminhos.ts'
import { useStore } from '../../app/store.ts'
import { ERRO_LOGIN_INVALIDO, PERFIS_DISPONIVEIS } from './constantes-login.ts'
import { TelaLogin } from './TelaLogin.tsx'

function renderLogin() {
  const memoria = createMemoryRouter(
    [
      {
        path: CAMINHOS.login,
        element: <TelaLogin />,
      },
      {
        path: CAMINHOS.cliente,
        element: <div>Área cliente</div>,
      },
    ],
    { initialEntries: [CAMINHOS.login] },
  )

  render(<RouterProvider router={memoria} />)
  return memoria
}

describe('TelaLogin', () => {
  beforeEach(() => {
    useStore.getState().sair()
  })

  it('renderiza microcopy e perfis na ordem correta', () => {
    renderLogin()

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Central de chamados de TI. Digite seu usuário para continuar.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Perfis disponíveis:')).toBeInTheDocument()

    const itens = screen
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(itens).toEqual([...PERFIS_DISPONIVEIS])
    expect(
      screen.getByPlaceholderText('ex.: consultor-infraestrutura'),
    ).toBeInTheDocument()
  })

  it('exibe erro ao submit inválido', () => {
    renderLogin()
    const campo = screen.getByLabelText('Usuário')

    fireEvent.change(campo, { target: { value: 'consultor' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('alert')).toHaveTextContent(ERRO_LOGIN_INVALIDO)
  })

  it('entra com usuário válido e navega', async () => {
    const memoria = renderLogin()
    const campo = screen.getByLabelText('Usuário')

    fireEvent.change(campo, { target: { value: 'cliente' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Área cliente')).toBeInTheDocument()
    expect(memoria.state.location.pathname).toBe(CAMINHOS.cliente)
    expect(useStore.getState().usuarioLogado?.nome).toBe('Leandro Mendes')
    expect(useStore.getState().tenant?.chamados.length).toBeGreaterThan(0)
  })

  it('Enter no formulário dispara submit', async () => {
    renderLogin()
    const formulario = document.querySelector('form.login__formulario')
    const campo = screen.getByLabelText('Usuário')

    fireEvent.change(campo, { target: { value: 'gestor' } })
    expect(formulario).toBeTruthy()
    fireEvent.submit(formulario!)

    await waitFor(() => {
      expect(useStore.getState().usuarioLogado?.nome).toBe('Ricardo Monteiro')
    })
  })
})