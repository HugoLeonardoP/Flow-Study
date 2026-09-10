# FlowStudy — Documentação do Front-end

Organizador de estudos que combina a técnica **Pomodoro** com um sistema de
**revisão espaçada** (inspirado no SM-2). Este documento descreve a
implementação da camada de interface: React Native + TypeScript com Expo,
navegação com React Navigation e dados mockados em memória.

---

## 1. Telas implementadas

| Tela | Arquivo | Descrição |
|---|---|---|
| **Home** | `src/screens/Home/HomeScreen.tsx` | Tela inicial. Mostra saudação, resumo do dia (minutos estudados e revisões pendentes), CTA para iniciar uma sessão Pomodoro livre e a lista de matérias cadastradas. |
| **Pomodoro (Timer de foco)** | `src/screens/Pomodoro/PomodoroScreen.tsx` | Timer circular animado com alternância entre ciclo de foco (25 min) e descanso (5 min), controles de play/pausa/pular, contagem de ciclos concluídos e indicação da matéria vinculada (quando houver). |
| **Cadastro/Edição de Matéria** | `src/screens/Materia/MateriaFormScreen.tsx` | Formulário para criar ou editar uma matéria: nome, seletor de cor e seletor de categoria. Reaproveitado tanto para criação quanto para edição. |
| **Detalhe de Matéria** | `src/screens/Materia/MateriaDetailScreen.tsx` | Cabeçalho da matéria, resumo (tempo total estudado e nº de itens de revisão), botão para iniciar Pomodoro já vinculado, histórico de sessões e lista de itens de revisão associados. |
| **Revisões do Dia** | `src/screens/Revisao/RevisaoScreen.tsx` | Lista dos itens de revisão pendentes no dia. Ao tocar em um item, abre uma folha (bottom sheet) de autoavaliação com três níveis. Possui empty state quando não há pendências. |
| **Estatísticas** (Fase 2) | `src/screens/Estatisticas/EstatisticasScreen.tsx` | Gráfico de barras com minutos estudados por dia da semana, gráfico de pizza com a taxa de lembrança nas revisões e um resumo textual do histórico geral. |

Navegação: **Bottom Tab Navigator** (Início / Revisões / Estatísticas) com uma
**Stack Navigator** aninhada na aba Início (`Home → Matéria (form/detalhe) →
Pomodoro`), configurada em `src/navigation/AppNavigator.tsx`.

---

## 2. Principais componentes utilizados

| Componente | Arquivo | Função |
|---|---|---|
| `TimerCircular` | `src/components/TimerCircular.tsx` | Círculo de progresso em SVG (`react-native-svg`) animado com `Animated.Value`, exibindo o tempo restante e trocando de cor conforme o tipo de ciclo (foco/descanso). |
| `CardMateria` | `src/components/CardMateria.tsx` | Card de matéria na Home, com faixa de cor, ícone por categoria (`@expo/vector-icons`), nome e categoria. |
| `ItemRevisaoCard` | `src/components/ItemRevisaoCard.tsx` | Card de item de revisão que, ao ser tocado, abre um `Modal` estilo bottom sheet com as três opções de autoavaliação ("não lembrei", "lembrei com dificuldade", "lembrei fácil"). |
| `GraficoEstudo` | `src/components/GraficoEstudo.tsx` | Envolve um `BarChart` de `react-native-chart-kit` para exibir minutos estudados por dia, adaptando a largura à tela do dispositivo. |
| `BotaoPrimario` / `BotaoSecundario` | `src/components/BotaoPrimario.tsx`, `BotaoSecundario.tsx` | Botões de ação primária (preenchido) e secundária (contornado), usados em todas as telas. |
| `Badge` | `src/components/Badge.tsx` | Selo colorido para status/categoria/data (ex.: "Hoje", "Avaliado hoje"). |

Bibliotecas de apoio: `react-native-svg` (timer), `react-native-chart-kit`
(gráficos de barra e pizza), `@expo/vector-icons` (ícones), React Navigation
(Bottom Tabs + Native Stack).

---

## 3. Componentes reutilizáveis

Ficam isolados em `src/components/` e são usados em duas ou mais telas, sem
nenhuma lógica de tela embutida:

- **`BotaoPrimario`** — usado na Home (iniciar Pomodoro), no formulário de
  matéria (salvar/criar) e na tela de Pomodoro/Detalhe de Matéria.
- **`BotaoSecundario`** — usado na tela de Pomodoro (encerrar sessão).
- **`Badge`** — usado no `ItemRevisaoCard` e na tela de Detalhe de Matéria.
- **`CardMateria`** — usado na listagem da Home; recebe a matéria e o
  callback de navegação por props, sem conhecer a tela que o chama.
- **`ItemRevisaoCard`** — usado exclusivamente na tela de Revisões, mas
  desenhado para ser reaproveitado caso outra tela precise listar itens de
  revisão no futuro (ex.: dentro do Detalhe de Matéria).
- **`TimerCircular`** — componente puramente visual/animado, recebe
  `progresso`, `tempoLabel` e `tipo` por props; não depende do estado do
  Pomodoro, podendo ser reutilizado em outras telas de timer.
- **`GraficoEstudo`** — recebe título e dados por props, reutilizável para
  qualquer recorte temporal (dia/semana/matéria).

A separação segue a estrutura pedida: `src/screens/` (uma pasta por tela),
`src/components/` (reutilizáveis), `src/navigation/`, `src/theme/`,
`src/types/` e `src/mocks/`.

---

## 4. Elementos de entrada de dados

| Elemento | Onde é usado | Detalhes |
|---|---|---|
| Campo de texto (nome da matéria) | `MateriaFormScreen` | `TextInput` controlado, com validação simples (mínimo de 2 caracteres) que habilita/desabilita o botão de salvar. |
| Seletor de cor | `MateriaFormScreen` | Grade de swatches (`materiaColorOptions`, definida em `src/theme/colors.ts`) com indicador de seleção (ícone de check sobre a cor ativa). |
| Seletor de categoria | `MateriaFormScreen` | Chips selecionáveis (`categorias`, definido em `src/types/index.ts`), com destaque visual para a categoria ativa. |
| Botões de autoavaliação | `ItemRevisaoCard` (modal) | Três opções de toque único ("não lembrei" / "lembrei com dificuldade" / "lembrei fácil"), cada uma disparando o recálculo da próxima data de revisão. |
| Controles do Pomodoro | `PomodoroScreen` | Botões de ícone para play/pausa e pular ciclo — tecnicamente entrada de dados de controle de estado, não de texto. |

---

## 5. Estratégias de adaptação do layout a diferentes tamanhos de tela

- **Flexbox em todas as telas**: nenhum posicionamento absoluto fixo é usado
  para layout de conteúdo; tudo é organizado com `flexDirection`, `flex: 1`,
  `gap` e `justifyContent`/`alignItems`.
- **`SafeAreaView` do `react-native-safe-area-context`**: usada em todas as
  telas (envolvida por `SafeAreaProvider` em `App.tsx`) para respeitar
  notches, barras de status e áreas de gesto em iOS e Android.
- **`useWindowDimensions`**: usado para calcular dimensões que dependem do
  tamanho real da tela em tempo de execução, em vez de valores fixos:
  - `PomodoroScreen` calcula o diâmetro do `TimerCircular` como
    `Math.min(width - spacing.lg * 4, 280)`, encolhendo o timer em telas
    pequenas e limitando o tamanho máximo em tablets;
  - `GraficoEstudo` e `EstatisticasScreen` calculam a largura dos gráficos
    (`react-native-chart-kit`) com base na largura da tela menos o padding,
    para que os gráficos nunca estourem o container nem fiquem
    desproporcionalmente pequenos em telas grandes.
- **Listas com `FlatList`** (Home e Revisões) em vez de mapear arrays
  diretamente, permitindo rolagem e recomputação eficiente de layout em
  qualquer altura de tela.
- **Unidades relativas de espaçamento**: a escala de `spacing` e `radius`
  (`src/theme/spacing.ts`) é aplicada de forma consistente, então aumentar
  ou ajustar essa escala reflete em todas as telas ao mesmo tempo.
- **Componentes com `flex: 1` em grades**: os cards de resumo na Home e no
  Detalhe de Matéria usam `flex: 1` dentro de uma `View` com
  `flexDirection: 'row'`, dividindo o espaço igualmente independentemente
  da largura do aparelho.

---

## 6. Instruções para execução da aplicação

Pré-requisito: **Node.js 20.19+** (ou 22.13+/24.3+), exigido pelas
dependências atuais do Expo.

```bash
# 1. Extraia o projeto e entre na pasta
cd FlowStudy

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npx expo start
```

- **No celular**: instale o app **Expo Go** (Android/iOS), fique na mesma
  rede Wi-Fi do computador e escaneie o QR code exibido no terminal/painel
  do navegador.
- **Em emulador Android**: com o Android Studio configurado, rode
  `npx expo start` e pressione `a`.
- **Em simulador iOS** (somente macOS): com o Xcode configurado, rode
  `npx expo start` e pressione `i`.

Não é necessário nenhum passo de "prebuild" nativo — o projeto usa apenas
módulos gerenciados pelo Expo.

---

## 7. Principais decisões de interface tomadas nesta etapa

- **Design system centralizado em `src/theme/`**: cores, tipografia,
  espaçamento e raio de borda ficam em arquivos únicos (`colors.ts`,
  `typography.ts`, `spacing.ts`) e são importados por todas as telas,
  garantindo consistência visual sem duplicar valores mágicos pelo código.
- **Paleta fugindo do "kit de card genérico"**: em vez de um cinza/azul
  corporativo padrão, a paleta usa papel neutro como base, verde-sálvia
  como cor de marca, âmbar para o ciclo de foco do Pomodoro e azul-céu
  para o descanso — reforçando visualmente o estado atual da sessão.
- **Tipografia com dois papéis bem definidos**: Fraunces (serifada, com
  peso editorial) para títulos e para o número do timer, e Inter para texto
  de interface e corpo — carregadas via `@expo-google-fonts` em `App.tsx`.
- **Autoavaliação em bottom sheet, não em nova tela**: optou-se por um
  `Modal` deslizando de baixo para cima no `ItemRevisaoCard`, mantendo o
  usuário no contexto da lista de revisões em vez de uma navegação completa,
  o que reduz a fricção de avaliar vários itens em sequência.
- **Reaproveitamento de uma única tela para criar e editar matéria**:
  `MateriaFormScreen` decide seu comportamento (criar vs. salvar) a partir
  da presença de `materiaId` nos parâmetros de rota, evitando duplicar
  formulário e validação em duas telas separadas.
- **Timer como componente puramente visual**: `TimerCircular` não conhece
  lógica de Pomodoro — apenas recebe progresso, rótulo e tipo de ciclo. A
  lógica de contagem, alternância de ciclos e persistência da sessão fica
  isolada em `PomodoroScreen`, facilitando testes e reuso do timer em
  outros contextos futuros.
- **Feedback imediato sem navegação**: tanto a avaliação de revisão quanto
  a conclusão de um ciclo Pomodoro atualizam o estado local e mostram
  feedback (remoção do item da lista, alerta nativo) sem exigir que o
  usuário saia da tela atual, conforme pedido nos requisitos de fluxo.
- **Dados mockados desacoplados da UI**: toda a leitura/escrita de dados
  passa por funções em `src/mocks/data.ts` (`getResumoDoDia`,
  `getRevisoesDoDia`, `avaliarItemRevisao`, etc.), para que a troca futura
  por SQLite ou uma API real não exija alterar nenhuma tela ou componente.
