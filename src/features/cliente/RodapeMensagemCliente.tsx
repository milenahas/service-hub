import { useState, type SubmitEvent } from 'react'
import type { StatusChamado } from '../../dominio/chamado.ts'
import { chamadoAtivo } from '../../dominio/prazo.ts'
import { Botao, CampoTexto } from '../../shared/components/index.ts'

type PropsRodapeMensagemCliente = {
  status: StatusChamado
  aoEnviar: (texto: string) => void
  aoReabrir: (motivo: string) => void
}

function textoConclusao(status: StatusChamado): string {
  if (status === 'fechado') {
    return 'Este chamado foi fechado. O problema voltou?'
  }
  return 'Este chamado foi resolvido. Se o problema voltar, você pode reabri-lo.'
}

/**
 * Desenha o rodapé do chamado: caixa de mensagem nos ativos, ou o texto
 * de conclusão com o formulário de reabertura. Guarda o texto digitado e
 * se o motivo está aberto. Enviar (botão ou Enter no campo) e reabrir
 * sobem para `PainelChamadoCliente.tsx`. Não grava mensagem nem status.
 */
export function RodapeMensagemCliente({
  status,
  aoEnviar,
  aoReabrir,
}: PropsRodapeMensagemCliente) {
  const [texto, setTexto] = useState('')
  const [motivo, setMotivo] = useState('')
  const [reaberturaAberta, setReaberturaAberta] = useState(false)
  const ativo = chamadoAtivo(status)

  function enviar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const corpo = texto.trim()
    if (!corpo) return
    aoEnviar(corpo)
    setTexto('')
    document.getElementById('mensagem-cliente')?.focus()
  }

  function confirmarReabertura() {
    const motivoLimpo = motivo.trim()
    if (!motivoLimpo) return
    aoReabrir(motivoLimpo)
    setMotivo('')
    setReaberturaAberta(false)
  }

  return (
    <footer className="rodape-cliente">
      {ativo && (
        <form className="rodape-cliente__form" onSubmit={enviar}>
          <CampoTexto
            id="mensagem-cliente"
            rotulo="Mensagem"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva uma mensagem…"
          />
          <div className="rodape-cliente__acoes">
            <Botao
              variante="primario"
              type="submit"
              disabled={!texto.trim()}
            >
              Enviar
            </Botao>
          </div>
        </form>
      )}
      {!ativo && !reaberturaAberta && (
        <div className="rodape-cliente__concluido">
          <p>{textoConclusao(status)}</p>
          <Botao
            variante="secundario"
            type="button"
            onClick={() => setReaberturaAberta(true)}
          >
            Reabrir chamado
          </Botao>
        </div>
      )}
      {!ativo && reaberturaAberta && (
        <div>
          <CampoTexto
            id="motivo-reabertura"
            rotulo="Motivo da reabertura"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <div className="rodape-cliente__acoes">
            <Botao
              variante="secundario"
              type="button"
              onClick={() => {
                setMotivo('')
                setReaberturaAberta(false)
              }}
            >
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              type="button"
              disabled={!motivo.trim()}
              onClick={confirmarReabertura}
            >
              Reabrir chamado
            </Botao>
          </div>
        </div>
      )}
    </footer>
  )
}
