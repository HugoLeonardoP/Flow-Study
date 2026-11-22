import { create } from 'zustand';
import { mensagemDeErro } from '@/services/api';
import { mostrarFeedback } from '@/services/feedback';
import { agendarFimDoCiclo, cancelarNotificacao } from '@/services/notificacoes';
import { useEstudosStore } from './useEstudosStore';

// Estado do timer, compartilhado entre a tela de Pomodoro, a Home e o relógio global.
// NÃO é persistido. O tempo restante vem de `fimEm - Date.now()` (nunca de um contador
// decrementado), então continua correto ao trocar de tela ou minimizar o app.

export const DURACAO_MS = { foco: 25 * 60 * 1000, descanso: 5 * 60 * 1000 } as const;

export type Fase = 'ocioso' | 'foco' | 'descanso';

interface PomodoroState {
  fase: Fase;
  materiaId: string | null;
  fimEm: number | null; // timestamp (ms) do fim do ciclo em andamento; null se parado/pausado
  restanteMs: number | null; // tempo que falta enquanto parado/pausado
  ciclosConcluidos: number;
  notificacaoId: string | null;
  /** Ao abrir a tela: prepara um ciclo de foco, a menos que já haja um em andamento. */
  preparar: (materiaId: string | null) => void;
  alternar: () => void; // iniciar / pausar / retomar
  pular: () => void; // vai para a próxima fase, parada
  encerrar: () => void;
  /** Chamado quando `fimEm` é atingido. */
  finalizarCiclo: () => void;
}

const inicial = {
  fase: 'ocioso' as Fase,
  materiaId: null,
  fimEm: null,
  restanteMs: null,
  ciclosConcluidos: 0,
  notificacaoId: null,
};

export const usePomodoroStore = create<PomodoroState>()((set, get) => {
  async function agendarAviso(fase: 'foco' | 'descanso', fimEm: number, materiaId: string | null) {
    const nome = useEstudosStore.getState().dados.materias.find((m) => m.id === materiaId)?.nome ?? null;
    const id = await agendarFimDoCiclo(fase, fimEm, nome);
    if (id === null) return;
    // Se o ciclo foi pausado/pulado enquanto agendava, descarta o aviso.
    if (get().fimEm === fimEm) set({ notificacaoId: id });
    else void cancelarNotificacao(id);
  }

  return {
    ...inicial,

    preparar: (materiaId) => {
      const s = get();
      if (s.fase === 'ocioso' || (s.fimEm === null && s.materiaId !== materiaId)) {
        set({
          ...inicial,
          fase: 'foco',
          materiaId,
          restanteMs: DURACAO_MS.foco,
          ciclosConcluidos: s.materiaId === materiaId ? s.ciclosConcluidos : 0,
        });
      }
    },

    alternar: () => {
      const s = get();
      const fase = s.fase === 'ocioso' ? 'foco' : s.fase;
      if (s.fimEm !== null) {
        void cancelarNotificacao(s.notificacaoId);
        set({ fase, fimEm: null, restanteMs: Math.max(0, s.fimEm - Date.now()), notificacaoId: null });
      } else {
        const fimEm = Date.now() + (s.restanteMs ?? DURACAO_MS[fase]);
        set({ fase, fimEm, restanteMs: null });
        void agendarAviso(fase, fimEm, s.materiaId);
      }
    },

    pular: () => {
      const s = get();
      void cancelarNotificacao(s.notificacaoId);
      const proxima = s.fase === 'descanso' ? 'foco' : 'descanso';
      set({ fase: proxima, fimEm: null, restanteMs: DURACAO_MS[proxima], notificacaoId: null });
    },

    encerrar: () => {
      void cancelarNotificacao(get().notificacaoId);
      set({ ...inicial });
    },

    finalizarCiclo: () => {
      const s = get();
      if (s.fimEm === null || s.fase === 'ocioso') return;

      const concluida = s.fase;
      const proxima = concluida === 'foco' ? 'descanso' : 'foco';
      // A notificação do sistema dispara sozinha no horário marcado; aqui só avançamos o estado.
      set({
        fase: proxima,
        fimEm: null,
        restanteMs: DURACAO_MS[proxima],
        notificacaoId: null,
        ciclosConcluidos: s.ciclosConcluidos + (concluida === 'foco' ? 1 : 0),
      });

      if (concluida === 'foco') {
        useEstudosStore
          .getState()
          .registrarSessao(s.materiaId, DURACAO_MS.foco / 60000)
          .then((geradas) =>
            mostrarFeedback(
              geradas > 0
                ? `Sessão registrada. ${geradas} revisões agendadas (1, 7 e 30 dias).`
                : 'Sessão registrada.'
            )
          )
          .catch((erro) => mostrarFeedback(mensagemDeErro(erro), 'erro'));
      } else {
        mostrarFeedback('Descanso concluído. Pronto para um novo ciclo de foco?', 'info');
      }
    },
  };
});
