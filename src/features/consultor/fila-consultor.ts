import { chamadoAtivo, classificarFaixaPrazo } from '../../dominio/prazo.ts'
import type { Chamado, TenantSessao } from '../../dominio/snapshot.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import { agruparFila, type SecaoFila } from './agrupar-fila.ts'

/**
 * Pega a fatia do tenant do consultor logado e joga os chamados certos em
 * cada aba (Minha fila, Fila do grupo, Concluídos, Sem dono). Também aplica
 * busca e o filtro do select; não desenha a lista.
 */

export type AbaFila = 'minha' | 'grupo' | 'concluidos' | 'sem_dono'

export type FiltroLista = 'todos' | 'urgentes' | 'quatro_horas' | 'aguardando_cliente'

export type ResumoFila = {
  atribuidos: number
  semDono: number
  urgentes: number
}

function consultoresDoGrupo(tenant: TenantSessao, grupoId: string): Set<string> {
  return new Set(
    tenant.usuarios
      .filter((u) => u.perfil === 'consultor' && u.grupo_id === grupoId)
      .map((u) => u.id),
  )
}

function chamadosDoGrupo(tenant: TenantSessao, grupoId: string): Chamado[] {
  return tenant.chamados.filter((c) => c.grupo_id === grupoId)
}

export function calcularResumoFila(
  tenant: TenantSessao,
  consultor: Usuario,
): ResumoFila {
  const grupoId = consultor.grupo_id!
  const agora = tenant.meta.agora
  const ativos = chamadosDoGrupo(tenant, grupoId).filter((c) =>
    chamadoAtivo(c.status),
  )

  const atribuidos = ativos.filter(
    (c) => c.responsavel_id === consultor.id,
  ).length
  const semDono = ativos.filter((c) => c.responsavel_id === null).length
  const urgentes = ativos.filter((c) => {
    const faixa = classificarFaixaPrazo(c.prazo_resolucao, agora, c.status)
    return faixa === 'vencido' || faixa === 'urgente'
  }).length

  return { atribuidos, semDono, urgentes }
}

type ContextoAbaFila = {
  consultor: Usuario
  idsConsultoresDoGrupo: Set<string>
}

function naAbaMinha(chamado: Chamado, ctx: ContextoAbaFila): boolean {
  return (
    chamadoAtivo(chamado.status) &&
    chamado.responsavel_id === ctx.consultor.id
  )
}

function naAbaGrupo(chamado: Chamado, ctx: ContextoAbaFila): boolean {
  const dono = chamado.responsavel_id
  return (
    chamadoAtivo(chamado.status) &&
    dono !== null &&
    dono !== ctx.consultor.id &&
    ctx.idsConsultoresDoGrupo.has(dono)
  )
}

function naAbaSemDono(chamado: Chamado): boolean {
  return chamadoAtivo(chamado.status) && chamado.responsavel_id === null
}

function naAbaConcluidos(chamado: Chamado, ctx: ContextoAbaFila): boolean {
  return (
    !chamadoAtivo(chamado.status) &&
    chamado.responsavel_id === ctx.consultor.id
  )
}

const pertenceNaAba: Record<
  AbaFila,
  (chamado: Chamado, ctx: ContextoAbaFila) => boolean
> = {
  minha: naAbaMinha,
  grupo: naAbaGrupo,
  sem_dono: (chamado) => naAbaSemDono(chamado),
  concluidos: naAbaConcluidos,
}

export function filtrarPorAba(
  chamados: Chamado[],
  aba: AbaFila,
  consultor: Usuario,
  tenant: TenantSessao,
): Chamado[] {
  const ctx: ContextoAbaFila = {
    consultor,
    idsConsultoresDoGrupo: consultoresDoGrupo(
      tenant,
      consultor.grupo_id!,
    ),
  }
  const inclui = pertenceNaAba[aba]
  return chamados.filter((chamado) => inclui(chamado, ctx))
}

/**
 * Valores em texto de um chamado que entram na busca (um item por linha da lista abaixo).
 * Não compara com o que foi digitado — `chamadoCorrespondeBusca` faz o match.
 *
 * Exemplo: chamado #42, título "Rede lenta", solicitante "Leandro Mendes" retorna:
 *   ["Rede lenta", "42", "#42", "Leandro Mendes"]
 *
 * O consultor pode achar esse chamado digitando parte do título ("rede"),
 * o número ("42" ou "#42") ou o nome do cliente ("leandro").
 */
function textosBuscaChamado(
  chamado: Chamado,
  tenant: TenantSessao,
): string[] {
  const solicitante = tenant.usuarios.find(
    (u) => u.id === chamado.solicitante_id,
  )
  return [
    chamado.titulo,
    String(chamado.numero),
    `#${chamado.numero}`,
    solicitante?.nome ?? '',
  ]
}

/** Campo de busca vazio mantém todos; senão bate em título, #número, número ou solicitante. */
function chamadoCorrespondeBusca(
  chamado: Chamado,
  termo: string,
  tenant: TenantSessao,
): boolean {
  const normalizado = termo.trim().toLowerCase()
  if (normalizado === '') {
    return true
  }
  const digitos = normalizado.replace('#', '')
  return textosBuscaChamado(chamado, tenant).some((texto) =>
    texto.toLowerCase().includes(normalizado),
  ) || String(chamado.numero).includes(digitos)
}

export function filtrarPorSelect(
  chamados: Chamado[],
  filtro: FiltroLista,
  agora: string,
): Chamado[] {
  if (filtro === 'todos') return chamados
  if (filtro === 'aguardando_cliente') {
    return chamados.filter((c) => c.status === 'aguardando_cliente')
  }
  if (filtro === 'urgentes') {
    return chamados.filter((c) => {
      const faixa = classificarFaixaPrazo(c.prazo_resolucao, agora, c.status)
      return faixa === 'vencido' || faixa === 'urgente'
    })
  }
  if (filtro === 'quatro_horas') {
    const limite = 4 * 60 * 60 * 1000
    return chamados.filter((c) => {
      if (!chamadoAtivo(c.status)) return false
      const restante =
        new Date(c.prazo_resolucao).getTime() - new Date(agora).getTime()
      return restante >= 0 && restante < limite
    })
  }
  return chamados
}

export function listarChamadosFila(
  tenant: TenantSessao,
  consultor: Usuario,
  aba: AbaFila,
  busca: string,
  filtro: FiltroLista,
): Chamado[] {
  const grupoId = consultor.grupo_id!
  const base = chamadosDoGrupo(tenant, grupoId)
  const porAba = filtrarPorAba(base, aba, consultor, tenant)
  const porBusca = porAba.filter((c) =>
    chamadoCorrespondeBusca(c, busca, tenant),
  )
  if (aba === 'concluidos') {
    return porBusca
  }
  return filtrarPorSelect(porBusca, filtro, tenant.meta.agora)
}

export function montarSecoesFilaVisivel(
  tenant: TenantSessao,
  consultor: Usuario,
  aba: AbaFila,
  busca: string,
  filtro: FiltroLista,
): SecaoFila[] {
  const lista = listarChamadosFila(tenant, consultor, aba, busca, filtro)
  return agruparFila(lista, aba, tenant.meta.agora)
}

export function primeiroIdFilaVisivel(
  tenant: TenantSessao,
  consultor: Usuario,
  aba: AbaFila,
  busca: string,
  filtro: FiltroLista,
): string | null {
  const secoes = montarSecoesFilaVisivel(tenant, consultor, aba, busca, filtro)
  return secoes[0]?.chamados[0]?.id ?? null
}

function idsNasSecoes(secoes: SecaoFila[]): Set<string> {
  const ids = secoes.flatMap((secao) =>
    secao.chamados.map((chamado) => chamado.id),
  )
  return new Set(ids)
}

export function chamadoVisivelNaFila(
  secoes: SecaoFila[],
  chamadoId: string,
): boolean {
  return idsNasSecoes(secoes).has(chamadoId)
}

export function contarFiltro(
  chamados: Chamado[],
  filtro: FiltroLista,
  agora: string,
): number {
  return filtrarPorSelect(chamados, filtro, agora).length
}