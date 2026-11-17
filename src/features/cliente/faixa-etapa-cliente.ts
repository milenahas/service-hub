import type { StatusChamado } from '../../dominio/chamado.ts'

export type TomFaixaEtapa = 'aberto' | 'aguardando' | 'resolvido'

export type FaixaEtapaCliente = {
  tom: TomFaixaEtapa
  frase: string
}

/**
 * Frase e tom da faixa de etapa do cliente. `fechado` devolve null
 * (a faixa não é desenhada). Não pinta: `PainelChamadoCliente.tsx` usa
 * o tom para a cor e a frase como texto. O nome do responsável vem do
 * painel, já resolvido em `usuarios`.
 */
export function faixaEtapaCliente(
  status: StatusChamado,
  nomeResponsavel: string | null,
): FaixaEtapaCliente | null {
  if (status === 'aberto') {
    return {
      tom: 'aberto',
      frase: 'Recebemos seu chamado. Um consultor vai assumir em breve.',
    }
  }
  if (status === 'em_atendimento') {
    const frase = nomeResponsavel
      ? `${nomeResponsavel} está cuidando do seu chamado.`
      : 'Um consultor está cuidando do seu chamado.'
    return { tom: 'aberto', frase }
  }
  if (status === 'aguardando_cliente') {
    return {
      tom: 'aguardando',
      frase: 'Precisamos de uma resposta sua para continuar.',
    }
  }
  if (status === 'resolvido') {
    return {
      tom: 'resolvido',
      frase: 'Resolvido. Confirme se está tudo certo ou reabra se precisar.',
    }
  }
  return null
}
