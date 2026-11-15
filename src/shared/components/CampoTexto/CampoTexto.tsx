import type { InputHTMLAttributes } from 'react'
import '../utilitarios/campo-estilos-compartilhados.css'
import './CampoTexto.css'
import { montarDescritoPor } from '../utilitarios/campoUtilitarios.ts'

export type PropsCampoTexto = {
  rotulo: string
  erro?: string
  legenda?: string
} & InputHTMLAttributes<HTMLInputElement>

export function CampoTexto({
  rotulo,
  erro,
  legenda,
  id,
  required,
  ...props
}: PropsCampoTexto) {
  const descritoPor = id ? montarDescritoPor(id, erro, legenda) : undefined

  return (
    <div className="campo">
      <label className="campo__rotulo" htmlFor={id}>
        {rotulo}
      </label>
      <input
        id={id}
        required={required}
        aria-required={required ? true : undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor}
        {...props}
        className="campo__controle campo__controle--altura-padrao"
      />
      {erro && id && (
        <p id={`${id}-erro`} className="campo__erro" role="alert">
          {erro}
        </p>
      )}
      {legenda && id && (
        <p id={`${id}-legenda`} className="campo__legenda">
          {legenda}
        </p>
      )}
    </div>
  )
}