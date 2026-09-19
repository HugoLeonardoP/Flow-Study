# FlowStudy — Etapa 03: Navegação, Feedback Visual e Acessibilidade

Este documento descreve a estrutura de navegação do FlowStudy, os
mecanismos de acesso a cada tela, o tratamento de feedback visual, as
principais decisões de UX e as medidas de acessibilidade implementadas na
camada de interface (React Native + TypeScript + Expo).

---

## 1. Estrutura de navegação implementada

A navegação combina dois padrões do React Navigation, configurados em
`src/navigation/AppNavigator.tsx`:

- **Bottom Tab Navigator** — nível raiz da aplicação, com três abas fixas:
  **Início**, **Revisões** e **Estatísticas**. Representa as três áreas de
  uso recorrente do app (organizar/estudar, revisar, acompanhar progresso).
- **Native Stack Navigator** — aninhada dentro da aba **Início**, cobrindo
  o fluxo `Home → Matéria (cadastro/edição ou detalhe) → Pomodoro`. Esse
  fluxo é sequencial por natureza (o usuário escolhe uma matéria antes de
  poder ver seu detalhe ou iniciar uma sessão nela), por isso fica de fora
  das abas e dentro de uma pilha com histórico de navegação.

```
Bottom Tabs
├── Início (Stack)
│   ├── HomeMain            (tela inicial)
│   ├── MateriaForm         (criar/editar matéria)
│   ├── MateriaDetail       (detalhe da matéria)
│   └── Pomodoro            (timer de foco)
├── Revisões                (tela única, sem stack)
└── Estatísticas            (tela única, sem stack)
```

Essa estrutura foi escolhida por ser coerente com o propósito do app:
Pomodoro e cadastro de matéria pertencem ao mesmo fluxo de estudo e por
isso compartilham uma pilha; Revisões e Estatísticas são consultadas de
forma independente, por isso ficam como abas próprias sem sub-navegação.

---

## 2. Telas e mecanismos de acesso

| Tela | Como se chega até ela | Como se sai/volta |
|---|---|---|
| **Home** (`HomeMain`) | Tela inicial ao abrir o app; aba "Início" a qualquer momento. | É a raiz da pilha — não tem "voltar". |
| **Pomodoro** | Botão "Iniciar sessão Pomodoro" na Home (sessão livre); botão "Iniciar sessão Pomodoro" no Detalhe de Matéria (sessão vinculada). | Seta/gesto de voltar do cabeçalho, botão "Encerrar sessão" na tela, ou automaticamente ao concluir um ciclo de descanso (opção "Voltar para a Home" no alerta). |
| **Cadastro/Edição de Matéria** (`MateriaForm`) | Botão "+ Nova" na Home (criar); ícone de lápis no Detalhe de Matéria (editar). | Seta/gesto de voltar; ao salvar, navega automaticamente para o Detalhe da matéria. |
| **Detalhe de Matéria** (`MateriaDetail`) | Toque em qualquer card de matéria na Home; automaticamente após criar/editar uma matéria. | Seta/gesto de voltar do cabeçalho. |
| **Revisões do Dia** | Aba "Revisões" na barra inferior, a qualquer momento. | Tela de nível de aba — trocar de aba não "sai" da navegação, apenas alterna o contexto. |
| **Estatísticas** | Aba "Estatísticas" na barra inferior, a qualquer momento. | Idem acima. |

Todas as transições usam `navigation.navigate(...)` com parâmetros
tipados (`HomeStackParamList`), garantindo checagem de tipos em tempo de
compilação para os dados passados entre telas (ex.: `materiaId`).

---

## 3. Menus, abas e outros mecanismos de navegação

- **Barra de abas inferior** (`Bottom Tab Navigator`): ícone + rótulo de
  texto para cada aba (Início/Revisões/Estatísticas), com cor de destaque
  (`amberDark`) na aba ativa e cor neutra nas inativas — nunca depende só
  de cor, o rótulo de texto está sempre visível.
- **Cabeçalho com seta de voltar** (`Native Stack Navigator`): gerado
  automaticamente pelo React Navigation em todas as telas empilhadas
  (Matéria, Pomodoro), com suporte também ao gesto de arrastar da borda
  (iOS) e ao botão físico/gesto de voltar do sistema (Android).
- **CTA de destaque**: botão preenchido (`BotaoPrimario`, variante âmbar)
  para a ação mais importante da tela — "Iniciar sessão Pomodoro" —
  presente tanto na Home quanto no Detalhe de Matéria.
- **Bottom sheet modal**: usado em `ItemRevisaoCard` para a autoavaliação
  de revisão, mantendo o usuário no contexto da lista em vez de abrir uma
  tela cheia.
- **Chips de seleção**: usados no seletor de categoria do formulário de
  matéria, com estado visual claro de selecionado/não selecionado.

---

## 4. Mecanismos de feedback visual implementados

| Ação | Feedback |
|---|---|
| Pressionar qualquer botão/card | Mudança de opacidade e/ou fundo enquanto pressionado (`BotaoPrimario`, `BotaoSecundario`, `CardMateria`, `ItemRevisaoCard`, botões de ícone do Pomodoro, botão "Nova" da Home, botão de editar do Detalhe de Matéria, swatches de cor e chips de categoria do formulário). |
| Botão desabilitado (ex.: "Criar matéria" com nome inválido) | Opacidade reduzida (45%) + mensagem de texto explicando o motivo, exibida ao sair do campo. |
| Avaliar um item de revisão | O item some da lista imediatamente (conforme o requisito de fluxo) e o modal se fecha. |
| Concluir um ciclo do Pomodoro | Alerta nativo (`Alert.alert`) com título e ação clara ("Ciclo de foco concluído!" → "Iniciar descanso"; "Descanso concluído" → "Novo ciclo de foco" / "Voltar para a Home"). |
| Selecionar cor ou categoria no formulário | Ícone de check sobre a cor escolhida; fundo preenchido e texto branco no chip de categoria ativa. |
| Progresso do timer Pomodoro | Anel circular animado (`TimerCircular`) que se preenche suavemente conforme o tempo passa, mudando de cor entre ciclo de foco e de descanso. |
| Listas vazias | Empty states com ícone, título e texto explicativo (Home sem matérias, Revisões sem pendências). |

---

## 5. Principais decisões de UX adotadas

- **Reaproveitar uma única tela para criar e editar matéria**, decidindo o
  comportamento a partir da presença de `materiaId` nos parâmetros de
  rota — evita duplicar formulário e validação.
- **Autoavaliação em bottom sheet, não em tela cheia**, reduzindo a
  fricção de avaliar vários itens de revisão em sequência sem perder o
  contexto da lista. O modal recebeu, nesta etapa, um botão "X" e um
  "Cancelar" visíveis (antes só era possível fechar tocando fora dele).
- **Timer como componente puramente visual**: `TimerCircular` não conhece
  a lógica do Pomodoro, apenas recebe progresso/rótulo/tipo por props — a
  lógica de contagem e alternância de ciclos fica isolada em
  `PomodoroScreen`.
- **Feedback sem navegação forçada**: avaliar uma revisão ou concluir um
  ciclo atualiza o estado local e dá retorno imediato, sem tirar o usuário
  da tela atual sem necessidade.
- **Barra de abas que respeita a área do sistema**: a altura e o
  espaçamento inferior da barra de abas passaram a ser calculados a partir
  de `useSafeAreaInsets()` (`react-native-safe-area-context`) em vez de
  valores fixos — corrige a sobreposição que ocorria com a barra de
  navegação do próprio aparelho (gestos/botões no Android, home indicator
  no iOS) em testes em dispositivo físico.

---

## 6. Medidas de acessibilidade implementadas

Esta etapa incluiu uma auditoria de contraste de cor e de rótulos para
leitor de tela, com as seguintes correções:

**Contraste de cor** (calculado conforme a fórmula de contraste da WCAG):

- `inkFaint` (categorias, legendas, placeholder) escurecido de forma a
  passar de ~2,85:1 para ~4,7:1 sobre o fundo padrão.
- `amberDark` (rótulo do timer em foco, badge, aba ativa) escurecido de
  ~3,3:1 para ~5,2:1.
- Nova cor `skyDark` para o rótulo do timer em descanso, substituindo o
  uso direto de `sky` (~3,0:1 → ~5,8:1).
- Nova cor `rustDark` para textos sobre fundo claro que antes usavam
  `rust` diretamente (~4,4:1 → ~5,7:1).
- Nova cor `goldDark` para o mesmo caso com `gold` (~2,2:1 → ~5,4:1).
- `borderStrong` escurecido para uso em bordas de campos de texto e chips
  (~1,7:1 → ~3,6:1 contra fundo branco), atingindo o mínimo de 3:1
  recomendado pela WCAG para contornos de componentes de interface.
- Texto/ícone da variante âmbar do `BotaoPrimario` (usada no CTA "Iniciar
  sessão Pomodoro" e no botão de play/pausa do timer) trocado de branco
  para `ink`, subindo de ~2,5:1 para ~6,4:1 de contraste sobre o fundo
  âmbar.

**Área de toque**: botões que estavam abaixo do mínimo recomendado de
44×44 pontos foram ajustados — botão "+ Nova" da Home, botão de editar do
Detalhe de Matéria (40px → 44px), swatches de cor e chips de categoria do
formulário de matéria.

**Rótulos para leitor de tela**: `accessibilityLabel`, `accessibilityRole`
e, quando aplicável, `accessibilityState` (selecionado/desabilitado) foram
adicionados a todo componente interativo do app — especialmente os que
usavam apenas ícone, sem texto visível (play/pausa/pular no Pomodoro,
editar matéria, fechar o modal de avaliação, cada opção de autoavaliação,
cada swatch de cor e chip de categoria).

**Mensagens de erro compreensíveis**: o formulário de matéria agora exibe
um texto de ajuda abaixo do campo de nome, que passa a indicar o motivo da
invalidação ("Use pelo menos 2 caracteres.") ao sair do campo, em vez de
apenas desabilitar o botão silenciosamente.

**Tamanho de texto**: o tamanho mínimo de fonte usado para informação real
(categorias, datas, legendas de gráfico) foi aumentado de 11px para 12px.

---

## 7. Instruções para execução e teste da navegação

### Executar o app

```bash
npm install
npx expo start
```

Abra no Expo Go (Android/iOS, mesma rede Wi-Fi do computador, escaneando o
QR code) ou em um emulador/simulador (`a` para Android, `i` para iOS no
terminal do Expo).

### Roteiro de teste manual da navegação

1. **Abas**: toque em "Início", "Revisões" e "Estatísticas" na barra
   inferior — cada uma deve trocar de tela instantaneamente, mantendo o
   ícone/rótulo da aba ativa destacado. Confirme que a barra de abas não
   se sobrepõe à barra de navegação do aparelho (gestos/botões no Android,
   home indicator no iOS).
2. **Ida e volta na pilha**: na aba Início, toque em uma matéria → deve
   abrir o Detalhe. Toque na seta de voltar do cabeçalho (ou faça o gesto
   de voltar) → deve retornar à Home preservando a lista de matérias.
3. **Cadastro de matéria**: toque em "+ Nova" → preencha um nome com
   menos de 2 caracteres e tire o foco do campo → deve aparecer a
   mensagem de erro e o botão "Criar matéria" deve permanecer desabilitado
   (opacidade reduzida). Complete um nome válido, escolha cor e categoria,
   toque em "Criar matéria" → deve navegar para o Detalhe da nova matéria.
4. **Edição**: no Detalhe de Matéria, toque no ícone de lápis → deve abrir
   o formulário já preenchido; altere algo e salve → deve voltar ao
   Detalhe com os dados atualizados.
5. **Pomodoro vinculado**: no Detalhe de Matéria, toque em "Iniciar sessão
   Pomodoro" → deve abrir o timer já mostrando o nome da matéria. Toque no
   botão central para pausar/retomar, e no botão de pular para trocar de
   ciclo manualmente — cada botão deve dar feedback visual ao ser tocado.
6. **Pomodoro livre**: na Home, toque em "Iniciar sessão Pomodoro" sem
   escolher matéria antes → o timer deve abrir mostrando "Sessão livre".
7. **Conclusão de ciclo**: deixe o cronômetro chegar a zero (ou ajuste
   manualmente para testar) → deve aparecer o alerta de conclusão com as
   opções esperadas ("Iniciar descanso" / "Novo ciclo de foco" / "Voltar
   para a Home").
8. **Revisão do dia**: na aba Revisões, toque em um item pendente → deve
   abrir a folha de autoavaliação com três opções, um botão "X" no topo e
   um "Cancelar" no rodapé. Teste fechar pelo "X", pelo "Cancelar" e
   tocando fora da folha — todos devem fechar sem avaliar o item. Depois,
   escolha uma das três opções → o item deve sumir da lista.
9. **Leitor de tela** (opcional, recomendado): ative o TalkBack (Android)
   ou o VoiceOver (iOS) e navegue pelo app — os botões que só têm ícone
   (play/pausa, pular, editar, fechar modal, swatches de cor) devem ser
   anunciados com uma descrição da ação, não apenas como "botão".
