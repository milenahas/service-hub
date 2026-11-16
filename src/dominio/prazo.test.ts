import { describe, expect, it } from 'vitest'
import { classificarFaixaPrazo, formatarTextoPrazoConsultor } from './prazo.ts'

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