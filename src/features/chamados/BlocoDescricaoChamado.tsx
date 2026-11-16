import './conversa.css'

type PropsBlocoDescricaoChamado = {
  descricao: string
}

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