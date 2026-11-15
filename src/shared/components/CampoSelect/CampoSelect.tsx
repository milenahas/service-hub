import type { SelectHTMLAttributes } from 'react'
import type { OpcaoSelect } from '../tipos.ts'
import '../utilitarios/campo-estilos-compartilhados.css'
import './CampoSelect.css'
import { montarDescritoPor } from '../utilitarios/campoUtilitarios.ts'

export type PropsCampoSelect = {
  rotulo: string
  opcoes: OpcaoSelect[]
  opcaoVazia?: string
  erro?: string
  legenda?: string
} & SelectHTMLAttributes<HTMLSelectElement>

export function CampoSelect({
  rotulo,
  opcoes,
  opcaoVazia,
  erro,
  legenda,
  id,
  required,
  ...props
}: PropsCampoSelect) {
  const descritoPor = id ? montarDescritoPor(id, erro, legenda) : undefined

  return (
    <div className="campo">
      <label className="campo__rotulo" htmlFor={id}>
        {rotulo}
      </label>
      <select
        id={id}
        required={required}
        aria-required={required ? true : undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor}
        {...props}
        className="campo__controle campo__controle--altura-padrao"
      >
        {opcaoVazia && (
          <option value="" disabled hidden>
            {opcaoVazia}
          </option>
        )}
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
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