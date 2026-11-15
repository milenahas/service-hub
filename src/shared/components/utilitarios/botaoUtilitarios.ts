import type { VarianteBotao } from '../tipos.ts'

type OpcoesClasseBotao = {
  variante: VarianteBotao
  bloco?: boolean
}

export function montarClasseBotao({
  variante,
  bloco = false,
}: OpcoesClasseBotao): string {
  const partes = ['botao', `botao--${variante}`]

  if (bloco) {
    partes.push('botao--bloco')
  }

  return partes.join(' ')
}