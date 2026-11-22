import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { mostrarFeedback } from '@/services/feedback';

// Notificações LOCAIS (agendadas no próprio aparelho; não usam push remoto).
// Toda função aqui falha em silêncio: sem notificações o app segue funcionando.

const CANAL_ID = 'flowstudy-lembretes';
const HORA_LEMBRETE_REVISAO = 9;
const MAX_DIAS_AGENDADOS = 30;

let avisouNegada = false;

/** Chamar uma vez ao abrir o app: define como exibir avisos em primeiro plano e cria o canal Android. */
export async function prepararNotificacoes(): Promise<void> {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      // No Android 13+ o canal precisa existir antes de o sistema exibir o pedido de permissão.
      await Notifications.setNotificationChannelAsync(CANAL_ID, {
        name: 'Lembretes de estudo',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
  } catch (erro) {
    console.warn('[FlowStudy] Notificações indisponíveis:', erro);
  }
}

async function permissaoConcedida(pedir: boolean): Promise<boolean> {
  try {
    let permissao = await Notifications.getPermissionsAsync();
    if (!permissao.granted && pedir && permissao.canAskAgain) {
      permissao = await Notifications.requestPermissionsAsync();
    }
    return permissao.granted;
  } catch {
    return false;
  }
}

function avisarPermissaoNegada() {
  if (avisouNegada) return;
  avisouNegada = true;
  mostrarFeedback(
    'Notificações desativadas: o timer funciona, mas você não será avisado com o app fechado. Ative nas configurações do aparelho.',
    'info'
  );
}

/** Agenda o aviso do fim do ciclo. Pede a permissão na 1ª vez. Retorna o id ou null se não foi possível. */
export async function agendarFimDoCiclo(
  fase: 'foco' | 'descanso',
  fimEm: number,
  nomeMateria: string | null
): Promise<string | null> {
  if (!(await permissaoConcedida(true))) {
    avisarPermissaoNegada();
    return null;
  }
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: fase === 'foco' ? 'Ciclo de foco concluído!' : 'Descanso concluído',
        body:
          fase === 'foco'
            ? `Hora de descansar${nomeMateria ? ` — ${nomeMateria}` : ''}.`
            : 'Pronto para um novo ciclo de foco?',
        data: { tipo: 'ciclo' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fimEm), channelId: CANAL_ID },
    });
  } catch {
    mostrarFeedback('Não foi possível agendar o aviso do fim do ciclo. O timer continua funcionando.', 'info');
    return null;
  }
}

export async function cancelarNotificacao(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    /* já disparada ou indisponível */
  }
}

// Evita que duas reagendas simultâneas dupliquem lembretes.
let filaLembretes: Promise<void> = Promise.resolve();

/** Substitui os lembretes de revisão por um por dia (09:00) com a quantidade de revisões do dia. */
export function reagendarLembretesDeRevisao(porDia: { dia: string; quantidade: number }[]): Promise<void> {
  filaLembretes = filaLembretes.then(async () => {
    // Não pede permissão aqui: só agenda se o usuário já concedeu (pedido feito no 1º ciclo).
    if (!(await permissaoConcedida(false))) return;
    try {
      const agendadas = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(
        agendadas
          .filter((n) => n.content.data?.tipo === 'revisao')
          .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
      );

      for (const { dia, quantidade } of porDia.slice(0, MAX_DIAS_AGENDADOS)) {
        const [ano, mes, d] = dia.split('-').map(Number);
        const quando = new Date(ano, mes - 1, d, HORA_LEMBRETE_REVISAO, 0, 0);
        if (quando.getTime() <= Date.now()) continue;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Hora de revisar',
            body: quantidade === 1 ? 'Você tem 1 revisão para hoje.' : `Você tem ${quantidade} revisões para hoje.`,
            data: { tipo: 'revisao' },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quando, channelId: CANAL_ID },
        });
      }
    } catch (erro) {
      console.warn('[FlowStudy] Falha ao agendar lembretes de revisão:', erro);
    }
  });
  return filaLembretes;
}
