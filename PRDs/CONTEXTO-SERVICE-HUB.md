# Service Hub — Contexto de produto, regras de negócio e especificação visual

Documento de contexto para um agente implementar o front do Service Hub (React + TS + Vite). Compila o que foi decidido no **design** (layout, fluxos, microcopy). Os prints estão em `prints/`; o protótipo navegável de referência está em `prototipo/Service Hub.dc.html` (+ `Botao`, `Campo`, `Conversa`, `support.js`) — abra no navegador para ver **comportamento e aparência**, não para copiar dados.

Convenções deste documento: **MUST** = obrigatório; *pode* = sugestão. Termos de domínio em português (chamado, mensagem, prazo, fila, nota interna, grupo).

Regras técnicas e de código compartilhadas com [AGENTS.md](../AGENTS.md) e [README.md](../README.md).

---

## 1. Produto em uma frase

Central de chamados de TI. Cliente abre chamado; consultor atende a fila do seu grupo; gestor acompanha a equipe e os prazos. Três rotinas, **três telas separadas** — nunca uma tela com `if` por perfil.

## 2. Restrições técnicas e fonte de dados

### Fonte de dados (MUST)

| Fonte | Uso |
| --- | --- |
| **`src/data/dados.json`** | Único tenant da aplicação: usuários, chamados, mensagens, grupos, categorias, SLA, `meta.agora` |
| **Protótipo HTML + prints** | Referência **visual** e de fluxo; dataset **fictício** (Claude Design, sem acesso ao JSON real) |

Não usar nomes, IDs, volumes ou histórias do protótipo na implementação. Exibir sempre o que o snapshot fornece (nomes, `#numero`, contagens, conversas).

### Demais restrições (AGENTS)

- Sem API, WebSocket ou autenticação real.
- **Relógio de SLA = `meta.agora` do snapshot**, nunca o relógio da máquina (valor atual no JSON: ver `meta.agora` em `src/data/dados.json`).
- Datas em UTC no dado; exibir no fuso do usuário logado (`usuarios[].zoneinfo` e `locale` pt-BR / pt-PT — equivalente a `Intl.DateTimeFormat` com `timeZone`).
- Mudanças de outras pessoas chegam por **eventos simulados** no mesmo formato do domínio e são **idempotentes** (reaplicar um evento com o mesmo `id` não duplica nada).
- Exemplo obrigatório: consultor logado na fila recebe um `chamado.aberto` enquanto a tela está aberta e o chamado aparece na lista sem recarregar.
- Stack: React, TypeScript, Vite, Vitest, RTL. Sem dependências novas se o código direto resolve. Sem toasts.
- Componentes reutilizáveis obrigatórios em `shared/components`: **Botão**, **Campo** (input/textarea/select), **Conversa** (lista de balões), **Selo** (status/prazo). Nenhum deles conhece regra de chamado.

## 3. Domínio

### Modelo do snapshot (`src/data/dados.json`)

Coleções principais: `meta`, `grupos`, `categorias`, `sla`, `usuarios`, `chamados`, `mensagens`, `historico`.

**Chamado (registro):** `id`, `numero`, `titulo`, `descricao`, `categoria_id`, `grupo_id`, `prioridade`, `status`, `solicitante_id`, `responsavel_id` (null = sem dono), `aberto_em`, `prazo_primeira_resposta`, `prazo_resolucao`, …

**Mensagem:** `id`, `chamado_id`, `autor_id`, `texto`, `criada_em`, `interna`

**Usuário:** `id`, `nome`, `perfil` (`gestor` | `consultor` | `cliente`), `grupo_id` (consultores), `locale`, `zoneinfo`, …

**Grupo:** `Infraestrutura` | `Aplicações` (via `grupos[].nome`).

Na UI, juntar `chamados` + `mensagens` + lookups de `usuarios` / `categorias` / `grupos` na camada `dominio/` — não é obrigatório persistir o formato simplificado do protótipo HTML.

### Status, prioridade e SLA

- **Status:** `aberto` · `em_atendimento` · `aguardando_cliente` · `resolvido` · `fechado`.
  Rótulos: Aberto · Em atendimento · Aguardando cliente · Resolvido · Fechado.
- **Ativo** = status ≠ `resolvido` e ≠ `fechado`. **Concluído** = `resolvido` ou `fechado`.
- **Prioridade:** `baixa` · `media` · `alta` · `critica` (rótulos: baixa, média, alta, crítica).
- **SLA:** tabela `sla[]` (`primeira_resposta_horas`, `resolucao_horas` por prioridade). Chamados existentes trazem `prazo_primeira_resposta` e `prazo_resolucao` já calculados; ao **abrir** chamado novo, derivar prazos a partir de `meta.agora` + linha `sla` da prioridade escolhida (padrão `media` se o cliente não escolhe prioridade).

### Cálculos (só na leitura)

- Para **consultor/gestor** (urgência na fila): `restante = prazo_resolucao − meta.agora`.
- Para **cliente** (linguagem amigável): usar `prazo_primeira_resposta` na “Resposta prevista” / “Resposta até HH:MM”; nunca mostrar “estourado” nem contagem crua de SLA.
- Faixas de prazo (chamados ativos, visão consultor/gestor):
  - `restante < 0` → **Estourado há Xh Ymin** (vermelho escuro `#B91C1C`, texto branco)
  - `0 ≤ restante < 1h` → **Vence em Xmin** (vermelho `#DC2626`, texto branco)
  - `1h ≤ restante < 4h` → **Vence em Xh Ymin** (âmbar fundo `#FEF3C7`, texto `#92400E`)
  - `≥ 4h` → **Prazo em Xh Ymin** (cinza fundo `#F1F5F9`, texto `#334155`)
  - Concluído → selo do status em vez do prazo (ou "—").
- Formato de duração: `2h 21min`, `36min`.
- Consultor "ocioso" = zero chamados ativos com `responsavel_id` = id do consultor. **Não** existe coluna “carga” nem estado “sobrecarregado” na UI (não inventar métricas que o snapshot não sustenta).

### Nota interna

**`interna: true`:** só consultor e gestor veem. **Nunca** aparece para o cliente — nem na lista, nem no detalhe, nem em contagem/notificação.

### Eventos

| `tipo` | payload | efeito no estado |
| --- | --- | --- |
| `chamado.aberto` | chamado completo | insere no topo se `id` não existe |
| `chamado.atribuido` | `chamado_id`, `consultor_id` | seta `responsavel_id`; se status era `aberto` vira `em_atendimento`; adiciona mensagem de sistema "Chamado atribuído a {nome}" |
| `mensagem.adicionada` | mensagem completa + `chamado_id` | anexa se `mensagem.id` não existe |
| `status.alterado` | `chamado_id`, `de`, `para`, `motivo`, `usuario_id` | muda status; adiciona mensagem de sistema "Status: {De} → {Para}. Motivo: {motivo}" |

- Toda ação do usuário (pegar, responder, anotar, mudar status, reabrir, redistribuir, abrir chamado) **emite um evento local** e passa pelo mesmo redutor — não há caminho separado.
- Idempotência: guardar `ids` de eventos aplicados; ignorar repetidos. Testar: SLA, nota interna invisível ao cliente, evento duplicado, reabertura.
- Simulação sugerida (após login de consultor): `chamado.aberto` aos 7s, `mensagem.adicionada` em um chamado existente aos 12s, e o **mesmo** `chamado.aberto` reenviado aos 14s (deve ser ignorado).
- Chamado que recebe novidade (novo chamado ou mensagem não interna) enquanto **não** está selecionado ganha marcador "não lido" (ponto azul) na lista; o marcador some ao abrir.

## 4. Login (escolha de perfil)

Print: `Tela de login.png`.

- Cartão centralizado (max 400px, fundo branco, raio 20px, sombra suave). Logo "S" em quadrado azul + "Service Hub". Título **Entrar**, subtítulo "Central de chamados de TI. Digite seu usuário para continuar."
- **Um campo "Usuário", sem senha**, botão primário **Entrar** (largura total). Enter no formulário também entra.
- Abaixo, caixa cinza "Perfis disponíveis:" com um usuário por linha, nesta ordem: `gestor`, `consultor-infraestrutura`, `consultor-aplicacoes`, `cliente`.
- Mapeamento (case-insensitive, trim) para usuários do snapshot — ver tabela em AGENTS.md. **Sem** alias `consultor`:
  - `gestor` → gestor logado (Ricardo Monteiro no snapshot)
  - `consultor-infraestrutura` → consultor com `grupo_id` Infraestrutura (Marina Almeida)
  - `consultor-aplicacoes` → consultor com `grupo_id` Aplicações (Beatriz Lima)
  - `cliente` → cliente logado (Helena Fernandes — persona do teste técnico, Lisboa / pt-PT)
- Usuário inválido: texto vermelho sob o campo "Usuário não encontrado. Use cliente, consultor-infraestrutura, consultor-aplicacoes ou gestor." Sem toast.

## 5. Cabeçalho comum (telas logadas)

Barra branca com borda inferior `#E2E8F0`: logo + "Service Hub" (nowrap) + selo cinza com o perfil ("Cliente", "Consultor · Infraestrutura", "Consultor · Aplicações", "Gestor"). À direita, **nome** do usuário do snapshot e botão secundário **Sair**.

---

## 6. Fluxo do CLIENTE

Prints: `Cliente - Tela 1 - Chamado aberto.png`, `Cliente -  Tela 2 - Em atendimento.png`, `Cliente - Tela 3 - Chamado resolvido.png`, `Cliente - Tela 4 - Aguardando cliente.png`, `Cliente - Tela 5 - Chamado fechado.png`, `Cliente - Tela 5 - Criar chamado.png`.

Persona (teste técnico): Helena — poucos chamados por ano; quer saber se alguém pegou, quando terá resposta e o que mudou, **sem reler tudo**. Não sabe o que é categoria, grupo ou prioridade — **não mostrar**.

### Layout
Duas colunas: esquerda (280–360px) e painel do chamado à direita (`minmax(0,1fr)`).

### Coluna esquerda
- Botão primário largura total **+ Novo chamado**.
- Rótulo "MEUS CHAMADOS" (12px, uppercase, `#334155`).
- Lista dos chamados do `solicitante_id` logado, mais recentes primeiro. Cada cartão (branco, raio 14px, hover `#F1F5F9`, selecionado `#E8F2FF`): título (600, 14px); linha com **selo de status preenchido** e, à direita, texto curto de prazo:
  - `aguardando_cliente` → "Aguardando você"
  - ativo com prazo no futuro → "Resposta até HH:MM"
  - ativo estourado → "Resposta em breve" (cliente **nunca** vê "estourado" nem contagem de SLA)
  - concluído → vazio.

### Painel do chamado (detalhe)
- Cabeçalho: título (700, 20px), "Chamado #{numero} · aberto em dd/mm, HH:MM", selo de status preenchido à direita.
- Dois blocos cinza (`#F1F5F9`, raio 12px): **Responsável** (nome do `responsavel_id` ou "Aguardando um consultor pegar") e **Resposta prevista** (a partir de `prazo_primeira_resposta`; "Em breve" se passou; "—" se concluído).
- **Aviso de etapa** (faixa colorida com ponto + frase, na cor do status) — resumo “de bater o olho” do que mudou, alinhado à persona do teste:
  - aberto → azul: "Recebemos seu chamado. Um consultor vai assumir em breve."
  - em_atendimento → azul: "{Nome do responsável} está cuidando do seu chamado."
  - aguardando_cliente → âmbar: "Precisamos de uma resposta sua para continuar."
  - resolvido → verde: "Resolvido. Confirme se está tudo certo ou reabra se precisar."
  - fechado → sem faixa (ver rodapé abaixo).
- Rótulo "HISTÓRICO" + componente **Conversa** ocultando `interna: true`. Mensagens do cliente à direita em azul primário; do suporte à esquerda em cinza; mensagens de sistema centralizadas em itálico.
- **Rodapé quando ativo:** textarea "Escreva uma mensagem…" + botão primário **Enviar** (desabilitado se vazio). Enviar emite `mensagem.adicionada`.
- **Rodapé quando concluído:** texto centralizado — fechado: "Este chamado foi fechado. O problema voltou?"; resolvido: "Este chamado foi resolvido. Se o problema voltar, você pode reabri-lo." Abaixo, botão secundário **Reabrir chamado**. Ao clicar, aparece o campo "Motivo da reabertura" + botões **Cancelar** / **Reabrir chamado** (primário, desabilitado sem motivo). Reabrir emite `status.alterado` para `aberto`.
- **Chamado fechado:** o painel inteiro muda para fundo `#F8FAFC` com borda `#E2E8F0` (resolvido mantém fundo branco).

### Novo chamado
Substitui o painel: título "Abrir chamado", subtítulo explicativo, campos **Assunto** e **Descrição** (textarea 5 linhas), botões **Cancelar** (secundário) e **Enviar chamado** (primário, desabilitado até ambos preenchidos). Cria chamado `aberto`, prioridade `media`, prazos pela tabela `sla`, `grupo_id` coerente com a categoria default (sem categoria explícita na UI do cliente → Infraestrutura), sem `responsavel_id`, com a descrição como primeira mensagem; seleciona o novo chamado.

---

## 7. Fluxo do CONSULTOR

Prints: `Consultor - Tela 1.png`, `Consultor - Tela 2 - Adicionar status ao chamado.png`, `Consultor - Tela 3 - Aba de chamados concluídos.png`, `Consultor - Tela 4 - Notas de chamado.png`, `Consultor - Tela 5 - Aba sem dono com botão Pegar chamado.png`.

Persona (teste técnico): Marina — muitos chamados atribuídos + fila do grupo. Precisa achar de imediato o que está prestes a estourar. A tela deve ser **escalável, organizada e com pouca informação simultânea**; funcionalidades opcionais ficam escondidas até serem chamadas.

**Grupo:** tudo filtrado pelo `grupo_id` do consultor logado (`consultor-infraestrutura` ≠ `consultor-aplicacoes`).

### Layout
Grid de altura fixa `calc(100vh − cabeçalho)`:
- Coluna da **fila** à esquerda: `minmax(380px, 460px)` (encolhe para `minmax(320px,380px)` quando o painel de notas está aberto).
- Área do **chamado** à direita: `minmax(260px,1fr)`; quando notas abertas, grid interno `minmax(260px,1fr) minmax(220px,0.55fr)`.
- Cada coluna rola **internamente**; a página não rola.

### Fila (cartão branco)
1. Título **Fila** + resumo em 12px: "{Grupo} · N atribuídos · N sem dono · N urgentes".
2. **Abas** (texto 13px, sublinhado 2px azul na ativa, contagem só na aba ativa, quebram linha se faltar espaço), nesta ordem e com estas regras **MUST**:
   - **Minha fila** — ativos com `responsavel_id` = consultor logado.
   - **Fila do grupo** — ativos com responsável = **outro** consultor do **mesmo** `grupo_id`.
   - **Concluídos** — resolvidos/fechados do consultor logado, mais recentes primeiro.
   - **Sem dono** — ativos sem `responsavel_id` e com `grupo_id` do consultor logado.
   - Trocar de aba reseta o filtro para "Todos".
3. Linha com **busca** ("Buscar chamado": assunto, cliente ou número) e **select de filtro** com contagens: Todos (n) · Urgentes (n) · Vencem em 4h (n) · Aguard. cliente (n). Na aba Concluídos o filtro não se aplica.
4. **Lista agrupada por prazo**, em ordem (grupos vazios não aparecem):
   - "URGENTES · ESTOURADO OU MENOS DE 1H" (cabeçalho vermelho `#B91C1C`)
   - "PRÓXIMAS 4 HORAS" (âmbar `#92400E`)
   - "DEMAIS, POR PRAZO" (cinza `#334155`)
   - "AGUARDANDO CLIENTE" (cinza) — `aguardando_cliente` **sempre por último**.
   - Dentro de cada grupo, ordenação por `prazo_resolucao` crescente.
   - Na aba Concluídos: "CONCLUÍDOS · MAIS RECENTES PRIMEIRO".
   - Cabeçalho de grupo **sticky** (`top: 0`) na lista rolável.
5. **Item da lista** (grid `auto 1fr auto`, raio 10px, hover `#F8FAFC`, selecionado `#E8F2FF`, sem borda):
   - Faixa vertical de 3px à esquerda: vermelha (urgente), âmbar (< 4h), cinza (demais).
   - Título (600, 14px, ellipsis) precedido de ponto azul 7px se houver novidade não lida.
   - Meta em 12.5px `#334155`: "#{numero} · Cliente · prioridade" (+ " · Nome do colega" na Fila do grupo; + " · aguardando cliente" quando for o caso).
   - À direita: selo de prazo (ou "Com o cliente" cinza para aguardando; selo de status para concluídos) e, abaixo, "Sem responsável" em azul quando não tem dono.
6. Estado vazio: "Nenhum chamado com esses filtros."

### Painel do chamado (cartão branco, cabeçalho / conversa rolável / rodapé)
**Cabeçalho** (borda inferior):
- Título (700, 19px) + selo de status com **borda** (fundo transparente, borda e texto na cor do status). Linha meta: "#{numero} · Cliente · Categoria · Grupo · prioridade X".
- Botões à direita (quebram linha se faltar espaço): **Pegar chamado** (primário, só se sem dono e ativo) · **Status** (secundário; vira primário enquanto o formulário está aberto) · **Notas** / **Notas (n)** (secundário; primário quando o painel está aberto).
- Linha: "Responsável **Nome**" · "Prazo até **dd/mm, HH:MM**" · selo de prazo.
- **Formulário de status** (só quando "Status" está ativo): caixa cinza com select **Novo status**, campo **Motivo (obrigatório)**, botões **Cancelar** e **Confirmar** (desabilitado sem motivo ou se status igual ao atual). Confirmar emite `status.alterado` e fecha o formulário. Reabrir um concluído é mudar o status aqui.

**Conversa** (`flex:1; min-height:180px; overflow:auto`): componente Conversa **sem** notas internas. Cores dos balões:
- cliente → cinza `#F1F5F9`, à esquerda;
- consultor logado → azul `#1582F9` texto branco, à direita;
- **outro consultor** → azul-claro `#E0F2FE` com borda `#BAE6FD`, texto `#0C4A6E`, à direita (lado "suporte");
- sistema → centralizado, itálico, sem fundo.

**Rodapé:**
- Ativo: textarea "Responder ao cliente…", legenda "Esta mensagem será enviada ao cliente." e botão primário **Enviar ao cliente** (desabilitado se vazio).
- Concluído: **sem campo de texto**; texto centralizado "Este chamado foi concluído. Para retomar o atendimento, mude o status."

### Painel de Notas internas (lateral direita, só quando aberto)
- Cartão amarelo `#FEFCE8` com borda `#FDE68A`, título **Notas internas**, subtítulo "Só a equipe vê. O cliente nunca.", botão × para fechar.
- Lista das mensagens `interna: true` do chamado (balões amarelos com borda tracejada, cabeçalho "Nome · anotação interna"), "Nenhuma nota ainda." se vazio.
- Textarea "Anotar para os colegas…" + botão secundário largura total **Salvar nota** (emite `mensagem.adicionada` com `interna: true`).
- Motivo da separação física: evitar que uma nota seja enviada ao cliente por engano. **Nunca** colocar checkbox "interna" no mesmo campo de resposta.

### Cenários a validar com o snapshot (não com o protótipo)

- Chamados de **outro consultor do mesmo grupo** com mensagens públicas e notas internas (para a aba Fila do grupo).
- Chamados **sem dono** no grupo do consultor logado.
- Concluídos atribuídos ao consultor logado.

---

## 8. Fluxo do GESTOR

Prints: `Gestor - Tela 1 - Dashboard inicial.png`, `Gestor - Tela 2 - Detalhe do consultor.png`, `Gestor - Tela 3 - Chat do consultor.png`, `Gestor - Tela 4 - SLA últimas 4h.png`, `Gestor - Tela 5 - Sem responsável.png`.

Persona: Ricardo — equipe de consultores do snapshot. Essencial primeiro; três telas encadeadas.

### Tela 1 — Dashboard (`max-width 1280px`, blocos largura total, gap 24px)
1. Saudação "Bom dia, {primeiro nome do gestor logado}" + linha com data (`meta.agora`) · N chamados ativos · N consultores (`perfil: consultor` no snapshot).
2. **Indicadores** (cards brancos lado a lado, número 30px):
   - **SLA em até 4h** — ativos estourados ou com `restante < 4h` (número vermelho se > 0; borda `#FCA5A5`) → clique abre Tela 2 em modo lista "SLA nas próximas 4h".
   - **Sem responsável** — ativos sem `responsavel_id` (vermelho se > 0) → abre Tela 2 em modo lista "Sem responsável".
   - **Ociosos agora** — consultores com 0 ativos → aplica filtro "Ociosos" na tabela Equipe.
   - Os cards são clicáveis mas **sem** seta/ícone/texto azul; só cursor pointer e leve escurecimento no hover.
   - **Não existem** indicadores "Escalados pelo cliente" nem "Sobrecarregados".
3. **Equipe (N)** — cartão largura total:
   - Título; **abaixo dele** a linha com filtros à esquerda (chips: Todos · Ociosos · Com risco) e, à direita, select "Ordenar: ativos / risco / ociosidade" + busca "Buscar consultor".
   - Tabela (grid `minmax(0,1.6fr) 140px 110px 90px 110px 130px`), cabeçalho uppercase 11px: **Consultor** (avatar com iniciais + nome) · **Situação** (selo "Em atendimento" azul ou "Ocioso" com borda) · **Chamados ativos** (número) · **Em risco** (número vermelho ou "—") · **Ocioso/sem.** (derivado de `historico` + `meta.agora` quando possível; senão "—") · **Ações** (botão secundário **Ver chamados**).
   - **Não há** coluna "Carga"/barra nem estado "Sobrecarregado".
   - Vazio: "Nenhum consultor com esses filtros."

### Tela 2 — Detalhe (consultor ou lista de indicador)
- Botão **← Voltar à equipe**.
- Cabeçalho: para consultor, avatar 56px + nome + "Situação · Grupo" e três números à direita (Ativos, Em risco, Ocioso na semana). Para lista de indicador, título + subtítulo explicativo.
- Cartão "Chamados (n)" com filtros **abaixo do título** (Todos · Em risco · Aguardando cliente).
- Tabela: **Chamado** · **Prazo** (selo) · **Status** (texto cinza `#334155`) · **Responsável** (select; trocar emite `chamado.atribuido`) · **Ações** (**Conversa**).
- Ordenação por prazo. Vazio: "Nenhum chamado aqui."

### Tela 3 — Conversa (somente leitura + notas)
- Botão voltar contextual: "← Voltar a {nome do consultor}", "← Voltar à lista", "← Voltar à equipe".
- Cartão de cabeçalho: título, "#{numero} · Cliente · Categoria · prioridade · aberto em … · n mensagens", selos de prazo e status; à direita select **Redistribuir para**.
- Duas colunas: **CONVERSA COM O CLIENTE · SOMENTE LEITURA** (Conversa sem notas; balões de consultores em azul-claro, cliente em cinza) e painel amarelo **Notas internas** onde o gestor pode ler e **Salvar nota interna**.

---

## 9. Sistema visual

### Cores (MUST)
- Primária `#1582F9` — botões primários, aba ativa, seleção, balão do usuário logado, links.
- `#F1F5F9` — fundo da página, superfícies secundárias, hover, botões/inputs desabilitados.
- `#94A3B8` — bordas de inputs e botões secundários, placeholders.
- `#334155` — textos secundários, subtítulos, labels, rótulos de coluna.
- Texto principal `#0F172A`. Divisores `#E2E8F0`. Hover de linha `#F8FAFC`. Seleção `#E8F2FF`.
- Status: aberto/em_atendimento `#E8F2FF`/`#0B4FA8` · aguardando_cliente `#FEF3C7`/`#92400E` · resolvido `#DCFCE7`/`#166534` · fechado `#F1F5F9`/`#334155` (par = fundo/texto).
- Alertas de prazo: `#B91C1C` (estourado), `#DC2626` (< 1h), âmbar `#FEF3C7`/`#92400E` (< 4h). Erro de formulário `#B91C1C`.
- Notas internas: fundo `#FEFCE8`, borda `#FDE68A`, balão `#FEF9C3` com borda tracejada `#94A3B8`.
- Outro consultor na conversa: `#E0F2FE` / borda `#BAE6FD` / texto `#0C4A6E`.

### Tipografia
'DM Sans' (Google Fonts), 400/500/600/700. Títulos de tela 20–22px/700; títulos de cartão 17–19px/700; corpo 14px; meta 12–13px; rótulos de coluna 11px uppercase letter-spacing .05em.

### Componentes compartilhados
- **Botão**: altura 40px, raio 10px, 14px/600, padding 0 18px. Variantes: `primario` (azul, texto branco), `secundario` (branco, texto `#334155`, borda `#94A3B8`), `fantasma` (transparente, texto azul). Desabilitado: fundo `#F1F5F9`, texto `#94A3B8`, cursor not-allowed. Prop `bloco` = largura total.
- **Campo**: label 13px/500 `#334155` acima; input/textarea/select altura 40px (textarea auto), raio 10px, borda `#94A3B8`, foco borda azul, desabilitado fundo `#F1F5F9`. Placeholder `#94A3B8`.
- **Selo**: pílula 12px/600, padding 3px 10px, nowrap. Variantes: status **preenchido** (cliente), status **com borda** (consultor/gestor), prazo, ou texto cinza (Status do gestor).
- **Conversa**: lista vertical gap 12px; balões max 78%, raio 14px, padding 10px 14px; cabeçalho 11px/600 "Autor · dd/mm, HH:MM"; regras de cor na seção 7 (cliente) e 8 (gestor).

### Princípios de layout
- Cartões brancos raio 16px sobre fundo `#F1F5F9`; padding 20–24px; gap entre blocos 16–24px.
- Tudo fluido (`minmax`, `flex-wrap`); nenhuma coluna fixa pode empurrar a coluna "Ações" para fora da tela em ~920px de largura.
- Filtros de tabela ficam **abaixo** do título do bloco, nunca ao lado.
- Nada de toasts, modais ou ícones decorativos; feedback por texto na própria tela e por estados desabilitados.
- Funcionalidades opcionais (notas, mudar status, reabrir) ficam **recolhidas atrás de um botão** e aparecem no lugar certo quando chamadas.

## 10. Snapshot do tenant (implementação)

- **Arquivo:** `src/data/dados.json`
- **`meta.agora`:** relógio único de prazo e saudações com data.
- **Volume:** produção-simulada (centenas de chamados ativos); listas com busca/filtro/abas — não espelhar contagens do protótipo.
- **Login → IDs:** mapa fixo em `features/autenticacao` (ou `dominio/`) conforme AGENTS.md; demais usuários só aparecem como solicitantes, responsáveis ou colegas nos dados.
- **`historico`:** útil para auditoria; pode apoiar cálculos de gestor (ex.: ociosidade), sem obrigar paridade com o protótipo.

## 11. Checklist de aceite

- [ ] Login pelos **quatro** usuários; inválido com erro inline; **sem** alias `consultor`.
- [ ] Cliente nunca vê categoria, grupo, prioridade, SLA numérico nem mensagem interna.
- [ ] Cliente vê faixa de etapa por status; fechado com fundo cinza e reabrir em dois passos.
- [ ] Dois consultores veem filas distintas por grupo.
- [ ] Consultor: 4 abas, agrupamento por urgência sticky, aguardando cliente por último.
- [ ] Notas e Status atrás de botões; nota nunca pelo campo de resposta ao cliente.
- [ ] Evento `chamado.aberto` ao vivo na fila; reaplicar não duplica.
- [ ] Gestor: 3 indicadores, equipe sem carga/sobrecarga, redistribuição, conversa leitura + notas.
- [ ] Dados e nomes vindos do snapshot, não do protótipo HTML.
- [ ] `lint`, `test`, `build` verdes.