import type { Chamado, TenantSessao } from '../../dominio/snapshot.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import {
  classificarFaixaPrazo,
  faixaBarraItemFila,
  formatarTextoPrazoConsultor,
} from '../../dominio/prazo.ts'
import type { FaixaPrazo } from '../../shared/components/tipos.ts'
import { formatarRotuloStatus } from '../../dominio/rotulo-status.ts'
import {
  type AbaFila,
  type FiltroLista,
  calcularResumoFila,
  contarFiltro,
  filtrarPorAba,
  listarChamadosFila,
  montarSecoesFilaVisivel,
} from './fila-consultor.ts'
import { CampoSelect, CampoTexto, Selo } from '../../shared/components/index.ts'

/**
 * Desenha a coluna esquerda da fila: abas (Minha fila, Fila do grupo,
 * Concluídos, Sem dono), busca, filtro e a lista de chamados.
 *
 * Quem entra em cada aba está em `fila-consultor.ts`; a ordem por prazo,
 * em `agrupar-fila.ts`. Aba ativa, busca, filtro e seleção ficam em
 * `TelaConsultor`.
 */
const ABAS: { id: AbaFila; rotulo: string }[] = [
  { id: 'minha', rotulo: 'Minha fila' },
  { id: 'grupo', rotulo: 'Fila do grupo' },
  { id: 'concluidos', rotulo: 'Concluídos' },
  { id: 'sem_dono', rotulo: 'Sem dono' },
]

const FILTROS: { id: FiltroLista; rotulo: string }[] = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'urgentes', rotulo: 'Urgentes' },
  { id: 'quatro_horas', rotulo: 'Vencem em 4h' },
  { id: 'aguardando_cliente', rotulo: 'Aguard. cliente' },
]

type PropsColunaFila = {
  tenant: TenantSessao
  usuario: Usuario
  aba: AbaFila
  aoMudarAba: (aba: AbaFila) => void
  busca: string
  aoMudarBusca: (v: string) => void
  filtro: FiltroLista
  aoMudarFiltro: (f: FiltroLista) => void
  selecionadoId: string | null
  /** Pontos azuis: chamado novo ou mensagem pública enquanto outro está aberto. */
  naoLidos: Set<string>
  aoSelecionar: (id: string) => void
  notasAbertas: boolean
}

function rotuloPrioridade(prioridade: string): string {
  return prioridade.charAt(0).toUpperCase() + prioridade.slice(1)
}

type PropsSeloResumoItemFila = {
  aba: AbaFila
  chamado: Chamado
  faixa: FaixaPrazo
  agora: string
}

/**
 * Canto superior do item: o que o consultor precisa ver primeiro.
 * Ordem: status (concluídos) → “Com o cliente” → “Sem responsável” → prazo.
 * O selo de prazo some quando o status é `aguardando_cliente` ou o chamado não tem responsável.
 */
function SeloResumoItemFila({
  aba,
  chamado,
  faixa,
  agora,
}: PropsSeloResumoItemFila) {
  if (aba === 'concluidos') {
    return (
      <Selo apresentacao="status-borda" status={chamado.status}>
        {formatarRotuloStatus(chamado.status)}
      </Selo>
    )
  }
  if (chamado.status === 'aguardando_cliente') {
    return (
      <span className="fila-item__com-cliente">Com o cliente</span>
    )
  }
  if (chamado.responsavel_id === null) {
    return (
      <span className="fila-item__sem-responsavel">Sem responsável</span>
    )
  }
  return (
    <Selo apresentacao="prazo" faixa={faixa}>
      {formatarTextoPrazoConsultor(
        chamado.prazo_resolucao,
        agora,
        chamado.status,
      )}
    </Selo>
  )
}

export function ColunaFila({
  tenant,
  usuario,
  aba,
  aoMudarAba,
  busca,
  aoMudarBusca,
  filtro,
  aoMudarFiltro,
  selecionadoId,
  naoLidos,
  aoSelecionar,
  notasAbertas,
}: PropsColunaFila) {
  const grupoId = usuario.grupo_id!
  const grupo = tenant.grupos.find((g) => g.id === grupoId)
  const resumo = calcularResumoFila(tenant, usuario)
  const agora = tenant.meta.agora

  const baseAba = filtrarPorAba(
    tenant.chamados.filter((c) => c.grupo_id === grupoId),
    aba,
    usuario,
    tenant,
  )

  const lista = listarChamadosFila(tenant, usuario, aba, busca, filtro)
  const secoes = montarSecoesFilaVisivel(tenant, usuario, aba, busca, filtro)

  const contagemAba = baseAba.length

  function renderItem(chamado: Chamado) {
    const cliente = tenant.usuarios.find((u) => u.id === chamado.solicitante_id)
    const colega =
      chamado.responsavel_id &&
      chamado.responsavel_id !== usuario.id &&
      tenant.usuarios.find((u) => u.id === chamado.responsavel_id)

    const faixa = classificarFaixaPrazo(
      chamado.prazo_resolucao,
      agora,
      chamado.status,
    )
    const selecionado = chamado.id === selecionadoId
    const naoLido = naoLidos.has(chamado.id)
    const faixaItem = faixaBarraItemFila(chamado.status, faixa)

    return (
      <button
        key={chamado.id}
        type="button"
        className={`fila-item${selecionado ? ' fila-item--selecionado' : ''}`}
        aria-current={selecionado ? 'true' : undefined}
        onClick={() => aoSelecionar(chamado.id)}
      >
        <span
          className={`fila-item__faixa fila-item__faixa--${faixaItem}`}
          aria-hidden="true"
        />
        <span className="fila-item__corpo">
          <span className="fila-item__selo">
            <SeloResumoItemFila
              aba={aba}
              chamado={chamado}
              faixa={faixa}
              agora={agora}
            />
          </span>
          <span className="fila-item__titulo">
            {naoLido && (
              <span className="fila-item__nao-lido" aria-label="Não lido" />
            )}
            {chamado.titulo}
          </span>
          <span className="fila-item__meta">
            #{chamado.numero} · {cliente?.nome ?? 'Cliente'} ·{' '}
            {rotuloPrioridade(chamado.prioridade)}
            {aba === 'grupo' && colega && ` · ${colega.nome}`}
            {chamado.status === 'aguardando_cliente' && ' · aguardando cliente'}
          </span>
        </span>
      </button>
    )
  }

  return (
    <section
      className={`coluna-fila${notasAbertas ? ' coluna-fila--notas-abertas' : ''}`}
      aria-labelledby="fila-titulo"
    >
      <h1 id="fila-titulo" className="coluna-fila__titulo">
        Fila
      </h1>
      <p className="coluna-fila__resumo">
        {grupo?.nome} · {resumo.atribuidos} atribuídos · {resumo.semDono} sem dono
        · {resumo.urgentes} urgentes
      </p>

      <div className="coluna-fila__abas" role="tablist" aria-label="Abas da fila">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className={`coluna-fila__aba${aba === item.id ? ' coluna-fila__aba--ativa' : ''}`}
            aria-selected={aba === item.id}
            onClick={() => aoMudarAba(item.id)}
          >
            {item.rotulo}
            {aba === item.id && (
              <span className="coluna-fila__contagem"> ({contagemAba})</span>
            )}
          </button>
        ))}
      </div>

      <div className="coluna-fila__ferramentas">
        <CampoTexto
          id="busca-fila"
          rotulo="Buscar chamado"
          value={busca}
          onChange={(e) => aoMudarBusca(e.target.value)}
          placeholder="Buscar chamado"
        />
        {aba !== 'concluidos' && (
          <CampoSelect
            id="filtro-fila"
            rotulo="Filtro"
            value={filtro}
            onChange={(e) => aoMudarFiltro(e.target.value as FiltroLista)}
            opcoes={FILTROS.map((f) => ({
              valor: f.id,
              rotulo: `${f.rotulo} (${contarFiltro(baseAba, f.id, agora)})`,
            }))}
          />
        )}
      </div>

      <div className="coluna-fila__lista" role="tabpanel">
        {lista.length === 0 && (
          <p className="coluna-fila__vazio">Nenhum chamado com esses filtros.</p>
        )}
        {secoes.map((secao) => (
          <div key={secao.grupo} className="fila-grupo">
            <h2 className={`fila-grupo__titulo fila-grupo__titulo--${secao.grupo}`}>
              {secao.titulo}
            </h2>
            {secao.chamados.map((chamado) => renderItem(chamado))}
          </div>
        ))}
      </div>
    </section>
  )
}