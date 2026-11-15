import type { Usuario } from '../../dominio/tipos.ts'

/** Login digitado → `usuarios[].id` (PRD tela-login §7.2) */
const LOGIN_PARA_ID_USUARIO: Record<string, string> = {
  gestor: '875d257a-0dff-4428-a233-5332d0e67b86',
  'consultor-infraestrutura': 'ae4d6fdf-bd5b-4fe0-879a-f86c41012b99',
  'consultor-aplicacoes': '079d16b1-1e0b-43bd-8740-ad3d3e20b552',
  cliente: '7a853f14-c064-4dc4-bb24-8e8fdce4ccd4',
}

export function resolverUsuarioLogin(
  textoDigitado: string,
  usuarios: Usuario[],
): Usuario | null {
  const chave = textoDigitado.trim().toLowerCase()
  const id = LOGIN_PARA_ID_USUARIO[chave]
  if (!id) {
    return null
  }

  return usuarios.find((usuario) => usuario.id === id) ?? null
}