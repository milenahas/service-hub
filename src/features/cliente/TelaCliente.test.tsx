import { act, render, screen, fireEvent, within } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TelaCliente } from './TelaCliente.tsx'
import { resetarStoreParaTestes, useStore } from '../../app/store.ts'
import { snapshotInicial } from '../../data/snapshot-inicial.ts'
import type { Chamado } from '../../dominio/snapshot.ts'

const leandro = snapshotInicial.usuarios.find(
  (usuario) => usuario.id === '7a853f14-c064-4dc4-bb24-8e8fdce4ccd4',
)!

function montar() {
  return render(
    <MemoryRouter>
      <TelaCliente />
    </MemoryRouter>,
  )
}

function prepararChamadoAberto() {
  const juliana = snapshotInicial.usuarios.find(
    (usuario) => usuario.nome === 'Juliana Pereira',
  )!
  const tenant = useStore.getState().tenant!
  const aberto: Chamado = {
    id: 'chamado-aberto-teste',
    numero: 20000,
    titulo: 'Chamado aberto de teste',
    descricao: 'Descrição do aberto',
    categoria_id: 'cat',
    grupo_id: 'grupo',
    prioridade: 'media',
    status: 'aberto',
    solicitante_id: leandro.id,
    responsavel_id: null,
    aberto_em: '2026-11-03T13:00:00Z',
    atualizado_em: '2026-11-03T13:00:00Z',
    prazo_primeira_resposta: '2026-11-03T21:00:00Z',
    prazo_resolucao: '2026-11-04T13:00:00Z',
    sla_pausado: false,
  }
  useStore.setState({
    tenant: { ...tenant, chamados: [aberto, ...tenant.chamados] },
  })
  return { juliana, aberto, agora: tenant.meta.agora }
}

describe('TelaCliente', () => {
  beforeEach(() => {
    resetarStoreParaTestes()
    useStore.getState().iniciarSessao(leandro)
  })

  afterEach(() => {
    resetarStoreParaTestes()
  })

  it('mostra o cliente, a lista e o formulário de novo chamado', () => {
    montar()
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(document.querySelector('.cabecalho-app__usuario')).toHaveTextContent(
      'Leandro Mendes',
    )
    expect(screen.getByRole('button', { name: '+ Novo chamado' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText('MEUS CHAMADOS')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Abrir chamado' })).toBeInTheDocument()

    const coluna = screen.getByRole('region', { name: 'MEUS CHAMADOS' })
    const cartoes = within(coluna).getAllByRole('button')
    expect(cartoes[1]).toHaveTextContent('Porta 443 bloqueada para fornecedor')
    expect(cartoes[1]).not.toHaveAttribute('aria-current')
    expect(cartoes[1]).toHaveTextContent('Resposta até 17:31')
    expect(
      screen.getByRole('button', { name: /VPN cai a cada 10 minutos/ }),
    ).toHaveTextContent('Aguardando você')
    expect(
      screen.getByRole('button', { name: /Erro ao fechar o mês/ }).textContent,
    ).not.toMatch(/Resposta/)

    fireEvent.click(cartoes[1]!)
    expect(cartoes[1]).toHaveAttribute('aria-current', 'true')
    expect(
      screen.getByRole('heading', { name: 'Porta 443 bloqueada para fornecedor' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Chamado #10387 · aberto em 03/11, 09:31'),
    ).toBeInTheDocument()
    expect(screen.getByText('03/11, 17:31')).toBeInTheDocument()
  })

  it('não mostra jargão interno', () => {
    montar()
    const texto = document.body.textContent ?? ''
    expect(texto).not.toMatch(/categoria/i)
    expect(texto).not.toMatch(/\bgrupo\b/i)
    expect(texto).not.toMatch(/infraestrutura/i)
    expect(texto).not.toMatch(/prioridade/i)
    expect(texto).not.toMatch(/\bsla\b/i)
    expect(texto).not.toMatch(/estourado/i)
    expect(texto).not.toMatch(/urgente/i)
    expect(texto).not.toMatch(/notas internas/i)
    expect(texto).not.toMatch(/pegar chamado/i)
    expect(texto).not.toMatch(/fila do grupo/i)
  })

  it('mostra a faixa do atendimento e esconde nota interna', () => {
    const tenant = useStore.getState().tenant!
    const chamado = tenant.chamados.find(
      (item) => item.titulo === 'Porta 443 bloqueada para fornecedor',
    )!
    useStore.setState({
      tenant: {
        ...tenant,
        mensagens: [
          ...tenant.mensagens,
          {
            id: 'nota-secreta',
            chamado_id: chamado.id,
            autor_id: 'consultor',
            corpo: 'Segredo interno do consultor',
            criado_em: '2026-11-03T12:00:00Z',
            interna: true,
          },
        ],
      },
    })
    montar()
    fireEvent.click(
      screen.getByRole('button', { name: /Porta 443 bloqueada para fornecedor/ }),
    )
    expect(
      screen.getByText('Juliana Pereira está cuidando do seu chamado.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Segredo interno do consultor')).not.toBeInTheDocument()
    expect(
      screen.getByText('Já está a funcionar, obrigada.').closest('.balao'),
    ).toHaveClass('balao--logado')
    expect(
      screen
        .getByText('Vou precisar reiniciar o serviço fora do horário comercial.')
        .closest('.balao'),
    ).toHaveClass('balao--cliente')
  })

  it('envia mensagem pública e esvazia a caixa', () => {
    montar()
    fireEvent.click(
      screen.getByRole('button', { name: /Porta 443 bloqueada para fornecedor/ }),
    )
    const enviar = screen.getByRole('button', { name: 'Enviar' })
    const campo = screen.getByLabelText('Mensagem')
    expect(enviar).toBeDisabled()
    fireEvent.change(campo, { target: { value: '   ' } })
    expect(enviar).toBeDisabled()
    fireEvent.change(campo, { target: { value: 'Pode verificar de novo?' } })
    fireEvent.click(enviar)
    expect(screen.getByText('Pode verificar de novo?')).toBeInTheDocument()
    expect(campo).toHaveValue('')
    expect(campo).toHaveFocus()
    const gravada = useStore
      .getState()
      .tenant!.mensagens.find((mensagem) => mensagem.corpo === 'Pode verificar de novo?')
    expect(gravada?.interna).toBe(false)
    expect(gravada?.autor_id).toBe(leandro.id)
  })

  it('descarta o texto não enviado ao trocar de chamado e ao abrir o formulário', () => {
    montar()
    fireEvent.click(
      screen.getByRole('button', { name: /Porta 443 bloqueada para fornecedor/ }),
    )
    fireEvent.change(screen.getByLabelText('Mensagem'), {
      target: { value: 'Ainda não enviei' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Erro ao fechar o mês/ }))
    fireEvent.click(
      screen.getByRole('button', { name: /Porta 443 bloqueada para fornecedor/ }),
    )
    expect(screen.getByLabelText('Mensagem')).toHaveValue('')
    fireEvent.change(screen.getByLabelText('Mensagem'), {
      target: { value: 'Também não' },
    })
    fireEvent.click(screen.getByRole('button', { name: '+ Novo chamado' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByLabelText('Mensagem')).toHaveValue('')
  })

  it('reabre chamado fechado com motivo', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: /Erro ao fechar o mês/ }))
    expect(
      screen.getByText('Este chamado foi fechado. O problema voltou?'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Recebemos seu chamado. Um consultor vai assumir em breve.'),
    ).not.toBeInTheDocument()
    expect(document.querySelector('.painel-chamado-cliente')).toHaveClass(
      'painel-chamado-cliente--fechado',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reabrir chamado' }))
    const confirmar = screen.getByRole('button', { name: 'Reabrir chamado' })
    expect(confirmar).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Motivo da reabertura'), {
      target: { value: 'O problema voltou no fechamento' },
    })
    expect(confirmar).toBeEnabled()
    fireEvent.click(confirmar)
    expect(
      screen.getByText('Recebemos seu chamado. Um consultor vai assumir em breve.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/O problema voltou no fechamento/)).toBeInTheDocument()
    expect(screen.getByText('Beatriz Lima')).toBeInTheDocument()
    expect(
      screen.queryByText('Este chamado foi fechado. O problema voltou?'),
    ).not.toBeInTheDocument()
  })

  it('abre um chamado novo e seleciona o título na lista', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: '+ Novo chamado' }))
    expect(screen.getByRole('heading', { name: 'Abrir chamado' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Conte o que aconteceu. Um consultor responderá dentro do prazo informado após a abertura.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Porta 443 bloqueada para fornecedor/ }),
    ).not.toHaveAttribute('aria-current')
    const enviar = screen.getByRole('button', { name: 'Enviar chamado' })
    expect(enviar).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Assunto'), {
      target: { value: 'Teclado falhou' },
    })
    expect(enviar).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Não digita' },
    })
    expect(enviar).toBeEnabled()
    fireEvent.click(enviar)
    expect(screen.getByRole('heading', { name: 'Teclado falhou' })).toBeInTheDocument()
    expect(screen.getByText('Não digita')).toBeInTheDocument()
    expect(screen.getByText('Aguardando um consultor pegar')).toBeInTheDocument()
    expect(
      screen.getByText('Recebemos seu chamado. Um consultor vai assumir em breve.'),
    ).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('Infraestrutura')
    const criado = useStore
      .getState()
      .tenant!.chamados.find((chamado) => chamado.titulo === 'Teclado falhou')
    expect(criado?.status).toBe('aberto')
    expect(criado?.prioridade).toBe('media')
    expect(criado?.responsavel_id).toBeNull()
  })

  it('cancelar a abertura volta ao detalhe anterior', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: /Erro ao fechar o mês/ }))
    fireEvent.click(screen.getByRole('button', { name: '+ Novo chamado' }))
    expect(screen.getByRole('button', { name: '+ Novo chamado' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('heading', { name: 'Erro ao fechar o mês' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Erro ao fechar o mês/ }),
    ).toHaveAttribute('aria-current', 'true')
  })

  it('cancelar a abertura inicial mostra o chamado mais recente', () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(
      screen.getByRole('heading', { name: 'Porta 443 bloqueada para fornecedor' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Porta 443 bloqueada para fornecedor/ }),
    ).toHaveAttribute('aria-current', 'true')
  })

  it('atualiza a faixa quando o chamado aberto é atribuído, sem perder o texto digitado', () => {
    const { juliana, aberto, agora } = prepararChamadoAberto()
    montar()
    fireEvent.click(screen.getByRole('button', { name: /Chamado aberto de teste/ }))
    const campo = screen.getByLabelText('Mensagem')
    fireEvent.change(campo, { target: { value: 'Texto pendente' } })
    act(() => {
      useStore.getState().aplicarEvento({
        id: 'evt-atribuicao-teste',
        tipo: 'chamado.atribuido' as const,
        ocorrido_em: agora,
        payload: { chamado_id: aberto.id, consultor_id: juliana.id },
      })
    })
    expect(
      screen.getByText('Juliana Pereira está cuidando do seu chamado.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Aguardando um consultor pegar')).not.toBeInTheDocument()
    expect(campo).toHaveValue('Texto pendente')
  })

  it('reaplicar o mesmo evento não duplica a linha do histórico', () => {
    const { juliana, aberto, agora } = prepararChamadoAberto()
    montar()
    fireEvent.click(screen.getByRole('button', { name: /Chamado aberto de teste/ }))
    const evento = {
      id: 'evt-atribuicao-duplicada',
      tipo: 'chamado.atribuido' as const,
      ocorrido_em: agora,
      payload: { chamado_id: aberto.id, consultor_id: juliana.id },
    }
    act(() => {
      useStore.getState().aplicarEvento(evento)
      useStore.getState().aplicarEvento(evento)
    })
    expect(screen.getAllByText('Chamado atribuído a Juliana Pereira')).toHaveLength(1)
  })

  it('mostra o vazio na lista e o formulário de abertura', () => {
    const tenant = useStore.getState().tenant!
    useStore.setState({ tenant: { ...tenant, chamados: [] } })
    montar()
    expect(screen.getByText('Você ainda não abriu chamados.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Abrir chamado' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getAllByText('Você ainda não abriu chamados.')).toHaveLength(2)
    expect(
      screen.getByRole('heading', { name: 'Você ainda não abriu chamados.' }),
    ).toBeInTheDocument()
  })
})
