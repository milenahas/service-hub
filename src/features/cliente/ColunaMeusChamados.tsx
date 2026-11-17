import type { Chamado } from '../../dominio/snapshot.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import { formatarRotuloStatus } from '../../dominio/rotulo-status.ts'
import { Botao, Selo } from '../../shared/components/index.ts'
import { textoPrazoListaCliente } from './texto-prazo-cliente.ts'

type PropsColunaMeusChamados = {
  chamados: Chamado[]
  agora: string
  usuario: Usuario
  selecionadoId: string | null
  formularioAberto: boolean
  aoSelecionar: (id: string) => void
  aoAbrirFormulario: () => void
}

/**
 * Desenha a coluna esquerda: botão de novo chamado, rótulo e os cartões.
 * Não ordena — recebe a lista de `lista-cliente.ts`. O prazo de cada
 * cartão vem de `texto-prazo-cliente.ts`. A vista e a seleção ficam em
 * `TelaCliente.tsx`.
 */
export function ColunaMeusChamados({
  chamados,
  agora,
  usuario,
  selecionadoId,
  formularioAberto,
  aoSelecionar,
  aoAbrirFormulario,
}: PropsColunaMeusChamados) {
  return (
    <section className="coluna-meus-chamados" aria-labelledby="rotulo-meus-chamados">
      <Botao
        variante="primario"
        bloco
        type="button"
        aria-pressed={formularioAberto}
        onClick={aoAbrirFormulario}
      >
        + Novo chamado
      </Botao>
      <p id="rotulo-meus-chamados" className="coluna-meus-chamados__rotulo">
        MEUS CHAMADOS
      </p>
      <div className="coluna-meus-chamados__lista">
        {chamados.length === 0 && (
          <p className="coluna-meus-chamados__vazio">
            Você ainda não abriu chamados.
          </p>
        )}
        {chamados.map((chamado) => {
          const selecionado = chamado.id === selecionadoId
          const prazo = textoPrazoListaCliente(
            chamado.status,
            chamado.prazo_primeira_resposta,
            agora,
            usuario,
          )
          const classe = selecionado
            ? 'cartao-chamado-cliente cartao-chamado-cliente--selecionado'
            : 'cartao-chamado-cliente'

          return (
            <button
              key={chamado.id}
              type="button"
              className={classe}
              aria-current={selecionado ? 'true' : undefined}
              onClick={() => aoSelecionar(chamado.id)}
            >
              <span className="cartao-chamado-cliente__titulo">{chamado.titulo}</span>
              <span className="cartao-chamado-cliente__linha">
                <Selo apresentacao="status-preenchido" status={chamado.status}>
                  {formatarRotuloStatus(chamado.status)}
                </Selo>
                {prazo && (
                  <span className="cartao-chamado-cliente__prazo">{prazo}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
