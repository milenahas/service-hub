import type { TextareaHTMLAttributes } from 'react'
import '../utilitarios/campo-estilos-compartilhados.css'
import './CampoTextarea.css'
import { montarDescritoPor } from '../utilitarios/campoUtilitarios.ts'

export type PropsCampoTextarea = {
  rotulo: string
  erro?: string
  legenda?: string
} & TextareaHTMLAttributes<HTMLTextAreaElement>

export function CampoTextarea({
  rotulo,
  erro,
  legenda,
  id,
  rows = 3,
  required,
  ...props
}: PropsCampoTextarea) {
  const descritoPor = id ? montarDescritoPor(id, erro, legenda) : undefined

  return (
    <div className="campo">
      <label className="campo__rotulo" htmlFor={id}>
        {rotulo}
      </label>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-required={required ? true : undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor}
        {...props}
        className="campo__controle campo__controle--textarea"
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