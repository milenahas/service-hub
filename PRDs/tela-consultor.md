# PRD — Rotina do consultor (fila + detalhe + notas)

## 1. Metadados

| Campo | Valor |
| --- | --- |
| **Produto** | Service Hub — central de chamados de TI |
| **Feature** | Tela do consultor: fila por grupo, detalhe do chamado, conversa, status, notas internas e simulação ao vivo |
| **Prioridade** | Alta — persona central do produto; demonstra SLA, eventos e escopo por grupo |
| **Stack** | React 18+, TypeScript, Vite, CSS com tokens, Vitest + React Testing Library |
| **Fonte da verdade visual** | `service-hub-design-prototype/CONTEXTO-SERVICE-HUB.md` **§5** (cabeçalho) e **§7** (fluxo consultor); **prints obrigatórios** abaixo |
| **Fonte da verdade técnica** | `AGENTS.md` (§ Perfis, § Dados e domínio, § Código, linha 40 — sessão e injeção) |
| **Depende de** | [tela-login.md](./tela-login.md) (login, `iniciarSessao`, recorte §7.5.4), [cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md), [componentes-compartilhados.md](./componentes-compartilhados.md) (**Botão**, **CampoTexto**, **CampoTextarea**, **CampoSelect**, **Selo**) |
| **Desbloqueia** | Demonstração completa de eventos idempotentes; validação de SLA na fila; base para PRD do gestor (redistribuição referencia os mesmos eventos) |
| **Rota** | `/consultor` (`CAMINHOS.consultor`) — guard `perfil === 'consultor'` |
| **Personas de login** | `consultor-infraestrutura` → Thiago Nascimento (Infraestrutura) · `consultor-aplicacoes` → Felipe Gomes (Aplicações) |
| **Conformidade a11y** | WCAG 2.1 AA; APG para botões, campos, alertas de erro; lista navegável por teclado onde o CONTEXTO permitir |
| **Fora do escopo** | API, WebSocket real, push, toasts, modais, ícones decorativos, persistência, rotina cliente/gestor, coluna “carga”, estado “sobrecarregado” |

### Referência visual obrigatória (MUST)

Antes de implementar e antes de dar a feature por concluída, o agente implementador **deve abrir e comparar lado a lado** (ou sobrepor) cada print com a UI correspondente. O protótipo HTML (`service-hub-design-prototype/prototipo/Service Hub.dc.html`) serve para **comportamento e aparência**, não para copiar nomes, IDs ou volumes.

| Print | O que validar |
| --- | --- |
| `prints/Consultor - Tela 1.png` | Layout geral (fila + detalhe), resumo da fila, abas, busca/filtro, agrupamento por urgência, item selecionado, cabeçalho do chamado, conversa, rodapé “Responder ao cliente…” |
| `prints/Consultor - Tela 2 - Adicionar status ao chamado.png` | Formulário de status recolhível (select + motivo + Cancelar/Confirmar), selo de status com borda |
| `prints/Consultor - Tela 3 - Aba de chamados concluídos.png` | Aba Concluídos, lista “CONCLUÍDOS · MAIS RECENTES PRIMEIRO”, selo de status em vez de prazo onde couber |
| `prints/Consultor - Tela 4 - Notas de chamado.png` | Grid com painel de notas à direita (`#FEFCE8`), lista de anotações, textarea “Anotar para os colegas…”, botão **Salvar nota** |
| `prints/Consultor - Tela 5 - Aba sem dono com botão Pegar chamado.png` | Aba **Sem dono**, texto “Sem responsável”, botão primário **Pegar chamado** no cabeçalho do detalhe |

**Dados na tela:** sempre do **tenant da sessão** (`useStore` → `tenant`), montado no login — **não** espelhar contagens ou histórias do protótipo HTML.

---

## 2. Objetivo

Substituir o placeholder em `features/consultor` pela rotina completa do consultor: fila do **grupo** do logado, detalhe com conversa pública, mudança de status com motivo, notas internas em painel separado e **atualização ao vivo** via eventos simulados (incluindo injeção periódica de novos chamados `aberto` sem dono).

Objetivos mensuráveis:

1. **Paridade visual** com os cinco prints (critério bloqueante por estado de tela).
2. Thiago e Felipe veem **filas distintas** (mesmo código, `grupo_id` diferente no snapshot da sessão).
3. SLA prestes a estourar **salta aos olhos** (agrupamento, faixa vertical, selo de prazo, contagens “urgentes”).
4. Toda mutação passa por **`aplicarEvento`** idempotente; incluindo simulação e ações do usuário.
5. Com a fila aberta, um `chamado.aberto` injetado aparece na lista **sem F5** (exemplo obrigatório `AGENTS.md`).
6. `npm run lint`, `npm run test`, `npm run build` verdes.

---

## 3. Papel no produto

| Regra | Detalhe |
| --- | --- |
| Escopo | Apenas chamados cujo `grupo_id` é o do consultor logado e que **existem** em `tenant.chamados` |
| Fila mental | Atribuídos ao logado + fila do grupo (outros consultores) + sem dono + concluídos do logado |
| Ordenação operacional | Dentro da aba ativa, “próximo” = menor `prazo_resolucao` entre ativos **não** em `aguardando_cliente` (este grupo vai por último na lista) |
| Notas | `interna: true` só no painel Notas — **nunca** no textarea de resposta ao cliente |
| Relógio | `tenant.meta.agora` — nunca `Date.now()` para SLA |
| Sessão | Definida no login (`montar-sessao` §7.5.4); esta feature **consome** e **estende** o tenant por eventos |
| Cabeçalho | Barra comum CONTEXTO §5: selo “Consultor · {Grupo}”, nome do snapshot, **Sair** |

---

## 4. Princípios de código e arquitetura (MUST — `AGENTS.md`)

| # | Regra |
| --- | --- |
| C1 | **Ordem:** funcionar → claro → rápido. |
| C2 | **Props primeiro** nas peças de UI; **tenant mutável** na store; listas e agrupamentos **calculados** em `dominio/` ou `features/chamados` (funções puras). |
| C3 | **Dados descem, evento sobe** — pegar chamado, enviar mensagem, status, nota → disparam evento → store aplica redutor. |
| C4 | **Um módulo, um assunto** — `fila-consultor.ts`, `agrupar-fila.ts`, `aplicar-evento.ts`, `simulacao-consultor.ts` separados da JSX. |
| C5 | **Sem componente que só repassa props** — não criar `LinhaFila` vazio se um único uso; extrair só quando duas telas usarem a mesma peça. |
| C6 | **Tela consultor** em `features/consultor` — **sem** `if (perfil === 'cliente')` na mesma rota. |
| C7 | **Nomes em português** para props de produto; HTML/React (`value`, `onChange`, `disabled`, `aria-*`) nos campos compartilhados. |
| C8 | **JSX condicional:** `condição && <elemento>` para blocos opcionais (formulário status, painel notas, botão Pegar). |
| C9 | **Sem toasts** — erros de validação inline (`role="alert"`). |
| C10 | **Sem dependências novas** salvo o que o login já usa (Zustand). Geração de id: `crypto.randomUUID()` quando disponível no ambiente de teste. |
| C11 | **Regra de prazo/visibilidade em um lugar** — `classificarFaixaPrazo`, `formatarTextoPrazoConsultor`, `chamadoAtivo` em `dominio/`. |
| C12 | **Conversa** conforme [componentes-compartilhados.md](./componentes-compartilhados.md) §14 — markup em `features/chamados` ou `features/consultor`, tokens `--conversa-*`; não antecipar `shared/Conversa.tsx` sem PRD dedicado. |

---

## 5. Dados da sessão e injeção (MUST — `AGENTS.md:40` + login §7.5)

### 5.1 O que o consultor vê ao entrar

No login (`iniciarSessao`), **já aplicado** por `dominio/montar-sessao.ts`:

| Aspecto | Regra |
| --- | --- |
| Volume | **Todos** os chamados do grupo no snapshot — sem teto e sem amostragem |
| Grupo | Todos os chamados com `grupo_id` = grupo do consultor logado, qualquer status |
| Mensagens / histórico | Apenas dos `chamado_id` da sessão |
| Catálogos | `meta`, `grupos`, `categorias`, `sla`, `usuarios` **inteiros** |

A tela **não** recorta de novo no mount; lê `tenant` da store. F5 ou **Sair** zera tudo.

**Referência de IDs** (login §7.2): Thiago `50039fe7-2ddf-4a02-8045-c635a4c724f6` (Infra `29be5d21-2981-4b38-a4c2-771116e58928`); Felipe `85d44809-37ca-4797-8fbf-53f112ebe792` (Aplicações `9d8ad616-fd35-4f2c-9eaa-3ca931b51313`).

### 5.2 Duas origens de dado na sessão

| Origem | Quando | Regra |
| --- | --- | --- |
| **Snapshot (leitura)** | Login | Cópia de registros existentes em `dados.json` — ids e textos **do arquivo** |
| **Injeção** | Ações do consultor; timer; demo de simulação | Registro **novo**: `id` único, `numero` = maior `numero` na sessão + 1, textos **gerados** (não copiar outro chamado do JSON) |

Toda injeção e mutação entra como **evento** (`chamado.aberto`, `chamado.atribuido`, `mensagem.adicionada`, `status.alterado`) e passa pelo mesmo `aplicarEvento` idempotente (`AGENTS.md`).

### 5.3 Contrato da store (extensão obrigatória deste PRD)

Além de `usuarioLogado`, `tenant`, `iniciarSessao`, `sair` (login):

| Membro | Responsabilidade |
| --- | --- |
| `aplicarEvento(evento: Evento)` | Redutor idempotente: ignora `evento.id` já visto; atualiza `chamados`, `mensagens`; mensagens de sistema em atribuição/status conforme CONTEXTO §3 |
| `emitirEAcumular(…)` | *Opcional* — atalho que monta evento + chama `aplicarEvento`; ou ações explícitas `pegarChamado`, `enviarMensagemCliente`, etc. que **só** delegam ao redutor |
| `iniciarSimulacaoConsultor()` | Chamado quando a rota consultor monta (e usuário é consultor) |
| `pararSimulacaoConsultor()` | Chamado em `sair()` e no cleanup do unmount da tela — **obrigatório** parar timers |

`iniciarSessao` deve **parar** simulação anterior se existir.

---

## 6. Simulação e injeção aleatória (MUST)

### 6.1 Timer contínuo (produção da demo)

Após o consultor estar na fila:

1. Sortear intervalo aleatório entre **1 e 3 minutos** (60 000–180 000 ms) até o próximo disparo.
2. Ao disparar, **injetar** um `chamado.aberto` via `aplicarEvento`:
   - `grupo_id` = grupo do consultor logado
   - `responsavel_id` = `null`, `status` = `aberto`
   - `prioridade` = `media` (default) salvo sorteio simples documentado no código
   - Prazos: `meta.agora` + linha `sla` da prioridade
   - `solicitante_id`: cliente aleatório do snapshot (`perfil === 'cliente'`)
   - `titulo` / `descricao`: strings **novas** (template curto + sufixo aleatório — ex. “Chamado simulado · {timestamp lógico}”)
   - Primeira mensagem pública opcional via `mensagem.adicionada` no mesmo fluxo ou só descrição no chamado — **consistente** com como o JSON modela abertura
3. Reagendar o próximo intervalo 1–3 min.
4. **Parar** todos os timers em `sair()` / F5 / unmount.

### 6.2 Roteiro de demonstração (testes e dev)

Conforme CONTEXTO §3 (simulação sugerida), implementar modo **determinístico nos testes** (fake timers):

| Tempo após mount | Evento | Esperado na UI |
| --- | --- | --- |
| ~7s | `chamado.aberto` (novo, sem dono, grupo correto) | Item na aba **Sem dono** / filtros; marcador não lido se não selecionado |
| ~12s | `mensagem.adicionada` em chamado **existente** da sessão (não interna) | Ponto azul de não lido na linha se outro chamado estiver selecionado |
| ~14s | **Reenvio** do **mesmo** `chamado.aberto` (mesmo `evento.id`) | **Nenhuma** duplicação na lista |

No app real (fora de teste), o roteiro 7s/12s/14s é **recomendado** na primeira sessão após login para validação manual; o timer 1–3 min continua em paralelo ou após o roteiro — decisão documentada no código (preferir: roteiro só se `import.meta.env.DEV` **ou** flag de teste; produção demo = timer 1–3 min + roteiro opcional em DEV).

### 6.3 Idempotência (MUST testar)

- Guardar `Set` (ou lista) de ids de eventos aplicados na store ou no redutor.
- Reaplicar o mesmo evento não duplica chamado, mensagem nem histórico.

---

## 7. Layout e especificação visual (CONTEXTO §7)

### 7.1 Estrutura da página

| Item | Especificação |
| --- | --- |
| Fundo | `--cor-fundo-pagina` (`#F1F5F9`) |
| Altura útil | Grid `height: calc(100vh - alturaCabecalho)` — página **não** rola; colunas rolam internamente |
| Colunas | Fila: `minmax(456px, 552px)` → com notas abertas encolhe para `minmax(384px, 456px)` · Detalhe: `minmax(260px, 1fr)` · Notas: quando aberto, subdivisão `minmax(260px,1fr) minmax(176px,0.44fr)` (notas ~20% mais estreitas que o layout anterior; a largura liberada vai para a fila) |
| Cartões | Branco, raio 16px, padding 20–24px |

### 7.2 Cabeçalho comum (CONTEXTO §5)

Implementar em `shared/` ou `app/` se ainda não existir PRD de cabeçalho — **bloqueante** para esta feature:

- Logo + “Service Hub” + selo cinza **Consultor · Infraestrutura** ou **Consultor · Aplicações** (nome do grupo vindo de `tenant.grupos`).
- Direita: `usuarioLogado.nome` (snapshot) + botão secundário **Sair** → `sair()` + navegação ao login.

### 7.3 Coluna Fila

1. Título **Fila** + linha 12px: `{Nome do grupo} · N atribuídos · N sem dono · N urgentes`.
   - **Atribuídos:** ativos com `responsavel_id` = logado.
   - **Sem dono:** ativos sem responsável no grupo.
   - **Urgentes:** ativos com faixa `estourado` ou `urgente` (`restante < 1h`), conforme `classificarFaixaPrazo`.
2. **Abas** (ordem MUST): **Minha fila** · **Fila do grupo** · **Concluídos** · **Sem dono**.
   - Minha fila: ativos, `responsavel_id` = logado.
   - Fila do grupo: ativos, responsável = outro consultor do mesmo `grupo_id`.
   - Concluídos: `resolvido` ou `fechado`, `responsavel_id` = logado; ordenar por data de conclusão ou `prazo_resolucao` / último evento — **mais recentes primeiro**.
   - Sem dono: ativos, `responsavel_id == null`, grupo do logado.
   - Trocar aba **reseta** filtro select para “Todos”.
   - Contagem na aba ativa apenas (13px, sublinhado 2px azul na ativa).
3. **Linha de ferramentas:** busca e filtro **lado a lado** — busca ~70% (`flex: 7`), filtro ~30% (`flex: 3`). Na aba Concluídos o filtro some e a busca ocupa 100%.
4. **Busca** `CampoTexto` placeholder **Buscar chamado** (assunto, cliente, `#numero`).
5. **Select filtro** (não na aba Concluídos): **Todos (n)** · **Urgentes (n)** · **Vencem em 4h (n)** · **Aguard. cliente (n)** — contagens dinâmicas.
6. **Lista agrupada** (cabeçalhos sticky `top: 0`):
   - `URGENTES · ESTOURADO OU MENOS DE 1H` — vermelho `#B91C1C`
   - `PRÓXIMAS 4 HORAS` — âmbar `#92400E`
   - `DEMAIS, POR PRAZO` — cinza `#334155`
   - `AGUARDANDO CLIENTE` — por último; `aguardando_cliente`
   - Dentro do grupo: `prazo_resolucao` crescente.
   - Aba Concluídos: grupo único `CONCLUÍDOS · MAIS RECENTES PRIMEIRO`.
   - Grupos vazios **não** renderizam.
7. **Item da lista:** grid `auto 1fr auto`; faixa 3px à esquerda (vermelha/âmbar/cinza); título 600 14px ellipsis; ponto azul 7px se não lido; meta `#{numero} · Cliente · prioridade` (+ colega na Fila do grupo; + “aguardando cliente”); selo prazo ou **Com o cliente** / status em concluídos; **Sem responsável** em azul se sem dono.
8. Vazio: **Nenhum chamado com esses filtros.**
9. **Scroll da lista** (`.coluna-fila__lista`): barra fina com pontas arredondadas em Chrome e Firefox. Chrome/WebKit: `::-webkit-scrollbar` 6px, thumb `border-radius: 999px`, cor `--cor-texto-terciario` (hover `--cor-texto-secundario`), track transparente. Firefox: `scrollbar-width: thin` e `scrollbar-color` com os mesmos tokens, isolados em `@supports (-moz-appearance: none)` para o Chrome não ignorar os pseudo-elementos WebKit.

### 7.4 Painel do chamado

**Cabeçalho** (borda inferior):

- Primeira linha: título 700 19px + **Selo** `status-borda` à esquerda; botões alinhados ao **canto superior direito**: **Pegar chamado** (primário, só ativo sem dono) · **Status** (secundário; primário com form aberto) · **Notas** / **Notas (n)** (secundário; primário com painel aberto; n = count `interna: true`).
- Meta: `#{numero} · Cliente · Categoria · Grupo · prioridade X` (lookup no tenant).
- Linha: Responsável **Nome** · Prazo até **dd/mm, HH:MM** (`zoneinfo` do usuário) · **Selo** prazo.

**Formulário Status** (recolhido até clicar Status):

- Caixa cinza; **CampoSelect** novo status; **CampoTexto** motivo obrigatório; **Cancelar** / **Confirmar** (desabilitado sem motivo ou status igual ao atual).
- Confirmar → `status.alterado` + fecha form.

**Conversa:** `flex:1; min-height:180px; overflow:auto` — mensagens **sem** `interna: true`; cores CONTEXTO §7 (cliente cinza esquerda; logado azul direita; outro consultor azul-claro; sistema itálico centro).

**Rodapé:**

- Chamado **ativo:** **CampoTextarea** “Responder ao cliente…”, legenda “Esta mensagem será enviada ao cliente.”, **Enviar ao cliente** (desabilitado se vazio) → `mensagem.adicionada` `interna: false`.
- **Concluído:** sem textarea; texto “Este chamado foi concluído. Para retomar o atendimento, mude o status.”

### 7.5 Painel Notas (lateral, só quando aberto)

- Cartão `#FEFCE8`, borda `#FDE68A`; título **Notas internas**; subtítulo “Só a equipe vê. O cliente nunca.”; botão × com `rotuloAcessivel` “Fechar notas”.
- Lista notas `interna: true` (balão amarelo tracejado) ou “Nenhuma nota ainda.”
- **CampoTextarea** “Anotar para os colegas…” + **Salvar nota** (secundário, bloco), com **12px** de espaço entre o textarea e o botão → `mensagem.adicionada` `interna: true`.
- **Proibido** checkbox “interna” no campo de resposta ao cliente.

---

## 8. Comportamento e regras de negócio

### 8.1 Seleção e não lido

- Estado local da tela: `chamadoSelecionadoId` (ou derivado da URL se quiser deep link — **opcional**, default primeiro da lista visível).
- Chamado ganha **não lido** quando: novo na fila (ex. `chamado.aberto`) ou `mensagem.adicionada` **não interna** enquanto **não** selecionado.
- Ao selecionar/abrir detalhe, limpar não lido desse id.

### 8.2 Pegar chamado

- Visível se chamado ativo e `responsavel_id == null`.
- Emite `chamado.atribuido` com `consultor_id` = logado.
- Redutor: seta `responsavel_id`; se status `aberto` → `em_atendimento`; mensagem sistema “Chamado atribuído a {nome}”.

### 8.3 Enviar mensagem ao cliente

- Texto trim não vazio; `autor_id` = logado; `interna: false`.

### 8.4 Alterar status

- Payload `status.alterado`: `de`, `para`, `motivo`, `usuario_id` = logado.
- Mensagem sistema: “Status: {De} → {Para}. Motivo: {motivo}”.
- Reabrir concluído: via select (ex. para `aberto`) com motivo — mesmo evento.

### 8.5 Cálculo de SLA (leitura)

Usar `restante = prazo_resolucao - meta.agora` (UTC no dado; exibição com `Intl` + `zoneinfo` do consultor):

| Faixa | Texto selo (ex.) |
| --- | --- |
| `restante < 0` | Estourado há Xh Ymin |
| `< 1h` | Vence em Xmin |
| `< 4h` | Vence em Xh Ymin |
| `≥ 4h` | Prazo em Xh Ymin |
| Concluído | selo status ou “—” |

Formato duração: `2h 21min`, `36min` (CONTEXTO §3).

### 8.6 Transições de status permitidas

Implementar conjunto mínimo coerente com o snapshot (não inventar máquina de estados enorme). MUST permitir pelo menos:

- `aberto` ↔ `em_atendimento` (via pegar ou status manual)
- `em_atendimento` ↔ `aguardando_cliente`
- → `resolvido` / `fechado`
- Reabrir de concluído → `aberto`

Select lista só estados **diferentes** do atual + rótulos `formatarRotuloStatus`.

---

## 9. Microcopy (literal — MUST onde indicado)

| Uso | Texto |
| --- | --- |
| Título fila | Fila |
| Abas | Minha fila · Fila do grupo · Concluídos · Sem dono |
| Busca placeholder | Buscar chamado |
| Filtros select | Todos · Urgentes · Vencem em 4h · Aguard. cliente |
| Cabeçalhos grupo | URGENTES · ESTOURADO OU MENOS DE 1H · PRÓXIMAS 4 HORAS · DEMAIS, POR PRAZO · AGUARDANDO CLIENTE · CONCLUÍDOS · MAIS RECENTES PRIMEIRO |
| Lista vazia | Nenhum chamado com esses filtros. |
| Sem responsável (item) | Sem responsável |
| Com o cliente | Com o cliente |
| Pegar | Pegar chamado |
| Status / Notas | Status · Notas · Notas (n) |
| Form status | Novo status · Motivo (obrigatório) · Cancelar · Confirmar |
| Resposta | Responder ao cliente… · Esta mensagem será enviada ao cliente. · Enviar ao cliente |
| Concluído rodapé | Este chamado foi concluído. Para retomar o atendimento, mude o status. |
| Notas | Notas internas · Só a equipe vê. O cliente nunca. · Anotar para os colegas… · Salvar nota · Nenhuma nota ainda. |
| Sair / cabeçalho | Sair · Consultor · Infraestrutura / Aplicações |

---

## 10. Arquitetura de arquivos sugerida

```
src/
  app/
    store.ts                          # + aplicarEvento, simulação, ids eventos
    CabecalhoApp.tsx                  # §7.2 (se ainda não existir)
  dominio/
    aplicar-evento.ts                 # redutor idempotente
    aplicar-evento.test.ts
    evento.ts                         # tipo Evento, fabricas
    prazo.ts                          # classificarFaixaPrazo, formatarTextoPrazoConsultor
    prazo.test.ts
    mensagens-sistema.ts              # textos atribuição / status
    simulacao-consultor.ts              # gerar chamado injetado, agendar timers (puro + interface clock)
    simulacao-consultor.test.ts
  features/
    chamados/
      regras/
        mensagens-chamado.ts            # filtrar públicas, ordenar
        papel-balao.ts                  # lado/cor: cliente, logado, colega, sistema
      BalaoMensagem.tsx
      ListaConversa.tsx                 # thread (sem interna)
      RodapeRespostaCliente.tsx
      ItemNotaInterna.tsx
      conversa.css                      # tokens --conversa-*
      formatar-rotulo-status.ts
      selecionar-transicoes-status.ts
    consultor/
      TelaConsultor.tsx               # grid principal, efeitos simulação
      TelaConsultor.css
      TelaConsultor.test.tsx
      ColunaFila.tsx
      PainelChamado.tsx
      PainelNotas.tsx
      fila-consultor.ts               # filtrar abas, busca, filtros select
      agrupar-fila.ts                 # grupos sticky + ordenação
      fila-consultor.test.ts
      agrupar-fila.test.ts
      usar-nao-lidos.ts                 # estado não lido (hook local)
  shared/components/                   # Botão, Campos, Selo — já existentes
```

**Proibido:** ler `dados.json` direto na tela — só `tenant` da store.

**Substituir:** `PlaceholderConsultor.tsx` por `TelaConsultor` em `Rotas.tsx`.

### 10.1 Conversa e notas (composição)

A conversa **não** é um único componente em `shared/` (ver C12 e [componentes-compartilhados.md](./componentes-compartilhados.md) §14). São **três assuntos** no detalhe do chamado: thread pública, resposta ao cliente e notas internas — este PRD compõe os dois primeiros em `PainelChamado` e o terceiro em `PainelNotas`.

| Camada | Onde | Responsabilidade |
| --- | --- | --- |
| Regras puras | `features/chamados/regras/` (ou `dominio/` se outro perfil precisar) | Mensagens do `chamado_id` sem `interna: true`; ordenação; papel do balão (§7.4, tokens §5.6 em [cores-globais-e-tipografia.md](./cores-globais-e-tipografia.md)) |
| UI reutilizável | `features/chamados/` | `BalaoMensagem`, `ListaConversa`, `RodapeRespostaCliente` — **sem** store; só `Campo*` / `Botão` compartilhados |
| Composição | `features/consultor/` | `PainelChamado` monta cabeçalho, status, lista + rodapé; `PainelNotas` usa `ItemNotaInterna` e fluxo `interna: true` |

**Contrato (MUST):**

- Props descem (`mensagens`, `usuarios`, `usuarioLogado`, estado do textarea, `chamadoAtivo`, etc.).
- Mutação sobe: `aoEnviarResposta`, `aoSalvarNota` — o pai dispara evento / store (`dados descem, evento sobe`, C3). Peças em `chamados/` **não** chamam `aplicarEvento`.
- Status, **Pegar chamado** e redistribuição ficam **fora** dos módulos de conversa.

**Reuso entre perfis:** consultor implementa primeiro. O PRD do gestor (escalação) deve **reimportar** `ListaConversa` + `RodapeRespostaCliente` e as mesmas regras de papel; não duplicar markup. Rotina **cliente** usa visão dois lados (eu × suporte) — peça separada ou `modo` só se markup e a11y forem idênticos (`AGENTS.md`: se precisar parâmetro por perfil, separar).

---

## 11. Acessibilidade (MUST)

| Item | Requisito |
| --- | --- |
| Abas | `role="tablist"` / `tab` / `tabpanel` ou botões com `aria-selected` — foco visível |
| Lista | Itens focáveis (`<button type="button">` ou link); Enter seleciona chamado |
| Formulários | Labels nos **Campo**; erros com `role="alert"` |
| Botão × notas | `rotuloAcessivel` |
| SLA | Texto no selo sempre legível sem depender só da cor (WCAG 1.4.1) |
| Cabeçalho | Um `<h1>` por página **ou** h1 na fila “Fila” — não duplicar sem hierarquia lógica |

---

## 12. Testes (MUST)

### 12.1 Unitários — `aplicar-evento`

- `chamado.aberto` insere; segundo apply mesmo `id` ignora.
- `chamado.atribuido` atualiza responsável e status; mensagem sistema criada.
- `mensagem.adicionada` anexa; duplicata de `id` ignorada.
- `status.alterado` muda status + mensagem sistema.

### 12.2 Unitários — `fila-consultor` / `agrupar-fila`

- Aba Minha fila só `responsavel_id` logado e ativos.
- Sem dono só `responsavel_id` null.
- Urgentes agrupados acima; `aguardando_cliente` no grupo final.
- Filtro “Vencem em 4h” coerente com `meta.agora` fixture.
- Busca por número e nome cliente.

### 12.3 Unitários — `simulacao-consultor`

- Chamado gerado tem `grupo_id` correto, `numero` sequencial, textos não iguais a fixture JSON.
- Fake timers: após 7s evento aparece na store (integração leve).

### 12.4 RTL — `TelaConsultor`

- Render com tenant fixture: abas, resumo fila.
- Selecionar chamado mostra conversa sem notas internas.
- Pegar chamado desabilitado quando já tem dono; habilitado na aba Sem dono.
- Abrir Status → Confirmar desabilitado sem motivo.
- Salvar nota não aparece na lista Conversa do painel principal.
- `vi.useFakeTimers()`: evento duplicado 14s não duplica linha na lista.

### 12.5 Integração store

- `iniciarSimulacaoConsultor` + `sair()` limpa timers (spy em `clearTimeout`).

---

## 13. Critérios de aceite

### Visual (comparar prints)

1. [ ] Layout duas colunas + notas conforme print Tela 4.
2. [ ] Abas, busca, filtros, cabeçalhos de grupo sticky e faixa lateral de urgência.
3. [ ] Form status conforme Tela 2.
4. [ ] Aba Concluídos conforme Tela 3.
5. [ ] Pegar chamado conforme Tela 5.

### Sessão e dados

6. [ ] Lista reflete apenas `tenant.chamados` do login (todos os chamados do grupo, §5.1).
7. [ ] Thiago ≠ Felipe (login separado, mesma UI, dados diferentes).
8. [ ] `meta.agora` para todos os selos de prazo.

### Eventos e simulação

9. [ ] Novo `chamado.aberto` aparece na fila sem reload.
10. [ ] Timer 1–3 min injeta chamado; para ao **Sair**.
11. [ ] Idempotência do evento duplicado (teste + checklist manual 14s).
12. [ ] Ações usuário só via eventos; mensagens sistema em atribuição/status.

### Regras de produto

13. [ ] Notas internas só no painel amarelo; cliente nunca vê `interna: true` na conversa.
14. [ ] Sem toasts; sem coluna carga/sobrecarregado.

### Código

15. [ ] `features/consultor` + extensões `dominio/` e `app/store` conforme §10.
16. [ ] `AGENTS.md` (JSX, nomes, sem over-engineering).
17. [ ] `lint` + `test` + `build` verdes.

---

## 14. Checklist manual para o implementador (prints)

Abrir os cinco PNGs da pasta `service-hub-design-prototype/prints/` e validar:

- [ ] **Tela 1** — hierarquia Fila vs detalhe; resumo “N atribuídos · N sem dono · N urgentes”; item selecionado `#E8F2FF`.
- [ ] **Tela 2** — formulário status em caixa cinza; botão Status em destaque com form aberto.
- [ ] **Tela 3** — concluídos sem filtros select; cabeçalho de grupo de concluídos.
- [ ] **Tela 4** — três colunas; notas amarelas; textarea de anotação separada.
- [ ] **Tela 5** — aba Sem dono; **Pegar chamado** no topo do detalhe.

Divergências corrigidas antes de merge. Dados exibidos vêm do **snapshot real**, não do protótipo HTML.

---

## 15. Dependências e ordem de implementação

1. Login + `montar-sessao` (consultor) já verdes.
2. Componentes compartilhados + tokens.
3. `aplicar-evento` + extensão da store.
4. Cabeçalho §7.2.
5. Domínio de fila/agrupamento/prazo.
6. UI consultor (fila → detalhe → notas).
7. Simulação (roteiro testes + timer 1–3 min).
8. Remover placeholder.

---

## 16. Riscos e decisões

| Tema | Decisão |
| --- | --- |
| Store ainda sem `aplicarEvento` | Este PRD **exige** implementar antes da UI de ações |
| Conversa em `shared` | Permanece em `features/` até PRD próprio (componentes-compartilhados §14) |
| Roteiro 7s/12s/14s vs timer longo | Roteiro para testes RTL obrigatório; em DEV ambos podem coexistir; documentar no código |
| PROFundidade URL (`/consultor/:id`) | Opcional; estado local suficiente para MVP |
| CONTEXTO cita Helena no cliente | Login real usa Leandro (`AGENTS.md`); consultor não impactado |
| Volume protótipo vs sessão | UI deve suportar todos os chamados do grupo com busca/filtro — não copiar contagens do HTML |
| Geração de título injetado | Texto novo simples; evitar lorem idêntico entre disparos |
| `crypto.randomUUID` em jsdom | Polyfill em `setupTestes.ts` se necessário |

---

## 17. Referências cruzadas

- Sessão consultor no login: [tela-login.md](./tela-login.md) §7.5.4
- Eventos e mensagens sistema: `service-hub-design-prototype/CONTEXTO-SERVICE-HUB.md` §3
- Layout e microcopy consultor: mesmo arquivo §7
- Regras globais: `AGENTS.md`