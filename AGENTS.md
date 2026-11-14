# Service Hub

Central de chamados de TI: cliente abre, consultor atende a fila, gestor enxerga equipe e SLA.

Decisões não definidas aqui: menor comportamento que sirva quem está na tela.

## Escopo deste front

| Item | Regra |
| --- | --- |
| API / auth | Não há API, WebSocket nem auth real (sem token, sessão, senha) |
| Dados iniciais | Snapshot `src/dados/dados.json` |
| Relógio de SLA | `meta.agora` do snapshot — nunca o relógio da máquina |
| Tempo real | Eventos **simulados** (mesmo `tipo`/`payload` da tabela abaixo), aplicados ao estado; idempotentes (reaplicar não duplica) |
| Exemplo obrigatório | Consultor na fila recebe `chamado.aberto` enquanto a tela está aberta |

## Perfis

Três rotinas, **telas separadas** — sem uma tela com `if` por perfil.

| Perfil | Foco | Restrições |
| --- | --- | --- |
| Cliente | Saber se pegaram o chamado, prazo de resposta e o que mudou, sem reler tudo | Ocultar categoria, grupo, prioridade interna e qualquer mensagem `interna: true`; pode reabrir fechado |
| Consultor | Fila (atribuídos + não pegos); próximo pelo prazo; responder, anotar, mudar status | SLA prestes a estourar deve saltar aos olhos; fila atualiza com eventos ao vivo |
| Gestor | Carga, ociosidade, SLA nas próximas horas, redistribuição | Priorizar visão de equipe; conversa sobretudo em escalação; não inundar — o essencial primeiro |

## Login (só perfil)

Um campo **usuário**, sem senha — seletor de perfil com cara de login.

| `usuario` | Perfil |
| --- | --- |
| `consultor-infraestrutura` | Consultor do grupo de Infraestrutura |
| `consultor-aplicaoes` | Consultor do grupo de Aplicações|
| `gestor` | Gestor |
| `cliente` | Cliente |

## O que a área faz

Abrir chamado · localizar e ver conversa/status/responsável/prazo · pegar da fila · mensagens · mudar status (com motivo; fechado pode reabrir) · painel do grupo.

Com tela aberta, mudanças de outras pessoas **refletem na UI** (via eventos simulados).

## Dados e domínio

- Datas em UTC; exibir no fuso do usuário (`zoneinfo`; `pt-BR` e `pt-PT`).
- **Status:** `aberto` · `em_atendimento` · `aguardando_cliente` · `resolvido` · `fechado`
- **Prioridade:** `baixa` · `media` · `alta` · `critica` — SLA em `sla` (horas); prazo restante, atraso e contagens **só na leitura**
- **`interna: true`:** só consultor/gestor; cliente não vê em lista, detalhe nem notificação

**Evento:** `id`, `tipo`, `ocorrido_em` (UTC), `payload`.

| `tipo` | Payload |
| --- | --- |
| `chamado.aberto` | Chamado completo |
| `chamado.atribuido` | `chamado_id`, `consultor_id` |
| `mensagem.adicionada` | Mensagem completa com `chamado_id` |
| `status.alterado` | `chamado_id`, `de`, `para`, `motivo`, `usuario_id` |

## Código

Ordem: funcionar → claro → rápido. Stack: React, TS, Vite, Vitest, RTL (jsdom); setup em `src/setupTestes.ts`. Nova dependência só se o código direto não resolver.

**Comportamento** — testar SLA, anotação interna, evento duplicado, reabertura. Props primeiro; estado só do que muda; resto calculado; estado no ancestral; dados descem, evento sobe.

**Nomes** — vocabulário do domínio (chamado, mensagem, prazo…); código e pastas em português (`app`, `features`, `dados`, `dominio`, `shared`; features `autenticacao`, `cliente`, `consultor`, `gestor`, `chamados`). Evitar `data`, `item`, `handleClick`, `utils`.

**Forma** — um módulo, um assunto (estado de chamado, evento e tela separados); regra de prazo/visibilidade em um lugar; estrutura plana; sem componente que só repassa props; sem cache/virtualização/worker antes da tela certa; só construir o que o produto usa agora.

**Telas** — compartilhar peças (prazo, mensagem, status) entre perfis; se o compartilhado precisar parâmetro por perfil, separar.

## Arquitetura

| Pasta | Papel |
| --- | --- |
| `app/` | `App`, rotas e contexto do perfil logado |
| `features/autenticacao` | Login e identificação do perfil pelo nome de usuário |
| `features/cliente` | Rotina do cliente (lista e abertura de chamado) |
| `features/consultor` | Fila e detalhe do chamado para o consultor |
| `features/gestor` | Visão de equipe e redistribuição |
| `features/chamados` | Peças e regras de chamado compartilhadas entre perfis |
| `dados/` | Snapshot inicial `dados.json` |
| `dominio/` | Tipos e funções puras do domínio |
| `shared/components` | UI reutilizável sem regra de chamado |

## Comandos

`npm install` · `npm run dev` · `npm run lint` · `npm test` · `npm run test:watch` · `npm run build`

Antes de dar por pronta: `lint` + `test` + `build` verdes.

## Limites

- Login escolhe perfil pelo nome; anotação interna nunca vaza para cliente.
- Sem camada ou abstração “para o futuro”; sem otimização antes do comportamento certo.
- UI no idioma do usuário; identificadores no vocabulário do domínio (português).