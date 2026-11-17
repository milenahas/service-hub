import { useState } from 'react'
import { CabecalhoApp } from '../../app/CabecalhoApp.tsx'
import { useStore } from '../../app/store.ts'
import { ColunaMeusChamados } from './ColunaMeusChamados.tsx'
import { FormularioNovoChamado } from './FormularioNovoChamado.tsx'
import { PainelChamadoCliente } from './PainelChamadoCliente.tsx'
import { ordenarChamadosCliente } from './lista-cliente.ts'
import './TelaCliente.css'

/**
 * Orquestra a rotina do cliente: cabeçalho, lista dos próprios chamados
 * e o painel à direita (detalhe ou abertura). A entrada é o formulário
 * de novo chamado. Guarda a vista (`detalhe` ou `novo`), o chamado
 * selecionado e uma geração que zera o texto não enviado ao trocar de
 * item. Abrir, enviar e reabrir sobem para a store.
 *
 * A lista fica em `ColunaMeusChamados.tsx`, o detalhe em
 * `PainelChamadoCliente.tsx` e o formulário em `FormularioNovoChamado.tsx`.
 * A ordem vem de `lista-cliente.ts`. Tenant e eventos ficam em `app/store.ts`.
 */
export function TelaCliente() {
  const usuario = useStore((estado) => estado.usuarioLogado)
  const tenant = useStore((estado) => estado.tenant)
  const enviarMensagemCliente = useStore((estado) => estado.enviarMensagemCliente)
  const alterarStatus = useStore((estado) => estado.alterarStatus)
  const abrirChamado = useStore((estado) => estado.abrirChamado)

  const [vista, setVista] = useState<'detalhe' | 'novo'>('novo')
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [geracao, setGeracao] = useState(0)

  if (!usuario || !tenant || usuario.perfil !== 'cliente') {
    return null
  }

  const lista = ordenarChamadosCliente(tenant.chamados)
  const idAindaNaLista = lista.find((chamado) => chamado.id === selecionadoId)?.id
  const idPersistido = idAindaNaLista ?? lista[0]?.id ?? null
  const chamado = lista.find((item) => item.id === idPersistido)
  const idNaLista = vista === 'novo' ? null : idPersistido

  function aoSelecionar(id: string) {
    setSelecionadoId(id)
    setVista('detalhe')
    setGeracao((valor) => valor + 1)
  }

  function aoEnviarNovo(titulo: string, descricao: string) {
    const id = abrirChamado(titulo, descricao)
    if (!id) return
    setSelecionadoId(id)
    setVista('detalhe')
  }

  return (
    <div className="tela-cliente">
      <CabecalhoApp rotuloPerfil="" />
      <main className="tela-cliente__grade">
        <ColunaMeusChamados
          chamados={lista}
          agora={tenant.meta.agora}
          usuario={usuario}
          selecionadoId={idNaLista}
          formularioAberto={vista === 'novo'}
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