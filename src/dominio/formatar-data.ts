import type { Usuario } from './tipos.ts'

export function formatarDataHoraUsuario(iso: string, usuario: Usuario): string {
  return new Intl.DateTimeFormat(usuario.locale, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: usuario.zoneinfo,
  }).format(new Date(iso))
}

/** Hora no fuso do usuário, para “Resposta até HH:MM” na lista do cliente. */
export function formatarHoraUsuario(iso: string, usuario: Usuario): string {
  return new Intl.DateTimeFormat(usuario.locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: usuario.zoneinfo,
  }).format(new Date(iso))
}