import type { Chamado, SnapshotCompleto, TenantSessao } from './snapshot.ts'
import type { Usuario } from './tipos.ts'

function filtrarMensagensHistorico(
  snapshot: SnapshotCompleto,
  idsChamados: Set<string>,
): Pick<TenantSessao, 'mensagens' | 'historico'> {
  return {
    mensagens: snapshot.mensagens.filter((m) => idsChamados.has(m.chamado_id)),
    historico: snapshot.historico.filter((h) => idsChamados.has(h.chamado_id)),
  }
}

function montarCatalogos(snapshot: SnapshotCompleto): Omit<
  TenantSessao,
  'chamados' | 'mensagens' | 'historico' | 'consultoresEquipeGestor'
> {
  return {
    meta: snapshot.meta,
    grupos: snapshot.grupos,
    categorias: snapshot.categorias,
    sla: snapshot.sla,
    usuarios: snapshot.usuarios,
  }
}

function montarTenant(
  snapshot: SnapshotCompleto,
  chamados: Chamado[],
  consultoresEquipeGestor?: string[],
): TenantSessao {
  const ids = new Set(chamados.map((c) => c.id))
  return {
    ...montarCatalogos(snapshot),
    chamados,
    ...filtrarMensagensHistorico(snapshot, ids),
    consultoresEquipeGestor,
  }
}

export function montarSessao(
  snapshot: SnapshotCompleto,
  usuarioLogado: Usuario,
): TenantSessao {
  if (usuarioLogado.perfil === 'cliente') {
    return montarTenant(
      snapshot,
      snapshot.chamados.filter((c) => c.solicitante_id === usuarioLogado.id),
    )
  }

  if (usuarioLogado.perfil === 'consultor' && usuarioLogado.grupo_id) {
    return montarTenant(
      snapshot,
      snapshot.chamados.filter((c) => c.grupo_id === usuarioLogado.grupo_id),
    )
  }

  if (usuarioLogado.perfil === 'gestor') {
    const consultoresEquipe = snapshot.usuarios.filter(
      (u) => u.perfil === 'consultor',
    )
    const gruposEquipe = new Set(
      consultoresEquipe
        .map((c) => c.grupo_id)
        .filter((id): id is string => id !== undefined),
    )
    return montarTenant(
      snapshot,
      snapshot.chamados.filter((c) => gruposEquipe.has(c.grupo_id)),
      consultoresEquipe.map((c) => c.id),
    )
  }

  return montarTenant(snapshot, [])
}
