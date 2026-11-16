import { ehMensagemSistema } from '../../../dominio/mensagens-sistema.ts'
import type { Usuario } from '../../../dominio/tipos.ts'

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