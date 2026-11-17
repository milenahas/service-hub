# PRD — Tela de login (escolha de perfil)

## 1. Metadados

| Campo | Valor |
| --- | --- |
| **Produto** | Service Hub — central de chamados de TI |
| **Feature** | Tela de login + resolução do usuário do snapshot |
| **Prioridade** | Alta — porta de entrada; bloqueia rotas dos três perfis |
| **Stack** | React 18+, TypeScript, Vite, CSS com tokens, Vitest + React Testing Library |
| **Fonte da verdade visual** | `service-hub-design-prototype/CONTEXTO-SERVICE-HUB.md` §4 e §9; **print obrigatório** abaixo |
| **Fonte da verdade técnica** | `AGENTS.md` (§ Login, § Código, § Arquitetura) |
| **Depende de** | [cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md), [componentes-compartilhados.md](./componentes-compartilhados.md) (**Botão**, **CampoTexto**) |
| **Desbloqueia** | Store Zustand da sessão em `app/`, cabeçalho comum, rotinas `cliente` · `consultor` · `gestor` |
| **Decisões de arquitetura** | Entrevista **grill-me** (sessão Nov/2025) — §7.5 e §13; tenant em memória, sem Context API |
| **Conformidade a11y** | WCAG 2.1 AA; APG para formulário, botão e alerta de erro (herdado do PRD de componentes) |
| **Fora do escopo** | Senha, token, API, persistência em `localStorage`, OAuth, “lembrar-me”, recuperação de senha, toasts, modais, animações decorativas |

### Referência visual obrigatória (MUST)

Antes de implementar e antes de dar a feature por concluída, o agente implementador **deve abrir e comparar lado a lado** (ou sobrepor em inspeção visual) o arquivo:

**`service-hub-design-prototype/prints/Tela de login.png`**

A tela implementada deve ficar **visualmente idêntica** ao print em:

- Hierarquia (marca → título → subtítulo → campo → botão → caixa de perfis).
- Alinhamentos (conteúdo **alinhado à esquerda** dentro do cartão; cartão **centralizado** na viewport).
- Espaçamentos relativos (respiro entre blocos, padding interno do cartão).
- Cores, tipografia (DM Sans), raios, sombra e contraste.
- Microcopy **literal** (§6).

O protótipo HTML em `service-hub-design-prototype/prototipo/` serve para **comportamento de referência**, não para copiar dados. O print é a **âncora de pixel** quando houver dúvida entre texto do CONTEXTO e detalhe fino do layout.

---

## 2. Objetivo

Entregar a **única** tela de acesso ao produto: um formulário de “login” fictício com **um campo de usuário** (sem senha) que seleciona qual persona do snapshot (`src/data/dados.json`) entrará na aplicação, com aparência e fluxo conforme o design aprovado.

Objetivos mensuráveis:

1. **Paridade visual** com `Tela de login.png` (critério bloqueante).
2. Os **quatro** logins fixos autenticam para o usuário correto do snapshot; qualquer outro valor mostra **erro inline** (sem toast).
3. **Enter** no formulário dispara o mesmo fluxo que o botão **Entrar**.
4. Após sucesso, a app dispara **`iniciarSessao(usuario)`** na store Zustand (`app/store`) — monta o tenant da sessão (§7.5) e expõe o **usuário logado** ao restante da árvore — sem regra de chamado na tela de login.
5. Código em `features/autenticacao`, regras puras de mapeamento testáveis, UI sem `if` de perfil nas telas futuras (cada perfil terá rota/tela própria).
6. `npm run lint`, `npm run test`, `npm run build` verdes.

---

## 3. Papel no produto

O login **não é autenticação real**. É um **seletor de perfil** com cara de login corporativo, para demonstrar três rotinas separadas (cliente, consultor por grupo, gestor) usando o mesmo tenant.

| Regra | Detalhe |
| --- | --- |
| Sem senha | Nunca exibir campo, link ou copy de senha |
| Sem alias genérico | `consultor` sozinho é **inválido** |
| Dois consultores | Existência explícita de `consultor-infraestrutura` e `consultor-aplicacoes` para filas distintas por `grupo_id` |
| Nome no cabeçalho (futuro) | Vem de `usuarios[].nome` do snapshot, **não** do texto digitado |
| Estado de sessão | **Zustand** em memória (sem Context API); **não** persistir entre reloads; F5 e **Sair** voltam ao snapshot bruto de `dados.json` |
| Bootstrap no login | Sucesso no formulário chama montagem da sessão por perfil (§7.5); login só orquestra UI + resolver usuário |

---

## 4. Princípios de código e arquitetura (MUST — `AGENTS.md`)

| # | Regra |
| --- | --- |
| L1 | **Ordem:** funcionar → claro → rápido. |
| L2 | **Estado que muda:** texto do campo `usuario` e flag de erro de validação ficam no componente de tela ou no ancestral imediato; **usuário logado** e **tenant da sessão** sobem para `app/store` (Zustand), não para Context API. |
| L3 | **Um módulo, um assunto:** mapeamento login → usuário em função pura (ex. `dominio/autenticacao.ts` ou `features/autenticacao/resolver-usuario-login.ts`); tela só orquestra UI e submit. |
| L4 | **Sem componente que só repassa props** — não criar `CartaoLogin` vazio se a tela já couber em um arquivo; marca/logo pode ser JSX local na tela ou um módulo mínimo **só** se reutilizado no cabeçalho (PRD futuro). |
| L5 | **Nomes em português** para props de produto (`rotulo`, `erro`), pastas `features/autenticacao`; props HTML/React nativas (`value`, `onChange`, `type`, `id`, `aria-*`) nos componentes compartilhados. |
| L6 | **JSX condicional:** erro sob o campo com `erro && …` ou prop `erro` do **CampoTexto** — evitar ternário `condição ? <p>…</p> : null`. |
| L7 | **Sem toasts** — feedback de inválido apenas com texto `--cor-erro` abaixo do campo (`role="alert"` via CampoTexto). |
| L8 | **Zustand** é a única dependência nova autorizada neste contrato (estado global de sessão + tenant); formulário nativo ou `<form onSubmit>` — sem libs de formulário. |
| L9 | **Tokens CSS** — hex só em tokens; layout da tela usa variáveis de [cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md). |
| L10 | **Remover vitrine** — ao integrar login em `App`, retirar a demo de componentes em `App.tsx` / `App.css` que hoje ocupa a rota raiz (não deixar duas “homes”). |

---

## 5. Layout e especificação visual

### 5.1 Viewport e fundo

| Item | Especificação |
| --- | --- |
| Fundo da página | `--cor-fundo-pagina` (`#F1F5F9`) em toda a altura útil |
| Rolagem | Página de login **não** deve depender de scroll em viewport típica desktop (~720px+ altura); centralizar verticalmente o cartão |
| Largura | `#root` largura total (já definido no PRD de tokens) |

### 5.2 Cartão central (MUST — CONTEXTO §4 + print)

| Propriedade | Valor |
| --- | --- |
| Largura | `width: 100%`, `max-width: 400px` |
| Fundo | `--cor-superficie` (`#FFFFFF`) |
| Raio | **20px** (`border-radius: 20px`) |
| Sombra | Suave, neutra — sugerir `box-shadow: 0 10px 40px rgba(15, 23, 42, 0.08)` ou token `--sombra-cartao-login` definido uma vez em CSS da feature |
| Padding interno | **24px** (alinhar ao print; ajuste fino ±2px só para match visual com o PNG) |
| Posição | Centralizado horizontal e verticalmente (`min-height: 100dvh`, flex ou grid no container da tela) |

### 5.3 Marca (topo do cartão)

Conforme print e CONTEXTO §4:

| Elemento | Especificação |
| --- | --- |
| Layout | Linha: **emblema** + texto **Service Hub** à direita, alinhados verticalmente ao centro |
| Emblema | Quadrado com cantos arredondados (raio ~10px), fundo `--cor-primaria`, dimensão ~36–40px; letra **S** branca centralizada, peso **700**, tamanho ~18–20px (ajustar até coincidir com o print) |
| Nome do produto | “Service Hub”, `--cor-texto-principal`, **600–700**, ~16–18px |
| Espaço abaixo da marca | ~24px até o título “Entrar” |

**Acessibilidade:** o emblema é decorativo; incluir texto visível “Service Hub”. Opcional: `aria-hidden` no quadrado do “S” se o texto adjacente já nomeia o produto.

### 5.4 Título e subtítulo

| Elemento | Texto (literal) | Estilo |
| --- | --- | --- |
| Título | **Entrar** | `--texto-titulo-tela` (20px / **700**), cor principal |
| Subtítulo | **Central de chamados de TI. Digite seu usuário para continuar.** | 14px, cor `--cor-texto-secundario` ou equivalente ao print (cinza médio), `line-height` confortável (~1.45) |
| Espaço | ~20–24px entre subtítulo e label do campo |

Usar `<h1>` para “Entrar” (único h1 da tela).

### 5.5 Formulário

| Item | Especificação |
| --- | --- |
| Campo | **CampoTexto** com `rotulo="Usuário"`, `type="text"`, `autoComplete="username"` |
| Placeholder | **`ex.: consultor-infraestrutura`** (com ponto após “ex.”, como no print) |
| Botão | **Botão** `variante="primario"`, `bloco`, `type="submit"`, children **Entrar** |
| Ordem | Campo → botão; espaçamento ~16px entre campo (incl. erro) e botão |
| `required` | Opcional no HTML; validação de negócio é o mapa dos quatro usuários (vazio = inválido com mesma mensagem de erro) |

**Não** exibir `legenda` auxiliar abaixo do campo (diferente da demo em `App.tsx`).

### 5.6 Caixa “Perfis disponíveis” (MUST)

| Propriedade | Valor |
| --- | --- |
| Fundo | `--cor-superficie-secundaria` (`#F1F5F9`) |
| Raio | **12px** (print mostra cantos suaves, levemente menores que o cartão) |
| Padding | ~16px |
| Margem superior | ~24px abaixo do botão |
| Título da caixa | **Perfis disponíveis:** — texto menor (~13px), cor secundária, peso 500 |
| Lista | Quatro linhas, **uma por perfil**, texto monospace ou sans igual ao print (usuários em destaque ~14px **600**, cor principal) |

**Ordem obrigatória** (CONTEXTO §4):

1. `gestor`
2. `consultor-infraestrutura`
3. `consultor-aplicacoes`
4. `cliente`

A caixa é **informativa** (não são links clicáveis neste PRD). O usuário digita no campo. *Opcional futuro:* clicar preenche o campo — **fora deste PRD** salvo pedido explícito.

### 5.7 Estados visuais

| Estado | Comportamento visual |
| --- | --- |
| Repouso | Conforme print |
| Foco no input | Borda azul primária (CampoTexto) |
| Erro | Mensagem vermelha `--cor-erro` sob o campo; `aria-invalid` no input |
| Submit com sucesso | Navegação/troca de árvore para rota do perfil — sem animação obrigatória |
| Botão Entrar | Sempre habilitado (não desabilitar por campo vazio; tratar vazio como inválido no submit) |

### 5.8 O que **não** aparece na tela

- Ícones decorativos, ilustrações, footer global, links “esqueci senha”, seletor de idioma, versão da app, toast.

---

## 6. Microcopy (literal — MUST)

| Chave | Texto |
| --- | --- |
| Marca | Service Hub |
| Título | Entrar |
| Subtítulo | Central de chamados de TI. Digite seu usuário para continuar. |
| Label campo | Usuário |
| Placeholder | ex.: consultor-infraestrutura |
| Botão | Entrar |
| Caixa | Perfis disponíveis: |
| Erro inválido | Usuário não encontrado. Use cliente, consultor-infraestrutura, consultor-aplicacoes ou gestor. |

Caracteres, pontuação e ordem na lista de perfis são **contrato de aceite**.

---

## 7. Comportamento e regras de negócio

### 7.1 Normalização da entrada

Antes de resolver o usuário:

1. `trim()` em ambas as extremidades.
2. Comparação **case-insensitive** com as chaves de login (ex. `GESTOR`, ` Gestor ` → válido).

### 7.2 Mapa de login → usuário do snapshot (MUST)

Implementação: mapa fixo `Record<string, string>` (login → `usuarios[].id`) ou função pura que retorna o registro `Usuario` — **não** buscar por `email` nem por substring livre na lista de usuários.

| Texto digitado (após normalização) | Perfil / rota | Usuário no snapshot | `id` (referência em `dados.json`) |
| --- | --- | --- | --- |
| `gestor` | Gestor | Ricardo Monteiro | `875d257a-0dff-4428-a233-5332d0e67b86` |
| `consultor-infraestrutura` | Consultor · Infraestrutura | Thiago Nascimento (`grupo_id` → Infraestrutura) | `50039fe7-2ddf-4a02-8045-c635a4c724f6` |
| `consultor-aplicacoes` | Consultor · Aplicações | Felipe Gomes (`grupo_id` → Aplicações) | `85d44809-37ca-4797-8fbf-53f112ebe792` |
| `cliente` | Cliente | Leandro Mendes (persona de demo com mais chamados ativos no snapshot) | `7a853f14-c064-4dc4-bb24-8e8fdce4ccd4` |

Grupos no snapshot (para testes de consultor):

- Infraestrutura: `29be5d21-2981-4b38-a4c2-771116e58928`
- Aplicações: `9d8ad616-fd35-4f2c-9eaa-3ca931b51313`

**Proibido:** aceitar `consultor`, `marina`, email, ou qualquer outro usuário do JSON que não esteja na tabela.

### 7.3 Fluxo de submit

1. Usuário preenche o campo e clica **Entrar** **ou** pressiona **Enter** com foco no formulário.
2. `preventDefault` no submit nativo.
3. Se resolução falhar → definir `erro` no **CampoTexto** com o texto §6; **não** limpar o campo; **não** navegar.
4. Se resolução ok → `aoEntrar(usuario)` → store chama **`iniciarSessao`** com o `Usuario` resolvido (§7.5) → app redireciona para a rota do perfil.

Erro deve **persistir** até nova tentativa de submit bem-sucedida ou até o usuário alterar o valor (decisão recomendada: limpar erro no `onChange` do campo para UX limpa — implementar e testar).

### 7.4 Pós-login (contrato com `app/`)

Este PRD exige que `app/`:

| Entrega | Descrição |
| --- | --- |
| Store `useStore` (Zustand) | Sessão + tenant mutável em memória; selectors por fatia (`sessao`, `tenant`) |
| `iniciarSessao(usuario)` | Disparada após login válido; delega a `dominio/montar-sessao` (regras §7.5) |
| `sair()` | Limpa sessão (equivalente a reset ao import de `dados.json`); para timers de simulação; volta à tela de login |
| Roteamento | Rota `/` ou equivalente = login quando não logado; rotas separadas por perfil (`/cliente`, `/consultor`, `/gestor`) — paths exatos podem ser definidos no PRD de rotas, mas **três telas separadas**, sem um único componente com `switch(perfil)` para UI inteira |
| Guarda | Usuário não logado não acessa rotas de perfil; usuário logado não vê login até **Sair** |
| Troca de perfil | Entrar com outro login **sem** sair antes não é fluxo suportado; trocar consultor-infra ↔ consultor-aplicações = **Sair** + novo login |

Telas de perfil são **fora** deste PRD; login só precisa do contrato acima.

### 7.5 Bootstrap do tenant na sessão (MUST — grill-me)

Ao login bem-sucedido, a store **não** carrega o JSON inteiro de chamados/mensagens/histórico na memória. Monta um **tenant de sessão** a partir de `src/data/dados.json` (import estático; **nunca** gravar alterações no arquivo em disco).

#### 7.5.1 O que entra inteiro vs recortado

| Sempre completo na sessão | Recortado no login; cresce só na sessão |
| --- | --- |
| `meta`, `grupos`, `categorias`, `sla`, `usuarios` | `chamados`, `mensagens`, `historico` |

`mensagens` e `historico`: apenas registros cujo `chamado_id` pertence a um chamado presente na sessão.

Relógio de SLA: sempre `meta.agora` do snapshot — nunca o relógio da máquina (`AGENTS.md`).

#### 7.5.2 Duas origens de dado

| Origem | Quando | Regra |
| --- | --- | --- |
| **Snapshot (`dados.json`)** | Login (lista fixa por perfil) | Cópia **leitura** de registros existentes; filtro conforme perfil abaixo — sem amostragem aleatória |
| **Injeção na store** | Ações do usuário, gestor, consultor; timer do consultor (PRD futuro da fila) | Sempre **registro novo**: `id` único, `numero` sequencial na sessão (máximo atual + 1), título/descrição/mensagens **novos** — não reutilizar texto nem `id` de outro registro; timer usa texto gerado na hora, não cópia do JSON |

Mutações na sessão seguem **eventos simulados** do domínio (`chamado.aberto`, `chamado.atribuido`, `mensagem.adicionada`, `status.alterado`) — idempotentes, mesmo contrato que um WebSocket futuro (`AGENTS.md`).

Implementação: telas finas; regras puras em `dominio/`; store aplica o resultado (`aplicarEvento` / ações equivalentes).

#### 7.5.3 Cliente (`cliente` → Leandro Mendes)

- `solicitante_id` do usuário logado: `7a853f14-c064-4dc4-bb24-8e8fdce4ccd4`.
- Sessão inclui **todos** os chamados do JSON em que `solicitante_id` é esse `id`, mais mensagens/histórico correlatos.
- Sem recorte aleatório no login.
- Abrir novo chamado na rotina cliente (PRD futuro) **injeta** na store com IDs e textos novos; perdido em `sair()` ou F5.

#### 7.5.4 Consultor (`consultor-infraestrutura` · `consultor-aplicacoes`)

No login:

1. Inclui **todos** os chamados do JSON com o **mesmo `grupo_id`** do consultor logado, em qualquer status.
2. Inclui mensagens/histórico só desses `chamado_id`.

Sem recorte aleatório de volume nem mix por faixa.

**Após login** (fora desta tela, mas store já preparada): simulação pode injetar novos `aberto` sem dono a cada 1–3 min via evento `chamado.aberto`; **para** em `sair()` ou F5.

Referência de `grupo_id` §7.2; consultores: Thiago (Infra), Felipe (Aplicações).

#### 7.5.5 Gestor (`gestor` → Ricardo Monteiro)

No login:

1. `consultoresEquipeGestor` = **todos** os usuários com `perfil === 'consultor'` (Infraestrutura e Aplicações).
2. Inclui **todos** os chamados do JSON cujo `grupo_id` pertence a esses consultores, em qualquer status.
3. Painel de equipe e dados da sessão referem **os mesmos** consultores — sem lista de pessoas desconectada dos chamados.

Sem recorte aleatório de consultores nem de volume.

#### 7.5.6 Reset e ciclo de vida

| Evento | Efeito |
| --- | --- |
| Login válido | `iniciarSessao` substitui qualquer tenant anterior |
| **Sair** | Zera store; volta ao login; nenhum dado injetado permanece |
| **F5** | Mesmo que Sair (sem `localStorage`) |
| Logout implícito | Trocar de persona exige Sair antes |

#### 7.5.7 Fora do escopo do login (mas contrato da store)

- UI das abas por status (cliente) e fila do consultor.
- Implementação completa do timer 1–3 min (pode ser stub até PRD consultor).
- Persistência, API, WebSocket real.

---

## 8. Arquitetura de arquivos sugerida

```
src/
  features/
    autenticacao/
      TelaLogin.tsx              # UI do cartão + formulário
      TelaLogin.css              # layout, cartão, marca, caixa perfis
      TelaLogin.test.tsx         # RTL: render, submit, erro, enter
      resolver-usuario-login.ts  # função pura + testes unitários
      resolver-usuario-login.test.ts
      constantes-login.ts        # chaves e mensagem de erro (opcional, se evitar string duplicada)
  app/
    store.ts                     # create store Zustand: sessao, tenant, iniciarSessao, sair, aplicarEvento
    Rotas.tsx                    # login vs perfis
  dominio/
    tipos.ts                     # Usuario, TenantSessao, Evento, …
    montar-sessao.ts             # regras puras §7.5 (cliente / consultor / gestor)
    montar-sessao.test.ts
    aplicar-evento.ts            # redutor idempotente (AGENTS.md)
    autenticacao.ts              # opcional: tipos de login
```

**Importações:**

- `TelaLogin` usa `Botao` e `CampoTexto` de `shared/components`.
- `resolver-usuario-login` pode importar tipo `Usuario` e lista/lookup do snapshot — preferir receber `usuarios` como argumento na função pura para testar sem carregar JSON inteiro em cada teste.
- `montar-sessao` recebe snapshot + `Usuario` logado; testes usam subconjuntos fixture do JSON.
- Telas consomem `useStore` com selectors; **sem** `Provider` de Context para sessão/tenant.

**Proibido:** colocar regra `if (perfil === 'cliente')` de layout dentro de `TelaLogin`.

---

## 9. Acessibilidade (MUST)

Herdado do [componentes-compartilhados.md](./componentes-compartilhados.md):

| Item | Requisito |
| --- | --- |
| Formulário | `<form>` com submit acessível; botão `type="submit"` |
| Campo | Label “Usuário” associada (`htmlFor` / `id`) |
| Erro | `role="alert"`, `aria-invalid="true"` no input quando inválido |
| Foco | Ordem lógica: campo → botão; foco visível `:focus-visible` |
| Título | Um `<h1>` (“Entrar”) |
| Idioma | `lang` no HTML (pt); conteúdo em português |

Sem modal; alerta no fluxo do documento (APG Alert pattern).

---

## 10. Testes (MUST)

### 10.1 Unitários — `resolver-usuario-login`

| Caso | Esperado |
| --- | --- |
| `gestor`, `GESTOR`, `  gestor  ` | Id Ricardo Monteiro |
| `consultor-infraestrutura` | Id Thiago Nascimento |
| `consultor-aplicacoes` | Id Felipe Gomes |
| `cliente` | Id Leandro Mendes |
| `consultor` | `null` / inválido |
| `marina.almeida@…` | inválido |
| string vazia / só espaços | inválido |

### 10.2 RTL — `TelaLogin`

1. Renderiza microcopy §6 e quatro perfis na ordem correta.
2. Submit inválido exibe mensagem de erro exata (§6) via `getByRole('alert')` ou texto.
3. Submit válido chama `aoEntrar` (mock) com usuário esperado.
4. `userEvent.keyboard('{Enter}')` no campo dispara submit.
5. Campo usa placeholder do print.

### 10.3 Unitários — `montar-sessao` (mínimo)

| Caso | Esperado |
| --- | --- |
| Cliente Leandro | Todos os chamados do JSON com `solicitante_id` = `7a853f14-c064-4dc4-bb24-8e8fdce4ccd4`; mensagens filtradas por `chamado_id` |
| Consultor Infra | Todos os chamados com `grupo_id` Infra, qualquer status; mensagens filtradas por `chamado_id` |
| Gestor | Todos os consultores em `consultoresEquipeGestor`; todos os chamados dos grupos desses consultores |
| Catálogos | `usuarios`, `categorias`, `sla`, `meta` completos independente do recorte |

### 10.4 Integração mínima (se `app/` no mesmo PRD)

- Após login como `cliente`, rota de cliente monta (smoke); store contém chamados de Leandro.
- Após `sair()`, login visível de novo e tenant vazio.
- Login válido como `gestor` chama `iniciarSessao` (mock ou assert em `consultoresEquipeGestor` e chamados dos grupos).

**Não** obrigatório: teste visual automatizado do PNG; **obrigatório** checklist manual do §11.

---

## 11. Critérios de aceite

### Visual

1. [ ] Comparação com `service-hub-design-prototype/prints/Tela de login.png` aprovada (marca, tipografia, cores, espaçamentos, sombra, caixa cinza).
2. [ ] Cartão `max-width: 400px`, raio 20px, fundo branco sobre `#F1F5F9`.
3. [ ] Placeholder `ex.: consultor-infraestrutura`.

### Funcional

4. [ ] Quatro logins da tabela §7.2 entram com sucesso.
5. [ ] `consultor` e entradas arbitrárias mostram erro inline exato §6 — **sem toast**.
6. [ ] Enter no formulário equivale a clicar **Entrar**.
7. [ ] Nome exibido nas telas logadas virá do snapshot (validar quando cabeçalho existir — Leandro Mendes ≠ texto digitado `cliente`).

### Sessão (store)

8. [ ] Login válido dispara `iniciarSessao` com recorte §7.5 (cliente = todos os chamados de Leandro; consultor = todos do grupo; gestor = todos os consultores e chamados dos grupos).
9. [ ] `sair()` e F5 resetam tenant; nenhum `localStorage`.
10. [ ] Zustand em `app/store`; sem Context API para sessão/tenant.

### Código

11. [ ] Feature em `features/autenticacao`; mapeamento testável e puro.
12. [ ] Usa **Botão** e **CampoTexto**; tokens globais; sem hex solto na feature salvo definição de sombra local documentada.
13. [ ] Alinhado a `AGENTS.md` (JSX condicional, nomes, sem over-engineering); eventos ao mutar tenant.
14. [ ] Vitrine `App.tsx` removida ou substituída pelo login na rota raiz.
15. [ ] `npm run lint`, `npm run test`, `npm run build` verdes.

---

## 12. Dependências e ordem de implementação

1. [cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md) aplicado.
2. [componentes-compartilhados.md](./componentes-compartilhados.md) — **Botão**, **CampoTexto**.
3. Este PRD (tela + resolver + `app/store` + `dominio/montar-sessao`).
4. PRDs futuros: cabeçalho comum (§5 CONTEXTO), telas por perfil.

---

## 13. Riscos e decisões

| Tema | Decisão |
| --- | --- |
| Print vs CONTEXTO (placeholder) | Print usa `ex.:` com ponto — **seguir o print** (§5.5). |
| IDs fixos vs lookup dinâmico | **IDs fixos** na tabela §7.2 — snapshot é a única fonte; IDs estáveis no repo de demo. |
| Clicar perfil na caixa cinza | Fora do escopo; só lista estática. |
| Persistência após F5 | Sem login persistido; volta ao formulário; tenant da sessão perdido. |
| Cliente demo (`AGENTS.md` cita Helena) | Neste PRD e na implementação imediata, login `cliente` → **Leandro Mendes** (`7a853f14-c064-4dc4-bb24-8e8fdce4ccd4`); alinhar `AGENTS.md` / microcopy em tarefa futura se necessário. |
| Context API vs Zustand | **Zustand** deliberado (grill-me): uma store, selectors; não duplicar com Context para o mesmo dado. |
| `dados.json` mutável | Apenas store em memória; arquivo em `src/data/` permanece imutável em runtime. |
| Recorte no login | Filtro por solicitante/grupo; sem amostragem aleatória. |
| Logo compartilhado com cabeçalho | Pode extrair componente `MarcaServiceHub` quando cabeçalho for implementado; não antecipar abstração só por DRY. |
| Sombra do cartão | Definir token ou constante CSS única; não copiar sombra pesada do template Vite. |

---

## 14. Checklist manual para o implementador (print)

Abrir o PNG e validar item a item:

- [ ] Fundo cinza claro uniforme
- [ ] Cartão branco centralizado, sombra leve
- [ ] Quadrado azul com “S” + “Service Hub”
- [ ] “Entrar” como título principal
- [ ] Subtítulo em cinza em duas linhas no print (quebra natural ok)
- [ ] Um único campo com borda cinza e placeholder
- [ ] Botão azul largura total “Entrar”
- [ ] Bloco inferior cinza com título “Perfis disponíveis:” e quatro logins em negrito

Qualquer divergência corrijida antes de merge.