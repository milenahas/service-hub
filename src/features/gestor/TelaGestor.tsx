import { useEffect, useMemo, useState } from 'react'
import { CabecalhoApp } from '../../app/CabecalhoApp.tsx'
import { definirChamadoSelecionadoSimulacao, useStore } from '../../app/store.ts'
import { Botao } from '../../shared/components/index.ts'
import type { TenantSessao } from '../../dominio/snapshot.ts'
import type { LinhaEquipeGestor } from './equipe-gestor.ts'
import { contarChamadosAtivos } from './indicadores-gestor.ts'
import {
  filtrarLinhasEquipe,
  formatarDataSaudacaoGestor,
  formatarLinhaMetaDashboard,
  iniciaisDoNome,
  montarLinhasEquipe,
  ordenarLinhasEquipe,
  primeiroNome,
} from './equipe-gestor.ts'
import type {
  FiltroEquipeGestor,
  OrdenacaoEquipeGestor,
} from './equipe-gestor.ts'
import {
  filtrarChamadosGestor,
  listarChamadosAtivosDoConsultor,
  listarChamadosModoIndicador,
  ordenarChamadosPorPrazo,
} from './lista-chamados-gestor.ts'
import type {
  FiltroChamadosGestor,
  ModoListaGestor,
} from './lista-chamados-gestor.ts'
import type { OrigemConversaGestor, VistaGestor } from './vista-gestor.ts'
import {
  nomeAcessivelBotaoVoltar,
  textoVoltarConversa,
  textoVoltarListaOuConsultor,
} from './vista-gestor.ts'
import { PainelIndicadores } from './PainelIndicadores.tsx'
import { PainelEquipe } from './PainelEquipe.tsx'
import { TabelaChamadosGestor } from './TabelaChamadosGestor.tsx'
import { PainelConversaGestor } from './PainelConversaGestor.tsx'
import './TelaGestor.css'

const OPCOES_ORDENACAO = [
  { valor: 'ativos', rotulo: 'Ordenar: ativos' },
  { valor: 'risco', rotulo: 'Ordenar: risco' },
  { valor: 'ociosidade', rotulo: 'Ordenar: ociosidade' },
]

/**
 * Orquestra a rotina do gestor: dashboard da equipe, listas de indicador,
 * detalhe do consultor e conversa somente leitura. Mantém vista local, filtros
 * e origem do voltar; lê o tenant da store e dispara `atribuirChamado` e
 * `salvarNotaInterna`. Publica o chamado da conversa para a simulação ao vivo.
 * Cálculos em módulos `.ts` vizinhos; desenho em painéis. Os disparos ficam em
 * `simulacao-gestor.ts`; a store em `app/store.ts` guarda o id aberto e o tenant.
 */
export function TelaGestor() {
  const usuario = useStore((e) => e.usuarioLogado)
  const tenant = useStore((e) => e.tenant)
  const atribuirChamado = useStore((e) => e.atribuirChamado)
  const salvarNotaInterna = useStore((e) => e.salvarNotaInterna)
  const iniciarSimulacao = useStore((e) => e.iniciarSimulacaoGestor)
  const pararSimulacao = useStore((e) => e.pararSimulacaoGestor)

  const [vista, setVista] = useState<VistaGestor>({ vista: 'equipe' })
  const [filtroEquipe, setFiltroEquipe] = useState<FiltroEquipeGestor>('todos')
  const [ordenacaoEquipe, setOrdenacaoEquipe] =
    useState<OrdenacaoEquipeGestor>('ativos')
  const [buscaEquipe, setBuscaEquipe] = useState('')
  const [filtroChamados, setFiltroChamados] =
    useState<FiltroChamadosGestor>('todos')

  const consultorIds = useMemo(
    () => tenant?.consultoresEquipeGestor ?? [],
    [tenant],
  )

  const linhasEquipe = useMemo(() => {
    if (!tenant) return []
    const linhas = montarLinhasEquipe(tenant, consultorIds)
    const filtradas = filtrarLinhasEquipe(linhas, filtroEquipe, buscaEquipe)
    return ordenarLinhasEquipe(filtradas, ordenacaoEquipe)
  }, [tenant, consultorIds, filtroEquipe, buscaEquipe, ordenacaoEquipe])

  const chamadosTabela = useMemo(() => {
    if (!tenant) return []
    const agora = tenant.meta.agora
    let base: typeof tenant.chamados = []

    if (vista.vista === 'consultor') {
      base = listarChamadosAtivosDoConsultor(
        tenant.chamados,
        vista.consultorId,
      )
    }
    if (vista.vista === 'lista') {
      base = listarChamadosModoIndicador(
        tenant.chamados,
        vista.modo,
        agora,
      )
    }

    const filtrados = filtrarChamadosGestor(base, filtroChamados, agora)
    return ordenarChamadosPorPrazo(filtrados)
  }, [tenant, vista, filtroChamados])

  let chamadoAbertoId: string | null = null
  if (vista.vista === 'conversa') {
    chamadoAbertoId = vista.chamadoId
  }

  useEffect(() => {
    definirChamadoSelecionadoSimulacao(chamadoAbertoId)
  }, [chamadoAbertoId])

  useEffect(() => {
    iniciarSimulacao()
    return () => {
      pararSimulacao()
      definirChamadoSelecionadoSimulacao(null)
    }
  }, [iniciarSimulacao, pararSimulacao])

  if (!usuario || !tenant || usuario.perfil !== 'gestor') {
    return null
  }

  const totalAtivos = contarChamadosAtivos(tenant.chamados)
  const dataSaudacao = formatarDataSaudacaoGestor(tenant.meta.agora, usuario)
  const linhaMeta = formatarLinhaMetaDashboard(
    dataSaudacao,
    totalAtivos,
    consultorIds.length,
  )

  function abrirLista(modo: ModoListaGestor) {
    setFiltroChamados('todos')
    setVista({ vista: 'lista', modo })
  }

  function abrirConsultor(consultorId: string) {
    setVista({ vista: 'consultor', consultorId })
  }

  function abrirConversa(
    chamadoId: string,
    origem: OrigemConversaGestor,
  ) {
    setVista({ vista: 'conversa', chamadoId, origem })
  }

  function voltarParaEquipe() {
    setVista({ vista: 'equipe' })
  }

  function voltarDaConversa(origem: OrigemConversaGestor) {
    if (origem.tipo === 'consultor') {
      setVista({ vista: 'consultor', consultorId: origem.consultorId })
      return
    }
    if (origem.tipo === 'lista') {
      setVista({ vista: 'lista', modo: origem.modo })
      return
    }
    setVista({ vista: 'equipe' })
  }

  function origemConversaAtual(): OrigemConversaGestor | null {
    if (vista.vista === 'conversa') {
      return vista.origem
    }
    if (vista.vista === 'consultor') {
      return { tipo: 'consultor', consultorId: vista.consultorId }
    }
    if (vista.vista === 'lista') {
      return { tipo: 'lista', modo: vista.modo }
    }
    return null
  }

  function aoAbrirConversaDaTabela(chamadoId: string) {
    const origem = origemConversaAtual()
    if (!origem) return
    abrirConversa(chamadoId, origem)
  }

  const chamadoConversa =
    vista.vista === 'conversa'
      ? tenant.chamados.find((c) => c.id === vista.chamadoId)
      : undefined

  return (
    <div className="tela-gestor">
      <CabecalhoApp rotuloPerfil="" />
      <main className="tela-gestor__conteudo">
        {vista.vista === 'equipe' && (
          <>
            <header className="tela-gestor__saudacao">
              <h1 className="tela-gestor__titulo">
                Bom dia, {primeiroNome(usuario.nome)}
              </h1>
              <p className="tela-gestor__meta">{linhaMeta}</p>
            </header>
            <PainelIndicadores
              chamados={tenant.chamados}
              consultorIds={consultorIds}
              agora={tenant.meta.agora}
              aoAbrirSla={() => abrirLista('sla-4h')}
              aoAbrirSemResponsavel={() => abrirLista('sem-responsavel')}
              aoFiltrarOciosos={() => setFiltroEquipe('ociosos')}
            />
            <PainelEquipe
              totalConsultores={consultorIds.length}
              linhas={linhasEquipe}
              filtro={filtroEquipe}
              ordenacao={ordenacaoEquipe}
              busca={buscaEquipe}
              opcoesOrdenacao={OPCOES_ORDENACAO}
              aoMudarFiltro={setFiltroEquipe}
              aoMudarOrdenacao={setOrdenacaoEquipe}
              aoMudarBusca={setBuscaEquipe}
              aoVerChamados={abrirConsultor}
            />
          </>
        )}

        {vista.vista === 'consultor' && (
          <>
            <BotaoVoltarGestor
              texto={textoVoltarListaOuConsultor()}
              onClick={voltarParaEquipe}
            />
            <CabecalhoConsultorGestor
              consultorId={vista.consultorId}
              tenant={tenant}
              linhas={montarLinhasEquipe(tenant, consultorIds)}
            />
            <TabelaChamadosGestor
              tenant={tenant}
              chamados={chamadosTabela}
              tituloCartao={`Chamados ativos (${chamadosTabela.length})`}
              filtro={filtroChamados}
              consultorIds={consultorIds}
              aoMudarFiltro={setFiltroChamados}
              aoAtribuir={atribuirChamado}
              aoAbrirConversa={aoAbrirConversaDaTabela}
            />
          </>
        )}

        {vista.vista === 'lista' && (
          <>
            <BotaoVoltarGestor
              texto={textoVoltarListaOuConsultor()}
              onClick={voltarParaEquipe}
            />
            <header className="cartao-gestor cabecalho-lista-gestor">
              {vista.modo === 'sla-4h' && (
                <>
                  <h2 className="cartao-gestor__titulo-grande">
                    SLA nas próximas 4h
                  </h2>
                  <p className="cabecalho-lista-gestor__sub">
                    Estourados ou perto do prazo, por ordem de urgência.
                  </p>
                </>
              )}
              {vista.modo === 'sem-responsavel' && (
                <>
                  <h2 className="cartao-gestor__titulo-grande">Sem responsável</h2>
                  <p className="cabecalho-lista-gestor__sub">
                    Ninguém pegou ainda. Atribua pelo seletor.
                  </p>
                </>
              )}
            </header>
            <TabelaChamadosGestor
              tenant={tenant}
              chamados={chamadosTabela}
              tituloCartao={`Chamados (${chamadosTabela.length})`}
              filtro={filtroChamados}
              consultorIds={consultorIds}
              aoMudarFiltro={setFiltroChamados}
              aoAtribuir={atribuirChamado}
              aoAbrirConversa={aoAbrirConversaDaTabela}
            />
          </>
        )}

        {vista.vista === 'conversa' && chamadoConversa && (
          <>
            <BotaoVoltarGestor
              texto={textoVoltarConversa(vista.origem, tenant.usuarios)}
              onClick={() => voltarDaConversa(vista.origem)}
            />
            <PainelConversaGestor
              chamado={chamadoConversa}
              tenant={tenant}
              usuario={usuario}
              consultorIds={consultorIds}
              aoAtribuir={(consultorId) =>
                atribuirChamado(chamadoConversa.id, consultorId)
              }
              aoSalvarNota={(texto) =>
                salvarNotaInterna(chamadoConversa.id, texto)
              }
            />
          </>
        )}
      </main>
    </div>
  )
}

type PropsBotaoVoltarGestor = {
  texto: string
  onClick: () => void
}

function BotaoVoltarGestor({ texto, onClick }: PropsBotaoVoltarGestor) {
  return (
    <Botao
      variante="secundario"
      type="button"
      aria-label={nomeAcessivelBotaoVoltar(texto)}
      onClick={onClick}
    >
      <span className="tela-gestor__voltar-chevron" aria-hidden="true">
        {'<'}
      </span>
      <span>{texto}</span>
    </Botao>
  )
}

type PropsCabecalhoConsultor = {
  consultorId: string
  tenant: TenantSessao
  linhas: LinhaEquipeGestor[]
}

function CabecalhoConsultorGestor({
  consultorId,
  tenant,
  linhas,
}: PropsCabecalhoConsultor) {
  const consultor = tenant.usuarios.find((u) => u.id === consultorId)
  const linha = linhas.find((l) => l.consultorId === consultorId)
  const grupo = consultor
    ? tenant.grupos.find((g) => g.id === consultor.grupo_id)
    : undefined

  if (!consultor || !linha) {
    return null
  }

  const situacao = linha.ocioso ? 'Ocioso' : 'Em atendimento'

  return (
    <header className="cartao-gestor cabecalho-consultor-gestor">
      <div className="cabecalho-consultor-gestor__principal">
        <span className="avatar-gestor avatar-gestor--grande" aria-hidden="true">
          {iniciaisDoNome(consultor.nome)}
        </span>
        <div>
          <h2 className="cartao-gestor__titulo-grande">{consultor.nome}</h2>
          <p className="cabecalho-consultor-gestor__linha">
            {situacao} · {grupo?.nome ?? '—'}
          </p>
        </div>
      </div>
      <div className="cabecalho-consultor-gestor__numeros">
        <div>
          <span className="cabecalho-consultor-gestor__rotulo-numero">Ativos</span>
          <span className="cabecalho-consultor-gestor__numero">{linha.ativos}</span>
        </div>
        <div>
          <span className="cabecalho-consultor-gestor__rotulo-numero">Em risco</span>
          <span
            className={
              linha.emRisco > 0
                ? 'cabecalho-consultor-gestor__numero cabecalho-consultor-gestor__numero--risco'
                : 'cabecalho-consultor-gestor__numero'
            }
          >
            {linha.emRisco}
          </span>
        </div>
        <div>
          <span className="cabecalho-consultor-gestor__rotulo-numero">
            Ocioso na semana
          </span>
          <span className="cabecalho-consultor-gestor__numero">
            {linha.textoOciosidade}
          </span>
        </div>
      </div>
    </header>
  )
}