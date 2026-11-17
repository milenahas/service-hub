# PRD — Fundação visual global (cores e tipografia)

## 1. Metadados

| Campo | Valor |
| --- | --- |
| **Produto** | Service Hub — central de chamados de TI |
| **Feature** | Design tokens globais: paleta semântica + escala tipográfica |
| **Prioridade** | Bloqueante — toda tela e componente compartilhado depende disto |
| **Stack** | React, TypeScript, Vite (sem nova dependência só para fonte; carregar DM Sans via Google Fonts no HTML ou CSS) |
| **Fonte da verdade visual** | `service-hub-design-prototype/CONTEXTO-SERVICE-HUB.md` §9 (+ usos pontuais nas §§4–8) |
| **Fonte da verdade técnica** | `AGENTS.md` |
| **Fora do escopo deste PRD** | Componentes Botão/Campo/Selo/Conversa, layouts por perfil, lógica de domínio |

## 2. Objetivo

Estabelecer um único sistema de **variáveis CSS** (e convenções de uso) para cores e tipografia em toda a aplicação, de forma que:

1. Qualquer feature ou componente consuma **tokens semânticos**, não hex soltos no JSX.
2. A aparência seja **idêntica em espírito** ao protótipo (`prints/`, HTML de referência), com valores **fixos** definidos no CONTEXTO.
3. O tema seja **apenas claro**; não há spec de dark mode no produto.
4. Agentes downstream (login, cabeçalho, filas, etc.) referenciem este PRD em vez de reinterpretar cores.

## 3. Princípios (MUST)

1. **Semântica antes de literal** — preferir `--cor-texto-principal` a `#0F172A` nos arquivos de feature; o hex vive só na definição do token.
2. **Um lugar para tokens** — todas as definições `:root` do design system ficam em módulo(s) dedicados importados uma vez na raiz da app (ex.: `main.tsx` → `index.css` → tokens).
3. **Substituir o scaffold Vite** — remover ou isolar estilos do template (`--accent` roxo, `prefers-color-scheme: dark`, tipografia 18px system-ui, `#root` centralizado 1126px) que conflitam com o produto.
4. **Sem toasts nem tema escuro** — alinhado ao CONTEXTO.
5. **Nomes em português** nos identificadores de token e pastas, consistente com `AGENTS.md` (ex.: `shared/estilos/`, não `theme/` genérico em inglês, salvo convenção já existente no repo).
6. **Acessibilidade mínima** — pares fundo/texto definidos no CONTEXTO são obrigatórios; não “clarear” alertas ou status sem atualizar este PRD.

## 4. Entregáveis esperados (para o agente implementador)

| # | Entregável | Descrição |
| --- | --- | --- |
| E1 | Arquivo de **tokens de cor** | Variáveis CSS com paleta completa abaixo |
| E2 | Arquivo de **tokens tipográficos** | Família, pesos, escala, letter-spacing |
| E3 | **Reset / base global** | `body` fundo página, cor texto padrão, `font-family`, antialiasing; `#root` full viewport, sem max-width de demo |
| E4 | **Carregamento DM Sans** | Google Fonts: pesos 400, 500, 600, 700 |
| E5 | **Documentação mínima inline** | Comentários no CSS agrupando tokens (núcleo, status, prazo, notas, conversa) |
| E6 | **Teste smoke opcional** | Se houver teste de estilo, apenas checar que tokens existem ou snapshot de classe utilitária — não obrigatório se `AGENTS` não pedir |

*Não* é obrigatório neste PRD: exportar tokens para TS, Tailwind, ou Storybook.

## 5. Paleta de cores

### 5.1 Núcleo da interface (MUST)

Valores **exatos** do CONTEXTO §9 e usos transversais:

| Token sugerido | Hex | Uso principal |
| --- | --- | --- |
| `--cor-primaria` | `#1582F9` | Botões primários, aba ativa, sublinhado de aba (2px), seleção de item, links, balão do usuário logado (cliente/consultor), texto em botão primário sobre fundo azul = branco |
| `--cor-fundo-pagina` | `#F1F5F9` | Fundo da aplicação atrás dos cartões |
| `--cor-superficie` | `#FFFFFF` | Cartões, cabeçalho, painéis principais |
| `--cor-superficie-secundaria` | `#F1F5F9` | Blocos informativos (ex.: Responsável / Resposta prevista), hover de lista, disabled de controles |
| `--cor-superficie-muda` | `#F8FAFC` | Hover de linha; painel cliente **fechado** (fundo) |
| `--cor-texto-principal` | `#0F172A` | Títulos e corpo principal |
| `--cor-texto-secundario` | `#334155` | Meta, subtítulos, labels de campo, cabeçalhos de grupo na fila, status textual gestor |
| `--cor-texto-terciario` | `#94A3B8` | Placeholders, bordas tratadas como “muted”, texto disabled |
| `--cor-borda` | `#E2E8F0` | Divisores, borda inferior do cabeçalho, bordas suaves de painel fechado |
| `--cor-borda-controle` | `#94A3B8` | Bordas de input, select, botão secundário |
| `--cor-selecao` | `#E8F2FF` | Item selecionado em listas (cliente, consultor) |
| `--cor-hover-linha` | `#F8FAFC` | Hover em itens de lista |
| `--cor-botao-primario-hover` | `#1275ED` | Fundo e borda do botão primário no hover (azul levemente mais escuro que `--cor-primaria`; links mantêm `#0B4FA8`) |
| `--cor-botao-secundario-hover` | `#F8FAFC` (`var(--cor-hover-linha)`) | Fundo do botão secundário no hover |
| `--cor-botao-fantasma-hover` | `#E8F2FF` (`var(--cor-selecao)`) | Fundo do botão fantasma no hover |

**Login (§4):** cartão `--cor-superficie`, raio e sombra definidos em PRD de layout; logo “S” em quadrado com fundo `--cor-primaria`.

### 5.2 Status do chamado (MUST)

Pares **fundo / texto** para selos e faixas de etapa (cliente). Chaves de domínio → tokens:

| Status (`dominio`) | Fundo | Texto | Token fundo sugerido | Token texto sugerido |
| --- | --- | --- | --- | --- |
| `aberto`, `em_atendimento` | `#E8F2FF` | `#0B4FA8` | `--status-aberto-fundo` (compartilhado com em_atendimento) | `--status-aberto-texto` |
| `aguardando_cliente` | `#FEF3C7` | `#92400E` | `--status-aguardando-fundo` | `--status-aguardando-texto` |
| `resolvido` | `#DCFCE7` | `#166534` | `--status-resolvido-fundo` | `--status-resolvido-texto` |
| `fechado` | `#F1F5F9` | `#334155` | `--status-fechado-fundo` | `--status-fechado-texto` |

**Variante de apresentação (fora deste arquivo, mas cores aqui):**

- Cliente: selo **preenchido** (fundo + texto acima).
- Consultor/gestor: selo **com borda** — fundo transparente, borda e texto na cor do texto do par (mesmos hex de “texto” da tabela).

**Faixa de etapa (cliente):** reutilizar pares de status; âmbar/verde/azul conforme §6 — sem cores novas além dos tokens de status e primária.

### 5.3 Prazo / SLA (consultor e gestor) (MUST)

| Situação (regra com `meta.agora`) | Fundo (selo) | Texto (selo) | Notas |
| --- | --- | --- | --- |
| Estourado (`restante < 0`) | `#FEE4E2` | `#B42318` | Tokens `--prazo-estourado-fundo`; texto do selo compartilha `--prazo-urgente-texto`. Cabeçalho de grupo “URGENTES…” mantém texto `#B91C1C` (`--prazo-cabecalho-urgente-texto` / legado `--prazo-cabecalho-urgente-fundo` `#B91C1C` onde ainda houver fundo sólido). |
| Vence em &lt; 1h | `#FEE4E2` | `#B42318` | Mesmo par visual que estourado: `--prazo-urgente-fundo` (= `--prazo-estourado-fundo`) e `--prazo-urgente-texto`. |
| Vence em 1h–4h | `#FEF3C7` | `#92400E` | Cabeçalho “PRÓXIMAS 4 HORAS” texto âmbar `#92400E` |
| ≥ 4h | `#F1F5F9` | `#334155` | Cabeçalho “DEMAIS, POR PRAZO” texto `#334155` |
| Concluído | — | — | Usar selo de status, não paleta de prazo |

**Token de texto legado (branco):** `--prazo-estourado-texto` permanece `#FFFFFF` no `:root` para usos que ainda exijam par sólido; selos estourado e urgente usam `--prazo-urgente-texto` (`#B42318`) no **Selo**.

**Faixa vertical na fila (3px):** urgente/estourado → `#D92D20` (`--prazo-faixa-urgente`); âmbar (&lt; 4h) → `--prazo-faixa-alerta`; demais → `--prazo-faixa-neutro` (`#334155` conforme §7).

### 5.4 Alertas, erros e destaques (MUST)

| Token sugerido | Hex | Uso |
| --- | --- | --- |
| `--cor-erro` | `#B91C1C` | Erro inline de login; mensagens de validação |
| `--cor-erro-borda` | `#FCA5A5` | Borda de card gestor “SLA em até 4h” quando contagem &gt; 0 |
| `--cor-indicador-negativo` | `#B91C1C` ou `#DC2626` | Números vermelhos em indicadores (CONTEXTO: número vermelho se &gt; 0) |

**Marcador não lido:** ponto `#1582F9` (7px) — reutilizar `--cor-primaria`.

**“Sem responsável” / destaque azul na fila:** texto `--cor-primaria`.

### 5.5 Notas internas (MUST)

| Token sugerido | Hex | Uso |
| --- | --- | --- |
| `--nota-painel-fundo` | `#FEFCE8` | Cartão painel de notas |
| `--nota-painel-borda` | `#FDE68A` | Borda do painel |
| `--nota-balao-fundo` | `#FEF9C3` | Balão de anotação |
| `--nota-balao-borda` | `#94A3B8` | Borda tracejada do balão |

### 5.6 Conversa — cores por papel (MUST)

Tokens separados da “primária” quando o CONTEXTO especifica outro tom:

| Papel | Fundo | Borda | Texto |
| --- | --- | --- | --- |
| Cliente (consultor/gestor: balão à esquerda) | `#F1F5F9` | — | padrão `--cor-texto-principal` |
| Consultor logado / cliente no próprio painel | `#1582F9` | — | `#FFFFFF` |
| Outro consultor (lado suporte) | `#E0F2FE` | `#BAE6FD` | `#0C4A6E` |
| Mensagem sistema | transparente | — | itálico, cor secundária |

Cliente na visão cliente: mensagens do cliente à direita em azul primário; suporte à esquerda em cinza (`--cor-superficie-secundaria` ou equivalente).

### 5.7 Cores fixas auxiliares (referência para PRDs de layout)

Não são “marca”, mas fazem parte do sistema global:

| Uso | Valor |
| --- | --- |
| Sombra suave login | Definir em PRD de login; sugerir sombra neutra derivada de `#0F172A` com baixa opacidade (protótipo: “sombra suave”) |
| Avatar / iniciais | Sem cor fixa no CONTEXTO — usar `--cor-superficie-secundaria` + `--cor-texto-secundario` até PRD de componente |
| Aba ativa (gestor/consultor) | Texto padrão + sublinhado 2px `--cor-primaria` |

## 6. Tipografia

### 6.1 Família e pesos (MUST)

| Item | Especificação |
| --- | --- |
| Família | **DM Sans**, fallback: `system-ui, -apple-system, 'Segoe UI', sans-serif` |
| Origem | Google Fonts |
| Pesos carregados | **400** (regular), **500** (medium), **600** (semibold), **700** (bold) |
| `font-synthesis` | `none` (não simular bold) |
| Renderização | `text-rendering: optimizeLegibility`; antialiasing webkit/moz no `body` |

Token: `--fonte-principal: 'DM Sans', system-ui, …`.

### 6.2 Escala tipográfica (MUST)

Mapear papéis do CONTEXTO para tokens reutilizáveis:

| Papel | Tamanho | Peso | Outros | Token sugerido |
| --- | --- | --- | --- | --- |
| Título de tela | 20–22px | 700 | — | `--texto-titulo-tela` (default 20px; 22px onde o layout de gestor/dashboard pedir) |
| Título de cartão / seção | 17–19px | 700 | Consultor detalhe: 19px explícito | `--texto-titulo-cartao` |
| Número destaque (indicadores gestor) | 30px | 700 ou 600 | — | `--texto-numero-indicador` |
| Corpo / botões / inputs | 14px | 400 (corpo), **600** (rótulo de botão) | Botão: 14px/600 no PRD de Botão | `--texto-corpo`, `--texto-botao` |
| Meta / abas / resumo fila | 12–13px | 400; aba pode 500 | Aba: 13px; resumo fila: 12px | `--texto-meta`, `--texto-aba` |
| Meta lista consultor | 12.5px | 400 | Cor `--cor-texto-secundario` | pode ser alias de `--texto-meta` + ajuste fino |
| Label de campo | 13px | 500 | Cor secundária | `--texto-label` |
| Rótulo de coluna / seção estreita | 11px | 600 | **uppercase**, `letter-spacing: 0.05em` | `--texto-rotulo-coluna` |
| Rótulo “MEUS CHAMADOS” / similar | 12px | 600 | uppercase, cor `#334155` | `--texto-rotulo-secao` |
| Cabeçalho de balão (Conversa) | 11px | 600 | — | `--texto-cabecalho-balao` |
| Selo (status/prazo) | 12px | 600 | — | `--texto-selo` |

### 6.3 Line-height e hierarquia HTML

| Regra | Especificação |
| --- | --- |
| Base `html`/`body` | **14px** como tamanho raiz do produto (substitui 18px do template Vite) |
| `line-height` corpo | ~1.4–1.5 para parágrafos e listas (valor único token `--leading-corpo`, ex. 1.45) |
| Títulos | `line-height` mais apertado (~1.2–1.25) em títulos 19–22px |
| `h1`–`h6` | Não usar estilos de marketing do template; resetar margens padrão para layouts de app (0 ou controlado por feature) |

### 6.4 Internacionalização (pt-BR / pt-PT)

Tipografia **não muda** entre locales; apenas conteúdo e formatação de data (`Intl`). DM Sans cobre latinos usados no snapshot.

## 7. Arquitetura técnica sugerida

```
src/
  shared/
    estilos/
      tokens-cores.css      # E1
      tokens-tipografia.css # E2
      global.css            # E3: body, #root, box-sizing
  index.css                 # importa shared/estilos/* (ou main.tsx importa direto)
index.html                  # <link> Google Fonts DM Sans
```

**Ordem de import:** tipografia + cores → global → (futuro) utilitários mínimos se necessário.

**Proibido nesta feature:** duplicar hex em `App.css` de demo; features podem usar tokens ou classes de componente, não novos `#1582F9` espalhados.

**TypeScript (opcional):** se o projeto exportar constantes para testes, espelhar nomes dos tokens — só se um PRD posterior exigir.

## 8. Matriz de consumo (quem usa o quê)

| Área (PRD futuro) | Tokens principais |
| --- | --- |
| Login | superfície, primária, erro, texto corpo/label, sombra |
| Cabeçalho comum | superfície, borda, texto, secundário, selo perfil (cinza) |
| Cliente | seleção, status, faixa etapa, conversa cliente/suporte |
| Consultor fila | prazo (selo + faixa + cabeçalhos grupo), primária, meta |
| Consultor detalhe | status borda, conversa multi-papel, notas |
| Gestor | número indicador, erro-borda card, tabela rótulo coluna |
| Botão / Campo / Selo / Conversa | todos os tokens de controle + escala §6.2 |

Este PRD **não implementa** esses fluxos; apenas garante que os tokens existam.

## 9. Critérios de aceite

1. [ ] `:root` expõe **todos** os hex listados nas §§5.1–5.6 com nomes semânticos em português.
2. [ ] DM Sans carregada com pesos 400, 500, 600, 700; `body` usa `--fonte-principal`.
3. [ ] Fundo global da app é `#F1F5F9`; texto padrão `#0F172A`; tamanho base 14px.
4. [ ] Não há regra `prefers-color-scheme: dark` ativa para o produto.
5. [ ] `#root` ocupa largura total útil (sem coluna central 1126px do template).
6. [ ] Nenhum `--accent` / roxo do template Vite permanece em folhas importadas pela app.
7. [ ] `npm run lint`, `npm run test`, `npm run build` permanecem verdes após a mudança.
8. [ ] Comentário no CSS referencia CONTEXTO §9 como origem dos valores.

## 10. Riscos e decisões explícitas

| Tema | Decisão |
| --- | --- |
| Dark mode | **Não implementar** — fora do CONTEXTO. |
| Cor “link” | Igual à primária `#1582F9` salvo estado hover (pode escurecer levemente com `#0B4FA8` do status aberto — opcional, documentar se usado). |
| 20 vs 22px títulos | Token único com variante ou custom property por contexto; gestor saudação/dashboard pode usar 22px sem novo hex. |
| Tailwind / CSS-in-JS | Não exigido; CSS variables puro alinha com “sem dependência nova”. |

## 11. Dependências

- **Bloqueia:** PRDs de Botão, Campo, Selo, Conversa, Login, Cabeçalho, layouts dos três perfis.
- **Não depende de:** `dados.json`, eventos, rotas.