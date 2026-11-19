import { describe, expect, it } from 'vitest'
import type { Chamado } from '../../dominio/snapshot.ts'
import {
  chamadoEmRisco,
  contarChamadosSemResponsavel,
  contarConsultoresOciosos,
} from './indicadores-gestor.ts'
import { primeiroNome as primeiroNomeEquipe } from './equipe-gestor.ts'

const agora = '2026-01-01T12:00:00Z'

const chamadoAtivoBase: Chamado = {
  id: '1',
  numero: 1,
  titulo: 'Teste',
  descricao: '',
  categoria_id: 'c',
  grupo_id: 'g',
  prioridade: 'media',
  status: 'aberto',
  solicitante_id: 'cli',
  responsavel_id: null,
  aberto_em: '2026-01-01T00:00:00Z',
  atualizado_em: '2026-01-01T00:00:00Z',
  prazo_primeira_resposta: '2026-01-02T00:00:00Z',
  prazo_resolucao: '2026-01-01T12:30:00Z',
  sla_pausado: false,
}

describe('indicadores-gestor', () => {
  it.each([
    {
      nome: 'prazo vencido',
      prazo: '2026-01-01T11:00:00Z',
      esperado: true,
    },
    {
      nome: 'menos de 4h',
      prazo: '2026-01-01T13:00:00Z',
      esperado: true,
    },
    {
      nome: 'fora de risco',
      prazo: '2026-01-05T00:00:00Z',
      esperado: false,
    },
  ])('$nome entra em risco quando esperado', ({ prazo, esperado }) => {
    const chamado = { ...chamadoAtivoBase, prazo_resolucao: prazo }
    expect(chamadoEmRisco(chamado, agora)).toBe(esperado)
  })

  it('conta sem responsável', () => {
    const lista = [
      chamadoAtivoBase,
      { ...chamadoAtivoBase, id: '2', responsavel_id: 'c1' },
    ]
    expect(contarChamadosSemResponsavel(lista)).toBe(1)
  })

  it('conta consultor ocioso', () => {
    const chamados = [
      { ...chamadoAtivoBase, responsavel_id: 'c2' },
    ]
    expect(contarConsultoresOciosos(['c1', 'c2'], chamados)).toBe(1)
  })

  it('primeiro nome', () => {
    expect(primeiroNomeEquipe('Ricardo Monteiro')).toBe('Ricardo')
  })
})