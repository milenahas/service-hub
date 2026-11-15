import { Navigate, Outlet } from 'react-router-dom'
import { CAMINHOS } from './caminhos.ts'
import type { Perfil } from '../dominio/tipos.ts'
import { useStore } from './store.ts'
import { redirecionarPorPerfil } from './redirecionar-por-perfil.ts'

type PropsRotaProtegida = {
  perfilRequerido: Perfil
}

export function RotaProtegida({ perfilRequerido }: PropsRotaProtegida) {
  const usuarioLogado = useStore((estado) => estado.usuarioLogado)

  if (!usuarioLogado) {
    return <Navigate to={CAMINHOS.login} replace />
  }

  if (usuarioLogado.perfil !== perfilRequerido) {
    return (
      <Navigate to={redirecionarPorPerfil(usuarioLogado.perfil)} replace />
    )
  }

  return <Outlet />
}