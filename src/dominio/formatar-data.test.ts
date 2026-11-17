import { describe, expect, it } from 'vitest'
import type { Usuario } from './tipos.ts'
import { formatarHoraUsuario } from './formatar-data.ts'

const leandro: Usuario = {
  id: '7a853f14-c064-4dc4-bb24-8e8fdce4ccd4',
  nome: 'Leandro Mendes',
  email: 'leandro@example.com',
  perfil: 'cliente',
  locale: 'pt-PT',
  zoneinfo: 'Europe/Lisbon',
}

describe('formatarHoraUsuario', () => {
  it('mostra hora e minuto no fuso do usuário', () => {
    expect(formatarHoraUsuario('2026-11-03T17:31:50Z', leandro)).toBe('17:31')
  })
})
