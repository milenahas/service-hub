import { create } from 'zustand'
import { snapshotInicial } from '../data/snapshot-inicial.ts'
import { aplicarEvento as aplicarEventoDominio } from '../dominio/aplicar-evento.ts'
import type { Evento } from '../dominio/evento.ts'
import { criarIdEvento } from '../dominio/evento.ts'
import { montarSessao } from '../dominio/montar-sessao.ts'
import type { Mensagem, TenantSessao } from '../dominio/snapshot.ts'
import {
  iniciarSimulacaoConsultor,
  type ControleSimulacao,
} from '../dominio/simulacao-consultor.ts'
import type { StatusChamado } from '../dominio/chamado.ts'
import type { Usuario } from '../dominio/tipos.ts'

type EstadoStore = {
  usuarioLogado: Usuario | null
  tenant: TenantSessao | null
  eventosAplicados: Set<string>
  iniciarSessao: (usuario: Usuario) => void
  sair: () => void
  aplicarEvento: (evento: Evento) => void
  pegarChamado: (chamadoId: string) => void
  enviarMensagemCliente: (chamadoId: string, corpo: string) => void
  salvarNotaInterna: (chamadoId: string, corpo: string) => void
  alterarStatus: (
    chamadoId: string,
    de: StatusChamado,
    para: StatusChamado,
    motivo: string,
  ) => void
  iniciarSimulacaoConsultor: () => void
  pararSimulacaoConsultor: () => void
}

let controleSimulacao: ControleSimulacao | null = null

function pararSimulacaoInterna() {
  controleSimulacao?.parar()
  controleSimulacao = null
}

function agoraDoTenant(tenant: TenantSessao): string {
  return tenant.meta.agora
}

export const useStore = create<EstadoStore>((set, get) => ({
  usuarioLogado: null,
  tenant: null,
  eventosAplicados: new Set<string>(),

  iniciarSessao: (usuario) => {
    pararSimulacaoInterna()
    const tenant = montarSessao(snapshotInicial, usuario)
    set({
      usuarioLogado: usuario,
      tenant,
      eventosAplicados: new Set<string>(),
    })
  },

  sair: () => {
    pararSimulacaoInterna()
    set({
      usuarioLogado: null,
      tenant: null,
      eventosAplicados: new Set<string>(),
    })
  },

  aplicarEvento: (evento) => {
    const { tenant, eventosAplicados } = get()
    if (!tenant) return
    const eventos = new Set(eventosAplicados)
    const atualizado = aplicarEventoDominio(tenant, evento, eventos)
    set({ tenant: atualizado, eventosAplicados: eventos })
  },

  pegarChamado: (chamadoId) => {
    const { usuarioLogado, tenant, aplicarEvento: aplicar } = get()
    if (!usuarioLogado || !tenant) return
    aplicar({
      id: criarIdEvento(),
      tipo: 'chamado.atribuido',
      ocorrido_em: agoraDoTenant(tenant),
      payload: { chamado_id: chamadoId, consultor_id: usuarioLogado.id },
    })
  },

  enviarMensagemCliente: (chamadoId, corpo) => {
    const texto = corpo.trim()
    if (!texto) return
    const { usuarioLogado, tenant, aplicarEvento: aplicar } = get()
    if (!usuarioLogado || !tenant) return
    const mensagem: Mensagem = {
      id: criarIdEvento(),
      chamado_id: chamadoId,
      autor_id: usuarioLogado.id,
      corpo: texto,
      criado_em: agoraDoTenant(tenant),
      interna: false,
    }
    aplicar({
      id: criarIdEvento(),
      tipo: 'mensagem.adicionada',
      ocorrido_em: agoraDoTenant(tenant),
      payload: mensagem,
    })
  },

  salvarNotaInterna: (chamadoId, corpo) => {
    const texto = corpo.trim()
    if (!texto) return
    const { usuarioLogado, tenant, aplicarEvento: aplicar } = get()
    if (!usuarioLogado || !tenant) return
    const mensagem: Mensagem = {
      id: criarIdEvento(),
      chamado_id: chamadoId,
      autor_id: usuarioLogado.id,
      corpo: texto,
      criado_em: agoraDoTenant(tenant),
      interna: true,
    }
    aplicar({
      id: criarIdEvento(),
      tipo: 'mensagem.adicionada',
      ocorrido_em: agoraDoTenant(tenant),
      payload: mensagem,
    })
  },

  alterarStatus: (chamadoId, de, para, motivo) => {
    const texto = motivo.trim()
    if (!texto) return
    const { usuarioLogado, tenant, aplicarEvento: aplicar } = get()
    if (!usuarioLogado || !tenant) return
    aplicar({
      id: criarIdEvento(),
      tipo: 'status.alterado',
      ocorrido_em: agoraDoTenant(tenant),
      payload: {
        chamado_id: chamadoId,
        de,
        para,
        motivo: texto,
        usuario_id: usuarioLogado.id,
      },
    })
  },

  iniciarSimulacaoConsultor: () => {
    const { usuarioLogado, aplicarEvento: aplicar } = get()
    if (!usuarioLogado || usuarioLogado.perfil !== 'consultor') return
    const modoDemonstracao = import.meta.env.DEV
    controleSimulacao = iniciarSimulacaoConsultor(
      usuarioLogado,
      () => get().tenant,
      (evento) => aplicar(evento),
      { modoDemonstracao },
    )
  },

  pararSimulacaoConsultor: () => {
    pararSimulacaoInterna()
  },
}))

/** Reset da store entre testes. */
export function resetarStoreParaTestes() {
  pararSimulacaoInterna()
  useStore.setState({
    usuarioLogado: null,
    tenant: null,
    eventosAplicados: new Set<string>(),
  })
}