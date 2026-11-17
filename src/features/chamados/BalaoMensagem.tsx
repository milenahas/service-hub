import type { MensagemBruta } from '../../dominio/mensagem-campos.ts'
import { textoMensagem } from './regras/mensagens-chamado.ts'
import type { TipoVisualBalao } from './regras/tipo-visual-balao.ts'
import './conversa.css'

type PropsBalaoMensagem = {
  mensagem: MensagemBruta
  tipoVisual: TipoVisualBalao
  cabecalho?: string
}

/**
 * Desenha um balão da conversa, com cabeçalho opcional e o texto. Não
 * escolhe o lado nem a ordem — o tipo visual chega pronto. O texto vem
 * de `mensagens-chamado.ts`. A lista do consultor e do gestor fica em
 * `ListaConversa.tsx`; a do cliente, em `PainelChamadoCliente.tsx`.
 */
export function BalaoMensagem({
  mensagem,
  tipoVisual,
  cabecalho,
}: PropsBalaoMensagem) {
  return (
    <div className={`balao balao--${tipoVisual}`}>
      <div className="balao__corpo">
        {cabecalho && <p className="balao__cabecalho">{cabecalho}</p>}
        <p className="balao__texto">{textoMensagem(mensagem)}</p>
      </div>
    </div>
  )
}