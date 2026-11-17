import { useCallback, useEffect, useRef, useState } from 'react'
import type { TenantSessao } from '../../dominio/snapshot.ts'

type SnapshotLeitura = {
  ultimaMensagemPorChamado: Map<string, string>
}

function extrairSnapshot(tenant: TenantSessao): SnapshotLeitura {
  const ultimaMensagemPorChamado = new Map<string, string>()
  for (const mensagem of tenant.mensagens) {
    if (mensagem.interna) continue
    ultimaMensagemPorChamado.set(mensagem.chamado_id, mensagem.id)
  }
  return { ultimaMensagemPorChamado }
}

/**
 * Guarda os chamados com mensagem pública nova desde a entrada na tela.
 * A conversa aberta não entra no conjunto. A carga inicial não marca
 * nada. Não desenha a bolinha — isso fica em `ColunaMeusChamados.tsx`.
 * Quem limpa ao selecionar é `TelaCliente.tsx`.
 */
export function useNaoLidosCliente(
  tenant: TenantSessao | null,
  chamadoAbertoId: string | null,
) {
  const [naoLidos, setNaoLidos] = useState<Set<string>>(() => new Set())
  const anterior = useRef<SnapshotLeitura | null>(null)

  useEffect(() => {
    if (!tenant) {
      anterior.current = null
      return
    }

    const atual = extrairSnapshot(tenant)
    if (anterior.current) {
      const novasMensagens = [...atual.ultimaMensagemPorChamado.entries()]
        .filter(
          ([chamadoId, msgId]) =>
            anterior.current!.ultimaMensagemPorChamado.get(chamadoId) !== msgId,
        )
        .map(([chamadoId]) => chamadoId)

      if (novasMensagens.length > 0) {
        setNaoLidos((prev) => {
          const proximo = new Set(prev)
          for (const id of novasMensagens) {
            if (id !== chamadoAbertoId) proximo.add(id)
          }
          return proximo
        })
      }
    }

    anterior.current = atual
  }, [tenant, chamadoAbertoId])

  const limparNaoLido = useCallback((chamadoId: string) => {
    setNaoLidos((prev) => {
      if (!prev.has(chamadoId)) return prev
      const proximo = new Set(prev)
      proximo.delete(chamadoId)
      return proximo
    })
  }, [])

  const naoLidosEfetivos = tenant ? naoLidos : new Set<string>()

  return { naoLidos: naoLidosEfetivos, limparNaoLido }
}
