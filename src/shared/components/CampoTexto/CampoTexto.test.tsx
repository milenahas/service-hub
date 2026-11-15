import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CampoTexto } from './CampoTexto.tsx'

describe('CampoTexto', () => {
  it('associa label, altera valor e expõe a11y de erro e legenda', () => {
    const onChange = vi.fn()
    render(
      <CampoTexto
        id="usuario"
        rotulo="Usuário"
        value=""
        onChange={onChange}
        erro="Usuário não encontrado"
        legenda="Use um dos logins de demonstração"
        required
      />,
    )

    const campo = screen.getByLabelText('Usuário')
    expect(campo).toHaveAttribute('aria-required', 'true')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAttribute(
      'aria-describedby',
      'usuario-erro usuario-legenda',
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Usuário não encontrado')

    fireEvent.change(campo, { target: { value: 'cliente' } })
    expect(onChange).toHaveBeenCalled()
  })
})