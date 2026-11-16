/** ID fixo para mensagens de sistema na conversa (não é usuário do snapshot). */
export const AUTOR_SISTEMA_ID = '00000000-0000-0000-0000-000000000001'

export function textoAtribuicao(nomeConsultor: string): string {
  return `Chamado atribuído a ${nomeConsultor}`
}

export function textoMudancaStatus(
  motivo: string,
  rotuloDe: string,
  rotuloPara: string,
): string {
  return `Status: ${rotuloDe} → ${rotuloPara}. Motivo: ${motivo}`
}

export function ehMensagemSistema(autorId: string): boolean {
  return autorId === AUTOR_SISTEMA_ID
}