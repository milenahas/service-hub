export function montarDescritoPor(
  id: string,
  erro?: string,
  legenda?: string,
): string | undefined {
  const ids: string[] = []

  if (erro) {
    ids.push(`${id}-erro`)
  }
  if (legenda) {
    ids.push(`${id}-legenda`)
  }

  return ids.length > 0 ? ids.join(' ') : undefined
}