import { formatarDataHoraUsuario, formatarHoraUsuario } from '../../dominio/formatar-data.ts'
import { chamadoAtivo } from '../../dominio/prazo.ts'
import type { StatusChamado } from '../../dominio/chamado.ts'
import type { Usuario } from '../../dominio/tipos.ts'

/**
 * Textos de prazo que o cliente pode ler. A lista usa a hora; o painel,
 * a data. Não desenha e não usa o texto do consultor (“Estourado há”).
 * Quem pinta é `ColunaMeusChamados.tsx` e `PainelChamadoCliente.tsx`.
 * O relógio continua sendo `meta.agora`, comparado em `dominio/prazo.ts`.
 */
export function textoPrazoListaCliente(
  status: StatusChamado,
  prazoPrimeiraResposta: string,
  agora: string,
  usuario: Usuario,
): string | null {
  if (status === 'aguardando_cliente') {
    return 'Aguardando você'
  }
  if (!chamadoAtivo(status)) {
    return null
  }
  if (prazoNoFuturo(prazoPrimeiraResposta, agora)) {
    return `Resposta até ${formatarHoraUsuario(prazoPrimeiraResposta, usuario)}`
  }
  return 'Resposta em breve'
}

export function textoRespostaPrevistaCliente(
  status: StatusChamado,
  prazoPrimeiraResposta: string,
  agora: string,
  usuario: Usuario,
): string {
  if (!chamadoAtivo(status)) {
    return '—'
  }
  if (prazoNoFuturo(prazoPrimeiraResposta, agora)) {
    return formatarDataHoraUsuario(prazoPrimeiraResposta, usuario)
  }
  return 'Em breve'
}

function prazoNoFuturo(prazo: string, agora: string): boolean {
  return new Date(prazo).getTime() > new Date(agora).getTime()
}
