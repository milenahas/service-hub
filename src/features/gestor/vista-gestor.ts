import type { Usuario } from '../../dominio/tipos.ts'
import { primeiroNome } from './equipe-gestor.ts'
import type { ModoListaGestor } from './lista-chamados-gestor.ts'

/**
 * Descreve em qual tela o gestor está (equipe, consultor, lista ou conversa)
 * e de onde a conversa abriu, para o botão voltar acertar o destino.
 * Também monta o texto do voltar. Não guarda estado — isso fica em
 * `TelaGestor`; não desenha os painéis.
 */
export type OrigemConversaGestor =
  | { tipo: 'consultor'; consultorId: string }
  | { tipo: 'lista'; modo: ModoListaGestor }
  | { tipo: 'equipe' }

export type VistaGestor =
  | { vista: 'equipe' }
  | { vista: 'consultor'; consultorId: string }
  | { vista: 'lista'; modo: ModoListaGestor }
  | { vista: 'conversa'; chamadoId: string; origem: OrigemConversaGestor }

export function nomeAcessivelBotaoVoltar(texto: string): string {
  return `< ${texto}`
}

export function textoVoltarConversa(
  origem: OrigemConversaGestor,
  usuarios: Usuario[],
): string {
  if (origem.tipo === 'consultor') {
    const consultor = usuarios.find((u) => u.id === origem.consultorId)
    const nome = consultor ? primeiroNome(consultor.nome) : 'consultor'
    return `Voltar a ${nome}`
  }
  if (origem.tipo === 'lista') {
    return 'Voltar à lista'
  }
  return 'Voltar à equipe'
}

export function textoVoltarListaOuConsultor(): string {
  return 'Voltar à equipe'
}