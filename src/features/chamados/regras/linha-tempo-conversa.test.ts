import { describe, expect, it } from 'vitest'
import { AUTOR_SISTEMA_ID } from '../../../dominio/mensagens-sistema.ts'
import type { HistoricoEntrada, Mensagem } from '../../../dominio/snapshot.ts'
import type { Usuario } from '../../../dominio/tipos.ts'
import { linhaTempoPublicaDoChamado } from './linha-tempo-conversa.ts'

const thiago: Usuario = {
  id: 'c-consultor',
  nome: 'Thiago Nascimento',
  email: 't@example.com',
  perfil: 'consultor',
  locale: 'pt-BR',
  zoneinfo: 'America/Sao_Paulo',
  grupo_id: 'g1',
}

const chamadoId = 'ch-10571'

describe('linhaTempoPublicaDoChamado', () => {
  it('inclui status e atribuição do histórico do snapshot', () => {
    const historico: HistoricoEntrada[] = [
      {
        id: 'h-atrib',
        chamado_id: chamadoId,
        tipo: 'atribuicao',
        usuario_id: thiago.id,
        ocorrido_em: '2026-11-03T11:55:00Z',
        de: null,
        para: null,
        motivo: null,
      } as HistoricoEntrada & {
        de: null
        para: null
        motivo: null
      },
      {
        id: 'h-status',
        chamado_id: chamadoId,
        tipo: 'status',
        de: 'aberto',
        para: 'em_atendimento',
        motivo: 'Pegando da fila',
        usuario_id: thiago.id,
        ocorrido_em: '2026-11-03T11:55:00Z',
      } as HistoricoEntrada & {
        de: string
        para: string
        motivo: string
      },
    ]

    const linha = linhaTempoPublicaDoChamado([], historico, chamadoId, [thiago])
    expect(linha).toHaveLength(2)
    expect(linha.map((m) => m.corpo)).toContain(
      'Chamado atribuído a Thiago Nascimento',
    )
    expect(linha.map((m) => m.corpo)).toContain(
      'Status: Aberto → Em atendimento. Motivo: Pegando da fila',
    )
  })

  it('ordena mensagens e histórico por data', () => {
    const mensagens: Mensagem[] = [
      {
        id: 'm2',
        chamado_id: chamadoId,
        autor_id: 'cliente',
        corpo: 'Segunda',
        criado_em: '2026-11-03T12:00:00Z',
        interna: false,
      },
    ]
    const historico: HistoricoEntrada[] = [
      {
        id: 'h1',
        chamado_id: chamadoId,
        tipo: 'status',
        de: 'aberto',
        para: 'em_atendimento',
        motivo: 'Início',
        ocorrido_em: '2026-11-03T11:00:00Z',
      } as HistoricoEntrada & { de: string; para: string; motivo: string },
    ]

    const linha = linhaTempoPublicaDoChamado(
      mensagens,
      historico,
      chamadoId,
      [thiago],
    )
    expect(linha).toHaveLength(2)
    expect(linha[0]?.corpo).toMatch(/Status:/)
    expect(linha[1]?.corpo).toBe('Segunda')
  })

  it('não duplica quando o redutor já criou a mensagem de sistema', () => {
    const corpo =
      'Status: Em atendimento → Resolvido. Motivo: ok'
    const ocorrido = '2026-01-01T13:00:00Z'
    const mensagens: Mensagem[] = [
      {
        id: 'm-sistema',
        chamado_id: chamadoId,
        autor_id: AUTOR_SISTEMA_ID,
        corpo,
        criado_em: ocorrido,
        interna: false,
      },
    ]
    const historico: HistoricoEntrada[] = [
      {
        id: 'h-s',
        chamado_id: chamadoId,
        tipo: 'status',
        ocorrido_em: ocorrido,
        usuario_id: thiago.id,
        detalhes: {
          de: 'em_atendimento',
          para: 'resolvido',
          motivo: 'ok',
        },
      },
    ]

    const linha = linhaTempoPublicaDoChamado(
      mensagens,
      historico,
      chamadoId,
      [thiago],
    )
    expect(linha).toHaveLength(1)
    expect(linha[0]?.id).toBe('m-sistema')
  })
})