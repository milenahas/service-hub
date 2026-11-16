import { corpoDaMensagem, criadoEmDaMensagem, type MensagemBruta } from '../../../dominio/mensagem-campos.ts'
import type { Mensagem } from '../../../dominio/snapshot.ts'

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