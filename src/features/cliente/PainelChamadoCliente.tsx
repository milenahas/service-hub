import { useLayoutEffect, useRef } from 'react'
import type { Chamado, TenantSessao } from '../../dominio/snapshot.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import { formatarDataHoraUsuario } from '../../dominio/formatar-data.ts'
import {
  criadoEmDaMensagem,
  type MensagemBruta,
} from '../../dominio/mensagem-campos.ts'
import { formatarRotuloStatus } from '../../dominio/rotulo-status.ts'
import { BalaoMensagem } from '../chamados/BalaoMensagem.tsx'
import { BlocoDescricaoChamado } from '../chamados/BlocoDescricaoChamado.tsx'
import { linhaTempoPublicaDoChamado } from '../chamados/regras/linha-tempo-conversa.ts'
import type { TipoVisualBalao } from '../chamados/regras/tipo-visual-balao.ts'
import { Selo } from '../../shared/components/index.ts'
import { faixaEtapaCliente } from './faixa-etapa-cliente.ts'
import { RodapeMensagemCliente } from './RodapeMensagemCliente.tsx'
import { textoRespostaPrevistaCliente } from './texto-prazo-cliente.ts'
import { tipoVisualBalaoCliente } from './tipo-visual-balao-cliente.ts'

type PropsPainelChamadoCliente = {
  chamado: Chamado
  tenant: TenantSessao
  usuario: Usuario
  aoEnviarMensagem: (texto: string) => void
  aoReabrir: (motivo: string) => void
}

function nomeDoUsuario(tenant: TenantSessao, usuarioId: string | null): string | null {
  if (!usuarioId) return null
  return tenant.usuarios.find((usuario) => usuario.id === usuarioId)?.nome ?? null
}

function cabecalhoDaMensagem(
  mensagem: MensagemBruta,
  tipo: TipoVisualBalao,
  tenant: TenantSessao,
  usuario: Usuario,
): string | undefined {
  if (tipo === 'sistema') return undefined
  const nome =
    tipo === 'logado'
      ? usuario.nome
      : (nomeDoUsuario(tenant, mensagem.autor_id) ?? 'Consultor')
  const dataHoraCriacao = formatarDataHoraUsuario(
    criadoEmDaMensagem(mensagem),
    usuario,
  )
  return `${nome} · ${dataHoraCriacao}`
}

/**
 * Desenha o detalhe do chamado: título, responsável, resposta prevista,
 * faixa, descrição, histórico público e rodapé. Rola o histórico até a
 * última linha. A descrição entra como card no topo da conversa — o
 * mesmo bloco de `BlocoDescricaoChamado.tsx` — e não vira balão.
 * Não escolhe o chamado. Mensagem e reabertura sobem para `TelaCliente.tsx`.
 * A faixa vem de `faixa-etapa-cliente.ts`, o prazo de `texto-prazo-cliente.ts`,
 * o lado do balão de `tipo-visual-balao-cliente.ts` e o rodapé de
 * `RodapeMensagemCliente.tsx`.
 */
export function PainelChamadoCliente({
  chamado,
  tenant,
  usuario,
  aoEnviarMensagem,
  aoReabrir,
}: PropsPainelChamadoCliente) {
  const threadRef = useRef<HTMLDivElement>(null)
  const linhas = linhaTempoPublicaDoChamado(
    tenant.mensagens,
    tenant.historico,
    chamado.id,
    tenant.usuarios,
  )
  const nomeResponsavel = nomeDoUsuario(tenant, chamado.responsavel_id)
  const faixa = faixaEtapaCliente(chamado.status, nomeResponsavel)
  const classePainel =
    chamado.status === 'fechado'
      ? 'painel-chamado-cliente painel-chamado-cliente--fechado'
      : 'painel-chamado-cliente'

  useLayoutEffect(() => {
    const thread = threadRef.current
    if (!thread) return
    thread.scrollTop = thread.scrollHeight
  }, [linhas.length, chamado.id])

  return (
    <section className={classePainel}>
      <div className="painel-chamado-cliente__resumo">
        <header className="painel-chamado-cliente__topo">
          <div className="painel-chamado-cliente__identificacao">
            <h1 className="painel-chamado-cliente__titulo">{chamado.titulo}</h1>
            <p className="painel-chamado-cliente__meta">
              Chamado #{chamado.numero} · aberto em{' '}
              {formatarDataHoraUsuario(chamado.aberto_em, usuario)}
            </p>
          </div>
          <span className="painel-chamado-cliente__selo">
            <Selo apresentacao="status-preenchido" status={chamado.status}>
              {formatarRotuloStatus(chamado.status)}
            </Selo>
          </span>
        </header>

        <div className="painel-chamado-cliente__fatos">
          <div className="painel-chamado-cliente__fato">
            <p className="painel-chamado-cliente__fato-rotulo">Responsável</p>
            <p className="painel-chamado-cliente__fato-valor">
              {nomeResponsavel ?? 'Aguardando um consultor pegar'}
            </p>
          </div>
          <div className="painel-chamado-cliente__fato">
            <p className="painel-chamado-cliente__fato-rotulo">Resposta prevista</p>
            <p className="painel-chamado-cliente__fato-valor">
              {textoRespostaPrevistaCliente(
                chamado.status,
                chamado.prazo_primeira_resposta,
                tenant.meta.agora,
                usuario,
              )}
            </p>
          </div>
        </div>

        {faixa && (
          <div className={`faixa-etapa faixa-etapa--${faixa.variante}`}>
            <span className="faixa-etapa__ponto" aria-hidden="true" />
            <span>{faixa.frase}</span>
          </div>
        )}
      </div>

      <p id="rotulo-historico" className="painel-chamado-cliente__historico-rotulo">
        HISTÓRICO
      </p>
      <div
        ref={threadRef}
        className="painel-chamado-cliente__thread"
        aria-labelledby="rotulo-historico"
      >
        <BlocoDescricaoChamado descricao={chamado.descricao} />
        <div className="conversa" role="log" aria-live="polite">
          {linhas.map((mensagem) => {
            const tipo = tipoVisualBalaoCliente(mensagem.autor_id, usuario.id)
            return (
              <BalaoMensagem
                key={mensagem.id}
                mensagem={mensagem}
                tipoVisual={tipo}
                cabecalho={cabecalhoDaMensagem(mensagem, tipo, tenant, usuario)}
              />
            )
          })}
        </div>
      </div>

      <RodapeMensagemCliente
        status={chamado.status}
        aoEnviar={aoEnviarMensagem}
        aoReabrir={aoReabrir}
      />
    </section>
  )
}
