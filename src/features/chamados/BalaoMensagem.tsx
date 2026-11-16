import type { MensagemBruta } from '../../dominio/mensagem-campos.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import { textoMensagem } from './regras/mensagens-chamado.ts'
import { tipoVisualBalao } from './regras/tipo-visual-balao.ts'
import './conversa.css'

type PropsBalaoMensagem = {
  mensagem: MensagemBruta
  solicitanteId: string
  usuarioLogado: Usuario
}

export function BalaoMensagem({
  mensagem,
  solicitanteId,
  usuarioLogado,
}: PropsBalaoMensagem) {
  const tipoVisual = tipoVisualBalao(
    mensagem.autor_id,
    solicitanteId,
    usuarioLogado,
  )
  return (
    <div className={`balao balao--${tipoVisual}`}>
      <div className="balao__corpo">{textoMensagem(mensagem)}</div>
    </div>
  )
}