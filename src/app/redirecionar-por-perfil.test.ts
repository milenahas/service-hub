import { describe, expect, it } from 'vitest'
import { CAMINHOS } from './caminhos.ts'
import { redirecionarPorPerfil } from './redirecionar-por-perfil.ts'

describe('redirecionarPorPerfil', () => {
  it('mapeia cada perfil para a rota correta', () => {
    expect(redirecionarPorPerfil('cliente')).toBe(CAMINHOS.cliente)
    expect(redirecionarPorPerfil('consultor')).toBe(CAMINHOS.consultor)
    expect(redirecionarPorPerfil('gestor')).toBe(CAMINHOS.gestor)
  })
})