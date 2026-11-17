import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../app/store.ts'
import { redirecionarPorPerfil } from '../../app/redirecionar-por-perfil.ts'
import { snapshotInicial } from '../../data/snapshot-inicial.ts'
import { Botao, CampoTexto } from '../../shared/components/index.ts'
import {
  ERRO_LOGIN_INVALIDO,
  PERFIS_DISPONIVEIS,
} from './constantes-login.ts'
import { resolverUsuarioLogin } from './resolver-usuario-login.ts'
import './TelaLogin.css'

/**
 * Desenha o login por usuário, sem senha: o campo, o erro inline e a
 * lista de perfis. Guarda o texto digitado e a mensagem de erro.
 * Usuário inválido aparece sob o campo; o válido inicia a sessão e
 * segue para a rota do perfil.
 *
 * Quem casa o texto com o snapshot é `resolver-usuario-login.ts`. O
 * texto do erro e a ordem dos perfis ficam em `constantes-login.ts`.
 * A sessão nasce na store em `app/store.ts`; o destino, em
 * `redirecionar-por-perfil.ts`.
 */
export function TelaLogin() {
  const [usuario, setUsuario] = useState('')
  const [erro, setErro] = useState<string | undefined>()
  const navigate = useNavigate()
  const iniciarSessao = useStore((estado) => estado.iniciarSessao)

  function aoSubmeter(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const resolvido = resolverUsuarioLogin(
      usuario,
      snapshotInicial.usuarios,
    )
    if (!resolvido) {
      setErro(ERRO_LOGIN_INVALIDO)
      return
    }

    iniciarSessao(resolvido)
    navigate(redirecionarPorPerfil(resolvido.perfil), { replace: true })
  }

  return (
    <div className="login">
      <section className="login__cartao" aria-labelledby="login-titulo">
        <div className="login__marca">
          <span className="login__emblema" aria-hidden="true">
            S
          </span>
          <span className="login__nome-produto">Service Hub</span>
        </div>

        <h1 id="login-titulo" className="login__titulo">
          Entrar
        </h1>
        <p className="login__subtitulo">
          Central de chamados de TI. Digite seu usuário para continuar.
        </p>

        <form className="login__formulario" onSubmit={aoSubmeter} noValidate>
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
          <div className="login__acao">
            <Botao variante="primario" bloco type="submit">
              Entrar
            </Botao>
          </div>
        </form>

        <aside className="login__perfis" aria-label="Perfis disponíveis">
          <p className="login__perfis-titulo">Perfis disponíveis:</p>
          <ul className="login__perfis-lista">
            {PERFIS_DISPONIVEIS.map((perfil) => (
              <li key={perfil} className="login__perfil">
                {perfil}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  )
}