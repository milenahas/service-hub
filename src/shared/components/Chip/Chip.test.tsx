import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Chip } from './Chip.tsx'

describe('Chip', () => {
  it('usa o texto visível como nome acessível do botão', () => {
    render(<Chip>Todos</Chip>)

    expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument()
  })

  it('marca aria-checked quando selecionado', () => {
    render(<Chip selecionado>Todos</Chip>)

    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('marca aria-checked false sem selecionado', () => {
    render(<Chip>Todos</Chip>)

    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('usa type button', () => {
    render(<Chip>Todos</Chip>)

    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute(
      'type',
      'button',
    )
  })
})
