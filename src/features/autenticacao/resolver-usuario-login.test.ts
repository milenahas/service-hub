import { describe, expect, it } from 'vitest'
import type { Usuario } from '../../dominio/tipos.ts'
import { resolverUsuarioLogin } from './resolver-usuario-login.ts'

const usuariosFixos: Usuario[] = [
  {
    id: '875d257a-0dff-4428-a233-5332d0e67b86',
    nome: 'Ricardo Monteiro',
    email: 'ricardo.monteiro@suporte.example',
    perfil: 'gestor',
    locale: 'pt-BR',
    zoneinfo: 'America/Sao_Paulo',
  },
  {
    id: 'ae4d6fdf-bd5b-4fe0-879a-f86c41012b99',
    nome: 'Marina Almeida',
    email: 'marina.almeida@suporte.example',
    perfil: 'consultor',
    locale: 'pt-BR',
    zoneinfo: 'America/Sao_Paulo',
    grupo_id: '29be5d21-2981-4b38-a4c2-771116e58928',
  },
  {
    id: '079d16b1-1e0b-43bd-8740-ad3d3e20b552',
    nome: 'Beatriz Lima',
    email: 'beatriz.lima@suporte.example',
    perfil: 'consultor',
    locale: 'pt-BR',
    zoneinfo: 'America/Sao_Paulo',
    grupo_id: '9d8ad616-fd35-4f2c-9eaa-3ca931b51313',
  },
  {
    id: '7a853f14-c064-4dc4-bb24-8e8fdce4ccd4',
    nome: 'Leandro Mendes',
    email: 'leandro.mendes@lusitania.example',
    perfil: 'cliente',
    locale: 'pt-PT',
    zoneinfo: 'Europe/Lisbon',
  },
]

describe('resolverUsuarioLogin', () => {
  it('aceita os quatro logins com normalização', () => {
    expect(resolverUsuarioLogin('gestor', usuariosFixos)?.nome).toBe(
      'Ricardo Monteiro',
    )
    expect(resolverUsuarioLogin('  GESTOR  ', usuariosFixos)?.id).toBe(
      '875d257a-0dff-4428-a233-5332d0e67b86',
    )
    expect(resolverUsuarioLogin('consultor-infraestrutura', usuariosFixos)?.id).toBe(
      'ae4d6fdf-bd5b-4fe0-879a-f86c41012b99',
    )
    expect(resolverUsuarioLogin('consultor-aplicacoes', usuariosFixos)?.id).toBe(
      '079d16b1-1e0b-43bd-8740-ad3d3e20b552',
    )
    expect(resolverUsuarioLogin('cliente', usuariosFixos)?.nome).toBe(
      'Leandro Mendes',
    )
  })

  it('rejeita alias e entradas inválidas', () => {
    expect(resolverUsuarioLogin('consultor', usuariosFixos)).toBeNull()
    expect(resolverUsuarioLogin('marina', usuariosFixos)).toBeNull()
    expect(resolverUsuarioLogin('   ', usuariosFixos)).toBeNull()
  })
})