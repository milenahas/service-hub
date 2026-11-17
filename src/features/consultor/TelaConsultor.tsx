import { useEffect, useMemo, useState } from 'react'
import { CabecalhoApp } from '../../app/CabecalhoApp.tsx'
import { definirChamadoSelecionadoSimulacao, useStore } from '../../app/store.ts'
import type { AbaFila, FiltroLista } from './fila-consultor.ts'
import {
  chamadoVisivelNaFila,
  montarSecoesFilaVisivel,
} from './fila-consultor.ts'
import { ColunaFila } from './ColunaFila.tsx'
import { PainelChamado } from './PainelChamado.tsx'
import { PainelNotas } from './PainelNotas.tsx'
import { useNaoLidos } from './usar-nao-lidos.ts'
import './TelaConsultor.css'

/**
 * Orquestra a rotina do consultor: cabeçalho, grade com fila, detalhe do
 * chamado e painel de notas (quando aberto). Guarda aba, busca, filtro,
 * seleção e `notasAbertas`; escolhe o chamado visível na fila e repassa
 * ações à store (pegar, mensagem, status, nota interna). Publica o
 * chamado selecionado para a simulação ao vivo.
 * Responsável por ler a store e distribuir tenant, usuário e callbacks
 * em props para os componentes filhos.
 *
 * Desenho da fila e dos painéis fica em `ColunaFila.tsx` e
 * `PainelChamado.tsx` / `PainelNotas.tsx`. Os disparos ficam em
 * `simulacao-consultor.ts`; a store em `app/store.ts` guarda o id
 * selecionado e o tenant. Não lidos em `usar-nao-lidos.ts`.
 */
export function TelaConsultor() {
  const usuario = useStore((e) => e.usuarioLogado)
  const tenant = useStore((e) => e.tenant)
  const pegarChamado = useStore((e) => e.pegarChamado)
  const enviarMensagemCliente = useStore((e) => e.enviarMensagemCliente)
  const salvarNotaInterna = useStore((e) => e.salvarNotaInterna)
  const alterarStatus = useStore((e) => e.alterarStatus)
  const iniciarSimulacao = useStore((e) => e.iniciarSimulacaoConsultor)
  const pararSimulacao = useStore((e) => e.pararSimulacaoConsultor)

  const [aba, setAba] = useState<AbaFila>('minha')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroLista>('todos')
  const [notasAbertas, setNotasAbertas] = useState(false)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)

  useEffect(() => {
    iniciarSimulacao()
    return () => {
      pararSimulacao()
      definirChamadoSelecionadoSimulacao(null)
    }
  }, [iniciarSimulacao, pararSimulacao])

  const secoesVisiveis = useMemo(() => {
    if (!tenant || !usuario || usuario.perfil !== 'consultor') return []
    return montarSecoesFilaVisivel(tenant, usuario, aba, busca, filtro)
  }, [tenant, usuario, aba, busca, filtro])

  const chamadoSelecionadoId = useMemo(() => {
    if (!tenant || !usuario || usuario.perfil !== 'consultor') return null
    if (selecionadoId && chamadoVisivelNaFila(secoesVisiveis, selecionadoId)) {
      return selecionadoId
    }
    return secoesVisiveis[0]?.chamados[0]?.id ?? null
  }, [tenant, usuario, selecionadoId, secoesVisiveis])

  useEffect(() => {
    definirChamadoSelecionadoSimulacao(chamadoSelecionadoId)
  }, [chamadoSelecionadoId])

  const { naoLidos, limparNaoLido } = useNaoLidos(tenant, chamadoSelecionadoId)

  if (!usuario || !tenant || usuario.perfil !== 'consultor') {
    return null
  }

  const grupo = tenant.grupos.find((g) => g.id === usuario.grupo_id)
  const chamado = tenant.chamados.find((c) => c.id === chamadoSelecionadoId)

  function aoMudarAba(nova: AbaFila) {
    setAba(nova)
    setFiltro('todos')
    setNotasAbertas(false)
  }

  function aoSelecionar(id: string) {
    setSelecionadoId(id)
    setNotasAbertas(false)
    limparNaoLido(id)
  }

  return (
    <div className="tela-consultor">
      <CabecalhoApp rotuloPerfil={grupo?.nome ?? 'Consultor'} />
      <main
        className={`tela-consultor__grade${notasAbertas ? ' tela-consultor__grade--com-notas' : ''}`}
      >
        <ColunaFila
          tenant={tenant}
          usuario={usuario}
          aba={aba}
          aoMudarAba={aoMudarAba}
          busca={busca}
          aoMudarBusca={setBusca}
          filtro={filtro}
          aoMudarFiltro={setFiltro}
          selecionadoId={chamadoSelecionadoId}
          naoLidos={naoLidos}
          aoSelecionar={aoSelecionar}
          notasAbertas={notasAbertas}
        />
        <PainelChamado
          key={chamadoSelecionadoId ?? 'vazio'}
          chamado={chamado}
          tenant={tenant}
          usuario={usuario}
          notasAbertas={notasAbertas}
          aoAlternarNotas={() => setNotasAbertas((v) => !v)}
          aoPegar={() => chamado && pegarChamado(chamado.id)}
          aoEnviarResposta={(texto) =>
            chamado && enviarMensagemCliente(chamado.id, texto)
          }
          aoAlterarStatus={(para, motivo) =>
            chamado && alterarStatus(chamado.id, chamado.status, para, motivo)
          }
        />
        {notasAbertas && chamado && (
          <PainelNotas
            chamadoId={chamado.id}
            mensagens={tenant.mensagens}
            aoFechar={() => setNotasAbertas(false)}
            aoSalvarNota={(texto) => salvarNotaInterna(chamado.id, texto)}
          />
        )}
      </main>
    </div>
  )
}