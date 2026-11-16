import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Chip.css'

export type PropsChip = {
  selecionado?: boolean
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'>

export function Chip({ selecionado = false, children, ...props }: PropsChip) {
  const classes = ['chip']
  if (selecionado) {
    classes.push('chip--selecionado')
  }

  return (
    <button
      {...props}
      type="button"
      aria-checked={selecionado}
      className={classes.join(' ')}
    >
      {children}
    </button>
  )
}
