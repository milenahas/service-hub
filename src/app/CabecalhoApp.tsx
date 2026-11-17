import { useNavigate } from 'react-router-dom'
import { CAMINHOS } from './caminhos.ts'
import { useStore } from './store.ts'
import type { Perfil } from '../dominio/tipos.ts'
import { Botao, Selo } from '../shared/components/index.ts'
import './CabecalhoApp.css'

type PropsCabecalhoApp = {
  rotuloPerfil: string
}

function perfilParaTexto(perfil: Perfil): string {
  if (perfil === 'consultor') return 'Consultor'
  if (perfil === 'cliente') return 'Cliente'
  return 'Gestor'
}

function textoSeloPerfil(perfil: Perfil, complemento: string): string {
  const rotulo = perfilParaTexto(perfil)
  const extra = complemento.trim()
  if (!extra) return rotulo
  return `${rotulo} · ${extra}`
}

export function CabecalhoApp({ rotuloPerfil }: PropsCabecalhoApp) {
  const usuario = useStore((e) => e.usuarioLogado)
  const sair = useStore((e) => e.sair)
  const navigate = useNavigate()

  if (!usuario) return null

  function aoSair() {
    sair()
    navigate(CAMINHOS.login, { replace: true })
  }

  return (
    <header className="cabecalho-app">
      <div className="cabecalho-app__marca">
        <span className="cabecalho-app__emblema" aria-hidden="true">
          S
        </span>
        <span className="cabecalho-app__nome-produto">Service Hub</span>
        <Selo apresentacao="texto-cinza">
          {textoSeloPerfil(usuario.perfil, rotuloPerfil)}
        </Selo>
      </div>
      <div className="cabecalho-app__acoes">
        <span className="cabecalho-app__usuario">{usuario.nome}</span>
        <Botao variante="secundario" type="button" onClick={aoSair}>
          Sair
        </Botao>
      </div>
    </header>
  )
}