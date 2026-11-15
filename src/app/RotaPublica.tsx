import { Navigate, Outlet } from 'react-router-dom'
import { useStore } from './store.ts'
import { redirecionarPorPerfil } from './redirecionar-por-perfil.ts'

/** Login: redireciona quem já tem sessão para a home do perfil */
export function RotaPublica() {
  const usuarioLogado = useStore((estado) => estado.usuarioLogado)

  if (usuarioLogado) {
    return (
      <Navigate
        to={redirecionarPorPerfil(usuarioLogado.perfil)}
        replace
      />
    )
  }

  return <Outlet />
}