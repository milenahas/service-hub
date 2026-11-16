import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GrupoChips } from './GrupoChips.tsx'

const OPCOES = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'ociosos', rotulo: 'Ociosos' },
  { valor: 'com_risco', rotulo: 'Com risco' },
]

function renderGrupo(value: string, onChange = vi.fn()) {
  render(
    <GrupoChips
      rotulo="Filtrar equipe"
      value={value}
      onChange={onChange}
      opcoes={OPCOES}
    />,
  )
  return onChange
}

describe('GrupoChips', () => {
  it('expõe radiogroup com o rótulo e as opções na ordem recebida', () => {
    renderGrupo('todos')

    expect(
      screen.getByRole('radiogroup', { name: 'Filtrar equipe' }),
    ).toBeInTheDocument()
    const nomes = screen.getAllByRole('radio').map((radio) => radio.textContent)
    expect(nomes).toEqual(['Todos', 'Ociosos', 'Com risco'])
  })

  it('marca só o value atual como escolhido', () => {
    renderGrupo('ociosos')

    expect(screen.getByRole('radio', { name: 'Todos' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByRole('radio', { name: 'Ociosos' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('radio', { name: 'Com risco' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('chama onChange com o valor da opção inativa', () => {
    const aoMudar = renderGrupo('todos')

    fireEvent.click(screen.getByRole('radio', { name: 'Com risco' }))

    expect(aoMudar).toHaveBeenCalledWith('com_risco')
  })

  it('seta para a direita a partir da primeira chama onChange com a segunda', () => {
    const aoMudar = renderGrupo('todos')

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Todos' }), {
      key: 'ArrowRight',
    })

    expect(aoMudar).toHaveBeenCalledWith('ociosos')
  })

  it('seta para a direita a partir da última chama onChange com a primeira', () => {
    const aoMudar = renderGrupo('com_risco')

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Com risco' }), {
      key: 'ArrowRight',
    })

    expect(aoMudar).toHaveBeenCalledWith('todos')
  })

  it('deixa um único tabIndex 0 no escolhido', () => {
    renderGrupo('ociosos')

    expect(screen.getByRole('radio', { name: 'Todos' })).toHaveAttribute(
      'tabindex',
      '-1',
    )
    expect(screen.getByRole('radio', { name: 'Ociosos' })).toHaveAttribute(
      'tabindex',
      '0',
    )
    expect(screen.getByRole('radio', { name: 'Com risco' })).toHaveAttribute(
      'tabindex',
      '-1',
    )
  })
})
