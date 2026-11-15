import { useNavigate } from 'react-router-dom'
import { CAMINHOS } from '../../app/caminhos.ts'
import { useStore } from '../../app/store.ts'
import { Botao } from '../../shared/components/index.ts'

export function PlaceholderConsultor() {
  const usuario = useStore((estado) => estado.usuarioLogado)
  const sair = useStore((estado) => estado.sair)
  const navigate = useNavigate()

  function aoSair() {
    sair()
    navigate(CAMINHOS.login, { replace: true })
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Área do consultor</h1>
      <p>
        Logado como <strong>{usuario?.nome}</strong> (rota {CAMINHOS.consultor}
        ).
      </p>
      <Botao variante="secundario" type="button" onClick={aoSair}>
        Sair
      </Botao>
    </main>
  )
}