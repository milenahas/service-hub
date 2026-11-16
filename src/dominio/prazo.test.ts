import { describe, expect, it } from 'vitest'
import {
  classificarFaixaPrazo,
  faixaBarraItemFila,
  formatarTextoPrazoConsultor,
} from './prazo.ts'

describe('prazo', () => {
  const agora = '2026-01-01T12:00:00Z'

  it('classifica estourado e urgente', () => {
    expect(
      classificarFaixaPrazo('2026-01-01T11:00:00Z', agora, 'aberto'),
    ).toBe('estourado')
    expect(
      classificarFaixaPrazo('2026-01-01T12:30:00Z', agora, 'aberto'),
    ).toBe('urgente')
  })

  it('mapeia faixa da barra na fila', () => {
    expect(
      faixaBarraItemFila('aguardando_cliente', 'urgente'),
    ).toBe('neutro')
    expect(faixaBarraItemFila('em_atendimento', 'estourado')).toBe(
      'urgente',
    )
    expect(faixaBarraItemFila('aberto', 'alerta')).toBe('alerta')
  })

  it('formata texto para consultor', () => {
    expect(
      formatarTextoPrazoConsultor(
        '2026-01-01T12:45:00Z',
        agora,
        'em_atendimento',
      ),
    ).toMatch(/Vence em/)
  })
})