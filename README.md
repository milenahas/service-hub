# Service Hub

Central de chamados do suporte de TI. Clientes abrem chamados quando algo quebra; consultores atendem a fila, respondem e registram o que fizeram; gestores acompanham a equipe, redistribuem trabalho e enxergam o que está perto de estourar o prazo.

Front em React, TypeScript e Vite. Em desenvolvimento, um snapshot de tenant substitui a API; o relógio dos prazos é `meta.agora` nesse snapshot, não o relógio da máquina. Com a API em uso, os dados vêm dela e as mudanças chegam por WebSocket.

## Quem usa

Três rotinas, em telas separadas — não uma única interface com ramos por perfil.

| Perfil | Rotina |
| --- | --- |
| **Cliente** | Poucos chamados por ano. Quer saber se alguém pegou o chamado, quando terá resposta e o que aconteceu, sem reler tudo. Não vê categoria, grupo nem prioridade interna. Anotação interna nunca aparece. |
| **Consultor** | Dia na fila: chamados atribuídos e fila do grupo. Prioriza prazo, responde, anota para colegas, muda status. Precisa achar de imediato o que está prestes a estourar o SLA. |
| **Gestor** | Olha a equipe, não a conversa: carga, ociosidade, SLA nas próximas horas, redistribuição. Abre a conversa sobretudo quando o cliente escalou. |

## O que a área permite

1. Abrir um chamado.
2. Encontrar um chamado e ver conversa, status, responsável e prazo.
3. Pegar um chamado para atender.
4. Trocar mensagens no chamado.
5. Mudar o status com motivo registrado (chamado fechado pode reabrir).
6. Acompanhar a situação de um grupo de consultores.

Mudanças feitas por outras pessoas devem aparecer na tela enquanto alguém usa o sistema.

## Pré-requisitos

- Node.js compatível com o projeto (use a versão LTS atual).
- `npm`

## Como rodar

Na raiz do repositório:

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar no terminal (em geral `http://localhost:5173`).

Build de produção e pré-visualização:

```bash
npm run build
npm run preview
```

## Ver como cliente, consultor ou gestor

Cada perfil tem sua própria rotina na interface. Depois de subir o app com `npm run dev`, escolha o perfil na tela inicial — isso abre a visão correspondente, sem misturar as três numa só tela.

Até o seletor existir na interface, o repositório ainda expõe apenas o scaffold da aplicação; a documentação acima descreve o comportamento alvo da área de chamados.

## Outros comandos

| Comando | Uso |
| --- | --- |
| `npm run lint` | ESLint |
| `npm test` | Testes (Vitest), uma execução |
| `npm run test:watch` | Testes em modo observação |
| `npm run build` | `tsc -b` e build do Vite |

Antes de enviar alterações, rode `npm run lint`, `npm test` e `npm run build` e deixe tudo verde.

## Para quem desenvolve

Convenções de produto, dados, eventos e estilo de código estão em [AGENTS.md](./AGENTS.md).

Stack principal: React, TypeScript, Vite, Vitest e React Testing Library (jsdom). Setup de testes em `src/setupTestes.ts`.