import { useState, type FormEvent } from 'react'
import { Botao, CampoTexto, CampoTextarea } from '../../shared/components/index.ts'

type PropsFormularioNovoChamado = {
  aoCancelar: () => void
  aoEnviar: (titulo: string, descricao: string) => void
}

/**
 * Desenha o formulário de abertura no lugar do detalhe. Guarda assunto
 * e descrição. Cancelar e enviar sobem para `TelaCliente.tsx`. O chamado
 * em si é montado em `dominio/abrir-chamado-cliente.ts` e aplicado na store.
 */
export function FormularioNovoChamado({
  aoCancelar,
  aoEnviar,
}: PropsFormularioNovoChamado) {
  const [assunto, setAssunto] = useState('')
  const [descricao, setDescricao] = useState('')
  const podeEnviar = assunto.trim() !== '' && descricao.trim() !== ''

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!podeEnviar) return
    aoEnviar(assunto, descricao)
  }

  return (
    <section className="painel-chamado-cliente form-novo-chamado">
      <form onSubmit={enviar}>
        <h1 className="painel-chamado-cliente__titulo">Abrir chamado</h1>
        <p className="form-novo-chamado__subtitulo">
          Conte o que aconteceu. Um consultor responderá dentro do prazo informado após a abertura.
        </p>
        <CampoTexto
          id="assunto-novo"
          rotulo="Assunto"
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          placeholder="Ex.: Não consigo acessar o e-mail"
        />
        <CampoTextarea
          id="descricao-novo"
          rotulo="Descrição"
          rows={5}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="O que você estava fazendo e o que apareceu na tela?"
        />
        <div className="rodape-cliente__acoes">
          <Botao variante="secundario" type="button" onClick={aoCancelar}>
            Cancelar
          </Botao>
          <Botao variante="primario" type="submit" disabled={!podeEnviar}>
            Enviar chamado
          </Botao>
        </div>
      </form>
    </section>
  )
}
