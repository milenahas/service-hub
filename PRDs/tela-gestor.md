# PRD — Rotina do gestor (equipe, listas e conversa)

## 1. Metadados

| Campo | Valor |
| --- | --- |
| **Produto** | Service Hub — central de chamados de TI |
| **Feature** | Tela do gestor: dashboard da equipe, detalhe do consultor, listas de indicador e conversa com notas |
| **Prioridade** | Alta — terceira rotina do produto; demonstra ociosidade, SLA e redistribuição |
| **Stack** | React 18+, TypeScript, Vite, CSS com tokens, Zustand (já no projeto), Vitest + React Testing Library |
| **Fonte da verdade visual** | `service-hub-design-prototype/CONTEXTO-SERVICE-HUB.md` **§5** (cabeçalho), **§8** (fluxo gestor) e **§9** (visual); **prints obrigatórios** abaixo |
| **Fonte da verdade técnica** | `AGENTS.md` (§ Perfis, § Dados e domínio, § Código, linha da sessão) e [tela-login.md](./tela-login.md) §7.5.5 |
| **Depende de** | Login e `montarSessao` (tenant + `consultoresEquipeGestor`), [cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md), [componentes-compartilhados.md](./componentes-compartilhados.md) (**Botão**, **CampoTexto**, **CampoTextarea**, **CampoSelect**, **Selo**), [componente-chip.md](./componente-chip.md) (**GrupoChips**), `dominio/prazo.ts`, `features/chamados/ListaConversa.tsx` e `ItemNotaInterna.tsx` |
| **Rota** | `/gestor` (`CAMINHOS.gestor`) — guard `perfil === 'gestor'`. As três telas encadeadas são **vistas** dessa rota, não rotas novas |
| **Persona** | `gestor` → Ricardo Monteiro (`875d257a-0dff-4428-a233-5332d0e67b86`, `locale` pt-BR, `America/Sao_Paulo`) |
| **Conformidade a11y** | WCAG 2.1 AA; indicadores e “Conversa” são botões; selects com nome acessível; erro/vazio em texto no fluxo |
| **Fora do escopo** | API, WebSocket real, toasts, modais, ícones decorativos, persistência, rotinas cliente/consultor, coluna “carga”, estado “sobrecarregado”, indicador “Escalados pelo cliente”, marcador de não lido |

### Referência visual obrigatória (MUST)

Antes de implementar e antes de dar a feature por concluída, o agente implementador **deve abrir e comparar lado a lado** cada print com a vista correspondente. O protótipo HTML serve para comportamento e aparência. **Nomes, volumes e IDs do print não entram na tela** — Ricardo no cabeçalho é **Ricardo Monteiro**; contagens saem do tenant da sessão, não de “87” ou “Marina Costa”.

| Print | O que validar |
| --- | --- |
| `service-hub-design-prototype/prints/Gestor - Tela 1 - Dashboard inicial.png` | Saudação, linha de meta, três cards, cartão **Equipe** com chips à esquerda e ordenar + busca à direita, tabela sem coluna de carga |
| `service-hub-design-prototype/prints/Gestor - Tela 2 - Detalhe do consultor.png` | **← Voltar à equipe**, cabeçalho do consultor (avatar, situação · grupo, três números), chips **Todos · Em risco · Aguardando cliente**, tabela **Chamados ativos** |
| `service-hub-design-prototype/prints/Gestor - Tela 3 - Chat do consultor.png` | Voltar contextual, cabeçalho do chamado, **Redistribuir para**, conversa somente leitura + painel amarelo de notas |
| `service-hub-design-prototype/prints/Gestor - Tela 4 - SLA últimas 4h.png` | Lista “SLA nas próximas 4h”, subtítulo, mesmos chips de filtro, selos de prazo, select de responsável (inclusive “Sem responsável”) |
| `service-hub-design-prototype/prints/Gestor - Tela 5 - Sem responsável.png` | Lista “Sem responsável”, subtítulo de atribuição, mesmos chips, prazos em faixas diferentes (vermelho e âmbar) |

Hierarquia, alinhamento, raios, cores e microcopy abaixo são contrato. Dúvida entre texto deste PRD e detalhe fino de espaçamento: o print vence no pixel; regra de negócio do CONTEXTO e do `AGENTS.md` vence no dado.

---

## 2. Objetivo

Substituir `PlaceholderGestor` pela rotina do gestor: visão da **equipe da sessão**, três indicadores, lista de chamados de um consultor ou de um indicador, redistribuição por select e conversa **somente leitura** com notas internas.

Objetivos mensuráveis:

1. **Paridade visual** com os cinco prints (critério bloqueante por vista).
2. Equipe, contagens e nomes vêm de `tenant` + `consultoresEquipeGestor` — a tela **não** recorta de novo.
3. SLA usa `meta.agora`. Vencido ou `< 4h` aparece no card e na lista, com selo de `dominio/prazo.ts`.
4. Não existe coluna “Carga”, barra de carga, estado “Sobrecarregado” nem card “Escalados pelo cliente”.
5. Trocar o responsável emite `chamado.atribuido` pelo redutor já existente. A nota interna emite `mensagem.adicionada` com `interna: true`.
6. `npm run lint`, `npm run test` e `npm run build` verdes.

---

## 3. Papel no produto

| Regra | Detalhe |
| --- | --- |
| Quem entra na equipe | Só os ids em `tenant.consultoresEquipeGestor` (todos os consultores de Infraestrutura e Aplicações, já definidos no login) |
| Quais chamados | Os de `tenant.chamados` da sessão (todos os chamados desses grupos). Não reler `dados.json` na tela |
| Foco | Ociosidade, prazo nas próximas horas, redistribuição. Conversa é o terceiro passo, sobretudo para escalar |
| Relógio | `tenant.meta.agora`. Proibido `Date.now()` para prazo, saudação de data ou ociosidade |
| Mutação | Dados descem da store; a tela sobe evento. Sem caminho que altere chamado fora de `aplicarEvento` |
| Cabeçalho | Barra comum já em `CabecalhoApp`: selo **Gestor** (sem “ · grupo”), nome do snapshot, **Sair** |

---

## 4. Princípios de código (MUST — `AGENTS.md`)

| # | Regra |
| --- | --- |
| G1 | **Ordem:** funcionar → claro → rápido. Sem virtualização, cache ou worker. |
| G2 | **Props primeiro** nos painéis. Tenant mutável na store. Indicadores, linhas da equipe, filtro e ordenação são funções puras. |
| G3 | **Um módulo, um assunto.** Vista, cálculo de equipe e tabela de chamados não moram no mesmo arquivo da JSX. |
| G4 | **Tela do gestor** em `features/gestor`. Sem `if (perfil === 'consultor')` nesta rota. As três vistas são um estado local (`equipe` \| `consultor` \| `lista` \| `conversa`), não quatro apps. |
| G5 | **Sem componente que só repassa props.** Extrair painel quando ele desenha um bloco de verdade (cards, tabela, conversa). |
| G6 | **JSX:** bloco opcional com `condição && <elemento>`. Sem ternário cujo um ramo é `null`. Sem ternário dentro de `.map()`. `eslint.config.js` (`no-restricted-syntax`) vale aqui. |
| G7 | **Testes** (`*.test.*`): sem `if`, `switch` ou ternário — casos em tabelas e `expect` direto. |
| G8 | **Nomes** de pasta, função e prop de produto em português. Props de HTML/React (`value`, `onChange`, `disabled`, `aria-*`) com o nome nativo. |
| G9 | **JSDoc** em português logo acima do `export` principal de cada `Tela*.tsx`, painel e `.ts` de regra da feature. Papel do arquivo e o que fica no vizinho (`TelaGestor.tsx`, `equipe-gestor.ts`, `app/store.ts`). Sem repetir assinatura. Tom de referência: `TelaConsultor.tsx`, `ColunaFila.tsx`, `fila-consultor.ts`. |
| G10 | **Prazo num lugar só:** `chamadoAtivo`, `classificarFaixaPrazo`, `formatarTextoPrazoConsultor`. Não recalcular faixa na JSX. |
| G11 | **Conversa:** reutilizar `ListaConversa` (esconde `interna: true`). Notas no painel amarelo, nunca no mesmo campo da conversa. O gestor **não** responde ao cliente. |
| G12 | **Sem dependência nova.** Sem toast. Feedback por texto na própria tela e botão desabilitado. |
| G13 | **Filtro em pílula** é `GrupoChips` de [componente-chip.md](./componente-chip.md). A feature não recria a pílula com `Botao` nem com `<button>` solto. |

---

## 5. Dados que a tela consome

O login já monta a sessão (`dominio/montar-sessao.ts`, [tela-login.md](./tela-login.md) §7.5.5):

| Campo | Uso na UI |
| --- | --- |
| `consultoresEquipeGestor` | Linhas da tabela Equipe e opções de redistribuição |
| `chamados` | Indicadores, listas, detalhe |
| `mensagens`, `historico` | Conversa, notas, ociosidade |
| `usuarios`, `grupos`, `categorias` | Nomes, iniciais, “Infraestrutura” / “Aplicações”, categoria no cabeçalho da conversa |
| `meta.agora` | Data da saudação, prazo, ociosidade |

F5 ou **Sair** zera a store. A tela não persiste vista nem filtro.

Chamado **ativo** = status diferente de `resolvido` e de `fechado`.

**Em risco** (card “SLA em até 4h”, coluna “Em risco”, chip “Com risco” / “Em risco”) = ativo com `classificarFaixaPrazo` em `vencido`, `urgente` ou `alerta` (`restante < 4h`, vencido incluso). `aguardando_cliente` entra se o prazo cair nessa faixa.

**Ocioso** = consultor da equipe com zero chamados ativos em que `responsavel_id` é o id dele.

### 5.1 Ociosidade (“Ocioso/sem.” e “Ocioso na semana”)

Um único cálculo, duas legendas:

1. Instante = o mais recente entre `historico.ocorrido_em` com `usuario_id` do consultor e `atualizado_em` dos chamados com `responsavel_id` dele.
2. Sem instante → texto **—**.
3. Com instante → horas inteiras de `meta.agora − instante`, arredondadas para baixo: `0h`, `1h`, `3h`. Sem minutos e sem “sobrecarregado”.

Não inventar soma semanal. O rótulo “Ocioso na semana” é o do print; o valor é essa duração.

### 5.2 Ação nova na store

`pegarChamado` grava o **usuário logado** como responsável. No gestor isso atribuiria o chamado ao Ricardo. Não usar.

Acrescentar `atribuirChamado(chamadoId, consultorId)` em `app/store.ts`: emite `chamado.atribuido` com `consultor_id` escolhido e `ocorrido_em = meta.agora`. O redutor existente seta `responsavel_id`, promove `aberto` → `em_atendimento` e gera a mensagem de sistema. Nota continua em `salvarNotaInterna`.

### 5.3 Simulação ao vivo

Enquanto `TelaGestor` está montada, `iniciarSimulacaoGestor` dispara os mesmos ciclos da fila do consultor. Tudo entra por `aplicarEvento`. O timer para no unmount, no logout e numa sessão nova. A store guarda um controle só.

| Intervalo | Evento | Universo |
| --- | --- | --- |
| 7s | `chamado.aberto` sem responsável | Grupo sorteado entre os grupos dos consultores de `consultoresEquipeGestor` |
| 12s | `mensagem.adicionada` pública; autor = solicitante | Chamado ativo cujo responsável está na equipe |
| 14s | `status.alterado`; autor = responsável; motivo **Simulação da fila.**; só entre status ativos | O mesmo universo da mensagem |

O chamado da vista `conversa` fica fora da mensagem e do status. No dashboard, na lista e no detalhe do consultor o sorteio usa a equipe inteira. Chamado novo entra em qualquer vista. O carimbo é `meta.agora`.

A tela não desenha o timer e não ganha marcador de não lido. Contagens, listas e conversa acompanham porque leem o tenant. Mensagem e status gravam atividade em `meta.agora`, então a ociosidade daquele consultor vai a **0h**. Chamado novo aumenta ativos e **Sem responsável**. O card de SLA não cresce com esses chamados: o prazo de resolução sorteado fica em 4h ou mais, e risco é o que vence em menos de 4h.

Os disparos ficam em `dominio/simulacao-gestor.ts`. A tela publica o id da conversa; a store aplica o evento.

---

## 6. Navegação das três telas

Estado local em `TelaGestor` (não vai para a store):

| Vista | Como se abre | Voltar |
| --- | --- | --- |
| `equipe` | Login e botão voltar das listas/detalhe | — |
| `consultor` | **Ver chamados** | **← Voltar à equipe** |
| `lista` `sla-4h` | Card **SLA em até 4h** | **← Voltar à equipe** |
| `lista` `sem-responsavel` | Card **Sem responsável** | **← Voltar à equipe** |
| `conversa` | **Conversa** na tabela | Depende da origem (abaixo) |

O card **Ociosos agora** não troca de vista: fica na equipe e seleciona o chip **Ociosos**.

Origem da conversa, guardada junto da vista:

| Veio de | Rótulo do botão |
| --- | --- |
| Detalhe de um consultor | **← Voltar a {primeiro nome}** (print: “← Voltar a Marina”) |
| Lista SLA ou Sem responsável | **← Voltar à lista** |
| Equipe (se um dia abrir direto) | **← Voltar à equipe** |

Filtro, ordenação e busca da equipe permanecem ao ir ao detalhe e voltar. Trocar de vista de lista não apaga o chip da equipe.

Botão de voltar: **Botão** `secundario`, texto com seta `←` como no print (contorno, não link solto).

---

## 7. Layout e microcopy

Fundo `--cor-fundo-pagina`. Conteúdo `max-width: 1280px`, centralizado, padding horizontal ~24px, blocos em coluna com `gap: 24px`. A página **rola**. Cartões brancos, raio 16px, padding 20–24px. Título de tela 20–22px/700. Rótulos de coluna 11px/600, uppercase, `letter-spacing: 0.05em`, `--cor-texto-secundario`.

Por volta de **920px** a coluna **Ações** continua visível: primeira coluna `minmax(0, 1fr)` com ellipsis, filtros com `flex-wrap`. Não inventar menu.

### 7.1 Cabeçalho

`CabecalhoApp` hoje concatena `Gestor · {rótulo}`. No print e no CONTEXTO §5 o selo do gestor é só **Gestor**. Ajustar o cabeçalho para o perfil `gestor` não ganhar sufixo. Consultor continua **Consultor · {grupo}**.

### 7.2 Vista equipe (print Tela 1)

**Saudação**

- Título: **Bom dia, {primeiro nome}** — primeiro token de `usuario.nome` (“Ricardo”). Texto fixo “Bom dia”, como o CONTEXTO e o print.
- Linha meta, 13–14px, cor secundária: `{data} · {N} chamados ativos · {M} consultores`.
- Data: `Intl.DateTimeFormat` com `locale` e `zoneinfo` do gestor, weekday longo + dia + mês (`terça-feira, 3 de novembro` para o `meta.agora` atual em São Paulo). Separador ` · `.
- N = chamados ativos da sessão. M = `consultoresEquipeGestor.length`.
- Plural: `1 chamado ativo`, `1 consultor`; zero e 2+ no plural.

**Três cards** na mesma linha (`flex` / `grid`, `gap` ~16px, empilham se a largura não couber). Cada um é `<button type="button">`: cursor pointer, hover com leve escurecimento (`--cor-hover-linha` ou equivalente). **Sem** seta, ícone ou texto azul.

| Card | Número | Legenda (literal) | Cor do número | Borda |
| --- | --- | --- | --- | --- |
| **SLA em até 4h** | ativos em risco | Vencidos ou perto do prazo | `--cor-indicador-negativo` se > 0; senão texto principal | `#FCA5A5` (`--cor-erro-borda`) se > 0 |
| **Sem responsável** | ativos com `responsavel_id == null` | Na fila do grupo | vermelho se > 0 | `#FCA5A5` se > 0 (como no print) |
| **Ociosos agora** | consultores ociosos da equipe | Sem chamado atribuído | texto principal, mesmo se > 0 | nenhuma borda de alerta |

Rótulo do card ~13px secundário; número ~30px/700.

**Equipe (M)**

- Título com o tamanho da equipe da sessão (não o da busca).
- **Abaixo do título**, uma linha: `GrupoChips` à esquerda, à direita o select e a busca. Filtro nunca ao lado do título.
- Grupo com `rotulo="Filtrar equipe"` e opções, nesta ordem: **Todos** (`todos`) · **Ociosos** (`ociosos`) · **Com risco** (`com_risco`). Aparência e teclado: [componente-chip.md](./componente-chip.md). Default `todos`.
- **Com risco** = consultor com pelo menos um chamado em risco. O card **Ociosos agora** só faz `onChange('ociosos')` nesse grupo.
- Select (**CampoSelect**): opções com rótulo visível **Ordenar: ativos**, **Ordenar: risco**, **Ordenar: ociosidade**. Default **ativos**.
- Busca: placeholder **Buscar consultor** (nome, case-insensitive). Sem label visível extra — nome acessível “Buscar consultor” para não criar uma linha que o print não tem.
- Vazio: **Nenhum consultor com esses filtros.**

Ordenação (empate: nome `pt-BR`):

| Valor | Ordem |
| --- | --- |
| ativos | chamados ativos, decrescente |
| risco | em risco, decrescente |
| ociosidade | ociosos primeiro; entre eles, duração maior primeiro; depois os demais pela mesma duração |

**Tabela** — grid `minmax(0, 1.6fr) 140px 110px 90px 110px 130px`. Cabeçalhos: **Consultor** · **Situação** · **Chamados ativos** · **Em risco** · **Ocioso/sem.** · **Ações**.

| Coluna | Conteúdo |
| --- | --- |
| Consultor | Avatar circular ~36px (iniciais do primeiro e do último nome, fundo `--cor-selecao`, texto `--cor-primaria`) + nome 14px/600 |
| Situação | **Selo** `status-preenchido` **Em atendimento** se não ocioso; **Ocioso** com borda (fundo transparente, texto e borda secundários) se ocioso |
| Chamados ativos | inteiro |
| Em risco | inteiro em vermelho se > 0; senão **—** |
| Ocioso/sem. | duração §5.1 |
| Ações | **Botão** `secundario` **Ver chamados** |

Não desenhar barra, percentual nem “Sobrecarregado”.

### 7.3 Vista detalhe do consultor (print Tela 2)

Botão **← Voltar à equipe**.

Cartão:

- Avatar ~56px, mesmas iniciais.
- Nome 20px/700.
- Linha: **Em atendimento · {grupo}** ou **Ocioso · {grupo}** (nome em `tenant.grupos`).
- À direita, três números com rótulo pequeno acima: **Ativos** · **Em risco** (vermelho se > 0) · **Ocioso na semana** (§5.1).

Cartão seguinte, título **Chamados ativos (n)** — n é a quantidade **depois** do filtro. Abaixo do título, `GrupoChips` com `rotulo="Filtrar chamados"`: **Todos** (`todos`) · **Em risco** (`em_risco`) · **Aguardando cliente** (`aguardando_cliente`). Mesmo componente da equipe; a tela não duplica o CSS da pílula.

Base, antes do chip: ativos com `responsavel_id` = esse consultor. **Em risco** restringe à faixa §5. **Aguardando cliente** restringe a `status === 'aguardando_cliente'`.

### 7.4 Vista lista de indicador (prints Tela 4 e Tela 5)

Mesmo botão **← Voltar à equipe** e a mesma tabela de chamados. Muda o cabeçalho e a base.

| Modo | Título | Subtítulo (literal) | Base |
| --- | --- | --- | --- |
| SLA | **SLA nas próximas 4h** | Vencidos ou perto do prazo, por ordem de urgência. | ativos em risco da sessão |
| Sem responsável | **Sem responsável** | Ninguém pegou ainda. Atribua pelo seletor. | ativos com `responsavel_id == null` |

Título do cartão: **Chamados (n)** com n após o filtro. O mesmo `GrupoChips` de “Filtrar chamados” (§7.3). Ao abrir a lista, o valor volta para `todos`.

### 7.5 Tabela de chamados (detalhe e listas)

Colunas: **Chamado** · **Prazo** · **Status** · **Responsável** · **Ações**.

Ordenação única: `prazo_resolucao` crescente (mais atrasado primeiro).

| Coluna | Conteúdo |
| --- | --- |
| Chamado | Título 14px/600; abaixo `#{numero} · {nome do solicitante} · {prioridade}` em 12–13px secundário. Prioridade: baixa, média, alta, crítica |
| Prazo | **Selo** `prazo` com `formatarTextoPrazoConsultor` + faixa de `classificarFaixaPrazo` |
| Status | Texto puro `#334155` (`Aberto`, `Em atendimento`, …). Sem selo preenchido nesta coluna |
| Responsável | **CampoSelect**. Sem responsável: valor vazio, rótulo **Sem responsável**. Opções: consultores de `consultoresEquipeGestor`. Se o responsável atual não estiver na equipe, incluí-lo para o nome não sumir. Trocar dispara `atribuirChamado`. Label visível só no cabeçalho da coluna; no controle, nome acessível “Responsável do chamado {numero}” |
| Ações | **Conversa** em texto `--cor-primaria` (**Botão** `fantasma`), como no print |

Vazio: **Nenhum chamado aqui.**

### 7.6 Vista conversa (print Tela 3)

Botão de voltar §6.

**Cartão de cabeçalho**

- Título do chamado, 700 ~19–20px.
- Meta: `#{numero} · {cliente} · {categoria} · prioridade {rótulo} · aberto em {dd/mm, HH:MM} · {n} mensagens`.
- Data com `formatarDataHoraUsuario` (fuso do gestor).
- n = mensagens do chamado com `interna: false` (a thread pública). `1 mensagem` no singular.
- Selos na linha de baixo: prazo + **Selo** `status-borda`.
- À direita: **CampoSelect** com label **Redistribuir para**, valor = responsável atual, mesmas opções §7.5. Trocar chama `atribuirChamado`.

**Duas colunas** (`minmax(260px, 1fr)` e `minmax(280px, 0.8fr)`; empilham abaixo de ~920px).

Coluna esquerda — rótulo uppercase 11px: **CONVERSA COM O CLIENTE · SOMENTE LEITURA**.

- `ListaConversa` sem notas internas.
- Cliente: balão cinza à esquerda (`cliente`).
- Consultor: azul-claro à direita (`colega` — o logado é o gestor, então `tipoVisualBalao` já não pinta o consultor como balão azul do usuário).
- Sistema: centralizado, itálico.
- Sem textarea de resposta ao cliente.

Coluna direita — painel sempre aberto (não fica atrás de botão):

| Item | Texto |
| --- | --- |
| Fundo / borda | `--nota-painel-fundo` / `--nota-painel-borda` |
| Título | **Notas internas** |
| Subtítulo | **A equipe vê. O cliente não.** |
| Lista | `ItemNotaInterna` das `interna: true`, ou **Nenhuma nota ainda.** |
| Campo | **CampoTextarea** placeholder **Orientar a equipe...** |
| Botão | **Salvar nota interna** — secundário, largura total, `disabled` com texto vazio |

Salvar chama `salvarNotaInterna` e limpa o campo. Autor = gestor logado.

---

## 8. O que não entra na interface

- Coluna ou barra “Carga”.
- Estado, selo ou ordenação “Sobrecarregado”.
- Cards “Escalados pelo cliente” ou qualquer quarto indicador.
- Checkbox “nota interna” na conversa.
- Resposta pública do gestor ao cliente.
- Toast, modal, ícone decorativo.
- Marcador de não lido. A simulação ao vivo (§5.3) não desenha timer na tela; contagens, listas e conversa só refletem o tenant.

---

## 9. Arquivos sugeridos

```
src/features/gestor/
  TelaGestor.tsx                 # vista, filtros da equipe, origem do voltar
  TelaGestor.css
  TelaGestor.test.tsx
  PainelIndicadores.tsx
  PainelEquipe.tsx
  TabelaChamadosGestor.tsx
  PainelConversaGestor.tsx
  vista-gestor.ts                # tipo da vista e rótulo do voltar — não desenha
  indicadores-gestor.ts
  equipe-gestor.ts               # linha, filtro, ordenação, ociosidade
  lista-chamados-gestor.ts       # base SLA / sem responsável / consultor + chips
  indicadores-gestor.test.ts
  equipe-gestor.test.ts
  lista-chamados-gestor.test.ts
```

`app/Rotas.tsx` passa a montar `TelaGestor` no lugar de `PlaceholderGestor`. `app/store.ts` ganha `atribuirChamado`, `iniciarSimulacaoGestor` e `pararSimulacaoGestor`. Cabeçalho: selo **Gestor** sem sufixo.

```
src/dominio/simulacao-gestor.ts       # ciclos da equipe; não desenha
src/dominio/simulacao-gestor.test.ts
```

Não duplicar `ListaConversa`, selo de prazo, redutor de evento nem a pílula de filtro. O filtro é `GrupoChips` (`src/shared/components/Chip/`), especificado em [componente-chip.md](./componente-chip.md). Esta feature passa `opcoes`, `value` e `onChange`; não desenha chip.

---

## 10. Testes (MUST)

Funções puras, com `meta.agora` fixo:

| Caso | Esperado |
| --- | --- |
| Ativo com prazo vencido ou `< 4h` | entra no card SLA e na lista `sla-4h` |
| Ativo sem `responsavel_id` | entra no card e na lista Sem responsável |
| Consultor com 0 ativos | ocioso; chip Ociosos o inclui; situação “Ocioso” |
| Consultor com ativo em risco | coluna Em risco > 0; chip Com risco o inclui |
| Ordenar por ativos | maior quantidade primeiro |
| Histórico ausente | ociosidade **—** |
| `interna: true` | fora da contagem “n mensagens” e fora da thread pública |
| Primeiro nome | “Ricardo Monteiro” → “Ricardo” |
| Chamado novo da simulação | sem responsável; grupo é um dos grupos da equipe |
| Mensagem e status simulados | só chamado ativo com responsável na equipe; o chamado da conversa fica de fora |
| `parar()` | novos disparos não entram |

RTL da tela (tenant mínimo na store):

1. Renderiza **Bom dia, Ricardo**, três cards e os cabeçalhos de coluna — e não renderiza “Carga” nem “Sobrecarregado”.
2. Card SLA abre o título **SLA nas próximas 4h** e o subtítulo literal.
3. Card Sem responsável abre o subtítulo **Ninguém pegou ainda. Atribua pelo seletor.**
4. Card Ociosos deixa o chip **Ociosos** ativo e some com quem tem chamado ativo.
5. **Ver chamados** mostra o nome daquele consultor e **← Voltar à equipe**.
6. **Conversa** a partir do detalhe mostra **← Voltar a {primeiro nome}**; a partir da lista, **← Voltar à lista**.
7. Trocar o select chama `atribuirChamado` com o id do consultor escolhido, não com o id do gestor.
8. **Salvar nota interna** não chama envio público; com textarea vazia o botão fica `disabled`.
9. Busca “zzz” mostra **Nenhum consultor com esses filtros.** Lista vazia mostra **Nenhum chamado aqui.**

---

## 11. Critérios de aceite

### Visual

1. [ ] Os cinco prints foram comparados com as vistas correspondentes.
2. [ ] Dashboard: saudação, três cards, equipe com `GrupoChips` **abaixo** do título, ordenar à direita, busca “Buscar consultor”.
3. [ ] Selo do cabeçalho é **Gestor**. Nome é o do snapshot.
4. [ ] Conversa: duas colunas, thread só leitura, painel amarelo, select **Redistribuir para**.

### Funcional

5. [ ] Equipe = `consultoresEquipeGestor`. Chamados = tenant da sessão. Relógio = `meta.agora`.
6. [ ] SLA em até 4h e Sem responsável abrem lista; Ociosos agora só filtra a tabela.
7. [ ] Select de responsável e **Redistribuir para** emitem `chamado.atribuido` para o consultor escolhido.
8. [ ] Nota interna não aparece na coluna “somente leitura”.
9. [ ] Não há carga, sobrecarregado nem card extra.
10. [ ] Com a tela aberta, os ciclos de §5.3 entram na store e a UI acompanha sem recarregar. Sair da tela para os disparos.

### Código

11. [ ] `PlaceholderGestor` saiu da rota.
12. [ ] Cálculos em `.ts` puro; JSX sem regra de prazo copiada. Filtros via `GrupoChips`, sem pílula local.
13. [ ] JSDoc nos módulos da feature. Lint de sintaxe (`&&`, sem ternário no `.map()`, testes sem `if`).
14. [ ] `lint`, `test` e `build` verdes.

---

## 12. Ordem sugerida

1. `Chip` e `GrupoChips` conforme [componente-chip.md](./componente-chip.md), se ainda não existirem.
2. Funções puras + testes (indicadores, equipe, listas, rótulo do voltar).
3. `atribuirChamado` na store.
4. Vista equipe (cards + tabela) no lugar do placeholder.
5. Listas e detalhe do consultor, reutilizando a tabela e o mesmo grupo de chips.
6. Conversa com `ListaConversa` + notas.
7. Ajuste do selo **Gestor** e passagem visual contra os prints.

---

## 13. Riscos e decisões

| Tema | Decisão |
| --- | --- |
| Números do print (87, 12, Marina Costa) | Aparência só. Dado é a sessão. |
| “Bom dia” com `meta.agora` à tarde | Copy fixa do CONTEXTO §8. Não criar “Boa tarde”. |
| Card Ociosos | Filtra a equipe. Não abre quarta lista. |
| Borda vermelha | SLA e Sem responsável quando o número é > 0. Ociosos sem borda de alerta. |
| `pegarChamado` | Não serve para o gestor. Ação nova com `consultorId`. |
| Responsável fora da equipe | Se o responsável atual não estiver em `consultoresEquipeGestor`, o select mostra esse nome e, além dele, a equipe da sessão. |
| “Ocioso na semana” | Rótulo do print; valor = horas desde a última atividade, ou **—**. |
| Rotas aninhadas | Não. Uma rota e vista local: F5 já desloga. |
| Simulação ao vivo | Três ciclos na equipe, §5.3. A tela só reflete o tenant. |
| Pílula de filtro | `GrupoChips` de [componente-chip.md](./componente-chip.md). Um valor por grupo. A feature não estiliza chip. |
