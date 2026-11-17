import {
  contarChamadosEmRisco,
  contarChamadosSemResponsavel,
  contarConsultoresOciosos,
} from './indicadores-gestor.ts'
import type { Chamado } from '../../dominio/snapshot.ts'

type PropsPainelIndicadores = {
  chamados: Chamado[]
  consultorIds: string[]
  agora: string
  aoAbrirSla: () => void
  aoAbrirSemResponsavel: () => void
  aoFiltrarOciosos: () => void
}

/**
 * Desenha os três cards de indicador do dashboard do gestor (SLA, sem
 * responsável, ociosos). Só lê contagens e repassa cliques à tela orquestradora.
 */
export function PainelIndicadores({
  chamados,
  consultorIds,
  agora,
  aoAbrirSla,
  aoAbrirSemResponsavel,
  aoFiltrarOciosos,
}: PropsPainelIndicadores) {
  const sla = contarChamadosEmRisco(chamados, agora)
  const semDono = contarChamadosSemResponsavel(chamados)
  const ociosos = contarConsultoresOciosos(consultorIds, chamados)

  return (
    <div className="painel-indicadores">
      <button
        type="button"
        aria-label="SLA em até 4h"
        className={`cartao-indicador${sla > 0 ? ' cartao-indicador--alerta' : ''}`}
        onClick={aoAbrirSla}
      >
        <span
          className={
            sla > 0
              ? 'cartao-indicador__numero cartao-indicador__numero--negativo'
              : 'cartao-indicador__numero'
          }
        >
          {sla}
        </span>
        <span className="cartao-indicador__legenda">SLA em até 4h</span>
        <span className="cartao-indicador__sub">Estourados ou perto do prazo</span>
      </button>
      <button
        type="button"
        aria-label="Sem responsável"
        className={`cartao-indicador${semDono > 0 ? ' cartao-indicador--alerta' : ''}`}
        onClick={aoAbrirSemResponsavel}
      >
        <span
          className={
            semDono > 0
              ? 'cartao-indicador__numero cartao-indicador__numero--negativo'
              : 'cartao-indicador__numero'
          }
        >
          {semDono}
        </span>
        <span className="cartao-indicador__legenda">Sem responsável</span>
        <span className="cartao-indicador__sub">Na fila do grupo</span>
      </button>
      <button
        type="button"
        aria-label="Ociosos agora"
        className="cartao-indicador"
        onClick={aoFiltrarOciosos}
      >
        <span className="cartao-indicador__numero">{ociosos}</span>
        <span className="cartao-indicador__legenda">Ociosos agora</span>
        <span className="cartao-indicador__sub">Sem chamado atribuído</span>
      </button>
    </div>
  )
}