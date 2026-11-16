import type { KeyboardEvent } from 'react'
import { Chip } from './Chip.tsx'
import './Chip.css'

export type OpcaoChip = {
  valor: string
  rotulo: string
}

export type PropsGrupoChips = {
  rotulo: string
  value: string
  onChange: (valor: string) => void
  opcoes: OpcaoChip[]
}

const DIRECAO_POR_TECLA: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

/**
 * Monta o radio group de pílulas e traduz clique e setas em `onChange`
 * com o `valor` da opção. Não filtra lista nem guarda qual está ativo —
 * a tela passa `value` e `opcoes`. O desenho de cada pílula fica em `Chip.tsx`.
 */
export function GrupoChips({
  rotulo,
  value,
  onChange,
  opcoes,
}: PropsGrupoChips) {
  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    const direcao = DIRECAO_POR_TECLA[evento.key]
    if (direcao === undefined) {
      return
    }

    evento.preventDefault()
    const total = opcoes.length
    const indiceAtual = opcoes.findIndex((opcao) => opcao.valor === value)
    const proximo = (indiceAtual + direcao + total) % total
    const destino = opcoes[proximo]
    if (destino.valor !== value) {
      onChange(destino.valor)
    }

    const radios = evento.currentTarget.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]',
    )
    radios.item(proximo)?.focus({ focusVisible: true })
  }

  return (
    <div
      className="grupo-chips"
      role="radiogroup"
      aria-label={rotulo}
      onKeyDown={aoTeclar}
    >
      {opcoes.map((opcao) => (
        <Chip
          key={opcao.valor}
          selecionado={value === opcao.valor}
          role="radio"
          tabIndex={value === opcao.valor ? 0 : -1}
          onClick={() => {
            if (opcao.valor !== value) {
              onChange(opcao.valor)
            }
          }}
        >
          {opcao.rotulo}
        </Chip>
      ))}
    </div>
  )
}
