# PRD — Componentes compartilhados (Botão, Campos, Selo)

## 1. Metadados

| Campo | Valor |
| --- | --- |
| **Produto** | Service Hub — central de chamados de TI |
| **Feature** | Biblioteca UI em `src/shared/components` |
| **Prioridade** | Alta — bloqueia login, cabeçalho e formulários dos perfis |
| **Stack** | React 18+, TypeScript, Vite, CSS com tokens (`src/shared/estilos/*`), Vitest + React Testing Library |
| **Fonte da verdade visual** | `service-hub-design-prototype/CONTEXTO-SERVICE-HUB.md` §9 |
| **Fonte da verdade técnica** | `AGENTS.md` |
| **Depende de** | [cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md) |
| **Conformidade obrigatória** | [WCAG 2.1](https://www.w3.org/TR/WCAG21/) **nível AA**; [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) por tipo de widget |
| **Fora do escopo** | **Conversa** / lista de balões (fica em `features/*` — ver §14); layouts por perfil; domínio; eventos; painel de notas; cabeçalho da app |

### Componentes neste PRD

| Componente | Arquivo | Papel |
| --- | --- | --- |
| **Botão** | `Botao.tsx` | Ações |
| **CampoTexto** | `CampoTexto.tsx` | `<input type="text">` ou `type="email"` |
| **CampoTextarea** | `CampoTextarea.tsx` | `<textarea>` |
| **CampoSelect** | `CampoSelect.tsx` | `<select>` nativo |
| **Selo** | `Selo.tsx` | Status, prazo, texto neutro |

**Proibido:** um único componente `Campo` com discriminated union `tipo: 'texto' | 'textarea' | 'select'` — cada tipo de controle é **um módulo React próprio** (design system separado por widget).

## 2. Objetivo

Implementar **cinco** peças presentacionais em `shared/components`, cada uma com responsabilidade única, sem regra de chamado e sem dados do tenant.

**WCAG 2.1 AA** e **APG** são obrigatórios em todos. O CONTEXTO não autoriza exceção de acessibilidade; tokens ajustam-se se o contraste falhar.

Objetivos mensuráveis:

1. Formulários e ações usam **Botão** + **um dos três campos** + **Selo**, sem CSS duplicado nem mega-componente.
2. Estilos só com tokens; hex só na definição de token.
3. Código **simples, legível**, alinhado a `AGENTS.md` (§3 deste PRD).
4. Testes RTL cobrem comportamento e contratos a11y (`aria-*`, `disabled`, labels, erros).
5. Contraste AA documentado por variante.

## 3. Princípios de código e arquitetura (MUST — `AGENTS.md`)

| # | Regra |
| --- | --- |
| C1 | **Ordem:** funcionar → claro → rápido. |
| C2 | **Props primeiro** — sem fetch, contexto de app ou `useEffect` de negócio. |
| C3 | **Um módulo, um assunto** — um TSX + um CSS por componente; um componente = um tipo de widget HTML. |
| C4 | **Sem componente que só repassa props** — nada de `Campo` genérico que delega para três filhos; consumidor importa `CampoTexto` ou `CampoSelect` explicitamente. |
| C5 | **Estrutura plana** — sem pastas profundas, sem factories, sem HOC, sem abstração “para o futuro”. |
| C6 | **Só o que o produto usa agora** — sem variantes não usadas em CONTEXTO/PRDs. |
| C7 | **Nomes em português** — arquivos, props de domínio da UI (`rotulo`, `desabilitado`, `aoAlterar`). |
| C8 | **Estado no ancestral** — campos controlados (`valor` + `aoAlterar`); botão não guarda estado interno além do nativo. |
| C9 | **Nova dependência só se o direto não resolver** — a11y com HTML semântico + ARIA do APG; testes com RTL, sem `axe-core` obrigatório. |
| C10 | **Comentários raros** — código autoexplicativo; `// a11y:` só ao desviar de padrão APG. |

### Estilo compartilhado entre campos (permitido, com limite)

Pode existir **`campo-estilos-compartilhados.css`** (ou imports cruzados mínimos) contendo **apenas** regras visuais repetidas (label, erro, legenda, foco do controle) — **sem** componente React wrapper. Cada `CampoTexto` / `CampoTextarea` / `CampoSelect` importa esse CSS e renderiza seu próprio DOM.

## 4. Princípios de produto e domínio (MUST)

| # | Regra |
| --- | --- |
| P1 | **Fronteira de domínio** — cálculo de prazo, rótulos de status, filtro de `interna` ficam em `features/` ou `dominio/`; **Selo** só pinta o que recebe. |
| P2 | **Selo** pode mapear `StatusChamado` → classes (apresentação). |
| P3 | **Sem toasts** — erro em texto abaixo do campo (`role="alert"`). |
| P4 | **Acessibilidade por padrão** — semântica HTML; ARIA quando APG exige; foco visível; não só cor (WCAG 1.4.1). |
| P5 | **APG como contrato** — desvio documentado com `// a11y:` + referência. |

## 5. Marco WCAG 2.1 (AA) e APG

### 5.1 Critérios aplicáveis (resumo)

1.1.1 · 1.3.1 · 1.3.2 · 1.4.1 · 1.4.3 · 1.4.11 · 1.4.12 · 1.4.13 · 2.1.1 · 2.1.2 · 2.4.3 · 2.4.7 · 2.5.3 · 3.2.2 · 3.3.1 · 3.3.2 · 4.1.2 · 4.1.3

Referência: [WCAG 2.1](https://www.w3.org/TR/WCAG21/). Consulta em português (não normativa): [tradução Google](https://www-w3-org.translate.goog/TR/WCAG21/?_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=pt&_x_tr_pto=tc).

### 5.2 Padrões APG por componente

| Componente | APG |
| --- | --- |
| **Botão** | [Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/) |
| **CampoTexto** / **CampoTextarea** | [Textbox](https://www.w3.org/WAI/ARIA/apg/patterns/textbox/) (nativo) |
| **CampoSelect** | `<select>` nativo — não implementar combobox custom |
| Erro inline | [Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) (mensagem no fluxo, não modal) |
| **Selo** | Texto informativo estático — sem widget APG |

### 5.3 Contraste (MUST)

Verificar pares fundo/texto e borda/foco para: variantes de **Botão**; estados dos **três campos**; variantes de **Selo**. Falha → ajustar token.

### 5.4 Foco global (MUST)

`:focus-visible`; outline ≥ 3:1; sugestão: `2px solid var(--cor-primaria)`, `outline-offset: 2px` em botão e controles de formulário.

### 5.5 Testes de acessibilidade (MUST)

Somente **RTL** com asserções explícitas listadas em cada seção de componente — **sem** dependência obrigatória de `jest-axe` / `vitest-axe`.

---

## 6. Botão

**APG:** [Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/)

### 6.1 Visual (CONTEXTO §9)

Altura 40px · raio 10px · 14px/600 · padding `0 18px` · `bloco` → `width: 100%`

| `variante` | Estilo |
| --- | --- |
| `primario` | `--cor-primaria` / texto branco; hover `--cor-botao-primario-hover` |
| `secundario` | superfície branca, texto secundário, borda controle; hover `--cor-botao-secundario-hover` |
| `fantasma` | transparente, texto primário; hover `--cor-botao-fantasma-hover` |

Disabled: `--cor-superficie-secundaria`, texto terciário, atributo `disabled`; **sem** hover.

### 6.2 API

```ts
type VarianteBotao = 'primario' | 'secundario' | 'fantasma';

type PropsBotao = {
  variante?: VarianteBotao;
  bloco?: boolean;
  desabilitado?: boolean;
  tipo?: 'button' | 'submit' | 'reset';
  rotuloAcessivel?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'type'>;
```

- Sempre `<button>`; `tipo="button"` por default.
- `rotuloAcessivel` → `aria-label` quando children não nomeia (ex.: "×").
- 2.5.3: não conflitar `aria-label` com texto visível.

### 6.3 Testes

- `disabled` + clique bloqueado.
- Variantes / `bloco`.
- Nome acessível no botão ícone.

---

## 7. Campos de formulário (três componentes)

Especificação visual **comum** (CONTEXTO §9 — “Campo”):

- Label acima: 13px/500, `--cor-texto-secundario`
- Controle: raio 10px, borda `--cor-borda-controle`, corpo 14px
- Input/select: altura 40px
- Placeholder: `--cor-texto-terciario` (não substitui label)
- Foco: borda primária + §5.4
- Erro: texto `--cor-erro`, `aria-invalid`, borda erro se aplicável
- Legenda: texto secundário, `aria-describedby`

IDs derivados: `{id}-erro`, `{id}-legenda`.

### 7.1 CampoTexto

**Um** componente para entrada de linha única; tipo HTML via prop nativa.

```ts
type PropsCampoTexto = {
  id: string;
  rotulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  tipoEntrada?: 'text' | 'email'; // default 'text'
  placeholder?: string;
  erro?: string;
  legenda?: string;
  desabilitado?: boolean;
  obrigatorio?: boolean;
  autoComplete?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id' | 'type'>;
```

- Renderiza `<input>` com `type={tipoEntrada}`.
- Login: feature passa `autoComplete="username"` e `tipoEntrada="text"`.

**Testes:** `getByLabelText`, `aria-invalid`, `role="alert"` no erro, `aria-describedby`.

### 7.2 CampoTextarea

```ts
type PropsCampoTextarea = {
  id: string;
  rotulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  placeholder?: string;
  linhas?: number; // default 3; abertura de chamado: 5 na feature
  erro?: string;
  legenda?: string;
  desabilitado?: boolean;
  obrigatorio?: boolean;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'id'>;
```

- `<textarea rows={linhas}>`; `resize: vertical` permitido.

**Testes:** iguais ao CampoTexto + alteração de valor.

### 7.3 CampoSelect

```ts
export type OpcaoSelect = { valor: string; rotulo: string };

type PropsCampoSelect = {
  id: string;
  rotulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  opcoes: OpcaoSelect[];
  opcaoVazia?: string; // rótulo da opção inicial desabilitada
  erro?: string;
  legenda?: string;
  desabilitado?: boolean;
  obrigatorio?: boolean;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'id'>;
```

- `<select>` + `<option>`; opção vazia com `value=""`, `disabled`, `hidden` se `opcaoVazia` definido.

**Testes:** mudança de opção; label; a11y de erro.

### 7.4 Acessibilidade comum aos três campos (MUST)

| Item | Requisito |
| --- | --- |
| Label | `<label htmlFor={id}>` |
| Obrigatório | `aria-required="true"` se `obrigatorio` |
| Erro | `aria-invalid="true"`; `{id}-erro` com `role="alert"` |
| Descrição | `aria-describedby` = ids de erro + legenda quando existirem |

---

## 8. Selo

Informativo; sem foco; WCAG 1.4.1 via texto em `children`.

### 8.1 Visual

Pílula · 12px/600 · padding 3px 10px · `nowrap`

| `apresentacao` | Uso |
| --- | --- |
| `status-preenchido` | Cliente |
| `status-borda` | Consultor/gestor |
| `prazo` | Fila/detalhe (texto da feature) |
| `texto-cinza` | Perfil, "Com o cliente", etc. |

### 8.2 API

```ts
import type { StatusChamado } from '../../dominio/...';

export type FaixaPrazo = 'vencido' | 'urgente' | 'alerta' | 'neutro';

export type PropsSelo =
  | {
      apresentacao: 'status-preenchido' | 'status-borda';
      status: StatusChamado;
      children: string;
    }
  | {
      apresentacao: 'prazo';
      faixa: FaixaPrazo;
      children: string;
    }
  | {
      apresentacao: 'texto-cinza';
      children: string;
    }
  & {
      decorativo?: boolean; // aria-hidden só com redundância no pai
    };
```

Mapeamento status/prazo → tokens: conforme [cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md).

### 8.3 Testes

- Texto visível; variantes CSS; `status-borda` sem fundo sólido.

---

## 9. Integração (`features/` — fora deste PRD)

Funções puras sugeridas (não implementar em `shared/`):

| Função | Alimenta |
| --- | --- |
| `formatarRotuloStatus` | texto do **Selo** |
| `classificarFaixaPrazo` | `FaixaPrazo` |
| `formatarTextoPrazoConsultor` | `children` do selo prazo |

Strings MUST ser compreensíveis sem depender só de cor (1.4.1).

---

## 10. Entregáveis

```
src/shared/components/
  Botao.tsx / Botao.css / Botao.test.tsx
  CampoTexto.tsx / CampoTexto.css / CampoTexto.test.tsx
  CampoTextarea.tsx / CampoTextarea.css / CampoTextarea.test.tsx
  CampoSelect.tsx / CampoSelect.css / CampoSelect.test.tsx
  campo-estilos-compartilhados.css   # opcional, só CSS
  Selo.tsx / Selo.css / Selo.test.tsx
  index.ts
  tipos.ts                           # OpcaoSelect, FaixaPrazo, etc.
```

**`index.ts` exporta:** `Botao`, `CampoTexto`, `CampoTextarea`, `CampoSelect`, `Selo`, tipos públicos.

**Não exportar** wrapper `Campo` genérico.

---

## 11. Critérios de aceite

1. [ ] Cinco componentes React distintos; **nenhum** `Campo` unificado.
2. [ ] Código alinhado a §3 (`AGENTS.md`).
3. [ ] Sem `dados.json` / reducers em `shared/components`.
4. [ ] Visual CONTEXTO §9 (botão, campos, selo).
5. [ ] WCAG 2.1 AA + APG §5.2.
6. [ ] Contraste §5.3 documentado.
7. [ ] Testes RTL por componente (a11y §5.5).
8. [ ] Foco `:focus-visible` em botão e campos.
9. [ ] `lint` + `test` + `build` verdes.

---

## 12. Ordem de implementação

1. `campo-estilos-compartilhados.css` (se necessário)
2. **Botão**
3. **CampoTexto** → **CampoTextarea** → **CampoSelect**
4. **Selo**

---

## 13. Dependências

| Desbloqueia | Componentes |
| --- | --- |
| Login | Botão, CampoTexto |
| Formulários gerais | três campos + Botão |
| Cabeçalho / listas | Selo, Botão |

---

## 14. Conversa e histórico de mensagens

O CONTEXTO descreve balões e alinhamento, mas **não** há componente `Conversa` neste escopo. Listas de mensagens, notas internas e mensagens de sistema são **markup e CSS das features** (`features/cliente`, `features/consultor`, `features/gestor` ou `features/chamados`), reutilizando tokens `--conversa-*` e `--nota-*`.

Um PRD futuro pode definir composição e a11y da thread sem criar abstração prematura em `shared/`.

---

## 15. Riscos e decisões

| Tema | Decisão |
| --- | --- |
| Campo unificado | **Rejeitado** — três componentes |
| `CampoTexto` text + email | **Um** componente — mesmo widget APG Textbox; diferença só no `type` |
| CSS compartilhado entre campos | Permitido; **não** wrapper React |
| Conversa em `shared` | **Fora** deste PRD |
| `StatusChamado` no Selo | Só import de tipo em `dominio/` |
| Contraste vs CONTEXTO | Token ajustado prevalece |
| Botão "×" | `rotuloAcessivel` obrigatório |