import { CAMINHOS, type CaminhoAplicacao } from './caminhos.ts'
import type { Perfil } from '../dominio/tipos.ts'

export function redirecionarPorPerfil(perfil: Perfil): CaminhoAplicacao {
  switch (perfil) {
    case 'cliente':
      return CAMINHOS.cliente
    case 'consultor':
      return CAMINHOS.consultor
    case 'gestor':
      return CAMINHOS.gestor
  }
}