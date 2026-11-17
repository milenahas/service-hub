import type { Chamado } from '../../dominio/snapshot.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import { formatarRotuloStatus } from '../../dominio/rotulo-status.ts'
import { Botao, CampoTexto, Selo } from '../../shared/components/index.ts'
import { textoPrazoListaCliente } from './texto-prazo-cliente.ts'

type PropsColunaMeusChamados = {
  chamados: Chamado[]
  busca: string
  temChamados: boolean
  agora: string
  usuario: Usuario
  selecionadoId: string | null
  naoLidos: Set<string>
  formularioAberto: boolean
  aoMudarBusca: (valor: string) => void
  aoSelecionar: (id: string) => void
  aoAbrirFormulario: () => void
}

/**
 * Desenha a coluna esquerda: botão de novo chamado, rótulo, busca e os
 * cartões. O ponto azul marca chamado com mensagem nova. Não ordena nem
 * filtra — recebe a lista visível de `lista-cliente.ts` — e não decide
 * quem está não lido: o conjunto vem de `usar-nao-lidos-cliente.ts`.
 * O prazo de cada cartão vem de `texto-prazo-cliente.ts`. A vista, o
 * termo da busca e a seleção ficam em `TelaCliente.tsx`.
 */
export function ColunaMeusChamados({
  chamados,
  busca,
  temChamados,
  agora,
  usuario,
  selecionadoId,
  naoLidos,
  formularioAberto,
  aoMudarBusca,
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
      <CampoTexto
        id="busca-meus-chamados"
        rotulo="Buscar chamado"
        value={busca}
        onChange={(evento) => aoMudarBusca(evento.target.value)}
        placeholder="Buscar chamado"
      />
      <div className="coluna-meus-chamados__lista">
        {chamados.length === 0 && !temChamados && (
          <p className="coluna-meus-chamados__vazio">
            Você ainda não abriu chamados.
          </p>
        )}
        {chamados.length === 0 && temChamados && (
          <p className="coluna-meus-chamados__vazio">
            Nenhum chamado encontrado.
          </p>
        )}
        {chamados.map((chamado) => {
          const selecionado = chamado.id === selecionadoId
          const naoLido = naoLidos.has(chamado.id)
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
              <span className="cartao-chamado-cliente__titulo">
                {naoLido && (
                  <span className="cartao-chamado-cliente__nao-lido" aria-label="Não lido" />
                )}
                <span className="cartao-chamado-cliente__titulo-texto">{chamado.titulo}</span>
              </span>
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
