import { useState } from 'react'
import { Botao, CampoTextarea } from '../../shared/components/index.ts'
import { chamadoAtivo } from '../../dominio/prazo.ts'
import type { StatusChamado } from '../../dominio/chamado.ts'
import './conversa.css'

type PropsRodapeRespostaCliente = {
  status: StatusChamado
  aoEnviar: (texto: string) => void
}

export function RodapeRespostaCliente({
  status,
  aoEnviar,
}: PropsRodapeRespostaCliente) {
  const [texto, setTexto] = useState('')

  if (!chamadoAtivo(status)) {
    return (
      <p className="rodape-resposta__legenda">
        Este chamado foi concluído. Para retomar o atendimento, mude o status.
      </p>
    )
  }

  function enviar() {
    const corpo = texto.trim()
    if (!corpo) return
    aoEnviar(corpo)
    setTexto('')
  }

  return (
    <div className="rodape-resposta">
      <CampoTextarea
        id="resposta-cliente"
        rotulo="Responder ao cliente"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Responder ao cliente…"
        rows={3}
      />
      <p className="rodape-resposta__legenda">
        Esta mensagem será enviada ao cliente.
      </p>
      <div className="rodape-resposta__acoes">
        <Botao
          variante="primario"
          type="button"
          disabled={!texto.trim()}
          onClick={enviar}
        >
          Enviar ao cliente
        </Botao>
      </div>
    </div>
  )
}