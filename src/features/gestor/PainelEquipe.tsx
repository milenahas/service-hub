import {
  Botao,
  CampoSelect,
  CampoTexto,
  GrupoChips,
  Selo,
} from '../../shared/components/index.ts'
import type { OpcaoChip } from '../../shared/components/Chip/GrupoChips.tsx'
import type {
  FiltroEquipeGestor,
  LinhaEquipeGestor,
  OrdenacaoEquipeGestor,
} from './equipe-gestor.ts'
import { iniciaisDoNome } from './equipe-gestor.ts'
import type { OpcaoSelect } from '../../shared/components/tipos.ts'

const OPCOES_FILTRO_EQUIPE: OpcaoChip[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'ociosos', rotulo: 'Ociosos' },
  { valor: 'com_risco', rotulo: 'Com risco' },
]

type PropsPainelEquipe = {
  totalConsultores: number
  linhas: LinhaEquipeGestor[]
  filtro: FiltroEquipeGestor
  ordenacao: OrdenacaoEquipeGestor
  busca: string
  opcoesOrdenacao: OpcaoSelect[]
  aoMudarFiltro: (valor: FiltroEquipeGestor) => void
  aoMudarOrdenacao: (valor: OrdenacaoEquipeGestor) => void
  aoMudarBusca: (valor: string) => void
  aoVerChamados: (consultorId: string) => void
}

/**
 * Cartão da tabela de equipe: chips de filtro, ordenação, busca e linhas de
 * consultor. Não calcula contagens — recebe `linhas` já filtradas da tela.
 */
export function PainelEquipe({
  totalConsultores,
  linhas,
  filtro,
  ordenacao,
  busca,
  opcoesOrdenacao,
  aoMudarFiltro,
  aoMudarOrdenacao,
  aoMudarBusca,
  aoVerChamados,
}: PropsPainelEquipe) {
  return (
    <section className="cartao-gestor painel-equipe" aria-labelledby="titulo-equipe">
      <h2 id="titulo-equipe" className="cartao-gestor__titulo">
        Equipe ({totalConsultores})
      </h2>
      <div className="painel-equipe__ferramentas">
        <GrupoChips
          rotulo="Filtrar equipe"
          value={filtro}
          onChange={(v) => aoMudarFiltro(v as FiltroEquipeGestor)}
          opcoes={OPCOES_FILTRO_EQUIPE}
        />
        <div className="painel-equipe__direita">
          <CampoSelect
            id="ordenar-equipe"
            rotulo="Ordenar equipe"
            value={ordenacao}
            opcoes={opcoesOrdenacao}
            onChange={(e) =>
              aoMudarOrdenacao(e.target.value as OrdenacaoEquipeGestor)
            }
          />
          <CampoTexto
            id="buscar-consultor"
            rotulo="Buscar consultor"
            value={busca}
            onChange={(e) => aoMudarBusca(e.target.value)}
            placeholder="Buscar consultor"
          />
        </div>
      </div>
      {linhas.length === 0 && (
        <p className="painel-equipe__vazio">Nenhum consultor com esses filtros.</p>
      )}
      {linhas.length > 0 && (
        <div
          className="painel-equipe__tabela"
          role="table"
          aria-label="Consultores da equipe"
        >
          <div className="painel-equipe__cabecalho" role="row">
            <span role="columnheader">Consultor</span>
            <span role="columnheader">Situação</span>
            <span role="columnheader">Chamados ativos</span>
            <span role="columnheader">Em risco</span>
            <span role="columnheader">Ocioso/sem.</span>
            <span role="columnheader">Ações</span>
          </div>
          {linhas.map((linha) => (
            <div key={linha.consultorId} className="painel-equipe__linha" role="row">
              <div className="painel-equipe__consultor" role="cell">
                <span className="avatar-gestor" aria-hidden="true">
                  {iniciaisDoNome(linha.nome)}
                </span>
                <span className="painel-equipe__nome">{linha.nome}</span>
              </div>
              <span role="cell">
                {linha.ocioso && (
                  <Selo apresentacao="status-borda" status="aberto">
                    Ocioso
                  </Selo>
                )}
                {!linha.ocioso && (
                  <Selo apresentacao="status-preenchido" status="em_atendimento">
                    Em atendimento
                  </Selo>
                )}
              </span>
              <span role="cell">{linha.ativos}</span>
              <span
                role="cell"
                className={
                  linha.emRisco > 0 ? 'painel-equipe__risco' : 'painel-equipe__traco'
                }
              >
                {linha.emRisco > 0 ? linha.emRisco : '—'}
              </span>
              <span role="cell">{linha.textoOciosidade}</span>
              <span role="cell">
                <Botao
                  variante="secundario"
                  type="button"
                  onClick={() => aoVerChamados(linha.consultorId)}
                >
                  Ver chamados
                </Botao>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}