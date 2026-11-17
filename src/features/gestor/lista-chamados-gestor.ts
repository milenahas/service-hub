import type { Chamado, Mensagem, TenantSessao } from '../../dominio/snapshot.ts'
import type { OpcaoSelect } from '../../shared/components/tipos.ts'
import { chamadoAtivo } from '../../dominio/prazo.ts'
import { chamadoEmRisco } from './indicadores-gestor.ts'

/**
 * Recorta a lista de chamados do gestor: ativos do consultor, modo do
 * indicador (SLA / sem responsável), filtro da tabela e ordem por prazo.
 * Também decide se a conversa pode abrir e monta o select de responsável.
 * Quem está em risco vem de `indicadores-gestor.ts`. Não desenha — a tabela
 * fica em `TabelaChamadosGestor.tsx`; a vista ativa, em `TelaGestor`.
 */
export type FiltroChamadosGestor = 'todos' | 'em_risco' | 'aguardando_cliente'
export type ModoListaGestor = 'sla-4h' | 'sem-responsavel'

export function listarChamadosAtivosDoConsultor(
  chamados: Chamado[],
  consultorId: string,
): Chamado[] {
  return chamados.filter(
    (c) =>
      chamadoAtivo(c.status) && c.responsavel_id === consultorId,
  )
}

export function listarChamadosModoIndicador(
  chamados: Chamado[],
  modo: ModoListaGestor,
  agora: string,
): Chamado[] {
  if (modo === 'sla-4h') {
    return chamados.filter((c) => chamadoEmRisco(c, agora))
  }
  return chamados.filter(
    (c) => chamadoAtivo(c.status) && c.responsavel_id === null,
  )
}

export function filtrarChamadosGestor(
  chamados: Chamado[],
  filtro: FiltroChamadosGestor,
  agora: string,
): Chamado[] {
  if (filtro === 'todos') {
    return chamados
  }
  if (filtro === 'em_risco') {
    return chamados.filter((c) => chamadoEmRisco(c, agora))
  }
  return chamados.filter((c) => c.status === 'aguardando_cliente')
}

export function ordenarChamadosPorPrazo(chamados: Chamado[]): Chamado[] {
  const copia = [...chamados]
  copia.sort(
    (a, b) =>
      new Date(a.prazo_resolucao).getTime() -
      new Date(b.prazo_resolucao).getTime(),
  )
  return copia
}

/**
 * Conversa na tabela do gestor só abre com responsável e mensagem pública.
 * Notas internas não contam. Usado em `TabelaChamadosGestor`; não desenha.
 */
export function chamadoPermiteConversaGestor(
  chamado: Chamado,
  mensagens: Mensagem[],
): boolean {
  if (!chamado.responsavel_id) {
    return false
  }
  return mensagens.some(
    (m) => m.chamado_id === chamado.id && !m.interna,
  )
}

export function montarOpcoesConsultoresEquipe(
  tenant: TenantSessao,
  consultorIds: string[],
  responsavelAtualId: string | null,
): OpcaoSelect[] {
  const ids = new Set(consultorIds)
  if (responsavelAtualId) {
    ids.add(responsavelAtualId)
  }
  const opcoes: OpcaoSelect[] = []
  for (const id of ids) {
    const usuario = tenant.usuarios.find((u) => u.id === id)
    if (!usuario) continue
    opcoes.push({ valor: id, rotulo: usuario.nome })
  }
  opcoes.sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'))
  return opcoes
}