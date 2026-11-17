import type { MensagemBruta } from '../../dominio/mensagem-campos.ts'
import { textoMensagem } from './regras/mensagens-chamado.ts'
import './conversa.css'

type PropsItemNotaInterna = {
  nota: MensagemBruta
}

/**
 * Desenha uma nota interna. Não lista, não filtra e não guarda texto
 * novo. O corpo vem de `mensagens-chamado.ts`. A lista fica em
 * `PainelNotas.tsx` e em `PainelConversaGestor.tsx`.
 */
export function ItemNotaInterna({ nota }: PropsItemNotaInterna) {
  return <article className="nota-interna">{textoMensagem(nota)}</article>
}