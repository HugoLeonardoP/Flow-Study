# FlowStudy — Frontend (Expo / React Native / TypeScript)

Organizador de estudos que combina **Pomodoro** com **revisão espaçada**
(inspirada no SM-2). Este pacote contém **apenas a camada de interface**:
não há backend, autenticação, API externa, SQLite ou sincronização —
tudo roda com dados mockados em memória (`src/mocks/data.ts`), prontos
para serem trocados por uma fonte real no futuro sem alterar as telas.

## Como rodar

Requer **Node.js 20.19+** (ou 22.13+ / 24.3+), exigido pelo Expo SDK 57.

```bash
npm install
npx expo start
```

Abra no Expo Go (Android/iOS) ou em um emulador. O projeto usa Expo SDK 57
(React Native 0.86, React 19.2) + bibliotecas puramente JS/gerenciadas —
não é necessário "prebuild" nativo. Todas as versões em `package.json`
foram conferidas contra o registro do npm no momento da entrega para
evitar conflitos de peer dependency.

## Decisões de design

- **Paleta**: papel neutro (`#F7F4EC`) como base, verde-sálvia como cor de
  marca, âmbar para o ciclo de foco do Pomodoro e azul-céu para o descanso.
  Evita deliberadamente o terracota/creme e o kit de cards genérico com
  sombra cinza uniforme.
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
  types/           # Materia, SessaoPomodoro, ItemRevisao, EstatisticaDia
  mocks/           # dados fake + helpers (inclui recálculo simplificado de revisão)
```

## O que é mock/simulado de propósito

- `recalcularProximaRevisao` em `src/mocks/data.ts` **não** é o algoritmo
  SM-2 real — apenas soma um número fixo de dias por nível de lembrança,
  como pedido no briefing.
- Todas as listas (`materiasMock`, `sessoesMock`, `itensRevisaoMock`) vivem
  em memória; reiniciar o app restaura os dados iniciais.
- Notificações são apenas alertas nativos (`Alert.alert`) simulando o fim
  de um ciclo — nenhuma notificação local real é agendada.
