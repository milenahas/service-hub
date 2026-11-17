import { ehMensagemSistema } from '../../../dominio/mensagens-sistema.ts'
import type { Usuario } from '../../../dominio/tipos.ts'

/**
 * Lado do balão para consultor e gestor: o cliente à esquerda, quem
 * está logado à direita, outro consultor como colega e o sistema ao
 * centro. Não desenha — `ListaConversa.tsx` pinta com
 * `BalaoMensagem.tsx`. Quem está na rotina de cliente usa
 * `tipo-visual-balao-cliente.ts`.
 */
export type TipoVisualBalao = 'cliente' | 'logado' | 'colega' | 'sistema'

export function tipoVisualBalao(
  autorId: string,
  solicitanteId: string,
  usuarioLogado: Usuario,
): TipoVisualBalao {
  if (ehMensagemSistema(autorId)) {
    return 'sistema'
  }
  if (autorId === solicitanteId) {
    return 'cliente'
  }
  if (autorId === usuarioLogado.id) {
    return 'logado'
  }
  return 'colega'
}