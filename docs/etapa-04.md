# FlowStudy — Etapa 04: Persistência de Dados

Nesta etapa o app passou a **criar, armazenar, recuperar, atualizar, remover
e apresentar** dados que permanecem disponíveis após o encerramento e a
reabertura da aplicação.

---

## 1. Mecanismo de persistência utilizado

**AsyncStorage** (`@react-native-async-storage/async-storage`, versão 2.2.0 —
a embutida no Expo SDK 57 / Expo Go), um armazenamento chave–valor assíncrono
e não criptografado, gravado em disco no próprio aparelho.

A arquitetura tem três camadas, todas sem dependência das telas:

| Camada | Arquivo | Responsabilidade |
|---|---|---|
| Armazenamento | `src/storage/armazenamento.ts` | Lê/grava JSON no AsyncStorage; define as chaves. |
| Serviço de dados | `src/services/dataService.ts` | Operações de dados (criar, ler, atualizar, remover), cache em memória, fila de gravação e hook `useDados()`. |
| Telas | `src/screens/*`, `src/components/*` | Chamam apenas funções do serviço; nunca acessam o AsyncStorage diretamente. |

**Fluxo:** ao abrir o app, `iniciarDados()` (chamada em `App.tsx`) lê tudo do
AsyncStorage para um cache em memória, e a interface só é exibida depois
disso. As telas leem do cache (síncrono) e se inscrevem com `useDados()`.
Cada alteração atualiza o cache, avisa as telas (re-renderizam sozinhas) e
grava a coleção alterada no disco em segundo plano, em fila (preservando a
ordem das gravações).

---

## 2. Justificativa da escolha

- **Volume e formato dos dados**: poucas centenas de registros pequenos,
  naturalmente representáveis como JSON. Não há consultas complexas,
  junções nem grandes volumes que exijam um banco relacional.
- **Compatibilidade**: o AsyncStorage já vem no Expo Go; não exige
  *prebuild*, módulos nativos próprios ou configuração em `app.json`.
- **Simplicidade e baixo risco**: sem esquema SQL nem migrações para manter
  nesta etapa — o campo `schemaVersion` já deixa um ponto de migração
  previsto.
- **Troca futura barata**: como as telas só conhecem `dataService.ts`,
  migrar para SQLite (`expo-sqlite`) ou sincronização em nuvem exige mudar
  apenas o serviço e a camada de armazenamento, não a interface.
- **Limitações conhecidas** (aceitas para esta etapa): não há consultas
  indexadas; cada gravação reescreve a coleção inteira; no Android o limite
  padrão do AsyncStorage é de cerca de 6 MB; os dados não são criptografados.

**Instalação:** `npx expo install @react-native-async-storage/async-storage`
(escolhe automaticamente a versão compatível com o seu SDK).

---

## 3. Estrutura dos dados armazenados

Cada coleção fica em uma chave própria (equivalente a uma "tabela"):

| Chave | Conteúdo |
|---|---|
| `@flowstudy/meta` | `{ schemaVersion: number, criadoEm: string }` — indica que o app já foi inicializado e a versão do esquema. |
| `@flowstudy/materias` | `Materia[]` |
| `@flowstudy/sessoes` | `SessaoPomodoro[]` |
| `@flowstudy/itens-revisao` | `ItemRevisao[]` |
| `@flowstudy/avaliacoes` | `AvaliacaoRevisao[]` |

Tipos (definidos em `src/types/index.ts`):

```ts
Materia          { id, nome, cor, categoria, criadoEm }
SessaoPomodoro   { id, materiaId | null, inicio, duracaoMin, tipo: 'foco'|'descanso', concluida }
ItemRevisao      { id, materiaId, tema, dataAgendada (yyyy-mm-dd), intervaloAtualDias,
                   fatorFacilidade, repeticoes, ultimaAvaliacao?, ultimaAvaliacaoEm?, criadoEm }
AvaliacaoRevisao { id, itemId, materiaId, nivel: 'nao_lembrei'|'dificil'|'facil', avaliadaEm }
```

**Relacionamentos e remoção em cascata:** `SessaoPomodoro`, `ItemRevisao` e
`AvaliacaoRevisao` referenciam a matéria por `materiaId`. Ao remover uma
matéria, tudo que depende dela é removido junto. Ao remover um item de
revisão, suas avaliações também são removidas. Sessões livres
(`materiaId: null`) não pertencem a nenhuma matéria e são preservadas.

**Dados derivados (não armazenados):** resumo do dia, minutos por dia dos
últimos 7 dias, taxa de lembrança e totais são calculados a partir das
coleções acima — nunca ficam duplicados.

**Datas:** os campos de dia (`yyyy-mm-dd`) usam o fuso **local** do aparelho
(`src/utils/datas.ts`), para que o dia não "vire" às 21h no Brasil.

**Dados de exemplo:** na **primeira execução** o app grava 5 matérias,
sessões dos últimos 7 dias, 6 itens de revisão e algumas avaliações
(`src/mocks/data.ts`). Depois disso eles são dados comuns: editar ou
remover não os traz de volta ao reabrir.

---

## 4. Operações de persistência implementadas

Todas em `src/services/dataService.ts`:

| Operação | Funções | Onde o usuário aciona |
|---|---|---|
| **Criar** | `criarMateria`, `criarItemRevisao`, `registrarSessaoConcluida`, `avaliarItemRevisao` (cria um registro de avaliação) | "+ Nova" na Home; "Adicionar" em Itens de revisão; fim de um ciclo do Pomodoro; autoavaliação na aba Revisões |
| **Armazenar** | `persistir` / `atualizarEstado` (interno: grava a coleção alterada, em fila) | Automático a cada alteração |
| **Recuperar** | `iniciarDados` | Automático ao abrir o app (antes de exibir a interface) |
| **Atualizar** | `atualizarMateria`, `atualizarTemaItemRevisao`, `avaliarItemRevisao` (reagenda o item) | Lápis no Detalhe da matéria; toque em um item de revisão; autoavaliação |
| **Remover** | `removerMateria` (cascata), `removerItemRevisao`, `limparTodosOsDados` | "Excluir matéria" e "Excluir item" (com confirmação); "Apagar todos os dados" em Estatísticas (com confirmação) |
| **Apresentar** | `listarMaterias`, `getHistoricoSessoes`, `getRevisoesDaMateria`, `getRevisoesDoDia`, `getResumoDoDia`, `getEstatisticasSemana`, `getTaxaLembranca`, `getTotaisArmazenados` + hook `useDados()` | Todas as telas (seção 5) |

**Robustez:** se a leitura inicial falhar, o app funciona apenas em memória e
**não grava nada**, para nunca sobrescrever dados já salvos. Erros de
gravação são registrados no console sem derrubar o app. JSON inválido em uma
coleção é ignorado (a coleção volta vazia).

**Limitação:** a gravação ocorre em segundo plano logo após cada ação.
Encerrar o processo no exato instante da ação (milissegundos) pode perder
essa última alteração.

---

## 5. Telas que utilizam os dados persistidos

| Tela | Dados exibidos | Operações |
|---|---|---|
| **Home** | Lista de matérias; minutos estudados hoje; revisões pendentes | Ler; navega para criar/detalhar |
| **Cadastro/Edição de Matéria** | Nome, cor e categoria da matéria | Criar; Atualizar |
| **Detalhe da Matéria** | Dados da matéria; histórico de sessões (10 mais recentes); itens de revisão | Ler; Criar/Atualizar/Remover itens de revisão; Remover a matéria |
| **Pomodoro** | Matéria vinculada | Criar (registra a sessão concluída) |
| **Revisões do Dia** | Itens vencidos/agendados para hoje | Ler; Atualizar (autoavaliação reagenda o item e registra a avaliação) |
| **Estatísticas** | Gráfico dos últimos 7 dias, taxa de lembrança e totais armazenados — calculados a partir dos dados reais | Ler; Remover tudo |

---

## 6. Instruções para execução e teste

```bash
npm install
npx expo install @react-native-async-storage/async-storage
npx expo start        # escaneie o QR code no Expo Go
```

**Roteiro de teste de cada operação**

1. **Criar**: Home → "+ Nova" → nome "Química", escolha cor/categoria → "Criar matéria". A matéria aparece na Home. No Detalhe → "Adicionar" → tema "Ligações químicas", primeira revisão "Hoje" → o item aparece na lista e na aba Revisões.
2. **Atualizar**: no Detalhe, lápis → mude o nome → salvar (o título e a Home refletem a mudança). Toque no item de revisão → altere o tema → salvar. Na aba Revisões, avalie um item: ele some da lista e a aba Estatísticas passa a contá-lo.
3. **Pomodoro**: inicie uma sessão a partir de uma matéria e deixe o ciclo de foco terminar ("pular ciclo" não registra a sessão). Para testar rápido, reduza temporariamente `DURACAO_FOCO_SEG` em `PomodoroScreen.tsx`. A sessão aparece no histórico da matéria e nos minutos do dia.
4. **Remover**: no Detalhe, toque no item → "Excluir item" → confirme. Depois "Excluir matéria" → confirme (a matéria e seus itens/sessões desaparecem). Em Estatísticas, "Apagar todos os dados" remove tudo.
5. **Apresentar**: confira Home (matérias + resumo), Detalhe (histórico e itens), Revisões (pendências) e Estatísticas (gráficos e "Dados armazenados neste aparelho").

---

## 7. Procedimento para verificar a persistência após encerrar e reabrir

1. Abra o app e **anote o estado**: crie uma matéria (ex.: "Teste Persistência"), adicione um item de revisão nela, avalie um item na aba Revisões, edite o nome de outra matéria e exclua um item. Anote também os totais na aba Estatísticas ("Dados armazenados neste aparelho").
2. **Encerre o app por completo**: abra a lista de apps recentes e feche o Expo Go deslizando-o para fora (não basta ir para a tela inicial).
3. Com o servidor Metro ainda rodando (ou até **desligado**, se o app já estiver carregado em cache), **reabra o Expo Go e o FlowStudy**.
4. **Confira**: a matéria criada, o item adicionado, o nome editado e a ausência do item excluído continuam como estavam; o item avaliado continua fora da lista de hoje; os totais de Estatísticas são idênticos aos anotados no passo 1.
5. **Repita a remoção**: apague a matéria "Teste Persistência", feche e reabra o app de novo — ela **não** deve reaparecer (confirma que remoções também persistem e que os dados de exemplo não são regravados).
6. **Zerar os dados para repetir o teste**: Estatísticas → "Apagar todos os dados". Para voltar ao estado de primeira execução (com os dados de exemplo), limpe os dados do Expo Go nas configurações do sistema ou reinstale-o.

**Como a lógica foi validada nesta entrega:** o serviço de dados foi executado em dois a três processos separados sobre um armazenamento simulado gravado em disco (equivalente a "fechar e reabrir"): criar, atualizar, remover em cascata e apagar tudo foram recuperados corretamente na abertura seguinte, e os dados de exemplo não foram regravados após apagar tudo. A verificação em aparelho segue o roteiro acima.

---

## 8. Ajustes de comportamento feitos junto com a persistência

- **Navegação**: após criar uma matéria, o formulário é *substituído* pelo Detalhe (`replace`), então "voltar" leva à Home; após editar, o app volta ao Detalhe (`goBack`). No Pomodoro, "Encerrar sessão" faz `goBack` e "Voltar para a Home" faz `popToTop`. Antes, `navigate` empilhava telas repetidas.
- **Datas**: `toISOString()` (UTC) foi substituído por datas no fuso local, corrigindo o "Hoje"/data de agendamento após as 21h e a exibição da data de itens agendados (que aparecia um dia antes).
- **Estado "avaliado hoje"**: o antigo campo `concluidaHoje` (que, persistido, esconderia o item para sempre) foi trocado por `ultimaAvaliacaoEm` (data da última avaliação).
- **Estatísticas** deixaram de usar dados fixos e passaram a ser calculadas a partir das sessões e avaliações armazenadas, com estado vazio quando não há dados.
