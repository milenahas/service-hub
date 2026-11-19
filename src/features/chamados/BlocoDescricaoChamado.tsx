import './conversa.css'

type PropsBlocoDescricaoChamado = {
  descricao: string
}

/**
 * Desenha o bloco “Descrição do chamado”. O texto chega pronto. Quem
 * decide o chamado e onde o bloco entra é `PainelChamado.tsx` e
 * `PainelChamadoCliente.tsx`.
 */
export function BlocoDescricaoChamado({ descricao }: PropsBlocoDescricaoChamado) {
  return (
    <section
      className="conversa-descricao"
      aria-label="Descrição do chamado"
    >
      <p className="conversa-descricao__rotulo">Descrição do chamado</p>
      <p className="conversa-descricao__texto">{descricao}</p>
    </section>
  )
}