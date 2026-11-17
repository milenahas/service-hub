# Service Hub

Central de chamados do suporte de TI. O cliente abre um pedido e acompanha se alguém assumiu, qual o prazo de resposta e o que mudou na conversa. O consultor atende a fila do próprio grupo, responde, anota para os colegas e muda o status. O gestor vê a equipe inteira, localiza o que está perto de estourar o prazo e redistribui chamados.

A interface é um front em React, TypeScript e Vite. Os dados iniciais vêm de um único arquivo, `src/data/dados.json`. Enquanto a tela está aberta, as ações e as novidades da fila passam por eventos aplicados no estado do navegador, no mesmo formato que uma atualização em tempo real usaria.

## Primeira execução

1. Instale o [Node.js](https://nodejs.org/) 20 ou mais recente (a versão LTS atual serve).
2. Na raiz do repositório, instale as dependências:

```bash
npm install
# ou
pnpm install
```

3. Suba o servidor de desenvolvimento:

```bash
npm run dev
# ou
pnpm run dev
```

4. Abra no navegador o endereço que o Vite imprimir no terminal. Em geral é `http://localhost:5173`.
5. A tela **Entrar** pede só o usuário, sem senha. Digite um dos quatro logins da tabela abaixo e confirme com **Entrar** ou com a tecla Enter. A comparação ignora maiúsculas e espaços nas pontas.
6. O cabeçalho mostra o nome dos perfis selecionados para o snapshot (não o texto que você digitou) e o botão **Sair**. Esses perfis são Leandro Mendes (cliente), Thiago Nascimento (consultor de Infraestrutura), Felipe Gomes (consultor de Aplicações) e Ricardo Monteiro (gestor).

Usuário inexistente mostra o erro em vermelho logo abaixo do campo. A sessão fica só na memória da aba: **Sair** ou recarregar a página descarta o que foi feito e a próxima entrada recomeça a partir de `dados.json`. O arquivo no disco não é alterado.

## Quem entra

Cada perfil tem a própria tela. O login escolhe qual rotina abrir.

| Usuário | Quem aparece no cabeçalho | O que a tela faz |
| --- | --- | --- |
| `cliente` | Leandro Mendes | Os chamados que ele mesmo abriu. Datas no fuso de Lisboa (`pt-PT`). |
| `consultor-infraestrutura` | Thiago Nascimento | Consultor do grupo **Infraestrutura**. |
| `consultor-aplicacoes` | Felipe Gomes | Consultor do grupo **Aplicações**. |
| `gestor` | Ricardo Monteiro | Equipe dos dois grupos e os chamados deles. |

Os dois consultores existem porque cada um enxerga só o grupo em que trabalha. `consultor` sozinho não entra. Os quatro nomes também aparecem na caixa **Perfis disponíveis** da tela de login, para copiar.

Datas são gravadas em UTC e exibidas no fuso de quem está logado. Cliente usa Lisboa; consultores e gestor usam `America/Sao_Paulo` e `pt-BR`.

## O que cada rotina faz

### Cliente

A tela tem a lista de chamados à esquerda e o chamado selecionado à direita.

- A lista traz só os chamados de Leandro, do mais recente para o mais antigo. Cada item mostra o número do chamado (`#1234`), o título, uma frase de prazo e o status.
- O prazo fala a língua de quem espera resposta: **Resposta até HH:MM** enquanto o prazo de primeira resposta ainda não passou, **Resposta em breve** depois disso, **Aguardando você** quando o suporte pediu um retorno. Chamado resolvido ou fechado não mostra contagem de atraso.
- No detalhe, uma faixa resume a etapa: recebido e à espera de um consultor, em atendimento (com o nome de quem assumiu), aguardando uma resposta sua, ou resolvido. Chamado fechado não exibe essa faixa.
- A conversa mostra só o que é público: mensagens e avisos de sistema (atribuição e mudança de status). Anotação interna não entra na lista, no detalhe nem em contagem.
- Com o chamado ativo, o rodapé envia uma mensagem. Com o chamado resolvido ou fechado, o rodapé oferece **reabrir**, pedindo um motivo. A reabertura volta o status para aberto e registra o motivo na conversa.
- **Abrir chamado** pede assunto e descrição. O pedido novo entra no grupo Infraestrutura, com prioridade média. Os prazos de primeira resposta e de resolução saem da tabela de SLA a partir do instante de referência do snapshot. Depois de enviar, o chamado aberto aparece selecionado na lista.

Categoria, grupo e prioridade interna ficam de fora dessa tela. O cliente vê status, responsável, prazo de resposta e o histórico público.

### Consultor

A tela organiza a fila do grupo: coluna da esquerda com os chamados, painel do chamado no centro e, quando aberto, o painel de notas à direita. A lista reúne os chamados do grupo, em qualquer data, separados pelas abas abaixo.

A fila tem quatro abas:

| Aba | O que lista |
| --- | --- |
| **Minha fila** | Chamados ativos atribuídos a quem está logado. |
| **Fila do grupo** | Chamados ativos do mesmo grupo, já com outro consultor. |
| **Sem dono** | Chamados ativos do grupo que ninguém pegou. |
| **Concluídos** | Resolvidos e fechados que estavam com o consultor logado. |

Acima da lista, a busca filtra por texto e um seletor restringe a **Todos**, **Urgentes**, **Próximas 4 horas** ou **Aguardando cliente**. Os ativos se agrupam por urgência do prazo de resolução: estourado ou com menos de uma hora, próximas quatro horas, demais, e aguardando cliente. O selo de prazo usa o texto **Estourado há…**, **Vence em…** ou **Prazo em…**, com cor mais forte quanto mais perto do limite. Concluído mostra o selo de status.

No chamado selecionado dá para:

- **Pegar chamado**, quando ele ainda não tem responsável. Isso atribui o chamado ao consultor logado e, se estava aberto, passa para em atendimento. A conversa ganha o aviso “Chamado atribuído a…”.
- **Responder ao cliente**. A mensagem é pública.
- **Notas**. Anotação interna, visível para consultor e gestor, invisível para o cliente.
- **Mudar status**, escolhendo o destino permitido a partir do status atual e registrando um motivo. A conversa ganha o aviso “Status: … → …. Motivo: …”. De resolvido ou fechado, a transição disponível é reabrir (volta para aberto).

Um ponto azul marca chamado com novidade (chamado novo ou mensagem pública) enquanto ele não está selecionado. Abrir o item limpa o marcador.

Com a tela do consultor aberta, a fila recebe novidades sozinha, sem recarregar, para **simular requisições WebSocket**:

- a cada 7 segundos, um chamado novo entra em **Sem dono** no grupo de quem está logado;
- a cada 12 segundos, uma mensagem de cliente chega em outro chamado ativo da fila (nunca no que está aberto na hora);
- a cada 20 segundos, uma mensagem de cliente chega no chamado aberto, se ele ainda está ativo. Trocar de chamado recomeça essa espera, e a conversa rola até a linha nova;
- a cada 14 segundos, o status de outro chamado ativo muda, com o motivo “Simulação da fila.”.

Sair da tela interrompe esses disparos. Aplicar de novo um evento que já entrou não duplica chamado, mensagem nem mudança de status.

### Gestor

A tela abre no painel da equipe, com a saudação, a data de referência, quantos chamados estão ativos e quantos consultores a equipe tem (Infraestrutura e Aplicações juntos).

Três cartões resumem o momento:

- **SLA em até 4h** — chamados ativos estourados, com menos de uma hora ou dentro das próximas quatro horas. O clique abre a lista ordenada por urgência.
- **Sem responsável** — chamados ativos que ninguém pegou. O clique abre a lista para atribuir.
- **Ociosos agora** — consultores sem nenhum chamado ativo. O clique filtra a equipe por ociosos.

A lista da equipe busca por nome, filtra por **Todos**, **Ociosos** ou **Com risco**, e ordena por chamados ativos, risco ou ociosidade. Cada linha mostra o grupo, quantos chamados ativos a pessoa tem, quantos estão em risco e há quanto tempo está ociosa na semana. **Ver chamados** abre os ativos daquele consultor, com os mesmos números no topo.

Nas listas (indicador ou consultor) dá para filtrar por **Todos**, **Em risco** e **Aguardando cliente**, abrir a conversa do chamado e trocar o responsável num seletor. Atribuir de novo para a mesma pessoa, ou devolver para “sem responsável” um chamado que já está sem dono, não gera evento repetido. A conversa é o histórico do chamado: o gestor lê, registra nota interna e redistribui. Quem volta da conversa retorna à lista ou ao consultor de onde saiu.

Consultor ocioso é quem não tem chamado ativo atribuído. O painel não calcula carga nem marca alguém como sobrecarregado.

Com a tela do gestor aberta, a equipe recebe as mesmas novidades nos dois grupos, sem recarregar:

- a cada 7 segundos, um chamado novo sem responsável entra num grupo sorteado da equipe;
- a cada 12 segundos, uma mensagem de cliente chega num chamado ativo de alguém da equipe (nunca no chamado aberto na conversa);
- a cada 14 segundos, o status de outro chamado ativo da equipe muda, com o motivo “Simulação da fila.”.

Sair da tela interrompe esses disparos. Não há marcador de não lido: contagens, listas e conversa acompanham o que já está na sessão.

## Status e prazo

Um chamado percorre estes status:

| Status | Rótulo na tela |
| --- | --- |
| `aberto` | Aberto |
| `em_atendimento` | Em atendimento |
| `aguardando_cliente` | Aguardando cliente |
| `resolvido` | Resolvido |
| `fechado` | Fechado |

**Ativo** é aberto, em atendimento ou aguardando cliente. **Concluído** é resolvido ou fechado.

A prioridade é `baixa`, `media`, `alta` ou `critica`. Cada uma tem, na tabela `sla` do snapshot, horas para a primeira resposta e horas para a resolução. Chamados que já vêm no arquivo trazem `prazo_primeira_resposta` e `prazo_resolucao` prontos. Chamado criado na sessão calcula esses dois prazos a partir de `meta.agora` mais a linha de SLA da prioridade.

Todo atraso, “vence em” e contagem de risco usa o instante `meta.agora` do snapshot (`2026-11-03T13:00:00Z`), não o relógio do computador. Assim a fila mostra a mesma urgência em qualquer máquina.

## Como o estado se atualiza

Toda ação — abrir, pegar, atribuir, responder, anotar, mudar status, reabrir — vira um evento e passa pelo mesmo redutor. Não há um caminho paralelo que altere o chamado “por fora”.

| Evento | Efeito |
| --- | --- |
| `chamado.aberto` | Inclui o chamado se aquele `id` ainda não existe. |
| `chamado.atribuido` | Define o responsável. Se o status era aberto, passa para em atendimento e registra a mensagem de sistema. |
| `mensagem.adicionada` | Anexa a mensagem se aquele `id` ainda não existe. `interna: true` fica restrita a consultor e gestor. |
| `status.alterado` | Troca o status e registra a mensagem de sistema com o motivo. |

O id de cada evento fica guardado na sessão. Reaplicar o mesmo id não duplica nada.

No login, a sessão recorta o snapshot: o cliente recebe os chamados em que é o solicitante; o consultor, todos os chamados do seu grupo; o gestor, os consultores dos dois grupos e os chamados desses grupos. Categorias, SLA, grupos e usuários permanecem inteiros. O que nasce depois (chamado aberto na hora, mensagem, histórico) existe só nessa sessão.

## Dependências

`npm install` ou `pnpm install` instala tudo o que está em `package.json`. As versões abaixo são as faixas declaradas nesse arquivo.

A aplicação em execução usa quatro pacotes:

| Pacote | Versão | Papel |
| --- | --- | --- |
| `react` | ^19.3.1 | Interface |
| `react-dom` | ^19.3.1 | Renderização no navegador |
| `react-router-dom` | ^7.18.5 | Rotas de login, cliente, consultor e gestor |
| `zustand` | ^5.1.0 | Estado da sessão (usuário logado, chamados, eventos) |

O restante entra só em desenvolvimento, teste e build:

| Pacote | Versão | Papel |
| --- | --- | --- |
| `vite` | ^8.3.6 | Servidor de desenvolvimento e build |
| `@vitejs/plugin-react` | ^6.1.2 | Suporte a React no Vite |
| `typescript` | ~6.0.3 | Linguagem e checagem de tipos (`tsc -b`) |
| `@types/node` | ^24.19.2 | Tipos do Node para o tooling |
| `@types/react` | ^19.3.0 | Tipos do React |
| `@types/react-dom` | ^19.3.0 | Tipos do React DOM |
| `vitest` | ^5.1.0 | Testes (`npm test` / `pnpm test`) |
| `jsdom` | ^29.1.1 | DOM simulado para os testes de tela |
| `@testing-library/react` | ^16.3.3 | Renderização e interação nos testes |
| `@testing-library/jest-dom` | ^7.0.1 | Asserções de DOM (`toBeInTheDocument` e afins) |
| `eslint` | ^10.14.0 | Lint |
| `@eslint/js` | ^10.0.1 | Regras base do ESLint |
| `typescript-eslint` | ^8.72.1 | Regras de TypeScript no ESLint |
| `eslint-plugin-react-hooks` | ^7.1.1 | Regras dos hooks do React |
| `eslint-plugin-react-refresh` | ^0.5.7 | Regras do recarregamento do Vite |
| `globals` | ^17.13.0 | Globais de ambiente usados na config do ESLint |

O setup dos testes está em `src/setupTestes.ts`. Convenções de domínio e de código estão em [AGENTS.md](./AGENTS.md).
