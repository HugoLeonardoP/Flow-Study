# FlowStudy — Etapa 07: Estado Global (Zustand) e Notificações Locais

O timer do Pomodoro e os dados de estudo passaram a ser **estados globais** gerenciados com
**Zustand**, e o app agora usa um **recurso nativo**: **notificações locais** (`expo-notifications`)
no fim do ciclo e como lembrete de revisões.

---

## 1. Mecanismo de gerenciamento de estado

**Zustand v5**, com duas stores em `src/store/` e tipagem completa:

| Store | Arquivo | Persistência | Responsabilidade |
|---|---|---|---|
| `usePomodoroStore` | `usePomodoroStore.ts` | **Não persistida** | Timer: fase, matéria, `fimEm`, ações de iniciar/pausar/pular/encerrar/finalizar |
| `useEstudosStore` | `useEstudosStore.ts` | **Persistida** (`persist` + `AsyncStorage`, chave `@flowstudy/estudos`) | Cópia dos dados do servidor (matérias, sessões, revisões, estatísticas), status de conexão e as ações `registrarSessao` e `concluirRevisao` |

As telas usam **seletores** (`useStore((s) => s.campo)`), então só re-renderizam quando o campo
que leem muda. `src/services/feedback.ts` (mensagens rápidas) continua sendo um mini-estado
próprio, sem mudanças.

---

## 2. Estados tratados globalmente

**`usePomodoroStore`**

| Campo | Significado |
|---|---|
| `fase` | `'ocioso'` · `'foco'` · `'descanso'` |
| `materiaId` | Matéria do ciclo (ou `null` = sessão livre) |
| `fimEm` | Timestamp (ms) do fim do ciclo **em andamento**; `null` se parado/pausado |
| `restanteMs` | Tempo que falta enquanto parado/pausado (necessário para a pausa) |
| `ciclosConcluidos` | Ciclos de foco concluídos na sessão |
| `notificacaoId` | Id do aviso de fim de ciclo agendado (para cancelar ao pausar/pular) |

O tempo restante é sempre `fimEm - Date.now()`; nenhum contador é decrementado.

**`useEstudosStore`**

| Campo / ação | Significado |
|---|---|
| `dados` | Última cópia recebida do servidor (matérias, sessões, itens de revisão, avaliações e dados derivados) — **persistido** |
| `status` | `conectando` · `online` · `offline` — não persistido |
| `registrarSessao(materiaId, minutos)` | Envia a sessão ao servidor, que a registra e **gera 3 revisões (1, 7 e 30 dias depois)** |
| `concluirRevisao(id, nivel)` | Conclui uma revisão com a autoavaliação de 3 níveis |
| `sincronizar()` | Busca o estado atual no servidor |

**Quem usa cada estado**

| Estado | Consumidores |
|---|---|
| Timer | Tela de Pomodoro · faixa "Foco em andamento" na Home · relógio global (`ServicosGlobais`) |
| Dados de estudo | Todas as telas (via `dataService` e seletores) · `ServicosGlobais` (lembretes) · timer (nome da matéria na notificação) |

---

## 3. Justificativa para tratá-los como globais

- **Timer:** precisa continuar correto ao **sair da tela ou minimizar o app**, ser visto em mais de um lugar (tela de Pomodoro e Home) e ter seu **fim detectado de qualquer tela**, para registrar a sessão e disparar a notificação. Estado local de tela se perderia ao navegar. Não é persistido porque um ciclo interrompido não deve "ressuscitar" depois de o app ser fechado.
- **Dados de estudo:** são lidos e alterados por seis telas e pelo relógio global. Centralizá-los evita cópias divergentes. A persistência no aparelho faz o app abrir já com dados e permite **leitura sem conexão**. O **servidor continua sendo a fonte da verdade**: a store só guarda a última cópia recebida.
- **Mantidos locais de propósito:** campos de formulário, modais abertos e o termo de busca da Wikipédia — só interessam à tela que os possui.

---

## 4. Recurso nativo utilizado

**Notificações locais** — `expo-notifications` (versão `~57.0.25`, alinhada ao Expo SDK 57).

| Notificação | Quando dispara | Conteúdo |
|---|---|---|
| Fim do ciclo | No horário exato em que o ciclo termina (`fimEm`), mesmo com o app minimizado | "Ciclo de foco concluído! Hora de descansar — *Matéria*" / "Descanso concluído" |
| Lembrete de revisão | **09:00** de cada dia em que há revisões vencendo | "Hora de revisar — Você tem N revisões para hoje." |

## 5. Justificativa da escolha do recurso

- O Pomodoro depende de **avisar o usuário no momento certo**, inclusive com o celular bloqueado ou o app em segundo plano — algo que o timer dentro do app não consegue fazer sozinho.
- São **notificações agendadas no próprio aparelho**: não exigem servidor de push, conta, chave de API nem internet, o que combina com o escopo e com a arquitetura atual.
- Funcionam no **Expo Go** (somente o push *remoto* do Android foi removido dele; não usamos push remoto).
- O agendamento casa naturalmente com a ideia do `fimEm`: a notificação é marcada para o mesmo instante em que o timer termina.

---

## 6. Permissões necessárias

| Plataforma | Permissão | Como é tratada |
|---|---|---|
| Android 13+ | `POST_NOTIFICATIONS` (em tempo de execução; já declarada pela biblioteca) | Pedida **na primeira vez que o usuário inicia um ciclo**. No Android 14+ vem negada até o usuário aceitar |
| Android | Canal de notificação (`flowstudy-lembretes`) | Criado ao abrir o app, **antes** do pedido (exigência do Android 13+) |
| iOS | Autorização de notificações (alerta e som) | Pedida junto, no mesmo momento |

Não são pedidas localização, câmera, contatos nem permissão de alarme exato (o aviso pode atrasar
alguns segundos em modo de economia de bateria). Os **lembretes de revisão só são agendados se a
permissão já tiver sido concedida** (eles não abrem um segundo pedido).

---

## 7. Fluxo de utilização do recurso

**Fim do ciclo**

1. Matéria (ou Home) → **Iniciar sessão Pomodoro** → a tela chama `preparar()` e mostra 25:00.
2. Toque em **Iniciar** → a store grava `fimEm = agora + 25 min` e agenda a notificação para esse instante (pedindo permissão na 1ª vez).
3. **Pausar** cancela a notificação e guarda `restanteMs`; **Retomar** recalcula `fimEm` e agenda de novo. **Pular** e **Encerrar** também cancelam.
4. Pode-se sair da tela: a Home mostra a faixa "Foco em andamento · mm:ss" e o `ServicosGlobais` continua vigiando `fimEm`.
5. Ao chegar em `fimEm` (ou ao voltar o app ao primeiro plano), `finalizarCiclo()` avança para o descanso (parado, pronto para iniciar) e chama `registrarSessao()`; a notificação do sistema avisa o usuário.
6. O servidor registra a sessão e **cria 3 revisões** (1, 7 e 30 dias depois) para a matéria; o app mostra "Sessão registrada. 3 revisões agendadas (1, 7 e 30 dias)."

**Lembretes de revisão**

1. Sempre que as revisões da store mudam, o `ServicosGlobais` recalcula quantas vencem em cada dia.
2. Se a permissão já foi concedida, substitui os lembretes antigos por **um por dia, às 09:00** (até 30 dias à frente).
3. Em **Revisões**, o usuário conclui cada item com a autoavaliação (3 níveis). Revisões geradas por sessão ficam **concluídas**; itens criados manualmente continuam sendo reagendados pelo servidor.

---

## 8. Tratamento de falhas ou indisponibilidade

| Situação | Comportamento |
|---|---|
| Permissão negada | O timer funciona normalmente; aparece **uma vez** o aviso "Notificações desativadas… ative nas configurações do aparelho" |
| Módulo/canal indisponível, erro ao agendar | Registrado no console; mensagem "Não foi possível agendar o aviso…"; o timer segue funcionando |
| Ciclo pausado/pulado enquanto o aviso estava sendo agendado | O aviso recém-criado é cancelado |
| Falha ao cancelar (já disparou) | Ignorada |
| App encerrado no meio do ciclo | A notificação ainda dispara, mas **a sessão não é registrada** (o timer não é persistido) |
| Sem conexão com o servidor no fim do ciclo | Aparece o erro "Não foi possível conectar ao servidor…" e **a sessão não é registrada** (não há fila de reenvio nesta versão) |
| Cópia salva da store inválida | Descartada; o app sincroniza de novo com o servidor |
| Servidor fora do ar ao abrir | O app abre com a última cópia salva e mostra a faixa "Sem conexão" |

---

## 9. Instruções para execução e teste

**Instalação (uma vez)**

```bash
npx expo install zustand expo-notifications @react-native-async-storage/async-storage
```

Remova o arquivo `src/storage/armazenamento.ts` (substituído pelo `persist` do Zustand). **Reinicie o
backend** (`cd backend && npm start`): ele ganhou a regra de gerar as 3 revisões. Depois `npx expo start -c`.

**Roteiro de teste**

| # | Teste | Resultado esperado |
|---|---|---|
| 1 | Matéria → **Iniciar sessão Pomodoro** → **Iniciar** | Aparece o pedido de permissão de notificações (aceite) |
| 2 | Com o ciclo rodando, volte à Home | Faixa "Foco em andamento · mm:ss · Matéria"; tocar nela reabre o timer no tempo correto |
| 3 | Minimize o app e volte | O tempo continua correto (não "congelou") |
| 4 | **Pausar** e **Iniciar** de novo | O tempo retoma de onde parou |
| 5 | Fim do ciclo (veja a dica abaixo) | Notificação do sistema; o timer vai para o descanso; aviso "Sessão registrada. 3 revisões agendadas…" |
| 6 | Matéria → Itens de revisão | 3 novos itens "Revisão de *Matéria* — estudo de dd/mm" (1, 7 e 30 dias depois) |
| 7 | Aba **Revisões** | Só aparecem as vencidas/de hoje; concluir uma com a autoavaliação a faz sumir, e no Detalhe ela fica "Concluída" |
| 8 | Feche o app **com o servidor desligado** e reabra | Os dados continuam aparecendo (cópia persistida) e a faixa "Sem conexão" aparece |
| 9 | Negue a permissão (Configurações → Apps → Expo Go → Notificações) e inicie um ciclo | O timer funciona e aparece o aviso de notificações desativadas |

**Dica para testar sem esperar 25 minutos:** em `src/store/usePomodoroStore.ts`, troque temporariamente
`foco: 25 * 60 * 1000` por `foco: 20 * 1000` (20 s). Volte ao valor original depois. Para o lembrete
das 09:00, altere temporariamente `HORA_LEMBRETE_REVISAO` em `src/services/notificacoes.ts` para a próxima
hora cheia e tenha uma revisão vencendo hoje ou amanhã.

No Expo Go, pode aparecer no console um aviso sobre o push **remoto** do Android não ser suportado; é
esperado, pois o app usa apenas notificações locais.

---

## 10. Decisões e adaptações em relação ao desenho proposto

O desenho original previa `sessoes` e `revisoes` guardadas só no aparelho. Como as sessões e revisões já
pertencem ao backend (etapa 05), as decisões acordadas foram:

- **O servidor continua sendo a fonte da verdade.** A `useEstudosStore` espelha e persiste os dados dele; `registrarSessao` e `concluirRevisao` chamam a API. A geração das 3 revisões (1, 7 e 30 dias) acontece **no servidor**, na regra que registra a sessão.
- **Concluir uma revisão = autoavaliação de 3 níveis.** Nas revisões geradas por sessão, avaliar **conclui** (o cronograma é fixo); nos itens manuais, o reagendamento pelo servidor continua.
- **Pendentes** = `!feita` + `dataAgendada <= hoje` + não avaliada hoje. A regra existe no servidor (Home/contagem) e é espelhada no app (`pendentesDe`) para manter a lista correta quando o dia vira.
- **Campo extra `restanteMs`** na store do timer, necessário para pausar.
- **Fim do ciclo tratado globalmente** (`ServicosGlobais`), e não só pela tela de Pomodoro, para funcionar de qualquer tela. O diálogo de fim de ciclo foi substituído por mensagem + notificação, e a fase seguinte fica parada, pronta para iniciar.
- **Só ciclos de foco geram sessão** (descansos não são mais registrados).
- O `useDados` continua existindo como atalho para as telas antigas, agora apoiado na store do Zustand.

---

## 11. O que foi verificado e limitações

Verificado: o backend com chamadas HTTP (geração das 3 revisões, conclusão, `409`, itens manuais), as duas
stores executadas contra o backend com as notificações simuladas (agendar, cancelar, reagendar sem
duplicar, permissão negada, persistência com o servidor desligado), type-check e empacotamento Android.
**Não foi testado em aparelho**: o comportamento real das notificações (horário, som, bateria) deve ser
validado com o roteiro acima.

Limitações: o timer não persiste (fechar o app encerra o ciclo); sem conexão a sessão não é registrada;
lembrete fixo às 09:00; tocar na notificação apenas abre o app (sem ir direto à tela).
