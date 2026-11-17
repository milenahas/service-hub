import { describe, expect, it } from 'vitest'
import { AUTOR_SISTEMA_ID } from '../../dominio/mensagens-sistema.ts'
import { tipoVisualBalaoCliente } from './tipo-visual-balao-cliente.ts'

describe('tipoVisualBalaoCliente', () => {
  it('mensagem do logado fica à direita', () => {
    expect(tipoVisualBalaoCliente('cliente-1', 'cliente-1')).toBe('logado')
  })

  it('mensagem do consultor fica no balão cinza da esquerda', () => {
    expect(tipoVisualBalaoCliente('consultor-1', 'cliente-1')).toBe('cliente')
  })

  it('mensagem de sistema fica ao centro', () => {
    expect(tipoVisualBalaoCliente(AUTOR_SISTEMA_ID, 'cliente-1')).toBe('sistema')
  })
})
