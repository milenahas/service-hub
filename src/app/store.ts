import { create } from 'zustand'
import { snapshotInicial } from '../data/snapshot-inicial.ts'
import { montarSessao } from '../dominio/montar-sessao.ts'
import type { TenantSessao } from '../dominio/snapshot.ts'
import type { Usuario } from '../dominio/tipos.ts'

type EstadoStore = {
  usuarioLogado: Usuario | null
  tenant: TenantSessao | null
  iniciarSessao: (usuario: Usuario) => void
  sair: () => void
}

export const useStore = create<EstadoStore>((set) => ({
  usuarioLogado: null,
  tenant: null,
  iniciarSessao: (usuario) => {
    const tenant = montarSessao(snapshotInicial, usuario)
    set({ usuarioLogado: usuario, tenant })
  },
  sair: () => {
    set({ usuarioLogado: null, tenant: null })
  },
}))