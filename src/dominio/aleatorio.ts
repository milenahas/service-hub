export type GeradorAleatorio = () => number

export function inteiroAleatorio(
  minimo: number,
  maximo: number,
  aleatorio: GeradorAleatorio,
): number {
  return Math.floor(aleatorio() * (maximo - minimo + 1)) + minimo
}
