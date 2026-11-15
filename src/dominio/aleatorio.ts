export type GeradorAleatorio = () => number

/** Gerador determinístico para testes (LCG simples) */
export function criarGeradorComSemente(semente: number): GeradorAleatorio {
  let estado = semente >>> 0
  return () => {
    estado = (1664525 * estado + 1013904223) >>> 0
    return estado / 0x1_0000_0000
  }
}

export function inteiroAleatorio(
  minimo: number,
  maximo: number,
  aleatorio: GeradorAleatorio,
): number {
  return Math.floor(aleatorio() * (maximo - minimo + 1)) + minimo
}

export function embaralhar<T>(lista: T[], aleatorio: GeradorAleatorio): T[] {
  const copia = [...lista]
  for (let indice = copia.length - 1; indice > 0; indice -= 1) {
    const sorteado = Math.floor(aleatorio() * (indice + 1))
    ;[copia[indice], copia[sorteado]] = [copia[sorteado], copia[indice]]
  }
  return copia
}

export function escolherAmostra<T>(
  lista: T[],
  quantidade: number,
  aleatorio: GeradorAleatorio,
): T[] {
  if (quantidade >= lista.length) {
    return embaralhar(lista, aleatorio)
  }
  return embaralhar(lista, aleatorio).slice(0, quantidade)
}