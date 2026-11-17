import { useState } from 'react'
import type { Chamado, TenantSessao } from '../../dominio/snapshot.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import {
  classificarFaixaPrazo,
  formatarTextoPrazoConsultor,
} from '../../dominio/prazo.ts'
import { formatarDataHoraUsuario } from '../../dominio/formatar-data.ts'
import { formatarRotuloStatus } from '../../dominio/rotulo-status.ts'
import { mensagensPublicasDoChamado, notasInternasDoChamado } from '../chamados/regras/mensagens-chamado.ts'
import { ListaConversa } from '../chamados/ListaConversa.tsx'
import { ItemNotaInterna } from '../chamados/ItemNotaInterna.tsx'
import {
  Botao,
  CampoSelect,
  CampoTextarea,
  Selo,
} from '../../shared/components/index.ts'
import { rotuloPrioridade } from './indicadores-gestor.ts'
import { montarOpcoesConsultoresEquipe } from './lista-chamados-gestor.ts'

type PropsPainelConversaGestor = {
  chamado: Chamado
  tenant: TenantSessao
  usuario: Usuario
  consultorIds: string[]
  aoAtribuir: (consultorId: string | null) => void
  aoSalvarNota: (texto: string) => void
}

/**
 * Vista conversa do gestor: cabeçalho do chamado, redistribuição, thread só
 * leitura e painel fixo de notas internas. Não altera tenant — repassa
 * atribuição e nota para a store via `TelaGestor`.
 */
export function PainelConversaGestor({
  chamado,
  tenant,
  usuario,
  consultorIds,
  aoAtribuir,
  aoSalvarNota,
}: PropsPainelConversaGestor) {
  const [textoNota, setTextoNota] = useState('')

  const cliente = tenant.usuarios.find((u) => u.id === chamado.solicitante_id)
  const categoria = tenant.categorias.find((c) => c.id === chamado.categoria_id)
  const agora = tenant.meta.agora
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
  const publicas = mensagensPublicasDoChamado(tenant.mensagens, chamado.id)
  const qtdPublicas = publicas.length
  const notas = notasInternasDoChamado(tenant.mensagens, chamado.id)
  const opcoes = montarOpcoesConsultoresEquipe(
    tenant,
    consultorIds,
    chamado.responsavel_id,
  )

  function salvarNota() {
    const corpo = textoNota.trim()
    if (!corpo) return
    aoSalvarNota(corpo)
    setTextoNota('')
  }

  const textoQtdMensagens =
    qtdPublicas === 1 ? '1 mensagem' : `${qtdPublicas} mensagens`

  return (
    <>
      <header className="cartao-gestor painel-conversa-gestor__cabecalho">
        <div className="painel-conversa-gestor__identificacao">
          <h2 className="painel-conversa-gestor__titulo">{chamado.titulo}</h2>
          <p className="painel-conversa-gestor__meta">
            #{chamado.numero} · {cliente?.nome ?? '—'} ·{' '}
            {categoria?.nome ?? '—'} · prioridade{' '}
            {rotuloPrioridade(chamado.prioridade)} · aberto em{' '}
            {formatarDataHoraUsuario(chamado.aberto_em, usuario)} ·{' '}
            {textoQtdMensagens}
          </p>
          <div className="painel-conversa-gestor__selos">
            <Selo apresentacao="prazo" faixa={faixa}>
              {textoPrazo}
            </Selo>
            <Selo apresentacao="status-borda" status={chamado.status}>
              {formatarRotuloStatus(chamado.status)}
            </Selo>
          </div>
        </div>
        <div className="painel-conversa-gestor__redistribuir">
          <CampoSelect
            id={`redistribuir-${chamado.id}`}
            rotulo="Redistribuir para"
            value={chamado.responsavel_id ?? ''}
            opcoes={opcoes}
            opcaoSemResponsavel
            onChange={(e) => {
              const id = e.target.value
              aoAtribuir(id || null)
            }}
          />
        </div>
      </header>

      <div className="painel-conversa-gestor__corpo">
        <section
          className="cartao-gestor painel-conversa-gestor__conversa"
          aria-labelledby="rotulo-conversa-gestor"
        >
          <h3 id="rotulo-conversa-gestor" className="painel-conversa-gestor__rotulo-secao">
            Conversa com o cliente · somente leitura
          </h3>
          <div className="painel-conversa-gestor__lista">
            <ListaConversa
              mensagens={tenant.mensagens}
              historico={tenant.historico}
              usuarios={tenant.usuarios}
              chamadoId={chamado.id}
              solicitanteId={chamado.solicitante_id}
              usuarioLogado={usuario}
            />
          </div>
        </section>

        <aside
          className="cartao-gestor painel-conversa-gestor__notas"
          aria-label="Notas internas"
        >
          <h3 className="painel-conversa-gestor__titulo-notas">Notas internas</h3>
          <p className="painel-conversa-gestor__sub-notas">
            A equipe vê. O cliente não.
          </p>
          <div className="painel-conversa-gestor__lista-notas">
            {notas.length === 0 && (
              <p className="painel-conversa-gestor__vazio-notas">Nenhuma nota ainda.</p>
            )}
            {notas.map((nota) => (
              <ItemNotaInterna key={nota.id} nota={nota} />
            ))}
          </div>
          <CampoTextarea
            id="nota-gestor"
            rotulo="Nova nota interna"
            value={textoNota}
            onChange={(e) => setTextoNota(e.target.value)}
            placeholder="Orientar a equipe..."
            rows={4}
          />
          <Botao
            variante="secundario"
            bloco
            type="button"
            disabled={!textoNota.trim()}
            onClick={salvarNota}
          >
            Salvar nota interna
          </Botao>
        </aside>
      </div>
    </>
  )
}