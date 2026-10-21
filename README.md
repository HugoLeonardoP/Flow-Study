# FlowStudy — Frontend (Expo / React Native / TypeScript)

Organizador de estudos que combina **Pomodoro** com **revisão espaçada**
(inspirada no SM-2). Este pacote contém a camada de interface e a
**persistência local** dos dados no aparelho (AsyncStorage). Não há backend,
autenticação, API externa ou sincronização em nuvem. Na primeira execução o
app grava dados de exemplo (`src/mocks/data.ts`); depois disso, tudo o que
o usuário cria, edita ou remove permanece salvo ao fechar e reabrir o app.

## Documentação

- **`DOCUMENTACAO.md`** — telas implementadas, componentes principais e
  reutilizáveis, elementos de entrada de dados e estratégias de layout
  responsivo.
- **`etapa-03.md`** — estrutura de navegação, mecanismos de acesso a cada
  tela, feedback visual, decisões de UX e medidas de acessibilidade
  implementadas (contraste de cor, áreas de toque, rótulos para leitor de
  tela, tratamento da barra de navegação do sistema).
- **`etapa-04.md`** — persistência de dados: mecanismo escolhido e
  justificativa, estrutura dos dados, operações implementadas, telas que
  usam os dados e procedimento de teste após fechar e reabrir o app.

## Como rodar

Requer **Node.js 20.19+** (ou 22.13+ / 24.3+), exigido pelo Expo SDK 57.

```bash
npm install
npx expo install @react-native-async-storage/async-storage   # persistência (etapa 04)
npx expo start
```

O `expo install` escolhe a versão do AsyncStorage compatível com o seu SDK
(SDK 57 → 2.2.0, a mesma embutida no Expo Go).

Abra no Expo Go (Android/iOS) ou em um emulador. O projeto usa Expo SDK 57
(React Native 0.86, React 19.2) + bibliotecas puramente JS/gerenciadas —
não é necessário "prebuild" nativo. Todas as versões em `package.json`
foram conferidas contra o registro do npm no momento da entrega para
evitar conflitos de peer dependency.

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
  components/      # TimerCircular, CardMateria, ItemRevisaoCard, GraficoEstudo, botões, badge
  navigation/      # Bottom Tabs (Início/Revisões/Estatísticas) + Stack aninhada em Início
  theme/           # cores, tipografia, espaçamento
  types/           # Materia, SessaoPomodoro, ItemRevisao, AvaliacaoRevisao, EstatisticaDia
  services/        # dataService.ts: operações de dados (CRUD) + cache + gravação
  storage/         # armazenamento.ts: leitura/gravação de JSON no AsyncStorage
  utils/           # datas.ts: datas no fuso local
  mocks/           # dados de exemplo gravados apenas na primeira execução
```

## O que é simulado de propósito

- `recalcularProximaRevisao` em `src/services/dataService.ts` **não** é o
  algoritmo SM-2 real — apenas define um número fixo de dias por nível de
  lembrança, como pedido no briefing.
- Notificações são apenas alertas nativos (`Alert.alert`) simulando o fim
  de um ciclo — nenhuma notificação local real é agendada.
