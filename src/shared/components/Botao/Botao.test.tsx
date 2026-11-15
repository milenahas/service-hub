import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Botao } from './Botao.tsx'

describe('Botao', () => {
  it('aplica variante e modo bloco', () => {
    render(
      <Botao variante="secundario" bloco>
        Salvar
      </Botao>,
    )

    const botao = screen.getByRole('button', { name: 'Salvar' })
    expect(botao).toHaveClass('botao--secundario', 'botao--bloco')
    expect(botao).toBeEnabled()
  })

  it('bloqueia clique quando desabilitado', () => {
    const aoClicar = vi.fn()
    render(
      <Botao disabled onClick={aoClicar}>
        Entrar
      </Botao>,
    )

    const botao = screen.getByRole('button', { name: 'Entrar' })
    expect(botao).toBeDisabled()
    fireEvent.click(botao)
    expect(aoClicar).not.toHaveBeenCalled()
  })

  it('expõe nome acessível para botão só com ícone', () => {
    render(<Botao aria-label="Fechar">×</Botao>)

    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument()
  })
})