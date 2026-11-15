import type { StatusChamado } from '../../../dominio/chamado.ts'
import type { FaixaPrazo } from '../tipos.ts'
import './Selo.css'

type PropsSeloBase = {
  decorativo?: boolean
}

type PropsSeloStatus = PropsSeloBase & {
  apresentacao: 'status-preenchido' | 'status-borda'
  status: StatusChamado
  children: string
}

type PropsSeloPrazo = PropsSeloBase & {
  apresentacao: 'prazo'
  faixa: FaixaPrazo
  children: string
}

type PropsSeloTextoCinza = PropsSeloBase & {
  apresentacao: 'texto-cinza'
  children: string
}

export type PropsSelo = PropsSeloStatus | PropsSeloPrazo | PropsSeloTextoCinza

export function Selo(props: PropsSelo) {
  const { children, decorativo = false } = props

  const classes = ['selo']

  if (props.apresentacao === 'texto-cinza') {
    classes.push('selo--texto-cinza')
  } else if (props.apresentacao === 'prazo') {
    classes.push(`selo--prazo-${props.faixa}`)
  } else {
    classes.push(`selo--${props.apresentacao}`, `selo--chamado-${props.status}`)
  }

  return (
    <span className={classes.join(' ')} aria-hidden={decorativo ? true : undefined}>
      {children}
    </span>
  )
}