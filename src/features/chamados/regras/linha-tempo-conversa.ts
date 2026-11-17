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

/**
 * Junta as mensagens públicas do chamado com as linhas de sistema
 * (atribuição e mudança de status) derivadas do histórico do snapshot,
 * sem repetir o que já existe como mensagem, e ordena por data.
 *
 * O recorte público fica em `mensagens-chamado.ts`. Textos de sistema e
 * a leitura do histórico ficam em `mensagens-sistema.ts` e
 * `historico-campos.ts`. Quem desenha a conversa é `ListaConversa.tsx`
 * e o painel do cliente em `PainelChamadoCliente.tsx`. Não desenha.
 */

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

function corpoSistemaDaEntrada(
  entrada: HistoricoBruto,
  usuarios: Usuario[],
): string | null {
  const transicao = transicaoStatusDoHistorico(entrada)
  if (transicao) {
    return textoMudancaStatus(
      transicao.motivo,
      formatarRotuloStatus(transicao.de),
      formatarRotuloStatus(transicao.para),
    )
  }

  const consultorId = consultorAtribuicaoDoHistorico(entrada)
  if (!consultorId) {
    return null
  }
  return textoAtribuicao(nomeUsuario(usuarios, consultorId))
}

function montarMensagemSistema(
  entrada: HistoricoEntrada,
  chamadoId: string,
  corpo: string,
): Mensagem {
  return {
    id: `historico-${entrada.id}`,
    chamado_id: chamadoId,
    autor_id: AUTOR_SISTEMA_ID,
    corpo,
    criado_em: entrada.ocorrido_em,
    interna: false,
  }
}

function mensagemSistemaDaEntrada(
  entrada: HistoricoEntrada,
  chamadoId: string,
  usuarios: Usuario[],
  mensagens: Mensagem[],
): Mensagem[] {
  const corpo = corpoSistemaDaEntrada(entrada as HistoricoBruto, usuarios)
  if (!corpo) {
    return []
  }
  if (
    mensagemSistemaJaExiste(mensagens, chamadoId, entrada.ocorrido_em, corpo)
  ) {
    return []
  }
  return [montarMensagemSistema(entrada, chamadoId, corpo)]
}

function mensagensSistemaDoHistorico(
  historico: HistoricoEntrada[],
  chamadoId: string,
  usuarios: Usuario[],
  mensagens: Mensagem[],
): Mensagem[] {
  return historico
    .filter((entrada) => entrada.chamado_id === chamadoId)
    .flatMap((entrada) =>
      mensagemSistemaDaEntrada(entrada, chamadoId, usuarios, mensagens),
    )
}

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