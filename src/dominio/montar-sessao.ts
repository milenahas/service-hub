import type { GeradorAleatorio } from './aleatorio.ts'
import {
  escolherAmostra,
  inteiroAleatorio,
} from './aleatorio.ts'
import type { Chamado, SnapshotCompleto, TenantSessao } from './snapshot.ts'
import type { Usuario } from './tipos.ts'

function calcularContagensPorFaixa(total: number) {
  const faixaA = Math.round(total * 0.3)
  const faixaB = Math.round(total * 0.4)
  const faixaC = Math.round(total * 0.15)
  const faixaD = total - faixaA - faixaB - faixaC
  return { faixaA, faixaB, faixaC, faixaD }
}

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

function selecionarChamadosPorFaixas(
  chamadosGrupo: Chamado[],
  contagens: ReturnType<typeof calcularContagensPorFaixa>,
  pools: {
    faixaA: Chamado[]
    faixaB: Chamado[]
    faixaC: Chamado[]
    faixaD: Chamado[]
  },
  aleatorio: GeradorAleatorio,
): Chamado[] {
  const usados = new Set<string>()
  const resultado: Chamado[] = []

  const adicionar = (origem: Chamado[], quantidade: number) => {
    const candidatos = origem.filter((c) => !usados.has(c.id))
    const escolhidos = escolherAmostra(candidatos, quantidade, aleatorio)
    for (const chamado of escolhidos) {
      usados.add(chamado.id)
      resultado.push(chamado)
    }
    const faltando = quantidade - escolhidos.length
    if (faltando > 0) {
      const reserva = chamadosGrupo.filter((c) => !usados.has(c.id))
      const extras = escolherAmostra(reserva, faltando, aleatorio)
      for (const chamado of extras) {
        usados.add(chamado.id)
        resultado.push(chamado)
      }
    }
  }

  adicionar(pools.faixaA, contagens.faixaA)
  adicionar(pools.faixaB, contagens.faixaB)
  adicionar(pools.faixaC, contagens.faixaC)
  adicionar(pools.faixaD, contagens.faixaD)

  return resultado
}

function montarChamadosConsultor(
  snapshot: SnapshotCompleto,
  grupoId: string,
  consultorId: string,
  total: number,
  aleatorio: GeradorAleatorio,
): Chamado[] {
  const consultoresGrupo = new Set(
    snapshot.usuarios
      .filter((u) => u.perfil === 'consultor' && u.grupo_id === grupoId)
      .map((u) => u.id),
  )

  const chamadosGrupo = snapshot.chamados.filter((c) => c.grupo_id === grupoId)

  const pools = {
    faixaA: chamadosGrupo.filter(
      (c) =>
        c.status === 'em_atendimento' && c.responsavel_id === consultorId,
    ),
    faixaB: chamadosGrupo.filter(
      (c) =>
        c.status === 'em_atendimento' &&
        c.responsavel_id !== null &&
        c.responsavel_id !== consultorId &&
        consultoresGrupo.has(c.responsavel_id),
    ),
    faixaC: chamadosGrupo.filter(
      (c) => c.status === 'aberto' && c.responsavel_id === null,
    ),
    faixaD: chamadosGrupo.filter(
      (c) => c.status === 'resolvido' || c.status === 'fechado',
    ),
  }

  const contagens = calcularContagensPorFaixa(total)
  return selecionarChamadosPorFaixas(chamadosGrupo, contagens, pools, aleatorio)
}

function montarChamadosGestor(
  snapshot: SnapshotCompleto,
  consultoresEquipe: Usuario[],
  total: number,
  aleatorio: GeradorAleatorio,
): Chamado[] {
  const idsEquipe = new Set(consultoresEquipe.map((c) => c.id))
  const gruposEquipe = new Set(
    consultoresEquipe
      .map((c) => c.grupo_id)
      .filter((id): id is string => id !== undefined),
  )

  const consultoresPorGrupo = (grupoId: string) =>
    new Set(
      snapshot.usuarios
        .filter((u) => u.perfil === 'consultor' && u.grupo_id === grupoId)
        .map((u) => u.id),
    )

  const chamadosRelevantes = snapshot.chamados.filter((c) =>
    gruposEquipe.has(c.grupo_id),
  )

  const pools = {
    faixaA: chamadosRelevantes.filter(
      (c) =>
        c.status === 'em_atendimento' &&
        c.responsavel_id !== null &&
        idsEquipe.has(c.responsavel_id),
    ),
    faixaB: chamadosRelevantes.filter((c) => {
      if (c.status !== 'em_atendimento' || c.responsavel_id === null) {
        return false
      }
      const doGrupo = consultoresPorGrupo(c.grupo_id)
      return doGrupo.has(c.responsavel_id) && !idsEquipe.has(c.responsavel_id)
    }),
    faixaC: chamadosRelevantes.filter(
      (c) => c.status === 'aberto' && c.responsavel_id === null,
    ),
    faixaD: chamadosRelevantes.filter(
      (c) => c.status === 'resolvido' || c.status === 'fechado',
    ),
  }

  const contagens = calcularContagensPorFaixa(total)
  return selecionarChamadosPorFaixas(
    chamadosRelevantes,
    contagens,
    pools,
    aleatorio,
  )
}

export function montarSessao(
  snapshot: SnapshotCompleto,
  usuarioLogado: Usuario,
  aleatorio: GeradorAleatorio = Math.random,
): TenantSessao {
  const catalogos = montarCatalogos(snapshot)

  if (usuarioLogado.perfil === 'cliente') {
    const chamados = snapshot.chamados.filter(
      (c) => c.solicitante_id === usuarioLogado.id,
    )
    const ids = new Set(chamados.map((c) => c.id))
    const correlatos = filtrarMensagensHistorico(snapshot, ids)
    return { ...catalogos, chamados, ...correlatos }
  }

  if (usuarioLogado.perfil === 'consultor' && usuarioLogado.grupo_id) {
    const total = inteiroAleatorio(20, 100, aleatorio)
    const chamados = montarChamadosConsultor(
      snapshot,
      usuarioLogado.grupo_id,
      usuarioLogado.id,
      total,
      aleatorio,
    )
    const ids = new Set(chamados.map((c) => c.id))
    const correlatos = filtrarMensagensHistorico(snapshot, ids)
    return { ...catalogos, chamados, ...correlatos }
  }

  if (usuarioLogado.perfil === 'gestor') {
    const todosConsultores = snapshot.usuarios.filter(
      (u) => u.perfil === 'consultor',
    )
    const quantidadeConsultores = inteiroAleatorio(10, 15, aleatorio)
    const consultoresEquipe = escolherAmostra(
      todosConsultores,
      quantidadeConsultores,
      aleatorio,
    )
    const totalChamados = inteiroAleatorio(20, 50, aleatorio)
    const chamados = montarChamadosGestor(
      snapshot,
      consultoresEquipe,
      totalChamados,
      aleatorio,
    )
    const ids = new Set(chamados.map((c) => c.id))
    const correlatos = filtrarMensagensHistorico(snapshot, ids)
    return {
      ...catalogos,
      chamados,
      ...correlatos,
      consultoresEquipeGestor: consultoresEquipe.map((c) => c.id),
    }
  }

  return {
    ...catalogos,
    chamados: [],
    mensagens: [],
    historico: [],
  }
}