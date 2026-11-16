import { useState } from 'react'
import type { Chamado, TenantSessao } from '../../dominio/snapshot.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import { chamadoAtivo, classificarFaixaPrazo, formatarTextoPrazoConsultor } from '../../dominio/prazo.ts'
import { formatarDataHoraUsuario } from '../../dominio/formatar-data.ts'
import { formatarRotuloStatus } from '../../dominio/rotulo-status.ts'
import { selecionarTransicoesStatus } from '../../dominio/selecionar-transicoes-status.ts'
import type { StatusChamado } from '../../dominio/chamado.ts'
import { notasInternasDoChamado } from '../chamados/regras/mensagens-chamado.ts'
import { BlocoDescricaoChamado } from '../chamados/BlocoDescricaoChamado.tsx'
import { ListaConversa } from '../chamados/ListaConversa.tsx'
import { RodapeRespostaCliente } from '../chamados/RodapeRespostaCliente.tsx'
import {
  Botao,
  CampoSelect,
  CampoTexto,
  Selo,
} from '../../shared/components/index.ts'

/**
 * Desenha o painel central da rotina do consultor: detalhe do chamado
 * selecionado na fila, mudança de status, conversa pública e rodapé
 * “Responder ao cliente…”. Inclui Pegar chamado, o form de status e o
 * botão Notas.
 *
 * Salvar anotações internas fica em `PainelNotas.tsx`. Só guarda estado
 * do form de status; o resto vem de `TelaConsultor` e da store.
 */
type PropsPainelChamado = {
  chamado: Chamado | undefined
  tenant: TenantSessao
  usuario: Usuario
  notasAbertas: boolean
  aoAlternarNotas: () => void
  aoPegar: () => void
  aoEnviarResposta: (texto: string) => void
  aoAlterarStatus: (para: StatusChamado, motivo: string) => void
}

function rotuloPrioridade(prioridade: string): string {
  return prioridade.charAt(0).toUpperCase() + prioridade.slice(1)
}

export function PainelChamado({
  chamado,
  tenant,
  usuario,
  notasAbertas,
  aoAlternarNotas,
  aoPegar,
  aoEnviarResposta,
  aoAlterarStatus,
}: PropsPainelChamado) {
  const [statusAberto, setStatusAberto] = useState(false)
  const [novoStatus, setNovoStatus] = useState<StatusChamado | ''>('')
  const [motivo, setMotivo] = useState('')

  if (!chamado) {
    return (
      <section className="painel-chamado painel-chamado--vazio">
        <p>Selecione um chamado na fila.</p>
      </section>
    )
  }

  const cliente = tenant.usuarios.find((u) => u.id === chamado.solicitante_id)
  const categoria = tenant.categorias.find((c) => c.id === chamado.categoria_id)
  const grupo = tenant.grupos.find((g) => g.id === chamado.grupo_id)
  const responsavel = tenant.usuarios.find((u) => u.id === chamado.responsavel_id)

  const agora = tenant.meta.agora
  const faixa = classificarFaixaPrazo(chamado.prazo_resolucao, agora, chamado.status)
  const qtdNotas = notasInternasDoChamado(tenant.mensagens, chamado.id).length
  const ativo = chamadoAtivo(chamado.status)
  const mostrarPegar = ativo && chamado.responsavel_id === null
  const transicoes = selecionarTransicoesStatus(chamado.status)

  const confirmarDesabilitado =
    !motivo.trim() || !novoStatus || novoStatus === chamado.status

  function confirmarStatus() {
    if (confirmarDesabilitado || !novoStatus) return
    aoAlterarStatus(novoStatus, motivo.trim())
    setStatusAberto(false)
    setMotivo('')
    setNovoStatus('')
  }

  return (
    <section className="painel-chamado" aria-label="Detalhe do chamado">
      <header className="painel-chamado__cabecalho">
        <div className="painel-chamado__topo">
          <div className="painel-chamado__identificacao">
            <div className="painel-chamado__titulo-linha">
              <h2 className="painel-chamado__titulo">{chamado.titulo}</h2>
              <Selo apresentacao="status-borda" status={chamado.status}>
                {formatarRotuloStatus(chamado.status)}
              </Selo>
            </div>
            <p className="painel-chamado__meta">
              #{chamado.numero} · {cliente?.nome ?? 'Cliente'} · {categoria?.nome ?? '—'}{' '}
              · {grupo?.nome ?? '—'} · prioridade {rotuloPrioridade(chamado.prioridade)}
            </p>
          </div>
          <div className="painel-chamado__acoes">
            {mostrarPegar && (
              <Botao variante="primario" type="button" onClick={aoPegar}>
                Pegar chamado
              </Botao>
            )}
            <Botao
              variante={statusAberto ? 'primario' : 'secundario'}
              type="button"
              onClick={() => setStatusAberto((v) => !v)}
            >
              Status
            </Botao>
            <Botao
              variante={notasAbertas ? 'primario' : 'secundario'}
              type="button"
              onClick={aoAlternarNotas}
            >
              {qtdNotas > 0 ? `Notas (${qtdNotas})` : 'Notas'}
            </Botao>
          </div>
        </div>
        <p className="painel-chamado__linha-info">
          Responsável <strong>{responsavel?.nome ?? 'Sem responsável'}</strong> · Prazo
          até{' '}
          <strong>
            {formatarDataHoraUsuario(chamado.prazo_resolucao, usuario)}
          </strong>{' '}
          <Selo apresentacao="prazo" faixa={faixa}>
            {formatarTextoPrazoConsultor(
              chamado.prazo_resolucao,
              agora,
              chamado.status,
            )}
          </Selo>
        </p>
      </header>

      {statusAberto && (
        <div className="painel-chamado__status-form">
          <CampoSelect
            id="novo-status"
            rotulo="Novo status"
            value={novoStatus}
            onChange={(e) => setNovoStatus(e.target.value as StatusChamado)}
            opcaoVazia="Selecione"
            opcoes={transicoes.map((s) => ({
              valor: s,
              rotulo: formatarRotuloStatus(s),
            }))}
          />
          <CampoTexto
            id="motivo-status"
            rotulo="Motivo (obrigatório)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
          />
          <div className="painel-chamado__status-acoes">
            <Botao
              variante="secundario"
              type="button"
              onClick={() => {
                setStatusAberto(false)
                setMotivo('')
                setNovoStatus('')
              }}
            >
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              type="button"
              disabled={confirmarDesabilitado}
              onClick={confirmarStatus}
            >
              Confirmar
            </Botao>
          </div>
        </div>
      )}

      <div className="painel-chamado__conversa">
        <BlocoDescricaoChamado descricao={chamado.descricao} />
        <ListaConversa
          mensagens={tenant.mensagens}
          historico={tenant.historico}
          usuarios={tenant.usuarios}
          chamadoId={chamado.id}
          solicitanteId={chamado.solicitante_id}
          usuarioLogado={usuario}
        />
      </div>

      <RodapeRespostaCliente
        status={chamado.status}
        aoEnviar={aoEnviarResposta}
      />
    </section>
  )
}