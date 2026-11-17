import { useCallback, useEffect, useRef, useState } from 'react'
import type { TenantSessao } from '../../dominio/snapshot.ts'

type SnapshotLeitura = {
  idsChamados: Set<string>
  ultimaMensagemPorChamado: Map<string, string>
}

function extrairSnapshot(tenant: TenantSessao): SnapshotLeitura {
  const idsChamados = new Set(tenant.chamados.map((c) => c.id))
  const ultimaMensagemPorChamado = new Map<string, string>()
  for (const mensagem of tenant.mensagens) {
    if (mensagem.interna) continue
    ultimaMensagemPorChamado.set(mensagem.chamado_id, mensagem.id)
  }
  return { idsChamados, ultimaMensagemPorChamado }
}

/**
 * Guarda os chamados com ponto azul na fila: chamado novo ou mensagem
 * pública nova desde a entrada na tela. O chamado aberto não entra no
 * conjunto. A carga inicial não marca nada. Não desenha a bolinha —
 * isso fica em `ColunaFila.tsx`. Quem limpa ao selecionar é
 * `TelaConsultor.tsx`.
 */
export function useNaoLidos(
  tenant: TenantSessao | null,
  chamadoSelecionadoId: string | null,
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
      const novosChamados = [...atual.idsChamados].filter(
        (id) => !anterior.current!.idsChamados.has(id),
      )
      const novasMensagens: string[] = []
      for (const [chamadoId, msgId] of atual.ultimaMensagemPorChamado) {
        const antigo = anterior.current.ultimaMensagemPorChamado.get(chamadoId)
        if (antigo && antigo !== msgId) {
          novasMensagens.push(chamadoId)
        }
        if (!antigo && msgId) {
          novasMensagens.push(chamadoId)
        }
      }

      if (novosChamados.length > 0 || novasMensagens.length > 0) {
        setNaoLidos((prev) => {
          const proximo = new Set(prev)
          for (const id of novosChamados) {
            if (id !== chamadoSelecionadoId) proximo.add(id)
          }
          for (const id of novasMensagens) {
            if (id !== chamadoSelecionadoId) proximo.add(id)
          }
          return proximo
        })
      }
    }

    anterior.current = atual
  }, [tenant, chamadoSelecionadoId])

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