import {
  consultorAtribuicaoDoHistorico,
  transicaoStatusDoHistorico,
  type HistoricoBruto,
} from '../../../dominio/historico-campos.ts'
import {
  AUTOR_SISTEMA_ID,
  textoAtribuicao,
  textoMudancaStatus,
} from '../../../dominio/mensagens-sistema.ts'
import {
  corpoDaMensagem,
  criadoEmDaMensagem,
  type MensagemBruta,
} from '../../../dominio/mensagem-campos.ts'
import { formatarRotuloStatus } from '../../../dominio/rotulo-status.ts'
import type { HistoricoEntrada, Mensagem } from '../../../dominio/snapshot.ts'
import type { Usuario } from '../../../dominio/tipos.ts'
import { mensagensPublicasDoChamado } from './mensagens-chamado.ts'

function nomeUsuario(usuarios: Usuario[], usuarioId: string): string {
  return usuarios.find((u) => u.id === usuarioId)?.nome ?? 'Consultor'
}

function mensagemSistemaJaExiste(
  mensagens: Mensagem[],
  chamadoId: string,
  ocorridoEm: string,
  corpo: string,
): boolean {
  return mensagens.some(
    (m) =>
      m.chamado_id === chamadoId &&
      m.autor_id === AUTOR_SISTEMA_ID &&
      !m.interna &&
      criadoEmDaMensagem(m as MensagemBruta) === ocorridoEm &&
      corpoDaMensagem(m as MensagemBruta) === corpo,
  )
}

function mensagensSistemaDoHistorico(
  historico: HistoricoEntrada[],
  chamadoId: string,
  usuarios: Usuario[],
  mensagens: Mensagem[],
): Mensagem[] {
  const sintetizadas: Mensagem[] = []

  for (const entrada of historico) {
    if (entrada.chamado_id !== chamadoId) {
      continue
    }
    const bruto = entrada as HistoricoBruto

    const transicao = transicaoStatusDoHistorico(bruto)
    if (transicao) {
      const corpo = textoMudancaStatus(
        transicao.motivo,
        formatarRotuloStatus(transicao.de),
        formatarRotuloStatus(transicao.para),
      )
      if (
        !mensagemSistemaJaExiste(
          mensagens,
          chamadoId,
          entrada.ocorrido_em,
          corpo,
        )
      ) {
        sintetizadas.push({
          id: `historico-${entrada.id}`,
          chamado_id: chamadoId,
          autor_id: AUTOR_SISTEMA_ID,
          corpo,
          criado_em: entrada.ocorrido_em,
          interna: false,
        })
      }
      continue
    }

    const consultorId = consultorAtribuicaoDoHistorico(bruto)
    if (consultorId) {
      const corpo = textoAtribuicao(nomeUsuario(usuarios, consultorId))
      if (
        !mensagemSistemaJaExiste(
          mensagens,
          chamadoId,
          entrada.ocorrido_em,
          corpo,
        )
      ) {
        sintetizadas.push({
          id: `historico-${entrada.id}`,
          chamado_id: chamadoId,
          autor_id: AUTOR_SISTEMA_ID,
          corpo,
          criado_em: entrada.ocorrido_em,
          interna: false,
        })
      }
    }
  }

  return sintetizadas
}

/** Mensagens públicas do chamado + linhas de sistema derivadas do histórico (snapshot). */
export function linhaTempoPublicaDoChamado(
  mensagens: Mensagem[],
  historico: HistoricoEntrada[],
  chamadoId: string,
  usuarios: Usuario[],
): MensagemBruta[] {
  const publicas = mensagensPublicasDoChamado(mensagens, chamadoId)
  const doHistorico = mensagensSistemaDoHistorico(
    historico,
    chamadoId,
    usuarios,
    mensagens,
  )

  return [...publicas, ...doHistorico].sort(
    (a, b) =>
      new Date(criadoEmDaMensagem(a)).getTime() -
      new Date(criadoEmDaMensagem(b)).getTime(),
  )
}