# Service Hub

Central de chamados do suporte de TI. Clientes cadastram chamados quando algo quebra. Consultores atendem a fila, respondem e registram o que fizeram. Gestores acompanham a equipe, redistribuem trabalho e enxergam o que está perto de estourar o prazo.

O que não estiver definido aqui é decisão de produto: resolva pelo menor comportamento que sirva a quem está na tela.

Não há API real nem autenticação de verdade neste front. O snapshot `src/dados/dados.json` substitui a API na carga inicial; mudanças em tempo real entram por **eventos simulados**, no mesmo formato descrito abaixo — como se chegassem por WebSocket.

## Quem usa

Três rotinas. Não as misture numa tela só com ramos por perfil.

**Cliente.** Abre poucos chamados por ano. Quer saber se alguém pegou o chamado, quando terá resposta e o que aconteceu, sem reler a conversa inteira. Não precisa saber o que é categoria, grupo de atendimento ou prioridade interna. Anotação interna nunca aparece para ele. Às vezes abre de novo um problema que já foi fechado.

**Consultor.** Passa o dia na fila: os chamados dele e os do grupo que ainda ninguém pegou. Escolhe o próximo pelo prazo, responde o cliente, deixa anotação para colegas, muda o status e segue. Enquanto escreve, chegam mensagens em outros chamados e às vezes no mesmo. Achar o chamado que está prestes a estourar o prazo tem de ser imediato.

**Gestor.** Olha a equipe, não a conversa. Vê quem está sobrecarregado, quem está sem chamado e o que estoura o SLA nas próximas horas. Redistribui quando alguém falta. Abre a conversa só quando o cliente escalou. No fim da semana quer saber quanto tempo cada consultor ficou sem chamado atribuído. Mostrar tudo esconde o que importa.

## O que a área permite

1. Abrir um chamado.
2. Encontrar um chamado e ver a conversa, o status, quem atende e o prazo.
3. Pegar um chamado para atender.
4. Trocar mensagens no chamado.
5. Mudar o status registrando o motivo. Um chamado fechado pode ser reaberto.
6. Acompanhar a situação de um grupo de consultores.

Enquanto a tela está aberta, outras pessoas abrem chamados, respondem e mudam status. A tela reflete isso.

## Entrada (perfil)

Há tela de login apenas para definir qual rotina abrir. Um único campo **usuário**, sem senha nem validação de credencial — é seletor de perfil com cara de login.

| Valor digitado | Perfil |
| --- | --- |
| `consultor` | Consultor |
| `gestor` | Gestor |
| `cliente` | Cliente |

## Dados

Os dados iniciais vêm do snapshot em `src/dados/dados.json`. O relógio dos prazos é `meta.agora` nesse arquivo. Não use o relógio da máquina: o snapshot está congelado nesse instante.

Enquanto alguém usa a fila ou o painel, chamados novos, mensagens e mudanças de status precisam **aparecer na tela** — como na regra da área. Aqui isso não vem de rede: o código precisa de um caminho explícito para **emitir eventos simulados** (mesmos `tipo` e `payload` da tabela abaixo) e aplicá-los ao estado já carregado. Exemplo que tem de ficar evidente na interface: um consultor no painel de chamados e, no meio do uso, chega um `chamado.aberto`. Idempotência na aplicação do evento continua valendo.

Datas em UTC. Exiba no fuso de quem está vendo (`zoneinfo`). Há usuários em `pt-BR` e `pt-PT`.

Status: `aberto`, `em_atendimento`, `aguardando_cliente`, `resolvido`, `fechado`.

Prioridade: `baixa`, `media`, `alta`, `critica`. O SLA de primeira resposta e de resolução está em `sla`, em horas, por prioridade. Prazo restante, atraso e contagens são valores derivados. Calcule na leitura. Não guarde de novo.

Uma mensagem com `interna: true` é anotação entre consultores e gestores. O cliente não a vê, nem em lista, nem em detalhe, nem em notificação.

Cada evento tem `id` (UUID), `tipo`, `ocorrido_em` (UTC) e `payload`. O mesmo evento pode chegar mais de uma vez. Aplicar de novo não pode duplicar mensagem, atribuição ou mudança de status.

| Tipo | Quando | Payload |
| --- | --- | --- |
| `chamado.aberto` | Um chamado foi criado | O chamado completo |
| `chamado.atribuido` | O responsável foi definido ou trocado | `chamado_id`, `consultor_id` |
| `mensagem.adicionada` | Uma mensagem entrou no chamado | A mensagem completa, com `chamado_id` |
| `status.alterado` | O status mudou | `chamado_id`, `de`, `para`, `motivo`, `usuario_id` |

## Como escrever código

Nesta ordem: fazer funcionar, deixar claro, só então deixar rápido.

- Identificadores - Arquivos, funções, variáveis, tipos, em português. Pastas de features já existentes (`autenticacao`, `chamados`, `cliente`, `consultor`, `gestor`), também seguem com a nomenclatura em português.
- Estrutura plana. Uma função, um objeto ou um array de um nível resolve. Hierarquia de classes só entra se o requisito existir.
- O comportamento da tela vem primeiro. Teste prazo de SLA, anotação interna, evento repetido e reabertura de chamado fechado.
- Nomeie pelo domínio: chamado, consultor, gestor, cliente, mensagem, prazo. Sem `data`, `item`, `handleClick` ou `utils` quando existe palavra do produto.
- Uma regra de prazo ou de visibilidade mora num lugar só.
- Arquivo, hook ou camada que não serve ao comportamento, ao nome ou a essa regra única não entra.
- Não construa o que o produto ainda não usa. Refatore quando uma mudança passar a exigir contorno.
- Sem cache, virtualização ou worker antes de a tela certa existir.
- Um módulo, um assunto. Estado do chamado, evento e tela ficam separados.
- Interface pequena. Sem componente que só repassa props.
- Os três perfis não compartilham uma tela com `if`. Compartilhe prazo, mensagem ou linha de status. Se o compartilhado ganhar parâmetro por perfil, separe.
- Testes de comportamento com Vitest e React Testing Library, no ambiente jsdom. Os matchers e a limpeza da tela ficam em `src/setupTestes.ts`.
- O componente segue um pedaço dos dados. Props primeiro; estado só para o que muda. O resto se calcula. Estado no ancestral comum. Dados descem, evento sobe.

## Comandos

Na raiz do repositório:

- `npm install`
- `npm run dev` — sobe a aplicação
- `npm run lint` — ESLint
- `npm test` — executa os testes uma vez
- `npm run test:watch` — executa os testes e observa o código
- `npm run build` — `tsc -b` e build do Vite

Rode `npm run lint`, `npm test` e `npm run build` antes de considerar uma alteração pronta. A suíte tem de ficar verde.

## Limites

- Sem API real, sem WebSocket real e sem fluxo de autenticação (token, sessão, senha). Login só escolhe perfil pelo nome digitado.
- Anotação interna não chega ao cliente por nenhum caminho.
- Não crie camada, pasta de arquitetura ou abstração "para o futuro".
- Não adicione dependência sem um problema presente que o código direto não resolve.
- Não otimize antes de o comportamento estar certo.
- Não una as três rotinas numa tela parametrizada por perfil.
- Texto de interface no idioma de quem usa. Identificadores de código no vocabulário do domínio, em português, como nos dados.
