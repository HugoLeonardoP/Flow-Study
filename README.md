# FlowStudy — Frontend (Expo / React Native / TypeScript)

Organizador de estudos que combina **Pomodoro** com **revisão espaçada**
(inspirada no SM-2). O projeto tem duas partes:

- **App mobile** (raiz do projeto — Expo / React Native / TypeScript): interface,
  navegação, feedback ao usuário e cache local dos últimos dados recebidos.
- **Backend** (`backend/` — Node.js + Express): guarda os dados, valida as
  entradas e aplica as regras de negócio (reagendamento de revisões, cascata de
  exclusões, resumo e estatísticas). Na primeira execução grava dados de exemplo.
- **Serviço externo — Wikipédia**: o backend consulta a API pública da Wikipédia
  para mostrar o **resumo de um tema de revisão** (sem chave de API).

Não há autenticação (um único usuário) nem sincronização em nuvem.

## Funcionalidades

- Matérias, itens de revisão e sessões Pomodoro (criar, editar, excluir).
- Autoavaliação com reagendamento da próxima revisão e estatísticas.
- **Resumo do tema pela Wikipédia**: no Detalhe da matéria, toque em um item de
  revisão → bloco "Resumo na Wikipédia" → **Buscar resumo**. Mostra carregando,
  resultado, "sem resultado" ou erro, e permite **salvar o resumo no item**.

## Documentação

- **`DOCUMENTACAO.md`** — telas implementadas, componentes principais e
  reutilizáveis, elementos de entrada de dados e estratégias de layout
  responsivo.
- **`etapa-03.md`** — estrutura de navegação, mecanismos de acesso a cada
  tela, feedback visual, decisões de UX e medidas de acessibilidade
  implementadas (contraste de cor, áreas de toque, rótulos para leitor de
  tela, tratamento da barra de navegação do sistema).
- **`docs/etapa-06.md`** — integração com a API da Wikipédia: endpoints,
  métodos HTTP, estrutura dos dados, fluxo, estados (carregando, sucesso, erro,
  ausência de dados), configuração e roteiro de teste.
- **`etapa-05.md`** — integração app + backend: fluxo completo de negócio,
  validação de entradas, feedback, decisões técnicas e instruções de teste.
- **`etapa-04.md`** — persistência de dados: mecanismo escolhido e
  justificativa, estrutura dos dados, operações implementadas, telas que
  usam os dados e procedimento de teste após fechar e reabrir o app.

## Como rodar

Requer **Node.js 20.19+** (ou 22.13+ / 24.3+), exigido pelo Expo SDK 57.
Celular e computador na **mesma rede Wi-Fi**.

**1. Backend** (terminal 1)

```bash
cd backend
npm install
npm start          # mostra: → no celular, use: http://SEU_IP:3000
```

**2. App** (terminal 2, na raiz do projeto)

```bash
npm install
npx expo install @react-native-async-storage/async-storage   # cache local (se ainda não instalou)
npm install -D babel-preset-expo@~57.0.16                    # exigido pelo babel.config.js
npx expo start -c
```

Escaneie o QR code no Expo Go. O app descobre sozinho o IP do computador; se
não conseguir conectar, crie um arquivo `.env` na raiz com
`EXPO_PUBLIC_API_URL=http://SEU_IP:3000` e rode `npx expo start -c`.
Detalhes e roteiro de teste em `etapa-05.md`.

**Resumo da Wikipédia (opcional configurar):** funciona sem configuração. O
**backend precisa de internet** para consultar a Wikipédia. Para identificar o
app (boa prática exigida pela Wikimedia), copie `backend/.env.example` para
`backend/.env`, coloque seu contato em `WIKIPEDIA_USER_AGENT` e rode
`npm run start:env` no lugar de `npm start`. Não há credenciais; o `.env` está
no `.gitignore`. Veja `docs/etapa-06.md`.

## Decisões de design

- **Paleta**: papel neutro (`#F7F4EC`) como base, verde-sálvia como cor de
  marca, âmbar para o ciclo de foco do Pomodoro e azul-céu para o descanso.
  Evita deliberadamente o terracota/creme e o kit de cards genérico com
  sombra cinza uniforme. As cores de texto (`inkFaint`, `amberDark`,
  `skyDark`, `rustDark`, `goldDark`, `borderStrong`) foram calibradas para
  atingir contraste mínimo de 4,5:1 (texto) e 3:1 (bordas de componentes),
  conforme WCAG — ver `etapa-03.md` para o detalhamento.
- **Tipografia**: Fraunces (serifada, com peso editorial) para títulos e o
  número do timer; Inter para texto de interface. Carregadas via
  `@expo-google-fonts` em `App.tsx`.
- **Design tokens**: `src/theme/colors.ts`, `typography.ts` e `spacing.ts`
  centralizam cor, tipo, espaçamento e raio de borda usados em todas as
  telas.

## Estrutura

```
src/
  screens/        # uma pasta por tela
  components/      # TimerCircular, CardMateria, ItemRevisaoCard, GraficoEstudo, ResumoWikipedia, botões, badge
  navigation/      # Bottom Tabs (Início/Revisões/Estatísticas) + Stack aninhada em Início
  theme/           # cores, tipografia, espaçamento
  types/           # Materia, SessaoPomodoro, ItemRevisao, AvaliacaoRevisao, EstatisticaDia
  services/        # api.ts (cliente HTTP), dataService.ts (dados + cache), feedback.ts (mensagens)
  storage/         # armazenamento.ts: cache local no AsyncStorage
  utils/           # datas.ts: datas no fuso local
  config.ts        # endereço do backend
backend/
  server.js        # rotas da API (Express)
  src/regras.js    # validações e regras de negócio
  src/wikipedia.js # cliente da API da Wikipédia (resumo do tema)
  src/db.js        # persistência em arquivo JSON (data/db.json)
  src/seed.js      # dados de exemplo da primeira execução
```

## O que é simulado de propósito

- O reagendamento de revisões (`DIAS_POR_NIVEL` em `backend/src/regras.js`) **não** é o
  algoritmo SM-2 real — apenas define um número fixo de dias por nível de
  lembrança, como pedido no briefing.
- Notificações são apenas alertas nativos (`Alert.alert`) simulando o fim
  de um ciclo — nenhuma notificação local real é agendada.
