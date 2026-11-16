import type { MensagemBruta } from '../../dominio/mensagem-campos.ts'
import { textoMensagem } from './regras/mensagens-chamado.ts'
import './conversa.css'

type PropsItemNotaInterna = {
  nota: MensagemBruta
}

export function ItemNotaInterna({ nota }: PropsItemNotaInterna) {
  return <article className="nota-interna">{textoMensagem(nota)}</article>
}