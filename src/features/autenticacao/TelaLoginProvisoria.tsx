import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import dados from '../../data/dados.json'
import { useStore } from '../../app/store.ts'
import { redirecionarPorPerfil } from '../../app/redirecionar-por-perfil.ts'
import { Botao, CampoTexto } from '../../shared/components/index.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import { resolverUsuarioLogin } from './resolver-usuario-login.ts'

const ERRO_LOGIN =
  'Usuário não encontrado. Use cliente, consultor-infraestrutura, consultor-aplicacoes ou gestor.'

const usuariosSnapshot = dados.usuarios as Usuario[]

/**
 * Substituir por TelaLogin.tsx (PRD tela-login) — layout provisório para validar router + sessão.
 */
export function TelaLoginProvisoria() {
  const [usuario, setUsuario] = useState('')
  const [erro, setErro] = useState<string | undefined>()
  const navigate = useNavigate()
  const iniciarSessao = useStore((estado) => estado.iniciarSessao)

  function aoSubmeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const resolvido = resolverUsuarioLogin(usuario, usuariosSnapshot)
    if (!resolvido) {
      setErro(ERRO_LOGIN)
      return
    }

    iniciarSessao(resolvido)
    navigate(redirecionarPorPerfil(resolvido.perfil), { replace: true })
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '28rem', margin: '0 auto' }}>
      <h1>Entrar</h1>
      <p>Login provisório — tela final conforme PRD em breve.</p>
      <form onSubmit={aoSubmeter} noValidate>
        <CampoTexto
          id="login-usuario"
          rotulo="Usuário"
          value={usuario}
          onChange={(evento) => {
            setUsuario(evento.target.value)
            if (erro) {
              setErro(undefined)
            }
          }}
          placeholder="ex.: consultor-infraestrutura"
          autoComplete="username"
          erro={erro}
        />
        <div style={{ marginTop: '1rem' }}>
          <Botao variante="primario" bloco type="submit">
            Entrar
          </Botao>
        </div>
      </form>
    </main>
  )
}