import type { Usuario } from '../../dominio/tipos.ts'

/** Login digitado → `usuarios[].id` (PRD tela-login §7.2) */
const LOGIN_PARA_ID_USUARIO: Record<string, string> = {
  gestor: '875d257a-0dff-4428-a233-5332d0e67b86',
  'consultor-infraestrutura': '50039fe7-2ddf-4a02-8045-c635a4c724f6',
  'consultor-aplicacoes': '85d44809-37ca-4797-8fbf-53f112ebe792',
  cliente: '7a853f14-c064-4dc4-bb24-8e8fdce4ccd4',
}

/**
 * Casa o texto digitado, sem espaços nas pontas e sem distinguir
 * maiúsculas, com um dos quatro logins fixos e devolve o usuário do
 * snapshot. Não desenha o campo nem inicia a sessão — a tela fica em
 * `TelaLogin.tsx` e a sessão na store em `app/store.ts`.
 */
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