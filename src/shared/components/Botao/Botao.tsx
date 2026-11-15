import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { VarianteBotao } from '../tipos.ts'
import { montarClasseBotao } from '../utilitarios/botaoUtilitarios.ts'
import './Botao.css'

export type PropsBotao = {
  variante?: VarianteBotao
  bloco?: boolean
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Botao({
  variante = 'primario',
  bloco = false,
  children,
  type = 'button',
  ...props
}: PropsBotao) {
  const classes = montarClasseBotao({ variante, bloco })

  return (
    <button type={type} {...props} className={classes}>
      {children}
    </button>
  )
}