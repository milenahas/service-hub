import type { StatusChamado } from './chamado.ts'
import type { HistoricoEntrada } from './snapshot.ts'

/** Compatibilidade: snapshot JSON usa `de` / `para` / `motivo` no topo. */
export type HistoricoBruto = HistoricoEntrada & {
  de?: string | null
  para?: string | null
  motivo?: string | null
}

type TransicaoStatus = {
  de: StatusChamado
  para: StatusChamado
  motivo: string
}

export function transicaoStatusDoHistorico(
  entrada: HistoricoBruto,
): TransicaoStatus | null {
  if (entrada.tipo !== 'status') {
    return null
  }

  const detalhes = entrada.detalhes
  if (
    detalhes &&
    typeof detalhes.de === 'string' &&
    typeof detalhes.para === 'string'
  ) {
    const motivo =
      typeof detalhes.motivo === 'string' ? detalhes.motivo : ''
    return {
      de: detalhes.de as StatusChamado,
      para: detalhes.para as StatusChamado,
      motivo,
    }
  }

  if (entrada.de && entrada.para) {
    return {
      de: entrada.de as StatusChamado,
      para: entrada.para as StatusChamado,
      motivo: entrada.motivo ?? '',
    }
  }

  return null
}

export function consultorAtribuicaoDoHistorico(
  entrada: HistoricoBruto,
): string | null {
  if (entrada.tipo !== 'atribuicao' || !entrada.usuario_id) {
    return null
  }
  return entrada.usuario_id
}