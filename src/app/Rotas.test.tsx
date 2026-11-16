import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CAMINHOS } from './caminhos.ts'
import { useStore } from './store.ts'
import { definicaoRotas } from './Rotas.tsx'

describe('Rotas', () => {
  it('exibe login na raiz sem sessão', () => {
    useStore.getState().sair()
    const memoria = createMemoryRouter(definicaoRotas, {
      initialEntries: [CAMINHOS.login],
    })

    render(<RouterProvider router={memoria} />)

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('redireciona perfil sem sessão para o login', async () => {
    useStore.getState().sair()
    const memoria = createMemoryRouter(definicaoRotas, {
      initialEntries: [CAMINHOS.cliente],
    })

    render(<RouterProvider router={memoria} />)

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('bloqueia consultor em rota de gestor', async () => {
    const thiago = {
      id: '50039fe7-2ddf-4a02-8045-c635a4c724f6',
      nome: 'Thiago Nascimento',
      email: 'thiago.nascimento@suporte.example',
      perfil: 'consultor' as const,
      locale: 'pt-BR',
      zoneinfo: 'America/Sao_Paulo',
      grupo_id: '29be5d21-2981-4b38-a4c2-771116e58928',
    }
    useStore.getState().iniciarSessao(thiago)

    const memoria = createMemoryRouter(definicaoRotas, {
      initialEntries: [CAMINHOS.gestor],
    })

    render(<RouterProvider router={memoria} />)

    expect(
      await screen.findByRole('heading', { name: 'Fila' }),
    ).toBeInTheDocument()
    useStore.getState().pararSimulacaoConsultor()
    useStore.getState().sair()
  })
})