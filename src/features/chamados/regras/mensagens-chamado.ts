import { corpoDaMensagem, criadoEmDaMensagem, type MensagemBruta } from '../../../dominio/mensagem-campos.ts'
import type { Mensagem } from '../../../dominio/snapshot.ts'

/**
 * Recorta as mensagens de um chamado: as públicas, as notas internas
 * e o texto de cada uma. Não desenha.
 *
 * A linha do tempo pública usa o recorte em `linha-tempo-conversa.ts`
 * e aparece em `ListaConversa.tsx`. As notas alimentam `PainelNotas.tsx`
 * e `PainelConversaGestor.tsx`. O texto do balão e da nota fica em
 * `BalaoMensagem.tsx` e `ItemNotaInterna.tsx`.
 */
export function mensagensPublicasDoChamado(
  mensagens: Mensagem[],
  chamadoId: string,
): MensagemBruta[] {
  return mensagens
    .filter((m) => m.chamado_id === chamadoId && !m.interna)
    .sort(
      (a, b) =>
        new Date(criadoEmDaMensagem(a as MensagemBruta)).getTime() -
        new Date(criadoEmDaMensagem(b as MensagemBruta)).getTime(),
    )
}

export function notasInternasDoChamado(
  mensagens: Mensagem[],
  chamadoId: string,
): MensagemBruta[] {
  return mensagens
    .filter((m) => m.chamado_id === chamadoId && m.interna)
    .sort(
      (a, b) =>
        new Date(criadoEmDaMensagem(a as MensagemBruta)).getTime() -
        new Date(criadoEmDaMensagem(b as MensagemBruta)).getTime(),
    )
}

export function textoMensagem(mensagem: MensagemBruta): string {
  return corpoDaMensagem(mensagem)
}