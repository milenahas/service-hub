import type { HistoricoEntrada, Mensagem } from '../../dominio/snapshot.ts'
import type { Usuario } from '../../dominio/tipos.ts'
import { linhaTempoPublicaDoChamado } from './regras/linha-tempo-conversa.ts'
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
          solicitanteId={solicitanteId}
          usuarioLogado={usuarioLogado}
        />
      ))}
    </div>
  )
}