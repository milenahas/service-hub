import { describe, expect, it } from 'vitest'
import { faixaEtapaCliente } from './faixa-etapa-cliente.ts'

describe('faixaEtapaCliente', () => {
  it('aberto pede um consultor', () => {
    expect(faixaEtapaCliente('aberto', null)).toEqual({
      tom: 'aberto',
      frase: 'Recebemos seu chamado. Um consultor vai assumir em breve.',
    })
  })

  it('em atendimento usa o nome do responsável', () => {
    expect(faixaEtapaCliente('em_atendimento', 'Juliana Pereira')).toEqual({
      tom: 'aberto',
      frase: 'Juliana Pereira está cuidando do seu chamado.',
    })
  })

  it('em atendimento sem responsável usa a frase genérica', () => {
    expect(faixaEtapaCliente('em_atendimento', null)).toEqual({
      tom: 'aberto',
      frase: 'Um consultor está cuidando do seu chamado.',
    })
  })

  it('aguardando cliente pede resposta', () => {
    expect(faixaEtapaCliente('aguardando_cliente', 'Juliana Pereira')).toEqual({
      tom: 'aguardando',
      frase: 'Precisamos de uma resposta sua para continuar.',
    })
  })

  it('resolvido confirma ou reabre', () => {
    expect(faixaEtapaCliente('resolvido', 'Juliana Pereira')).toEqual({
      tom: 'resolvido',
      frase: 'Resolvido. Confirme se está tudo certo ou reabra se precisar.',
    })
  })

  it('fechado não tem faixa', () => {
    expect(faixaEtapaCliente('fechado', 'Beatriz Lima')).toBeNull()
  })
})
