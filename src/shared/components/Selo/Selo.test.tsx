import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Selo } from './Selo.tsx'

describe('Selo', () => {
  it('exibe texto e variantes de status preenchido', () => {
    render(
      <Selo apresentacao="status-preenchido" status="aberto">
        Aberto
      </Selo>,
    )

    const selo = screen.getByText('Aberto')
    expect(selo).toHaveClass('selo--status-preenchido', 'selo--chamado-aberto')
  })

  it('aplica status-borda sem fundo preenchido de status', () => {
    render(
      <Selo apresentacao="status-borda" status="resolvido">
        Resolvido
      </Selo>,
    )

    const selo = screen.getByText('Resolvido')
    expect(selo).toHaveClass('selo--status-borda', 'selo--chamado-resolvido')
    expect(selo).not.toHaveClass('selo--status-preenchido')
  })

  it('renderiza faixa de prazo e texto cinza', () => {
    const { rerender } = render(
      <Selo apresentacao="prazo" faixa="urgente">
        45 min
      </Selo>,
    )
    expect(screen.getByText('45 min')).toHaveClass('selo--prazo-urgente')

    rerender(
      <Selo apresentacao="texto-cinza">
        Gestor
      </Selo>,
    )
    expect(screen.getByText('Gestor')).toHaveClass('selo--texto-cinza')
  })
})