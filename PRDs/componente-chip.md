# PRD — Chip reutilizável

## 1. Metadados

| Campo | Valor |
| --- | --- |
| **Produto** | Service Hub — central de chamados de TI |
| **Feature** | Filtro em pílula: `Chip` + `GrupoChips` em `src/shared/components` |
| **Prioridade** | Alta — a rotina do gestor não desenha o filtro na mão |
| **Stack** | React 18+, TypeScript, Vite, CSS com tokens, Vitest + React Testing Library |
| **Fonte da verdade visual** | Prints do gestor (pílula azul ativa, pílula branca inativa) e `CONTEXTO-SERVICE-HUB.md` §9 (cor primária, borda de controle, foco) |
| **Fonte da verdade técnica** | `AGENTS.md` (§ Código) e [componentes-compartilhados.md](./componentes-compartilhados.md) §§3–5 |
| **Depende de** | [cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md) |
| **Desbloqueia** | [tela-gestor.md](./tela-gestor.md) — filtros da equipe e da tabela de chamados |
| **Conformidade** | WCAG 2.1 AA; [APG Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) no grupo |
| **Fora do escopo** | Selo de status/prazo, botão de ação, chip com ícone, com contagem, com “×” para remover, seleção múltipla, regra de chamado |

Os dois módulos nascem juntos. O produto só usa chip **dentro de um grupo em que um está escolhido**. `Chip` é a pílula. `GrupoChips` é o controle que a tela monta.

---

## 2. Objetivo

Entregar o filtro visual dos prints do gestor como peça compartilhada, sem CSS de pílula copiado em `features/gestor`.

1. A pílula ativa e a inativa coincidem com os prints `Gestor - Tela 1`, `Tela 2`, `Tela 4` e `Tela 5`.
2. O grupo é controlado: a tela guarda o valor; o componente não escolhe filtro de equipe nem de chamado.
3. Teclado e leitor de tela seguem o radio group (um selecionado, setas trocam a escolha).
4. `lint`, `test` e `build` verdes.

---

## 3. Onde aparece

| Tela | Grupo | Opções (rótulo visível) | Nome acessível do grupo |
| --- | --- | --- | --- |
| Equipe | um só ativo | Todos · Ociosos · Com risco | Filtrar equipe |
| Chamados do consultor, SLA e Sem responsável | um só ativo | Todos · Em risco · Aguardando cliente | Filtrar chamados |

O card **Ociosos agora** não é um chip. Ele só pede à tela para mudar o `value` do grupo da equipe para o valor de **Ociosos**.

---

## 4. Princípios (MUST)

| # | Regra |
| --- | --- |
| K1 | Presentacional. Sem store, sem `dominio/`, sem saber o que é “ocioso” ou “em risco”. |
| K2 | Um arquivo por assunto: `Chip.tsx`, `GrupoChips.tsx`, um CSS. |
| K3 | Estado no ancestral. `value` + `onChange`. O chip não guarda qual está ativo. |
| K4 | Props de produto em português (`rotulo`, `selecionado`, `opcoes`, `valor`). `value`, `onChange`, `disabled`, `type` e `aria-*` com o nome nativo. |
| K5 | Tokens. Hex só se o token ainda não existir — e aí o hex entra no arquivo de tokens, não no CSS do chip. |
| K6 | Sem variante extra (contorno colorido, fantasma, bloco). O produto tem dois estados: escolhido e não escolhido. |
| K7 | JSX opcional com `condição &&`. Testes sem `if`, `switch` ou ternário. |
| K8 | JSDoc curto, em português, acima do `export` de cada módulo: o que desenha e o que não decide. |

---

## 5. Visual (MUST)

Comparar com a fileira de pílulas à esquerda do título **Equipe** no print da Tela 1 e com a fileira sob **Chamados** nas Telas 2, 4 e 5.

| Parte | Escolhido | Não escolhido |
| --- | --- | --- |
| Fundo | `--cor-primaria` | `--cor-superficie` |
| Texto | branco | `--cor-texto-secundario` |
| Borda | a mesma cor do fundo (1px, para a largura não pular) | `--cor-borda-controle` |
| Hover | `--cor-botao-primario-hover` | `--cor-botao-secundario-hover` |
| Cursor | pointer | pointer |

Forma, igual nos dois estados:

| Propriedade | Valor |
| --- | --- |
| Altura | 32px |
| Raio | 999px (pílula) |
| Padding | `0 14px` |
| Texto | 13px / 500, sem uppercase |
| Sombra | nenhuma |
| Ícone | nenhum |

Grupo: `display: flex`, `flex-wrap: wrap`, `gap: 8px`, `align-items: center`. Sem fundo próprio.

Foco visível, igual ao botão: `:focus-visible` com `outline: 2px solid var(--cor-primaria)` e `outline-offset: 2px`. O estado escolhido não depende só da cor: `aria-checked` marca o ativo para tecnologia assistiva (WCAG 1.4.1).

Contraste do par branco / `--cor-primaria` é o mesmo do botão primário. Se esse token tiver sido ajustado para AA, o chip usa o token, não um azul novo.

---

## 6. Comportamento

### 6.1 Chip

Um `<button type="button">` com o texto em `children`.

| Prop | Papel |
| --- | --- |
| `selecionado` | `true` pinta o estado azul e reflete em `aria-checked` |
| `children` | Rótulo visível. É o nome acessível. Sem `aria-label` por cima desse texto |
| `onClick` | Nativo. Quem reage é o grupo |
| `disabled` | Nativo, se vier. O gestor não desabilita chip; o botão nativo já cobre o caso |

Não é link. Não submete formulário.

### 6.2 GrupoChips

Conjunto exclusivo. Sempre um valor escolhido — a tela não monta o grupo vazio nem com dois ativos.

```ts
type OpcaoChip = {
  valor: string
  rotulo: string
}

type PropsGrupoChips = {
  rotulo: string
  value: string
  onChange: (valor: string) => void
  opcoes: OpcaoChip[]
}
```

| Prop | Papel |
| --- | --- |
| `rotulo` | `aria-label` do grupo. Não aparece na tela (o título do cartão já está acima) |
| `value` | `valor` da opção ativa |
| `onChange` | Recebe o `valor` escolhido, não um evento de input |
| `opcoes` | Ordem de renderização e de seta |

DOM:

- Contêiner `role="radiogroup"` e `aria-label={rotulo}`.
- Cada opção é um `Chip` com `role="radio"` e `aria-checked={value === opcao.valor}`.
- Só o escolhido fica na ordem de tabulação (`tabIndex={0}`). Os outros ficam `tabIndex={-1}`.

Teclado, no padrão radio group:

| Tecla | Efeito |
| --- | --- |
| Tab | Entra no chip escolhido e sai do grupo. Não percorre os inativos |
| Seta para a direita ou para baixo | Próxima opção; na última, volta à primeira |
| Seta para a esquerda ou para cima | Opção anterior; na primeira, vai à última |
| Clique | Escolhe aquele chip |

A seta já muda o `value` (seleção segue o foco). Clicar de novo no chip já ativo não precisa disparar `onChange`.

`GrupoChips` não filtra lista. A tela, ao receber `onChange`, guarda o valor e recalcula a tabela nas funções puras do gestor.

---

## 7. Arquivos

```
src/shared/components/Chip/
  Chip.tsx
  Chip.css
  Chip.test.tsx
  GrupoChips.tsx
  GrupoChips.test.tsx
```

`src/shared/components/index.ts` exporta `Chip`, `GrupoChips` e os tipos `PropsChip`, `PropsGrupoChips`, `OpcaoChip`.

---

## 8. Testes (MUST)

`Chip.test.tsx`

1. Texto visível é o nome acessível do botão.
2. `selecionado` coloca `aria-checked="true"`. Sem a prop, `aria-checked="false"`.
3. `type` do botão é `button`.

`GrupoChips.test.tsx`

1. `radiogroup` com o `rotulo` acessível e três rádios na ordem recebida.
2. Só o `value` atual tem `aria-checked="true"`.
3. Clique na opção inativa chama `onChange` com o `valor` dela.
4. Seta para a direita a partir da primeira chama `onChange` com a segunda; a partir da última, com a primeira.
5. Tab: um único `tabIndex={0}`, no escolhido.

---

## 9. Critérios de aceite

1. [ ] Pílula dos prints: 32px, raio total, azul com texto branco quando escolhida, branca com borda quando não.
2. [ ] Grupo com `flex-wrap` e 8px de intervalo.
3. [ ] Sem regra de equipe, prazo ou status dentro de `shared/components/Chip`.
4. [ ] Radio group com um tab stop e setas que trocam a escolha.
5. [ ] Exportado em `shared/components/index.ts`.
6. [ ] `lint`, `test` e `build` verdes.

---

## 10. Decisões

| Tema | Decisão |
| --- | --- |
| Chip solto na tela do gestor | Não. A tela usa `GrupoChips`. |
| Vários selecionados | Fora. Os filtros do produto são exclusivos. |
| Contagem no rótulo (“Todos (12)”) | Fora. O print não mostra número dentro da pílula. |
| Selo no lugar do chip | Não. Selo é estático; chip escolhe filtro. |
| Botão `primario` estilizado como pílula | Não. Altura, raio e papel são outros. |
