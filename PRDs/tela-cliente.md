# PRD — Rotina do cliente (lista, detalhe, abertura e reabertura)

## 1. Metadados

| Campo | Valor |
| --- | --- |
| **Produto** | Service Hub — central de chamados de TI |
| **Feature** | Tela do cliente: meus chamados, detalhe com faixa de etapa, histórico público, nova abertura e reabertura |
| **Prioridade** | Alta — primeira persona do produto; demonstra visibilidade sem jargão interno |
| **Stack** | React 18+, TypeScript, Vite, CSS com tokens, Zustand (já no projeto), Vitest + React Testing Library |
| **Fonte da verdade visual** | `service-hub-design-prototype/CONTEXTO-SERVICE-HUB.md` **§5** (cabeçalho), **§6** (fluxo cliente) e **§9** (visual); **prints obrigatórios** abaixo |
| **Fonte da verdade técnica** | `AGENTS.md` (§ Perfis, § Dados e domínio, § Código, linha da sessão) e [tela-login.md](./tela-login.md) §7.5.3 |
| **Depende de** | Login e `montarSessao` (chamados com `solicitante_id` do logado), [cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md), [componentes-compartilhados.md](./componentes-compartilhados.md) (**Botão**, **CampoTexto**, **CampoTextarea**, **Selo**), `dominio/prazo.ts` (`chamadoAtivo`), `dominio/formatar-data.ts`, `dominio/aplicar-evento.ts`, `features/chamados/regras/linha-tempo-conversa.ts` e `BalaoMensagem.tsx` |
| **Rota** | `/cliente` (`CAMINHOS.cliente`) — guard `perfil === 'cliente'` |
| **Persona** | `cliente` → Leandro Mendes (`7a853f14-c064-4dc4-bb24-8e8fdce4ccd4`, `locale` pt-PT, `Europe/Lisbon`) |
| **Conformidade a11y** | WCAG 2.1 AA; APG para botões, campos e alerta; lista de chamados navegável por teclado; faixa de etapa com texto (não só cor) |
| **Fora do escopo** | API, WebSocket, toasts, modais, ícones decorativos, persistência, rotinas consultor/gestor, timer 1–3 min da fila, notas internas, select de status, categoria/grupo/prioridade na UI, coluna de SLA numérico |

### Referência visual obrigatória (MUST)

Antes de implementar e antes de dar a feature por concluída, o agente implementador **deve abrir e comparar lado a lado** cada print com o estado correspondente. O protótipo HTML serve para comportamento e aparência. **Nomes, volumes, números e IDs do print não entram na tela.**

O cabeçalho mostra **Leandro Mendes**, não “Helena Duarte”. Contagens, títulos e horários saem do tenant da sessão (`meta.agora` = `2026-11-03T13:00:00Z` no snapshot atual), não de “Impressora do 3º andar” nem de “14/11, 17:00”.

| Print | O que validar |
| --- | --- |
| `PRDs/prints-tela-cliente/Cliente - Tela 1 - Chamado aberto.png` | Lista + detalhe; cartão selecionado azul-claro; responsável “Aguardando um consultor pegar”; faixa azul de etapa; HISTÓRICO; textarea **Escreva uma mensagem…** + **Enviar** desabilitado |
| `PRDs/prints-tela-cliente/Cliente -  Tela 2 - Em atendimento.png` | Faixa “{Nome} está cuidando do seu chamado.”; balão do suporte cinza à esquerda; balões do cliente azul à direita com cabeçalho Nome · data |
| `PRDs/prints-tela-cliente/Cliente - Tela 3 - Chamado resolvido.png` | Faixa verde; **Resposta prevista** = **—**; sem textarea; texto de rodapé + **Reabrir chamado**; lista sem texto de prazo nesse item |
| `PRDs/prints-tela-cliente/Cliente - Tela 4 - Aguardando cliente.png` | Faixa âmbar; item da lista com **Aguardando você**; textarea ainda visível |
| `PRDs/prints-tela-cliente/Cliente - Tela 5 - Chamado fechado.png` | Painel inteiro cinza-claro; **sem** faixa de etapa; **Resposta prevista** = **—**; rodapé “Este chamado foi fechado. O problema voltou?” + **Reabrir chamado** |
| `PRDs/prints-tela-cliente/Cliente - Tela 6 - Criar chamado.png` | Painel **Abrir chamado**; subtítulo literal; Assunto + Descrição; **Cancelar** / **Enviar chamado** (desabilitado com campos vazios); nenhum item da lista selecionado |

Hierarquia, alinhamento, raios, cores e microcopy abaixo são contrato. Dúvida entre texto deste PRD e detalhe fino de espaçamento: o **print vence no pixel**. Regra de negócio do CONTEXTO e do `AGENTS.md` vence no dado (Helena vs Leandro; SLA “estourado” nunca visível ao cliente).

O CONTEXTO cita um print `06-cliente-reabrir-motivo.png` que **não** está nesta pasta. O formulário de motivo da reabertura é **MUST** mesmo assim (§8.5), recolhido atrás do botão **Reabrir chamado**.

---

## 2. Objetivo

Substituir `PlaceholderCliente` pela rotina do cliente: ver **os próprios chamados**, entender de relance se alguém pegou, quando há resposta prevista e o que mudou, escrever na conversa pública, abrir um chamado novo e reabrir concluído.

Objetivos mensuráveis:

1. **Paridade visual** com os seis prints (critério bloqueante por estado).
2. Lista e detalhe vêm só de `tenant.chamados` da sessão (todos com `solicitante_id` do logado). A tela **não** recorta de novo e **não** lê `dados.json`.
3. Cliente **nunca** vê categoria, grupo, prioridade, texto “estourado”, contagem de SLA, nem mensagem `interna: true`.
4. Faixa de etapa por status (CONTEXTO §6) é o feedback de bater o olho.
5. Abrir chamado, enviar mensagem e reabrir passam por `aplicarEvento` (`chamado.aberto`, `mensagem.adicionada`, `status.alterado`). Idempotência já existe no redutor — não criar caminho paralelo na store.
6. `npm run lint`, `npm run test` e `npm run build` verdes.

---

## 3. Papel no produto

| Regra | Detalhe |
| --- | --- |
| Quem entra | Só o usuário logado com `perfil === 'cliente'` (Leandro). Sem `if (perfil === 'consultor')` nesta rota |
| Quais chamados | Os de `tenant.chamados` já recortados no login (`solicitante_id` = Leandro). Sem amostragem |
| Foco | “Pegaram o meu chamado?”, “quando respondem?”, “o que mudou?” — sem jargão de fila |
| Relógio | `tenant.meta.agora`. Proibido `Date.now()` para prazo, “em breve” ou datas de abertura |
| Mutação | Dados descem da store; a tela sobe evento. Sem `set` direto em `chamados` |
| Cabeçalho | `CabecalhoApp` com `rotuloPerfil=""` → selo **Cliente**; nome do snapshot; **Sair** |
| Tempo real | UI derivada do tenant. Se um evento entrar na store, lista/faixa/histórico acompanham. **Não** há timer 1–3 min nesta feature (isso é da fila do consultor) |

---

## 4. Princípios de código (MUST — `AGENTS.md`)

| # | Regra |
| --- | --- |
| K1 | **Ordem:** funcionar → claro → rápido. Sem virtualização, cache, worker ou lib de formulário. |
| K2 | **Props primeiro** nos painéis. Tenant mutável na store. Lista, prazo visível ao cliente, faixa de etapa e mapeamento de balão são **funções puras**. |
| K3 | **Dados descem, evento sobe.** Abrir, enviar e reabrir chamam ações da store que só montam evento e delegam a `aplicarEvento`. |
| K4 | **Um módulo, um assunto.** Orquestração da tela, desenho da lista, desenho do detalhe, formulário de abertura e regras `.ts` **não** moram no mesmo arquivo. |
| K5 | **Tela do cliente** em `features/cliente`. Telas separadas por perfil — **proibido** copiar `PainelChamado.tsx` do consultor e esconder campos com `if`. |
| K6 | **Sem componente que só repassa props.** Extrair quando o bloco desenha de verdade (lista, detalhe, formulário, rodapé). |
| K7 | **JSX:** bloco opcional com `condição && <elemento>`. Sem ternário cujo um ramo é `null`. Sem ternário dentro de `.map()`. `eslint.config.js` (`no-restricted-syntax`) vale aqui. |
| K8 | **Testes** (`*.test.*`): sem `if`, `switch` ou ternário — casos em `it.each` / tabelas e `expect` direto. |
| K9 | **Nomes** de pasta, função e prop de produto em português (`rotulo`, `erro`, `aoSelecionar`). Props de HTML/React (`value`, `onChange`, `disabled`, `placeholder`, `aria-*`) com o **nome nativo**. |
| K10 | **JSDoc** em português logo acima do `export` principal de cada `Tela*.tsx`, painel, coluna e `.ts` de regra da feature. Papel do arquivo e o que fica no vizinho, com crase no nome do arquivo. Sem repetir assinatura. Tom: `TelaConsultor.tsx`, `ColunaFila.tsx`, `fila-consultor.ts`. |
| K11 | **Prazo do cliente num lugar só.** Não reusar `formatarTextoPrazoConsultor` na UI do cliente (esse texto fala “Estourado há”). Função própria: `textoPrazoListaCliente` / `textoRespostaPrevistaCliente`. `chamadoAtivo` e comparação com `meta.agora` continuam em `dominio/prazo.ts` se couber, ou ao lado dessas funções. |
| K12 | **Conversa dois lados (eu × suporte).** `tipoVisualBalao` do consultor pinta o solicitante como cinza à esquerda — **errado** para o cliente logado. Não passar `perfil` para o mapper compartilhado (`AGENTS.md`: se o compartilhado precisar parâmetro por perfil, **separar**). Ver §10.1. |
| K13 | **Sem dependência nova.** Sem toast. Feedback: botão `disabled`, texto no rodapé, seleção do chamado recém-criado. |
| K14 | **Tokens, não hex.** Cores e tipo vêm de [cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md). Hex só se um token ainda não existir — aí o token nasce em `shared/estilos`, não solto no CSS da feature. |
| K15 | **Só o que o produto usa agora.** Sem busca na lista, sem abas, sem chips, sem deep link `/cliente/:id` (F5 já desloga). |
| K16 | **Estrutura plana.** Nada de `features/cliente/components/ui/...`. Um nível de arquivos na pasta da feature. |

---

## 5. Dados que a tela consome

O login já monta a sessão (`dominio/montar-sessao.ts`, [tela-login.md](./tela-login.md) §7.5.3):

| Campo | Uso na UI |
| --- | --- |
| `chamados` | Lista e detalhe — todos os do solicitante logado |
| `mensagens`, `historico` | HISTÓRICO público (`interna: false` + linhas de sistema do redutor/histórico) |
| `usuarios` | Nome do responsável e cabeçalho dos balões |
| `sla`, `categorias`, `grupos` | **Só** para **criar** chamado (prazos e `grupo_id` / `categoria_id` internos). **Não** renderizar |
| `meta.agora` | “Resposta até”, “Em breve”, datas de abertura |

F5 ou **Sair** zera a store. A tela não persiste seleção.

Chamado **ativo** = `chamadoAtivo(status)` (`resolvido` e `fechado` estão concluídos).

**Referência de volume:** o snapshot de Leandro tem **mais** chamados que os cinco do print. A lista **rola**. Não limitar a 5. Não copiar títulos do protótipo.

Se o snapshot não tiver um `aberto` sem dono, esse estado aparece ao **abrir um chamado novo** (o formulário cria exatamente isso) e nos testes com fixture. **Não** editar `dados.json` para forçar o print.

### 5.1 Relógio e fuso

Leandro usa `locale: 'pt-PT'` e `zoneinfo: 'Europe/Lisbon'`. Toda data visível passa por `Intl.DateTimeFormat` com esses valores — reusar `formatarDataHoraUsuario` (`dominio/formatar-data.ts`) no painel (`dd/mm, HH:MM`).

Na **lista**, CONTEXTO pede só hora: **Resposta até HH:MM**. Acrescentar `formatarHoraUsuario` no mesmo módulo de data (hour + minute, mesmo `locale` / `timeZone`). Não formatar com `slice` de ISO.

### 5.2 Qual prazo o cliente vê

O produto tem `prazo_primeira_resposta` e `prazo_resolucao`. A copy do cliente fala de **resposta**, não de resolução interna.

| Superfície | Campo | Texto |
| --- | --- | --- |
| Lista (ativo, não `aguardando_cliente`) | `prazo_primeira_resposta` vs `meta.agora` | futuro → **Resposta até HH:MM**; passado → **Resposta em breve** |
| Lista `aguardando_cliente` | — | **Aguardando você** (ignora o relógio) |
| Lista concluído | — | vazio (não renderiza o span) |
| Painel **Resposta prevista** | mesmo campo | futuro → `formatarDataHoraUsuario`; passado e ativo → **Em breve**; concluído → **—** |

**Proibido** na UI do cliente: “Estourado há”, “Vence em”, “Prazo em”, horas de SLA, `prazo_resolucao` como selo de consultor.

### 5.3 Ação nova na store

`enviarMensagemCliente` e `alterarStatus` já existem e servem.

Acrescentar `abrirChamado(titulo: string, descricao: string)` em `app/store.ts`:

1. Trim nos dois textos; se algum ficar vazio, return (a UI já desabilita).
2. Montar um `Chamado` **novo** (injeção, não cópia de registro do JSON):
   - `id` = `criarIdEvento()` / `crypto.randomUUID()`
   - `numero` = maior `numero` em `tenant.chamados` + 1
   - `titulo` / `descricao` = textos do formulário
   - `status` = `aberto`, `prioridade` = `media`, `responsavel_id` = `null`
   - `solicitante_id` = logado
   - `grupo_id` = grupo **Infraestrutura** (`tenant.grupos` pelo nome; CONTEXTO: chamado do cliente sem categoria cai em Infraestrutura)
   - `categoria_id` = primeira categoria desse `grupo_id` em `tenant.categorias` (precisa existir no modelo; **não aparece na UI**)
   - `aberto_em` / `atualizado_em` = `meta.agora`
   - prazos = `meta.agora` + linha `sla` da prioridade `media` (`primeira_resposta_horas` e `resolucao_horas`)
   - `sla_pausado` = `false`; `primeira_resposta_em` / `resolvido_em` / `fechado_em` = `null`
3. Emitir `chamado.aberto` com o chamado completo (`ocorrido_em` = `meta.agora`).
4. Emitir `mensagem.adicionada` com a **descrição** como primeira mensagem pública (`interna: false`, `autor_id` = logado, `criado_em` = `meta.agora`).

Padrão de montagem: o mesmo espírito de `dominio/simulacao-consultor.ts` (`gerarChamadoInjetado`), extraído para uma função pura testável (ex. `dominio/abrir-chamado-cliente.ts`) — a store só chama e aplica os dois eventos.

Não usar `pegarChamado` nem `atribuirChamado` nesta feature.

---

## 6. Navegação da vista

Uma rota. Estado **local** em `TelaCliente` (não vai para a store):

| Vista | Como abre | Como sai |
| --- | --- | --- |
| `detalhe` | Default ao entrar; clique num item da lista | — |
| `novo` | Botão **+ Novo chamado** | **Cancelar**, ou submit com sucesso (volta a `detalhe` no chamado criado) |

`chamadoSelecionadoId`: default = primeiro da lista ordenada. Clique na lista atualiza. Abrir o formulário **não** apaga o id anterior (Cancelar restaura o detalhe desse id). Enquanto `vista === 'novo'`, **nenhum** cartão da lista fica selecionado (print Tela 6).

Não há rotas aninhadas. F5 desloga.

---

## 7. Layout e especificação visual (CONTEXTO §6 + prints)

### 7.1 Estrutura da página

| Item | Especificação |
| --- | --- |
| Fundo | `--cor-fundo-pagina` (`#F1F5F9`) |
| Shell | Coluna: `CabecalhoApp` + grade. Altura útil `calc(100vh - altura do cabeçalho)` — a **página não rola**; lista e histórico rolam por dentro |
| Grade | `minmax(280px, 360px) minmax(0, 1fr)`, `gap` ~16px, padding ~16–20px |
| Coluna esquerda | **Não** é um cartão branco único (diferente da Fila do consultor). Botão + rótulo + **cartões soltos** sobre o fundo da página |
| Painel direito | Um cartão `--cor-superficie`, raio **16px**, padding 20–24px; flex coluna; `min-height: 0` |

Por volta de ~720px a grade **pode** empilhar (lista em cima, detalhe embaixo), cada uma com scroll próprio. Não inventar menu hamburger.

### 7.2 Cabeçalho

`CabecalhoApp rotuloPerfil=""` → selo cinza **Cliente**. Nome **Leandro Mendes**. **Sair** já navega ao login.

### 7.3 Coluna esquerda (prints Tela 1–6)

1. **Botão** `primario` `bloco`: **+ Novo chamado**. Continua primário com o formulário aberto (`aria-pressed` quando `vista === 'novo'`).
2. Rótulo **MEUS CHAMADOS** — `--texto-rotulo-secao` (12px / 600, uppercase, `--cor-texto-secundario`).
3. Lista, **mais recentes primeiro** por `aberto_em` decrescente (CONTEXTO §6). Empate: `numero` decrescente.
4. Cada item é `<button type="button">` (cartão):
   - Fundo branco; raio **14px**; padding ~12–14px 16px; hover `--cor-hover-linha` / `#F1F5F9`; selecionado `--cor-selecao` (`#E8F2FF`).
   - Título 600 14px, ellipsis, `--cor-texto-principal`.
   - Linha inferior: **Selo** `status-preenchido` à esquerda (`formatarRotuloStatus`) + texto de prazo à direita (12–13px, secundário), conforme §5.2.
5. Vazio: **Você ainda não abriu chamados.**
6. Scroll da lista: barra fina (mesmo critério da fila do consultor, tokens `--cor-texto-terciario`).

**Proibido no cartão:** prioridade, grupo, categoria, ponto de não-lido de consultor, faixa vermelha de SLA, “Sem responsável” azul da fila.

### 7.4 Painel do chamado — detalhe (prints Tela 1–5)

**Cabeçalho**

- Título 700 20px (`--texto-titulo-tela` / `--texto-titulo-cartao`). É o `<h1>` da vista detalhe.
- **Selo** `status-preenchido` no canto superior direito.
- Meta 12–13px secundária: **Chamado #{numero} · aberto em {dd/mm, HH:MM}** (`formatarDataHoraUsuario` em `aberto_em`). O print diz “Chamado #2”; o produto usa `numero` do snapshot, **nunca** o índice da lista.

**Dois blocos** lado a lado (`flex` / `grid` 1fr 1fr, `gap` ~12px; empilham se estreito). Fundo `--cor-superficie-secundaria`, raio 12px, padding ~12px 16px.

| Bloco | Rótulo 12px secundário | Valor 14px/600 |
| --- | --- | --- |
| Responsável | Responsável | Nome do `responsavel_id` em `usuarios`, ou **Aguardando um consultor pegar** se `null` |
| Resposta prevista | Resposta prevista | §5.2 |

**Faixa de etapa** (MUST — CONTEXTO §6). Barra largura total, raio ~10–12px, padding ~10px 14px, ponto 8px + frase 14px. Pares de cor = tokens de status ([cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md) §5.2). **Não** usar só cor: o texto é o conteúdo.

| Status | Fundo / texto | Frase (literal) |
| --- | --- | --- |
| `aberto` | `--status-aberto-*` | Recebemos seu chamado. Um consultor vai assumir em breve. |
| `em_atendimento` | mesmo par azul | **{nome do responsável} está cuidando do seu chamado.** (nome completo do snapshot). Sem responsável: **Um consultor está cuidando do seu chamado.** |
| `aguardando_cliente` | `--status-aguardando-*` | Precisamos de uma resposta sua para continuar. |
| `resolvido` | `--status-resolvido-*` | Resolvido. Confirme se está tudo certo ou reabra se precisar. |
| `fechado` | — | **Não renderiza** a faixa |

**HISTÓRICO** — rótulo uppercase 11px / 600 / `letter-spacing: 0.05em` / secundário. Abaixo, a thread (§10.1):

- Mensagens do **cliente logado** à **direita**, fundo `--cor-primaria`, texto branco.
- Mensagens de **suporte** (qualquer consultor) à **esquerda**, cinza `--conversa-cliente-fundo`.
- Sistema (`autor_id` de `AUTOR_SISTEMA_ID`) ao centro, itálico, sem fundo.
- `interna: true` **fora**. `mensagensPublicasDoChamado` / `linhaTempoPublicaDoChamado` já fazem esse recorte — reutilizar a regra, não o layout de `ListaConversa` do consultor.
- Cabeçalho do balão (prints Tela 2): **{Nome} · {dd/mm, HH:MM}**, 11px/600, **dentro** do balão. Sistema **sem** esse cabeçalho.

Não usar `BlocoDescricaoChamado` neste painel: a abertura vira balão (e o snapshot já traz mensagens). Duplicar a descrição no topo quebraria o print.

Área da thread: `flex: 1; min-height: 160px; overflow: auto`.

**Rodapé — chamado ativo** (`aberto`, `em_atendimento`, `aguardando_cliente`):

- **CampoTextarea** placeholder **Escreva uma mensagem…**, `rows` ~3. Label visível **ou** `rotulo` associado (o print não mostra label extra — usar o rótulo acessível “Mensagem” / “Escreva uma mensagem” sem inventar linha que o PNG não tem; se o CampoTextarea atual **sempre** mostra label, o rótulo curto **Mensagem** é aceitável).
- **Botão** `primario` **Enviar**, alinhado à direita, `disabled` se trim vazio → `enviarMensagemCliente`.
- Sem legenda “Esta mensagem será enviada ao cliente.” (isso é copy do **consultor**). Sem checkbox de nota interna.

**Rodapé — concluído** (sem textarea):

| Status | Texto | Ação |
| --- | --- | --- |
| `resolvido` | Este chamado foi resolvido. Se o problema voltar, você pode reabri-lo. | **Reabrir chamado** (`secundario`) |
| `fechado` | Este chamado foi fechado. O problema voltou? | **Reabrir chamado** (`secundario`) |

Textos centralizados; botão centralizado abaixo, como os prints Tela 3 e Tela 5.

**Painel fechado:** o cartão direito inteiro usa fundo `--cor-superficie-muda` (`#F8FAFC`) e borda `--cor-borda` (`#E2E8F0`). `resolvido` permanece branco.

### 7.5 Formulário de reabertura (CONTEXTO §6, sem print nesta pasta)

Ao clicar **Reabrir chamado**, o rodapé **substitui** o par texto+botão por:

- **CampoTexto** (ou textarea curta) `rotulo` **Motivo da reabertura**, obrigatório.
- **Cancelar** (`secundario`) — fecha o form, volta ao rodapé concluído.
- **Reabrir chamado** (`primario`) — `disabled` sem motivo trim; ao confirmar emite `alterarStatus(chamadoId, statusAtual, 'aberto', motivo)` e fecha o form.

Não pedir status de destino: sempre `aberto`. Não zerar `responsavel_id` (o redutor de `status.alterado` não desatribui). Sem modal.

### 7.6 Vista abrir chamado (print Tela 6)

Substitui o painel direito (a lista permanece).

| Elemento | Spec |
| --- | --- |
| Título `<h1>` | **Abrir chamado** — 700 20px |
| Subtítulo | **Conte o que aconteceu. Um consultor responderá dentro do prazo informado após a abertura.** — 14px secundário |
| Assunto | **CampoTexto** `rotulo="Assunto"`, placeholder **Ex.: Não consigo acessar o e-mail** |
| Descrição | **CampoTextarea** `rotulo="Descrição"`, `rows={5}`, placeholder **O que você estava fazendo e o que apareceu na tela?** |
| Ações | à direita: **Cancelar** (`secundario`) · **Enviar chamado** (`primario`, `disabled` até os dois trim ≠ `''`) |

Submit → `abrirChamado` → `vista = 'detalhe'` e `chamadoSelecionadoId` = id novo (topo da lista). Sem toast.

**Proibido no formulário:** select de categoria, grupo, prioridade, SLA, anexos.

---

## 8. Comportamento e regras de negócio

### 8.1 Seleção

- Entrar na rota: primeiro chamado da lista ordenada, se houver.
- Lista vazia: não quebra; CTA é **+ Novo chamado**.
- Selecionar item: fecha form de reabertura e form de novo chamado.

### 8.2 Enviar mensagem

- Só com chamado ativo e texto trim.
- `enviarMensagemCliente` já existente (`interna: false`).
- **Não** muda status automaticamente (nem de `aguardando_cliente` para `em_atendimento`). O consultor faz isso na outra rotina.

### 8.3 Abrir chamado

Ver §5.3. Depois do sucesso, o item novo aparece no topo **sem F5**.

### 8.4 Reabrir

- Permitido em `resolvido` e `fechado` (`selecionarTransicoesStatus` já lista `aberto`).
- Motivo obrigatório. Evento `status.alterado`.
- Mensagem de sistema do redutor entra no HISTÓRICO (pública). A faixa passa a ser a de `aberto`.

### 8.5 O que o cliente nunca vê (MUST testar)

- Qualquer `interna: true` (lista, detalhe, notificação, contagem).
- Palavras categoria, grupo, prioridade, SLA, “estourado”, “urgente”, “Fila do grupo”.
- Painel amarelo de notas, botão Status, Pegar chamado, Redistribuir.
- Toast.

### 8.6 Eventos na store com a tela aberta

A UI é derivada. Testes RTL **devem** chamar `aplicarEvento` / `atribuirChamado` / `enviarMensagemCliente` **depois** do render e assertir que faixa, responsável e HISTÓRICO mudam **sem** remount. Isso cumpre “mudanças de outras pessoas refletem na UI” sem timer.

---

## 9. Microcopy (literal — MUST onde indicado)

| Uso | Texto |
| --- | --- |
| Selo cabeçalho | Cliente |
| Sair | Sair |
| Botão lista | + Novo chamado |
| Rótulo lista | MEUS CHAMADOS |
| Lista vazia | Você ainda não abriu chamados. |
| Sem dono (painel) | Aguardando um consultor pegar |
| Lista `aguardando_cliente` | Aguardando você |
| Lista prazo futuro | Resposta até {HH:MM} |
| Lista prazo passado | Resposta em breve |
| Blocos | Responsável · Resposta prevista |
| Prevista passada | Em breve |
| Prevista concluída | — |
| Meta | Chamado #{numero} · aberto em {data} |
| Faixas | §7.4 |
| HISTÓRICO | HISTÓRICO |
| Textarea ativo | Escreva uma mensagem… |
| Enviar | Enviar |
| Rodapé resolvido | Este chamado foi resolvido. Se o problema voltar, você pode reabri-lo. |
| Rodapé fechado | Este chamado foi fechado. O problema voltou? |
| Reabrir (botão) | Reabrir chamado |
| Motivo | Motivo da reabertura |
| Cancelar | Cancelar |
| Form novo título | Abrir chamado |
| Form novo subtítulo | Conte o que aconteceu. Um consultor responderá dentro do prazo informado após a abertura. |
| Assunto / placeholder | Assunto · Ex.: Não consigo acessar o e-mail |
| Descrição / placeholder | Descrição · O que você estava fazendo e o que apareceu na tela? |
| Submit novo | Enviar chamado |
| Status (selos) | Aberto · Em atendimento · Aguardando cliente · Resolvido · Fechado (`formatarRotuloStatus`) |

Pontuação e reticências dos placeholders são contrato (como no login: `Ex.:` com ponto).

---

## 10. Arquitetura de arquivos sugerida

```
src/
  app/
    store.ts                         # + abrirChamado
    Rotas.tsx                        # TelaCliente no lugar de PlaceholderCliente
  dominio/
    abrir-chamado-cliente.ts         # monta Chamado + 1ª mensagem (puro)
    abrir-chamado-cliente.test.ts
    formatar-data.ts                 # + formatarHoraUsuario
  features/
    chamados/
      BalaoMensagem.tsx              # presentacional: tipoVisual + corpo + cabecalho?
      regras/
        tipo-visual-balao.ts         # consultor/gestor — não usar na rotina cliente
        linha-tempo-conversa.ts      # reusar recorte público
        mensagens-chamado.ts         # reusar filtro interna
    cliente/
      TelaCliente.tsx                # cabeçalho, vista detalhe|novo, seleção
      TelaCliente.css
      TelaCliente.test.tsx
      ColunaMeusChamados.tsx
      PainelChamadoCliente.tsx
      FormularioNovoChamado.tsx
      RodapeMensagemCliente.tsx      # textarea + Enviar / rodapé concluído + reabrir
      lista-cliente.ts               # ordenar lista; não desenha
      texto-prazo-cliente.ts         # lista + resposta prevista
      faixa-etapa-cliente.ts         # frase e se há faixa; não desenha
      tipo-visual-balao-cliente.ts   # eu × suporte × sistema
      lista-cliente.test.ts
      texto-prazo-cliente.test.ts
      faixa-etapa-cliente.test.ts
      tipo-visual-balao-cliente.test.ts
```

**Proibido:** ler `dados.json` / `snapshotInicial` na feature de UI. Store e testes de montagem já fazem isso.

**Substituir:** `PlaceholderCliente.tsx` por `TelaCliente` em `Rotas.tsx`. Remover o placeholder quando a rota apontar para a tela nova.

**Não copiar** `PainelChamado.tsx`, `RodapeRespostaCliente.tsx` nem `ColunaFila.tsx`. Copy, grade e campos internos são outros.

### 10.1 Conversa do cliente (dois lados)

`ListaConversa` + `tipoVisualBalao` resolvem **consultor/gestor** (solicitante = cinza esquerda). No cliente logado isso deixaria as **próprias** mensagens cinza à esquerda — falha de aceite.

| Camada | Onde | Responsabilidade |
| --- | --- | --- |
| Recorte puro | `linhaTempoPublicaDoChamado` / `mensagensPublicasDoChamado` | Já exclui `interna: true` e mescla sistema do histórico |
| Mapper visual | `tipo-visual-balao-cliente.ts` | sistema → `sistema`; `autor === usuarioLogado.id` → `logado` (azul direita); demais pessoas → estilo cinza esquerda (reusar classe `balao--cliente` **só como pele cinza**, não como “é o solicitante”) |
| Balão | `BalaoMensagem` | Presentacional. Aceitar `tipoVisual` (e `cabecalho` opcional). **Não** chamar `tipoVisualBalao` por dentro se isso impedir o mapper do cliente — a lista do consultor passa a calcular o tipo e passar por prop |
| Composição | `PainelChamadoCliente` | Monta HISTÓRICO + `BalaoMensagem`; **não** chama a store |

Mutação sobe: `aoEnviarMensagem`, `aoReabrir`, `aoAbrirChamado`. Peças de conversa **não** importam `useStore`.

Cabeçalho do balão: MUST no cliente. Preferir prop `cabecalho` em `BalaoMensagem` (Nome · data). Sistema: sem cabeçalho. Consultor/gestor **podem** passar a prop depois (débito do CONTEXTO §9); este PRD não exige redesenhar a fila do consultor, só não quebrar testes existentes. Se a refatoração de props quebrar `ListaConversa`, ajustar a lista do consultor para o contrato novo **sem** mudar o visual dela se `cabecalho` for omitido.

### 10.2 JSDoc (MUST)

Todo `Tela*.tsx`, painel, coluna e `.ts` de regra em `features/cliente` leva bloco JSDoc **acima** do `export` principal, em português: o que orquestra/desenha/transforma, estado local, eventos que dispara, e o que **não** fica ali (vizinhos em crase). Não copiar tipos.

---

## 11. Acessibilidade (MUST)

| Item | Requisito |
| --- | --- |
| Título | Um `<h1>` visível: título do chamado **ou** “Abrir chamado” |
| Lista | Cada cartão é botão; `aria-current="true"` (ou `aria-pressed`) no selecionado; Enter seleciona |
| Novo chamado | `aria-pressed` quando o formulário está aberto |
| Campos | `rotulo` associado (`htmlFor` / `id`); Enviar / Enviar chamado / Reabrir com motivo vazio ficam `disabled`, não alertas vermelhos obrigatórios |
| Erro | Se validar no submit por algum motivo, texto `--cor-erro` + `role="alert"` — sem toast |
| Faixa | Texto sempre presente (WCAG 1.4.1) |
| Thread | `role="log"` `aria-live="polite"` (já usado em `ListaConversa`) |
| Foco | Visível; ordem: lista → detalhe → textarea → Enviar |
| Fechado | Contraste do painel `#F8FAFC` / `#0F172A` permanece AA |

---

## 12. Testes (MUST)

Funções puras com `meta.agora` fixo (`2026-11-03T13:00:00Z` ou fixture):

| Caso | Esperado |
| --- | --- |
| Ordenar por `aberto_em` | mais novo primeiro |
| `aguardando_cliente` | lista = **Aguardando você** |
| Ativo, `prazo_primeira_resposta` > agora | **Resposta até** + hora no fuso do usuário |
| Ativo, prazo < agora | **Resposta em breve** / painel **Em breve** |
| `resolvido` / `fechado` | lista sem prazo; painel **—** |
| Faixa `aberto` / `em_atendimento` / `aguardando_cliente` / `resolvido` | frases literais §7.4 |
| Faixa `fechado` | função retorna ausência de faixa |
| `tipoVisualBalaoCliente` | mensagem do logado → `logado`; consultor → pele cinza esquerda; sistema → `sistema` |
| `abrir-chamado-cliente` | `status` aberto, `prioridade` media, `responsavel_id` null, `grupo_id` Infraestrutura, `numero` sequencial, textos **não** copiados de outro chamado do JSON, prazos = agora + sla media |
| `interna: true` | fora da lista pública |

RTL da tela (Leandro na store via `iniciarSessao` **ou** tenant mínimo):

1. Renderiza selo **Cliente**, nome **Leandro Mendes**, botão **+ Novo chamado**, rótulo **MEUS CHAMADOS**.
2. Não renderiza “categoria”, “Infraestrutura”, “prioridade”, “Estourado”, “Notas internas”, “Pegar chamado”.
3. Selecionar um `em_atendimento` mostra a faixa com o **nome do responsável** e HISTÓRICO sem notas internas (plantar uma `interna: true` no tenant de teste e garantir que o corpo **não** aparece).
4. Textarea vazia → **Enviar** `disabled`; com texto → chama `enviarMensagemCliente`.
5. Chamado `fechado`: painel sem faixa, texto **Este chamado foi fechado. O problema voltou?**, **Reabrir chamado**; **Confirmar** do motivo `disabled` até digitar; confirmar chama `alterarStatus` para `aberto`.
6. **+ Novo chamado** mostra **Abrir chamado** e o subtítulo literal; **Enviar chamado** `disabled` com um campo vazio; submit chama `abrirChamado` e o novo título entra na lista.
7. **Cancelar** no form novo volta ao detalhe anterior.
8. Depois do render, `aplicarEvento` de `chamado.atribuido` no chamado aberto de teste atualiza responsável e faixa **sem** remount.
9. Reaplicar o mesmo `evento.id` não duplica linha do HISTÓRICO.

Atualizar `Rotas.tsx` / testes de rota se ainda procurarem “Área do cliente”.

---

## 13. Critérios de aceite

### Visual

1. [ ] Os seis prints foram comparados com os estados correspondentes.
2. [ ] Coluna esquerda: botão primário, MEUS CHAMADOS, cartões soltos (não um único card da fila).
3. [ ] Selo do cabeçalho é **Cliente**. Nome é **Leandro Mendes**.
4. [ ] Faixas azul / âmbar / verde e ausência no fechado batem com os prints.
5. [ ] Fechado: fundo `--cor-superficie-muda` no painel. Resolvido: fundo branco + faixa verde.
6. [ ] Balões: cliente direita azul com cabeçalho; suporte esquerda cinza; Enviar à direita.

### Funcional

7. [ ] Lista = todos os chamados do solicitante na sessão, ordenados por `aberto_em`.
8. [ ] Relógio = `meta.agora`. Datas no `zoneinfo` do usuário.
9. [ ] Cliente não vê categoria, grupo, prioridade, SLA interno nem `interna: true`.
10. [ ] Abrir chamado emite `chamado.aberto` + primeira `mensagem.adicionada`; prioridade media; sem dono; grupo Infraestrutura.
11. [ ] Enviar usa `enviarMensagemCliente`. Reabrir usa `alterarStatus` → `aberto` com motivo.
12. [ ] Evento aplicado com a tela aberta atualiza UI; duplicata de `id` não duplica.

### Código

13. [ ] `PlaceholderCliente` saiu da rota.
14. [ ] Cálculos em `.ts` puro; JSX sem `formatarTextoPrazoConsultor`.
15. [ ] Sem `ListaConversa` do consultor como caixa-preta de alinhamento; mapper cliente separado.
16. [ ] JSDoc nos módulos da feature. Lint de sintaxe (`&&`, sem ternário no `.map()`, testes sem `if`).
17. [ ] Hex só em tokens. Sem dependência nova.
18. [ ] `lint`, `test` e `build` verdes.

---

## 14. Ordem sugerida

1. Funções puras + testes (`lista-cliente`, `texto-prazo-cliente`, `faixa-etapa-cliente`, `tipo-visual-balao-cliente`, `abrir-chamado-cliente`, `formatarHoraUsuario`).
2. `abrirChamado` na store (dois eventos).
3. Ajuste mínimo de `BalaoMensagem` para receber `tipoVisual` / `cabecalho` sem regressão no consultor.
4. `ColunaMeusChamados` + `TelaCliente` no lugar do placeholder (lista + seleção).
5. `PainelChamadoCliente` (cabeçalho, blocos, faixa, histórico, rodapé ativo).
6. Rodapé concluído + form de motivo.
7. `FormularioNovoChamado`.
8. RTL da tela + evento ao vivo + invisibilidade de nota interna.
9. Passagem visual contra os seis prints.

---

## 15. Riscos e decisões

| Tema | Decisão |
| --- | --- |
| Helena Duarte / Marina Costa / #2 no print | Aparência só. Dado = sessão de Leandro |
| `prazo_resolucao` vs primeira resposta | Cliente vê **primeira resposta**. Consultor continua no prazo de resolução |
| Snapshot sem `aberto` sem dono | Cobre via **+ Novo chamado** e fixture de teste. Não alterar `dados.json` |
| `ListaConversa` reusada como está | **Não** — quebraria o lado dos balões. Recorte de mensagens sim; mapper não |
| `RodapeRespostaCliente` | Copy e fluxo do consultor. Cliente tem `RodapeMensagemCliente` |
| Timer de simulação | Fora. Teste aplica evento depois do render |
| Reabertura zera responsável | **Não.** Só `status.alterado` → `aberto` |
| Mensagem do cliente muda `aguardando_cliente` | **Não** neste PRD |
| Categoria oculta na criação | Gravada (primeira do grupo Infra) para o modelo; nunca desenhada |
| CONTEXTO “SLA 8h” vs tabela `sla` | Tabela vence: media = 8h primeira resposta / 24h resolução (`AGENTS.md`) |
| Label visível no textarea do detalhe | Print não mostra label; acessibilidade exige nome. Rótulo curto **Mensagem** se o Campo obrigar label visível |
| Deep link `/cliente/:id` | Não. Estado local |
| Página rola vs colunas rolam | Colunas rolam; página não (mesmo espírito do consultor, volume maior que o print) |
| Cabeçalho no balão do consultor | Opcional neste PRD (`cabecalho` omitido = visual atual) |

---

## 16. Checklist manual para o implementador (prints)

Abrir os PNGs em `PRDs/prints-tela-cliente/` e validar:

- [ ] **Tela 1** — item selecionado azul-claro; dois blocos cinza; faixa azul com ponto; Enviar cinza/desabilitado com campo vazio.
- [ ] **Tela 2** — faixa com nome do consultor do **snapshot**; conversa dois lados; cabeçalho dentro do balão.
- [ ] **Tela 3** — faixa verde; **—** em Resposta prevista; rodapé de resolvido; sem textarea.
- [ ] **Tela 4** — faixa âmbar; **Aguardando você** na lista; textarea presente.
- [ ] **Tela 5** — painel cinza; sem faixa; rodapé de fechado.
- [ ] **Tela 6** — formulário; nenhum cartão selecionado; Enviar chamado desabilitado até preencher.

Divergências corrigidas antes de merge. Dados exibidos vêm do **snapshot real**, não do protótipo HTML.

---

## 17. Referências cruzadas

- Sessão cliente no login: [tela-login.md](./tela-login.md) §7.5.3
- Layout e microcopy cliente: `service-hub-design-prototype/CONTEXTO-SERVICE-HUB.md` §6
- Cabeçalho comum: mesmo arquivo §5
- Cores da faixa e da conversa: [cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md) §5.2 e §5.6
- Botão / Campo / Selo: [componentes-compartilhados.md](./componentes-compartilhados.md)
- Eventos e notas internas: `AGENTS.md` + CONTEXTO §3
- Reuso **proibido** de layout: [tela-consultor.md](./tela-consultor.md) (a conversa do consultor é outro papel visual)
