import type { Chamado, TenantSessao } from '../../dominio/snapshot.ts'
import {
  classificarFaixaPrazo,
  formatarTextoPrazoConsultor,
} from '../../dominio/prazo.ts'
import {
  Botao,
  CampoSelect,
  GrupoChips,
  Selo,
} from '../../shared/components/index.ts'
import type { OpcaoChip } from '../../shared/components/Chip/GrupoChips.tsx'
import {
  rotuloPrioridade,
  textoStatusColunaGestor,
} from './indicadores-gestor.ts'
import type { FiltroChamadosGestor } from './lista-chamados-gestor.ts'
import {
  chamadoPermiteConversaGestor,
  montarOpcoesConsultoresEquipe,
} from './lista-chamados-gestor.ts'

const OPCOES_FILTRO_CHAMADOS: OpcaoChip[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'em_risco', rotulo: 'Em risco' },
  { valor: 'aguardando_cliente', rotulo: 'Aguardando cliente' },
]

type PropsTabelaChamadosGestor = {
  tenant: TenantSessao
  chamados: Chamado[]
  tituloCartao: string
  filtro: FiltroChamadosGestor
  consultorIds: string[]
  aoMudarFiltro: (valor: FiltroChamadosGestor) => void
  aoAtribuir: (chamadoId: string, consultorId: string | null) => void
  aoAbrirConversa: (chamadoId: string) => void
  mostrarFiltroChips?: boolean
}

/**
 * Desenha a tabela de chamados nas views de lista e de consultor:
 * prazo, status, responsável e a ação Conversa. Não filtra, não ordena
 * e não decide se a conversa pode abrir — isso fica em
 * `lista-chamados-gestor.ts`. Rótulos de prioridade e status vêm de
 * `indicadores-gestor.ts`. Atribuir e abrir conversa sobem para
 * `TelaGestor.tsx`. A conversa em si é `PainelConversaGestor.tsx`.
 */
export function TabelaChamadosGestor({
  tenant,
  chamados,
  tituloCartao,
  filtro,
  consultorIds,
  aoMudarFiltro,
  aoAtribuir,
  aoAbrirConversa,
  mostrarFiltroChips = true,
}: PropsTabelaChamadosGestor) {
  const agora = tenant.meta.agora

  return (
    <section className="cartao-gestor tabela-chamados-gestor">
      <h2 className="cartao-gestor__titulo">{tituloCartao}</h2>
      {mostrarFiltroChips && (
        <GrupoChips
          rotulo="Filtrar chamados"
          value={filtro}
          onChange={(v) => aoMudarFiltro(v as FiltroChamadosGestor)}
          opcoes={OPCOES_FILTRO_CHAMADOS}
        />
      )}
      {chamados.length === 0 && (
        <p className="tabela-chamados-gestor__vazio">Nenhum chamado aqui.</p>
      )}
      {chamados.length > 0 && (
        <div
          className="tabela-chamados-gestor__grade"
          role="table"
          aria-label={tituloCartao}
        >
          <div className="tabela-chamados-gestor__cabecalho" role="row">
            <span role="columnheader">Chamado</span>
            <span role="columnheader">Prazo</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Responsável</span>
            <span role="columnheader">Ações</span>
          </div>
          {chamados.map((chamado) => {
            const cliente = tenant.usuarios.find(
              (u) => u.id === chamado.solicitante_id,
            )
            const faixa = classificarFaixaPrazo(
              chamado.prazo_resolucao,
              agora,
              chamado.status,
            )
            const textoPrazo = formatarTextoPrazoConsultor(
              chamado.prazo_resolucao,
              agora,
              chamado.status,
            )
            const opcoes = montarOpcoesConsultoresEquipe(
              tenant,
              consultorIds,
              chamado.responsavel_id,
            )
            const selectId = `responsavel-${chamado.id}`
            const permiteConversa = chamadoPermiteConversaGestor(
              chamado,
              tenant.mensagens,
            )

            return (
              <div
                key={chamado.id}
                className="tabela-chamados-gestor__linha"
                role="row"
              >
                <div className="tabela-chamados-gestor__chamado" role="cell">
                  <span className="tabela-chamados-gestor__titulo-chamado">
                    {chamado.titulo}
                  </span>
                  <span className="tabela-chamados-gestor__meta-chamado">
                    #{chamado.numero} · {cliente?.nome ?? '—'} ·{' '}
                    {rotuloPrioridade(chamado.prioridade)}
                  </span>
                </div>
                <span role="cell">
                  <Selo apresentacao="prazo" faixa={faixa}>
                    {textoPrazo}
                  </Selo>
                </span>
                <span className="tabela-chamados-gestor__status" role="cell">
                  {textoStatusColunaGestor(chamado.status)}
                </span>
                <span className="tabela-chamados-gestor__responsavel" role="cell">
                  <CampoSelect
                    id={selectId}
                    rotulo={`Responsável do chamado ${chamado.numero}`}
                    value={chamado.responsavel_id ?? ''}
                    opcoes={opcoes}
                    opcaoSemResponsavel
                    onChange={(e) => {
                      const id = e.target.value
                      aoAtribuir(chamado.id, id || null)
                    }}
                  />
                </span>
                <span role="cell">
                  <Botao
                    variante="fantasma"
                    type="button"
                    disabled={!permiteConversa}
                    onClick={() => aoAbrirConversa(chamado.id)}
                  >
                    Conversa
                  </Botao>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}