import type { HistoricoEntrada, Mensagem } from '../../dominio/snapshot.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import { linhaTempoPublicaDoChamado } from './regras/linha-tempo-conversa.ts'
import { tipoVisualBalao } from './regras/tipo-visual-balao.ts'
import { BalaoMensagem } from './BalaoMensagem.tsx'
import './conversa.css'

type PropsListaConversa = {
  mensagens: Mensagem[]
  historico: HistoricoEntrada[]
  usuarios: Usuario[]
  chamadoId: string
  solicitanteId: string
  usuarioLogado: Usuario
}

/**
 * Desenha a thread pública do chamado, uma linha por mensagem,
 * inclusive as de sistema. Não escolhe o chamado nem guarda texto
 * digitado. A ordem e as linhas de sistema vêm de
 * `linha-tempo-conversa.ts`; o lado de cada balão, de
 * `tipo-visual-balao.ts`; o desenho, de `BalaoMensagem.tsx`. Quem
 * monta a tela é `PainelChamado.tsx` e `PainelConversaGestor.tsx`.
 */
export function ListaConversa({
  mensagens,
  historico,
  usuarios,
  chamadoId,
  solicitanteId,
  usuarioLogado,
}: PropsListaConversa) {
  const publicas = linhaTempoPublicaDoChamado(
    mensagens,
    historico,
    chamadoId,
    usuarios,
  )
  return (
    <div className="conversa" role="log" aria-live="polite">
      {publicas.map((mensagem) => (
        <BalaoMensagem
          key={mensagem.id}
          mensagem={mensagem}
          tipoVisual={tipoVisualBalao(
            mensagem.autor_id,
            solicitanteId,
            usuarioLogado,
          )}
        />
      ))}
    </div>
  )
}