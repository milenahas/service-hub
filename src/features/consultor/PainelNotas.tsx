import { useState } from 'react'
import type { Mensagem } from '../../dominio/snapshot.ts'
import { notasInternasDoChamado } from '../chamados/regras/mensagens-chamado.ts'
import { ItemNotaInterna } from '../chamados/ItemNotaInterna.tsx'
import { Botao, CampoTextarea } from '../../shared/components/index.ts'

type PropsPainelNotas = {
  chamadoId: string
  mensagens: Mensagem[]
  aoFechar: () => void
  aoSalvarNota: (texto: string) => void
}

export function PainelNotas({
  chamadoId,
  mensagens,
  aoFechar,
  aoSalvarNota,
}: PropsPainelNotas) {
  const [texto, setTexto] = useState('')
  const notas = notasInternasDoChamado(mensagens, chamadoId)

  function salvar() {
    const corpo = texto.trim()
    if (!corpo) return
    aoSalvarNota(corpo)
    setTexto('')
  }

  return (
    <aside className="painel-notas" aria-label="Notas internas">
      <header className="painel-notas__cabecalho">
        <div>
          <h2 className="painel-notas__titulo">Notas internas</h2>
          <p className="painel-notas__subtitulo">
            Só a equipe vê. O cliente nunca.
          </p>
        </div>
        <Botao
          variante="fantasma"
          type="button"
          aria-label="Fechar notas"
          onClick={aoFechar}
        >
          ×
        </Botao>
      </header>
      <div className="painel-notas__lista">
        {notas.length === 0 && (
          <p className="painel-notas__vazio">Nenhuma nota ainda.</p>
        )}
        {notas.map((nota) => (
          <ItemNotaInterna key={nota.id} nota={nota} />
        ))}
      </div>
      <CampoTextarea
        id="nota-interna"
        rotulo="Anotar para os colegas"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Anotar para os colegas…"
        rows={4}
      />
      <Botao
        variante="secundario"
        bloco
        type="button"
        disabled={!texto.trim()}
        onClick={salvar}
      >
        Salvar nota
      </Botao>
    </aside>
  )
}