import type { Chamado } from '../../dominio/snapshot.ts'

/**
 * Ordena os chamados do cliente: mais recentes primeiro por `aberto_em`,
 * e `numero` decrescente no empate. Não desenha a lista — quem pinta é
 * `ColunaMeusChamados.tsx`. A seleção fica em `TelaCliente.tsx`.
 * O recorte por texto fica em `filtrarChamadosCliente`, neste arquivo.
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

function textosBusca(chamado: Chamado): string[] {
  return [chamado.titulo, String(chamado.numero), `#${chamado.numero}`]
}

/**
 * Recorta a lista já ordenada por um trecho do título ou do número
 * (`42` ou `#42`). Termo vazio devolve a lista inteira, na mesma ordem.
 * Não desenha e não escolhe o chamado aberto — a busca e a seleção
 * ficam em `TelaCliente.tsx`; os cartões, em `ColunaMeusChamados.tsx`.
 */
export function filtrarChamadosCliente(
  chamados: Chamado[],
  busca: string,
): Chamado[] {
  const normalizado = busca.trim().toLowerCase()
  if (normalizado === '') {
    return chamados
  }
  const digitos = normalizado.replace('#', '')
  return chamados.filter((chamado) => {
    const noTexto = textosBusca(chamado).some((texto) =>
      texto.toLowerCase().includes(normalizado),
    )
    return noTexto || String(chamado.numero).includes(digitos)
  })
}