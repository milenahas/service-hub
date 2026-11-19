import {
  chamadoAtivo,
  classificarFaixaPrazo,
  dataConclusaoChamado,
} from '../../dominio/prazo.ts'
import type { Chamado } from '../../dominio/snapshot.ts'
import type { AbaFila } from './fila-consultor.ts'

/**
 * Agrupa e ordena a lista do consultor pelo prazo de resolução em
 * relação a `meta.agora`: urgentes (vencido ou menos de 1h), próximas
 * 4h, demais e aguardando cliente. Concluídos formam uma seção à parte,
 * do mais recente ao mais antigo. Não desenha. Quem pede as seções é
 * `fila-consultor.ts`; quem pinta é `ColunaFila.tsx`.
 */

export type GrupoListaFila =
  | 'urgentes'
  | 'proximas_quatro'
  | 'demais'
  | 'aguardando_cliente'
  | 'concluidos'

export type SecaoFila = {
  grupo: GrupoListaFila
  titulo: string
  chamados: Chamado[]
}

const TITULOS: Record<GrupoListaFila, string> = {
  urgentes: 'URGENTES · VENCIDO OU MENOS DE 1H',
  proximas_quatro: 'PRÓXIMAS 4 HORAS',
  demais: 'DEMAIS, POR PRAZO',
  aguardando_cliente: 'AGUARDANDO CLIENTE',
  concluidos: 'CONCLUÍDOS · MAIS RECENTES PRIMEIRO',
}

function ordenarPorPrazo(a: Chamado, b: Chamado): number {
  return (
    new Date(a.prazo_resolucao).getTime() -
    new Date(b.prazo_resolucao).getTime()
  )
}

function grupoAtivo(chamado: Chamado, agora: string): GrupoListaFila {
  if (chamado.status === 'aguardando_cliente') {
    return 'aguardando_cliente'
  }
  const faixa = classificarFaixaPrazo(
    chamado.prazo_resolucao,
    agora,
    chamado.status,
  )
  if (faixa === 'vencido' || faixa === 'urgente') {
    return 'urgentes'
  }
  if (faixa === 'alerta') {
    return 'proximas_quatro'
  }
  return 'demais'
}

const ORDEM_GRUPOS: GrupoListaFila[] = [
  'urgentes',
  'proximas_quatro',
  'demais',
  'aguardando_cliente',
]

function montarSecaoConcluidos(chamados: Chamado[]): SecaoFila[] {
  const ordenados = [...chamados].sort(
    (a, b) => dataConclusaoChamado(b) - dataConclusaoChamado(a),
  )
  if (ordenados.length === 0) {
    return []
  }
  return [
    {
      grupo: 'concluidos',
      titulo: TITULOS.concluidos,
      chamados: ordenados,
    },
  ]
}

function montarSecoesAtivos(chamados: Chamado[], agora: string): SecaoFila[] {
  const ativos = chamados.filter((chamado) => chamadoAtivo(chamado.status))

  return ORDEM_GRUPOS.flatMap((grupo) => {
    const lista = ativos
      .filter((chamado) => grupoAtivo(chamado, agora) === grupo)
      .sort(ordenarPorPrazo)
    if (lista.length === 0) {
      return []
    }
    return [{ grupo, titulo: TITULOS[grupo], chamados: lista }]
  })
}

export function agruparFila(
  chamados: Chamado[],
  aba: AbaFila,
  agora: string,
): SecaoFila[] {
  if (aba === 'concluidos') {
    return montarSecaoConcluidos(chamados)
  }
  return montarSecoesAtivos(chamados, agora)
}