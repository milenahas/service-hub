import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CampoSelect } from './CampoSelect.tsx'

describe('CampoSelect', () => {
  it('mudança de opção e mensagem de erro acessível', () => {
    const onChange = vi.fn()
    render(
      <CampoSelect
        id="categoria"
        rotulo="Categoria"
        value="rede"
        onChange={onChange}
        opcoes={[
          { valor: 'rede', rotulo: 'Rede' },
          { valor: 'email', rotulo: 'E-mail' },
        ]}
        erro="Escolha uma categoria"
      />,
    )

    const campo = screen.getByLabelText('Categoria')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma categoria')

    fireEvent.change(campo, { target: { value: 'email' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('renderiza opção vazia quando informada', () => {
    render(
      <CampoSelect
        id="prioridade"
        rotulo="Prioridade"
        value=""
        onChange={() => {}}
        opcoes={[{ valor: 'media', rotulo: 'Média' }]}
        opcaoVazia="Selecione"
      />,
    )

    const opcaoVazia = screen.getByText('Selecione', { selector: 'option' })
    expect(opcaoVazia).toBeDisabled()
    expect(opcaoVazia).toHaveAttribute('value', '')
  })

  it('renderiza opção sem responsável selecionável no gestor', () => {
    const onChange = vi.fn()
    render(
      <CampoSelect
        id="responsavel"
        rotulo="Responsável"
        value=""
        onChange={onChange}
        opcoes={[{ valor: 'c1', rotulo: 'Ana' }]}
        opcaoSemResponsavel
      />,
    )

    const opcao = screen.getByText('Sem responsável', { selector: 'option' })
    expect(opcao).toHaveAttribute('value', '')
    expect(opcao).not.toBeDisabled()

    const campo = screen.getByLabelText('Responsável')
    fireEvent.change(campo, { target: { value: '' } })
    expect(onChange).toHaveBeenCalled()
  })
})