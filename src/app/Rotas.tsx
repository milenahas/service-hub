import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { CAMINHOS } from './caminhos.ts'
import { RotaProtegida } from './RotaProtegida.tsx'
import { RotaPublica } from './RotaPublica.tsx'
import { TelaLogin } from '../features/autenticacao/TelaLogin.tsx'
import { PlaceholderCliente } from '../features/cliente/PlaceholderCliente.tsx'
import { PlaceholderConsultor } from '../features/consultor/PlaceholderConsultor.tsx'
import { PlaceholderGestor } from '../features/gestor/PlaceholderGestor.tsx'

export const definicaoRotas: RouteObject[] = [
  {
    element: <RotaPublica />,
    children: [
      {
        path: CAMINHOS.login,
        element: <TelaLogin />,
      },
    ],
  },
  {
    element: <RotaProtegida perfilRequerido="cliente" />,
    children: [
      {
        path: CAMINHOS.cliente,
        element: <PlaceholderCliente />,
      },
    ],
  },
  {
    element: <RotaProtegida perfilRequerido="consultor" />,
    children: [
      {
        path: CAMINHOS.consultor,
        element: <PlaceholderConsultor />,
      },
    ],
  },
  {
    element: <RotaProtegida perfilRequerido="gestor" />,
    children: [
      {
        path: CAMINHOS.gestor,
        element: <PlaceholderGestor />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={CAMINHOS.login} replace />,
  },
]

export const router = createBrowserRouter(definicaoRotas)