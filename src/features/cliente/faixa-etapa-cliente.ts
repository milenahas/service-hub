import type { StatusChamado } from '../../dominio/chamado.ts'

export type VarianteFaixaEtapa = 'aberto' | 'aguardando' | 'resolvido'

export type FaixaEtapaCliente = {
  variante: VarianteFaixaEtapa
  frase: string
}

/**
 * Frase e variante visual da faixa de etapa do cliente. `fechado` devolve
 * null (a faixa não é desenhada). Não pinta: `PainelChamadoCliente.tsx` usa
 * a variante na classe da cor e a frase como texto. O nome do responsável
 * vem do painel, já resolvido em `usuarios`.
 */
export function faixaEtapaCliente(
  status: StatusChamado,
  nomeResponsavel: string | null,
): FaixaEtapaCliente | null {
  if (status === 'aberto') {
    return {
      variante: 'aberto',
      frase: 'Recebemos seu chamado. Um consultor vai assumir em breve.',
    }
  }
  if (status === 'em_atendimento') {
    const frase = nomeResponsavel
      ? `${nomeResponsavel} está cuidando do seu chamado.`
      : 'Um consultor está cuidando do seu chamado.'
    return { variante: 'aberto', frase }
  }
  if (status === 'aguardando_cliente') {
    return {
      variante: 'aguardando',
      frase: 'Precisamos de uma resposta sua para continuar.',
    }
  }
  if (status === 'resolvido') {
    return {
      variante: 'resolvido',
      frase: 'Resolvido. Confirme se está tudo certo ou reabra se precisar.',
    }
  }
  return null
}
