import { useEffect, useState } from 'react'
import { CabecalhoApp } from '../../app/CabecalhoApp.tsx'
import { definirChamadoSelecionadoSimulacao, useStore } from '../../app/store.ts'
import { ColunaMeusChamados } from './ColunaMeusChamados.tsx'
import { FormularioNovoChamado } from './FormularioNovoChamado.tsx'
import { PainelChamadoCliente } from './PainelChamadoCliente.tsx'
import {
  filtrarChamadosCliente,
  ordenarChamadosCliente,
} from './lista-cliente.ts'
import { useNaoLidosCliente } from './usar-nao-lidos-cliente.ts'
import './TelaCliente.css'

/**
 * Orquestra a rotina do cliente: cabeçalho, lista dos próprios chamados
 * e o painel à direita (detalhe ou abertura). A entrada é o formulário
 * de novo chamado. Guarda a vista (`detalhe` ou `novo`), o chamado
 * selecionado, o texto da busca e uma geração que zera o texto não
 * enviado ao trocar de item. Abrir com sucesso zera a busca. Enviar e
 * reabrir sobem para a store. Liga a simulação
 * de mensagens do consultor e publica o id da conversa aberta (nulo
 * com o formulário). Limpa a bolinha ao selecionar o chamado.
 *
 * A lista fica em `ColunaMeusChamados.tsx`, o detalhe em
 * `PainelChamadoCliente.tsx` e o formulário em `FormularioNovoChamado.tsx`.
 * A ordem e o filtro vêm de `lista-cliente.ts`. Os ciclos ficam em
 * `simulacao-cliente.ts`; a store em `app/store.ts` aplica o evento.
 * Não lidos em `usar-nao-lidos-cliente.ts`.
 */
export function TelaCliente() {
  const usuario = useStore((estado) => estado.usuarioLogado)
  const tenant = useStore((estado) => estado.tenant)
  const enviarMensagemCliente = useStore((estado) => estado.enviarMensagemCliente)
  const alterarStatus = useStore((estado) => estado.alterarStatus)
  const abrirChamado = useStore((estado) => estado.abrirChamado)
  const iniciarSimulacao = useStore((estado) => estado.iniciarSimulacaoCliente)
  const pararSimulacao = useStore((estado) => estado.pararSimulacaoCliente)

  const [vista, setVista] = useState<'detalhe' | 'novo'>('novo')
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [geracao, setGeracao] = useState(0)

  const listaOrdenada = tenant ? ordenarChamadosCliente(tenant.chamados) : []
  const listaVisivel = filtrarChamadosCliente(listaOrdenada, busca)
  const idAindaNaLista = listaOrdenada.find((chamado) => chamado.id === selecionadoId)?.id
  const idPersistido = idAindaNaLista ?? listaOrdenada[0]?.id ?? null
  const idConversa = vista === 'novo' ? null : idPersistido
  const { naoLidos, limparNaoLido } = useNaoLidosCliente(tenant, idConversa)

  useEffect(() => {
    iniciarSimulacao()
    return () => {
      pararSimulacao()
      definirChamadoSelecionadoSimulacao(null)
    }
  }, [iniciarSimulacao, pararSimulacao])

  useEffect(() => {
    definirChamadoSelecionadoSimulacao(idConversa)
  }, [idConversa])

  if (!usuario || !tenant) {
    return null
  }

  const chamado = listaOrdenada.find((item) => item.id === idPersistido)

  function aoSelecionar(id: string) {
    setSelecionadoId(id)
    setVista('detalhe')
    setGeracao((valor) => valor + 1)
    limparNaoLido(id)
  }

  function aoEnviarNovo(titulo: string, descricao: string) {
    const id = abrirChamado(titulo, descricao)
    if (!id) return
    setBusca('')
    setSelecionadoId(id)
    setVista('detalhe')
  }

  return (
    <div className="tela-cliente">
      <CabecalhoApp rotuloPerfil="" />
      <main className="tela-cliente__grade">
        <ColunaMeusChamados
          chamados={listaVisivel}
          busca={busca}
          temChamados={listaOrdenada.length > 0}
          agora={tenant.meta.agora}
          usuario={usuario}
          selecionadoId={idConversa}
          naoLidos={naoLidos}
          formularioAberto={vista === 'novo'}
          aoMudarBusca={setBusca}
          aoSelecionar={aoSelecionar}
          aoAbrirFormulario={() => setVista('novo')}
        />
        {vista === 'novo' && (
          <FormularioNovoChamado
            aoCancelar={() => setVista('detalhe')}
            aoEnviar={aoEnviarNovo}
          />
        )}
        {vista === 'detalhe' && chamado && (
          <PainelChamadoCliente
            key={`${chamado.id}-${geracao}`}
            chamado={chamado}
            tenant={tenant}
            usuario={usuario}
            aoEnviarMensagem={(texto) => enviarMensagemCliente(chamado.id, texto)}
            aoReabrir={(motivo) =>
              alterarStatus(chamado.id, chamado.status, 'aberto', motivo)
            }
          />
        )}
        {vista === 'detalhe' && !chamado && (
          <section className="painel-chamado-cliente painel-chamado-cliente--vazio">
            <h1>Você ainda não abriu chamados.</h1>
          </section>
        )}
      </main>
    </div>
  )
}