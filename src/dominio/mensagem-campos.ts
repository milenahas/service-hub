import type { Mensagem } from './snapshot.ts'

/** Compatibilidade: snapshot JSON usa `texto` / `criada_em`. */
export type MensagemBruta = Mensagem & {
  texto?: string
  criada_em?: string
}

export function corpoDaMensagem(mensagem: MensagemBruta): string {
  return mensagem.corpo ?? mensagem.texto ?? ''
}

export function criadoEmDaMensagem(mensagem: MensagemBruta): string {
  return mensagem.criado_em ?? mensagem.criada_em ?? ''
}