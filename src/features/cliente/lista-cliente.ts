import type { Chamado } from '../../dominio/snapshot.ts'

/**
 * Ordena os chamados do cliente: mais recentes primeiro por `aberto_em`,
 * e `numero` decrescente no empate. Não desenha a lista — quem pinta é
 * `ColunaMeusChamados.tsx`. A seleção fica em `TelaCliente.tsx`.
 */
export function ordenarChamadosCliente(chamados: Chamado[]): Chamado[] {
  return [...chamados].sort((a, b) => {
    const porData = b.aberto_em.localeCompare(a.aberto_em)
    if (porData !== 0) {
      return porData
    }
    return b.numero - a.numero
  })
}