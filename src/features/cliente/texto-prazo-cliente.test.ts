import { describe, expect, it } from 'vitest'
import type { StatusChamado } from '../../dominio/chamado.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import {
  textoPrazoListaCliente,
  textoRespostaPrevistaCliente,
} from './texto-prazo-cliente.ts'

const usuario: Usuario = {
  id: 'cli',
  nome: 'Leandro Mendes',
  email: 'leandro@example.com',
  perfil: 'cliente',
  locale: 'pt-PT',
  zoneinfo: 'Europe/Lisbon',
}

const agora = '2026-11-03T13:00:00Z'
const futuro = '2026-11-03T17:31:00Z'
const passado = '2026-11-03T10:00:00Z'

describe('textoPrazoListaCliente', () => {
  it('no aguardando cliente ignora o relógio', () => {
    expect(
      textoPrazoListaCliente('aguardando_cliente', futuro, agora, usuario),
    ).toBe('Aguardando você')
  })

  it('com prazo futuro mostra a hora da primeira resposta', () => {
    expect(
      textoPrazoListaCliente('em_atendimento', futuro, agora, usuario),
    ).toBe('Resposta até 17:31')
  })

  it('com prazo passado avisa que a resposta vem em breve', () => {
    expect(textoPrazoListaCliente('aberto', passado, agora, usuario)).toBe(
      'Resposta em breve',
    )
  })

  it.each<StatusChamado>(['resolvido', 'fechado'])(
    'não mostra prazo na lista quando o status é %s',
    (status) => {
      expect(textoPrazoListaCliente(status, futuro, agora, usuario)).toBeNull()
    },
  )
})

describe('textoRespostaPrevistaCliente', () => {
  it('com prazo futuro mostra data e hora', () => {
    expect(
      textoRespostaPrevistaCliente('em_atendimento', futuro, agora, usuario),
    ).toBe('03/11, 17:31')
  })

  it('com prazo passado e chamado ativo mostra Em breve', () => {
    expect(
      textoRespostaPrevistaCliente('aguardando_cliente', passado, agora, usuario),
    ).toBe('Em breve')
  })

  it.each<StatusChamado>(['resolvido', 'fechado'])(
    'mostra travessão quando o status é %s',
    (status) => {
      expect(
        textoRespostaPrevistaCliente(status, futuro, agora, usuario),
      ).toBe('—')
    },
  )
})
