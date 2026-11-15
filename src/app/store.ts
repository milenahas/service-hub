import { create } from 'zustand'
import type { Usuario } from '../dominio/tipos.ts'

type EstadoStore = {
  usuarioLogado: Usuario | null
  iniciarSessao: (usuario: Usuario) => void
  sair: () => void
}

export const useStore = create<EstadoStore>((set) => ({
  usuarioLogado: null,
  iniciarSessao: (usuario) => {
    set({ usuarioLogado: usuario })
  },
  sair: () => {
    set({ usuarioLogado: null })
  },
}))