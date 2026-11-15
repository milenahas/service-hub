import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CampoTextarea } from './CampoTextarea.tsx'

describe('CampoTextarea', () => {
  it('altera valor e repete contrato a11y do campo', () => {
    const onChange = vi.fn()
    render(
      <CampoTextarea
        id="descricao"
        rotulo="Descrição"
        value="Inicial"
        onChange={onChange}
        erro="Descrição obrigatória"
        rows={5}
      />,
    )

    const campo = screen.getByLabelText('Descrição')
    expect(campo).toHaveAttribute('rows', '5')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toBeInTheDocument()

    fireEvent.change(campo, { target: { value: 'Novo texto' } })
    expect(onChange).toHaveBeenCalled()
  })
})