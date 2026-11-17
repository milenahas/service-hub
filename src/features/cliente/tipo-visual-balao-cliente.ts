import { ehMensagemSistema } from '../../dominio/mensagens-sistema.ts'
import type { TipoVisualBalao } from '../chamados/regras/tipo-visual-balao.ts'

/**
 * Lado do balão para quem está logado como cliente: a própria mensagem
 * à direita (`logado`), as outras pessoas no balão cinza da esquerda
 * (`cliente`) e o sistema ao centro. Não desenha o balão — isso fica em
 * `BalaoMensagem.tsx`, montado por `PainelChamadoCliente.tsx`.
 * O mapper do consultor (`tipo-visual-balao.ts`) não serve aqui.
 */
export function tipoVisualBalaoCliente(
  autorId: string,
  usuarioLogadoId: string,
): TipoVisualBalao {
  if (ehMensagemSistema(autorId)) {
    return 'sistema'
  }
  if (autorId === usuarioLogadoId) {
    return 'logado'
  }
  return 'cliente'
}
