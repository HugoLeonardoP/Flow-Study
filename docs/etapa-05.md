# FlowStudy — Etapa 05: Integração App + Backend

Primeira versão funcional com **app mobile** (Expo/React Native) e **backend**
(Node.js + Express) integrados. O app continua com a mesma proposta — Pomodoro
+ revisão espaçada —, agora com a responsabilidade pelos dados e pelas regras
de negócio no servidor.

---

## 1. Fluxo completo de negócio implementado

**"Estudar um tema e acompanhar sua revisão"** — do cadastro até a exclusão:

> **criar** matéria → **criar** item de revisão → **processar** a autoavaliação
> (o servidor reagenda a revisão) → **visualizar** o resultado → **alterar** →
> **excluir**

| Etapa | O que o usuário faz | O que o servidor faz |
|---|---|---|
| Criar | Cadastra uma matéria e adiciona um tema para revisar | Valida (nome, cor, categoria, tema), gera o `id` e grava |
| Visualizar | Vê a matéria na Home e o tema em "Revisões do dia" | Devolve o estado atualizado com o resumo do dia já calculado |
| Processar | Avalia o tema ("não lembrei" / "com dificuldade" / "fácil") | Registra a avaliação e **calcula a próxima data de revisão** |
| Resultado | Vê "Próxima revisão: dd/mmm", o item sai da lista e a taxa de lembrança aparece em Estatísticas | Recalcula taxa de lembrança e totais |
| Alterar | Renomeia a matéria / edita o tema do item | Revalida (ex.: nome repetido) e atualiza |
| Excluir | Exclui o item e depois a matéria | Remove em cascata (sessões, itens e avaliações da matéria) |

O Pomodoro se integra ao mesmo fluxo: ao concluir um ciclo de foco, a sessão é
enviada ao servidor e passa a contar no histórico da matéria e nas estatísticas.

---

## 2. Passo a passo para executar o fluxo

Com backend e app rodando (seção 7):

1. **Home** → "+ Nova" → nome "Química Orgânica", escolha cor e categoria → **Criar matéria**. Aparece o aviso "Matéria criada." e abre o Detalhe.
2. No Detalhe → **Adicionar** (Itens de revisão) → tema "Funções orgânicas", primeira revisão **Hoje** → **Adicionar item**. Aviso "Item de revisão adicionado."
3. Aba **Revisões** → o tema aparece na lista → toque nele → **Lembrei com dificuldade**. Aparece "Revisão registrada. Próxima revisão: *(hoje + 3 dias)*." e o item sai da lista.
4. Aba **Estatísticas** → a taxa de lembrança e o total de autoavaliações incluem a avaliação feita.
5. Volte ao Detalhe da matéria → o item mostra "Avaliado hoje". Toque no item → altere o tema → **Salvar alterações**. Depois toque no lápis do cabeçalho → renomeie a matéria → **Salvar alterações**.
6. (Opcional) Detalhe → **Iniciar sessão Pomodoro** e conclua um ciclo → "Sessão de foco registrada." → o histórico da matéria e o tempo estudado hoje aumentam.
7. Detalhe → toque no item → **Excluir item** → confirme. Depois **Excluir matéria** → confirme. A matéria, seus itens, sessões e avaliações somem; o app volta à Home com o aviso "Matéria excluída."

---

## 3. Funcionalidades integradas nesta etapa

| Funcionalidade | Etapa de origem | Como está integrada agora |
|---|---|---|
| Matérias (criar, editar, excluir) | 01/04 | `POST/PUT/DELETE /api/materias`; validação e cascata no servidor |
| Itens de revisão (criar, editar, excluir) | 04 | `POST/PUT/DELETE /api/itens-revisao` |
| Autoavaliação e reagendamento | 01/04 | `POST /api/itens-revisao/:id/avaliacao` — o servidor define a próxima data |
| Revisões do dia | 01 | O servidor decide quais itens vencem hoje |
| Pomodoro (sessões) | 01 | `POST /api/sessoes` ao concluir um ciclo |
| Resumo do dia e Estatísticas | 01 | Calculados no servidor (minutos por dia, taxa de lembrança, totais) |
| Persistência | 04 | Dados no servidor (`backend/data/db.json`) + **cache local** no app (AsyncStorage) |
| Navegação, acessibilidade, layout | 02/03 | Mantidos sem alteração estrutural |

**Divisão de responsabilidades**

| Backend | App |
|---|---|
| Guardar os dados e gerar `id` | Interface, navegação e acessibilidade |
| Validar entradas (regras finais) | Validação básica de campos para resposta imediata |
| Cascata de exclusões | Pedir a exclusão e confirmar com o usuário |
| Reagendar revisões, listar as do dia | Exibir o resultado |
| Calcular resumo e estatísticas | Exibir gráficos e totais |
| — | Cache local dos últimos dados e aviso de falta de conexão |

**API** (todas as respostas de sucesso trazem `dados`, o estado completo atualizado):

| Método e rota | Função |
|---|---|
| `GET /api/saude` · `GET /api/dados` · `DELETE /api/dados` | Verificar o servidor · obter tudo · apagar tudo |
| `POST /api/materias` · `PUT/DELETE /api/materias/:id` | Matérias |
| `POST /api/itens-revisao` · `PUT/DELETE /api/itens-revisao/:id` | Itens de revisão |
| `POST /api/itens-revisao/:id/avaliacao` | Autoavaliação |
| `POST /api/sessoes` | Sessão Pomodoro concluída |

---

## 4. Tratamento de entradas inválidas

Duas camadas: o app evita o erro óbvio na hora; o **servidor é a validação final**
e devolve `400` com a mensagem por campo (`{ erro, campos: { nome: "..." } }`).

| Entrada inválida | App | Servidor | O que o usuário vê |
|---|---|---|---|
| Nome da matéria com menos de 2 caracteres | Botão desabilitado; ajuda em vermelho ao sair do campo | `400` | "Use pelo menos 2 caracteres." |
| Nome com mais de 40 caracteres | Campo limitado a 40 (`maxLength`) | `400` | "Use no máximo 40 caracteres." |
| Nome de matéria repetido (sem diferenciar maiúsculas) | — (só o servidor conhece todos os dados) | `400` | "Já existe uma matéria com esse nome." junto ao campo |
| Tema do item vazio/curto (< 2) ou longo (> 80) | Mensagem no modal | `400` | Mensagem sob o campo do modal |
| Cor, categoria, nível ou duração fora do esperado | Seletores só oferecem valores válidos | `400` | Mensagem de erro |
| Matéria/item inexistente (ex.: já excluído) | — | `404` | "Matéria não encontrada." / "Item de revisão não encontrado." |
| Avaliar o mesmo item duas vezes no mesmo dia | — | `409` | "Este item já foi avaliado hoje." |
| JSON malformado na requisição | — | `400` | "JSON inválido na requisição." |
| Servidor inacessível / demora (> 8 s) | Faixa de aviso + mensagem | — | "Não foi possível conectar ao servidor…" |

Erros de **campo** aparecem junto ao campo; os demais, como mensagem (toast).
Nenhum erro derruba o app, e ao falhar a tela permanece como estava.

---

## 5. Mecanismos de feedback utilizados

- **Mensagem rápida (toast)** acima da barra de abas, com cor por tipo (verde = sucesso, vermelho = erro). Some sozinha em ~3 s, é anunciada por leitores de tela (`accessibilityRole="alert"`). Usada em: matéria criada/atualizada/excluída, item adicionado/atualizado/excluído, revisão registrada (com a próxima data), sessão registrada, dados apagados e qualquer erro.
- **Botão em andamento**: "Criar matéria", "Salvar alterações" e "Adicionar item" mostram um indicador de carregamento e ficam bloqueados enquanto o servidor responde (evita toque duplo).
- **Mensagens junto ao campo** para erros de validação, inclusive os do servidor.
- **Faixa de "Sem conexão"** na Home e em Revisões, com toque para tentar de novo.
- **Confirmação antes de excluir** (matéria, item, apagar tudo) por diálogo.
- **Resultado visível na própria interface**: o item avaliado sai da lista, os totais e gráficos mudam, e o Detalhe mostra "Avaliado hoje".

---

## 6. Principais decisões técnicas

- **Backend em Node + Express, persistindo em arquivo JSON** (`backend/data/db.json`, gravação atômica). É o mínimo para uma primeira versão de usuário único: uma dependência (`express`), sem banco para instalar. Trocar por SQLite/Postgres exige mudar só `src/db.js`.
- **Servidor como fonte da verdade e "resposta com estado completo"**: toda operação devolve o snapshot atualizado (matérias, sessões, itens, avaliações e dados derivados) e o app o substitui por inteiro. Mantém o app simples e sem divergência; o custo é tráfego maior, aceitável para este volume.
- **Regras de negócio no servidor** (`backend/src/regras.js`): validações, cascata, reagendamento (continua sendo a *simulação* do SM-2, não o algoritmo real), lista do dia, resumo e estatísticas. O app deixou de recalcular essas regras.
- **Fuso do usuário**: o app envia o "hoje" local (`?hoje=yyyy-mm-dd`) em toda chamada e cada sessão leva seu `dia` local, para que "hoje" e as estatísticas fiquem corretos independentemente do fuso do servidor.
- **Cache local + leitura offline**: a última cópia recebida fica no AsyncStorage; sem conexão o app abre com esses dados e avisa. **Criar/alterar/excluir exige conexão** (não há fila de sincronização nesta versão).
- **Descoberta do endereço do backend** (`src/config.ts`): usa `EXPO_PUBLIC_API_URL` se existir; senão o mesmo IP do computador que serve o app (porta 3000); `10.0.2.2` no emulador Android. Sem dependências novas no app.
- **Navegação, telas e componentes preservados**: só os pontos que gravavam dados passaram a ser assíncronos (com estado de carregamento e tratamento de erro).
- **Fora do escopo desta versão**: autenticação/multiusuário, HTTPS, sincronização offline com fila, testes automatizados.

---

## 7. Instruções para execução e teste

**Requisitos:** Node.js 20.19+; celular com Expo Go e computador na mesma rede Wi-Fi.

**1) Backend** (terminal 1)

```bash
cd backend
npm install
npm start
```

Deve exibir `FlowStudy API rodando na porta 3000` e o(s) endereço(s) `http://SEU_IP:3000`. Na primeira execução cria `backend/data/db.json` com dados de exemplo. No Windows, se aparecer o aviso do Firewall, **permita o Node.js em redes privadas**. Para conferir: abra `http://SEU_IP:3000/api/saude` no navegador do celular — deve mostrar `{"ok":true}`.

**2) App** (terminal 2, na raiz do projeto)

```bash
npm install
npx expo install @react-native-async-storage/async-storage   # se ainda não instalou na etapa 04
npm install -D babel-preset-expo@~57.0.16                    # exigido pelo babel.config.js
npx expo start -c
```

O `babel-preset-expo` precisa estar nas dependências do projeto: sem ele o Babel não carrega, o Metro falha (`Cannot read properties of undefined (reading 'transformFile')`) e o Expo Go fica carregando até mostrar "algo deu errado".

Use o modo padrão (LAN), não `--tunnel`. Escaneie o QR code no Expo Go.
Remova o arquivo antigo `src/mocks/data.ts`, que não é mais usado.

**Se o app não achar o servidor:** crie `.env` na raiz com `EXPO_PUBLIC_API_URL=http://SEU_IP:3000` e reinicie com `npx expo start -c`. (Emulador Android: nada a configurar.)

**3) Roteiro de teste**

1. **Fluxo completo:** siga a seção 2.
2. **Entradas inválidas:** tente criar matéria com 1 caractere (botão bloqueado); crie "Química" e depois "química" (erro de nome repetido junto ao campo); avalie um item e tente avaliá-lo de novo no mesmo dia (não aparece mais na lista — o servidor também recusaria).
3. **Persistência no servidor:** crie dados, pare o backend (`Ctrl+C`), inicie de novo (`npm start`) e volte ao app (ou reabra-o): os dados continuam (ficam em `backend/data/db.json`).
4. **Sem conexão:** pare o backend e reabra o app — aparecem os últimos dados e a faixa "Sem conexão com o servidor…". Tente criar uma matéria: aparece a mensagem de erro e nada muda. Religue o backend e toque na faixa: ela some e os dados sincronizam.
5. **Zerar para repetir:** Estatísticas → "Apagar todos os dados", ou apague `backend/data/db.json` (e reinicie o backend) para voltar aos dados de exemplo.

**O que foi verificado nesta entrega:** a API foi testada com chamadas HTTP reais (criar, validar, duplicidade, `404`/`409`, avaliação, sessão, alteração, exclusão em cascata e persistência após reiniciar o servidor), e a camada de dados do app foi executada contra o backend rodando, inclusive o modo offline com cache. O type-check do app passa sem erros. A interface em si deve ser validada em aparelho com o roteiro acima.
