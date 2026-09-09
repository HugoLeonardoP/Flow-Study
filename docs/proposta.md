# Proposta de Aplicativo — FlowStudy
### Organizador de Estudos (Pomodoro + Revisão Espaçada)

## 1. Nome da aplicação
FlowStudy

## 2. Problema que a aplicação pretende resolver
Estudantes frequentemente têm dificuldade em manter o foco durante sessões de estudo e em saber quando revisar o conteúdo já estudado antes de esquecê-lo. A falta de gestão do tempo de estudo e de um sistema de revisão estruturado leva a baixa retenção de conteúdo e procrastinação.

## 3. Público-alvo
Estudantes do ensino médio, graduação e concursos ou pessoas se preparando para provas em geral, que precisam organizar rotina de estudos e reter conteúdo por longos períodos.

## 4. Objetivo principal
Ajudar o usuário a manter foco durante os estudos através da técnica Pomodoro e a otimizar a retenção de conteúdo por meio de um sistema de revisão espaçada baseado em repetição inteligente.

## 5. Descrição das principais funcionalidades
- Cadastro de matérias/temas de estudo
- Timer configurado no estilo Pomodoro (estudo cronometrado)
- Associação de sessões de estudo a matérias específicas
- Histórico de sessões concluídas (data, duração, matéria)
- Cadastro de itens de revisão vinculados a um tema estudado
- Algoritmo de repetição espaçada (baseado no modelo SM-2) que recalcula a próxima data de revisão conforme o desempenho do usuário
- Tela de "revisões do dia" com avaliação de desempenho do usuário (não lembrei / lembrei com dificuldade / lembrei fácil)
- Notificações locais ao final de cada ciclo Pomodoro e para revisões pendentes
- Estatísticas de tempo estudado por dia/semana/matéria

## 6. Tecnologia escolhida para o desenvolvimento mobile
React Native + TypeScript (com Expo) — permite build multiplataforma (Android/iOS) a partir de uma única base de código, com tipagem estática que ajuda a evitar erros em tempo de desenvolvimento (especialmente útil na lógica do algoritmo de repetição espaçada) e boa integração com bibliotecas de notificações locais (expo-notifications) e gráficos (react-native-chart-kit ou victory-native).

## 7. Tecnologia escolhida para o backend, caso exista
Não é obrigatório para o escopo principal, já que o app funciona offline. Mas como melhoria futura pode integrar o Firebase para sincronização em núvem

## 8. Necessidade ou não de comunicação com APIs externas
Não é necessária. A menos que seja integrado com o Firebase

## 9. Forma prevista de armazenamento de dados
Armazenamento local via SQLite (usando expo-sqlite), com tabelas para matérias, sessões de pomodoro e itens de revisão. 

## 10. Estrutura inicial de diretórios do projeto
```
study_flow/
├── App.tsx
├── src/
│   ├── models/
│   │   ├── Materia.ts
│   │   ├── SessaoPomodoro.ts
│   │   └── ItemRevisao.ts
│   ├── database/
│   │   ├── db.ts
│   │   └── migrations/
│   ├── screens/
│   │   ├── Home/
│   │   │   └── HomeScreen.tsx
│   │   ├── Pomodoro/
│   │   │   └── PomodoroScreen.tsx
│   │   ├── Revisao/
│   │   │   └── RevisaoScreen.tsx
│   │   └── Estatisticas/
│   │       └── EstatisticasScreen.tsx
│   ├── components/
│   │   ├── TimerCircular.tsx
│   │   ├── CardMateria.tsx
│   │   └── GraficoEstudo.tsx
│   ├── services/
│   │   ├── notificacaoService.ts
│   │   └── spacedRepetitionService.ts
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── constants.ts
├── assets/
│   └── icons/
├── tsconfig.json
├── package.json
└── README.md
```

## 11. Telas previstas para a aplicação

**1. Home (Tela inicial)**
Exibe a lista de matérias cadastradas, um resumo do progresso do dia (tempo estudado, revisões pendentes) e botão de destaque para iniciar uma nova sessão Pomodoro.

**2. Pomodoro (Timer de foco)**
Tela do cronômetro em si: círculo de progresso visual, controles de play/pausa/pular ciclo, indicação de qual matéria está sendo estudada e contagem de ciclos concluídos na sessão.

**3. Cadastro/Detalhe de Matéria**
Formulário para criar ou editar uma matéria (nome, cor, categoria) e, na versão de detalhe, exibe o histórico de sessões e itens de revisão associados àquela matéria.

**4. Revisões do Dia**
Lista os itens de revisão agendados para o dia atual (algoritmo de repetição espaçada), permitindo ao usuário abrir cada item e avaliar seu desempenho, o que recalcula a próxima data de revisão.

**5. Estatísticas**
Gráficos de tempo estudado por dia/semana/matéria, taxa de acerto nas revisões, e histórico geral de progresso.

*(Telas 1 a 4 compõem o MVP mínimo; a tela de Estatísticas entra na Fase 2/3 do desenvolvimento.)*

## 12. Fluxo básico de navegação entre as telas

```
                        ┌───────────────┐
                        │     Home      │◄────────────────┐
                        └───────┬───────┘                  │
             ┌──────────────────┼──────────────────┐       │
             ▼                  ▼                  ▼       │
   ┌─────────────────┐ ┌────────────────┐ ┌──────────────┐ │
   │ Cadastro/Detalhe │ │    Pomodoro    │ │  Revisões    │ │
   │    de Matéria    │ │ (Timer de foco)│ │    do Dia    │ │
   └─────────┬────────┘ └────────┬───────┘ └──────┬───────┘ │
             │                   │                 │        │
             │          (ciclo concluído)   (avaliação feita)│
             │                   │                 │        │
             └───────────────────┴─────────────────┴────────┘
                                  │
                                  ▼
                         ┌────────────────┐
                         │  Estatísticas  │
                         └────────────────┘
```

**Descrição do fluxo:**
- A **Home** é o ponto central de navegação, acessível a qualquer momento via bottom tab bar (ou botão "voltar").
- A partir da Home, o usuário pode: (a) tocar em uma matéria para abrir seu **Cadastro/Detalhe**, (b) tocar em "Iniciar Pomodoro" para ir direto ao **Timer**, ou (c) acessar **Revisões do Dia** caso haja pendências.
- Na tela de **Cadastro/Detalhe de Matéria**, o usuário pode iniciar uma sessão Pomodoro já associada àquela matéria específica, sendo levado à tela de Timer.
- Ao concluir um ciclo Pomodoro, o app retorna automaticamente à Home (ou oferece a opção de iniciar um novo ciclo).
- Na tela de **Revisões do Dia**, ao avaliar um item, o usuário retorna à própria lista (até zerar as pendências) ou pode voltar manualmente à Home.
- A tela de **Estatísticas** é acessada via bottom tab bar a partir de qualquer ponto do app, sem interromper fluxos em andamento.

**Navegação técnica (React Navigation):**
- **Bottom Tab Navigator** com 3 abas principais: Home, Revisões, Estatísticas.
- **Stack Navigator** aninhado dentro da aba Home, para as transições Home → Detalhe de Matéria → Pomodoro (permitindo o botão nativo de "voltar").
