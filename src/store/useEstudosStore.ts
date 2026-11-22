import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ErroApi } from '@/services/api';
import { hojeISO } from '@/utils/datas';
import { ItemRevisao, NivelLembranca, SnapshotDados } from '@/types';

// Estado dos dados de estudo (matérias, sessões, revisões, estatísticas).
// O SERVIDOR continua sendo a fonte da verdade: esta store guarda a última cópia
// recebida e a persiste no aparelho (persist + AsyncStorage) para abrir já com
// dados e funcionar em modo leitura sem conexão.

export const DADOS_VAZIOS: SnapshotDados = {
  materias: [],
  sessoes: [],
  itensRevisao: [],
  avaliacoes: [],
  derivados: {
    resumoDoDia: { minutosEstudadosHoje: 0, revisoesPendentesHoje: 0 },
    revisoesDoDiaIds: [],
    estatisticasSemana: [],
    taxaLembranca: { facil: 0, dificil: 0, naoLembrei: 0, total: 0 },
    totais: { materias: 0, sessoesFoco: 0, minutosFoco: 0, itensRevisao: 0, avaliacoes: 0 },
  },
};

export type StatusConexao = 'conectando' | 'online' | 'offline';
export type ComDados = { dados: SnapshotDados };

interface EstudosState {
  dados: SnapshotDados;
  status: StatusConexao; // não persistido
  aplicarSnapshot: (dados: SnapshotDados) => void;
  sincronizar: () => Promise<void>;
  /** Registra uma sessão de foco; o servidor gera as revisões (1, 7 e 30 dias). Retorna quantas gerou. */
  registrarSessao: (materiaId: string | null, minutos: number) => Promise<number>;
  /** Conclui uma revisão com a autoavaliação (3 níveis). */
  concluirRevisao: (id: string, nivel: NivelLembranca) => Promise<ItemRevisao>;
}

export const useEstudosStore = create<EstudosState>()(
  persist(
    (set, get) => ({
      dados: DADOS_VAZIOS,
      status: 'conectando',

      aplicarSnapshot: (dados) => set({ dados, status: 'online' }),

      sincronizar: async () => {
        if (get().status !== 'online') set({ status: 'conectando' });
        try {
          const r = await api.get<ComDados>('/dados');
          get().aplicarSnapshot(r.dados);
        } catch {
          set({ status: 'offline' });
        }
      },

      registrarSessao: async (materiaId, minutos) => {
        const r = await chamar(
          api.post<{ revisoesGeradas: number } & ComDados>('/sessoes', {
            materiaId,
            inicio: new Date(Date.now() - minutos * 60000).toISOString(),
            dia: hojeISO(),
            duracaoMin: minutos,
            tipo: 'foco',
            concluida: true,
          })
        );
        return r.revisoesGeradas;
      },

      concluirRevisao: async (id, nivel) => {
        const r = await chamar(api.post<{ item: ItemRevisao } & ComDados>(`/itens-revisao/${id}/avaliacao`, { nivel }));
        return r.item;
      },
    }),
    {
      name: '@flowstudy/estudos',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ dados: s.dados }),
      // Ignora cópia salva inválida em vez de quebrar o app.
      merge: (salvo, atual) => {
        const dados = (salvo as { dados?: SnapshotDados } | undefined)?.dados;
        return dados && Array.isArray(dados.materias) && dados.derivados ? { ...atual, dados } : atual;
      },
    }
  )
);

/** Executa uma alteração no servidor e adota o estado devolvido por ele. */
export async function chamar<T extends ComDados>(requisicao: Promise<T>): Promise<T> {
  try {
    const resposta = await requisicao;
    useEstudosStore.getState().aplicarSnapshot(resposta.dados);
    return resposta;
  } catch (erro) {
    if (erro instanceof ErroApi && erro.semConexao) useEstudosStore.setState({ status: 'offline' });
    throw erro;
  }
}

const porData = (a: ItemRevisao, b: ItemRevisao) =>
  a.dataAgendada < b.dataAgendada ? -1 : a.dataAgendada > b.dataAgendada ? 1 : 0;

/** Revisões pendentes: não concluídas, já vencidas (ou de hoje) e ainda não avaliadas hoje. */
export function pendentesDe(itens: ItemRevisao[], hoje: string): ItemRevisao[] {
  return itens.filter((r) => !r.feita && r.dataAgendada <= hoje && r.ultimaAvaliacaoEm !== hoje).sort(porData);
}

/** Quantas revisões vencem em cada dia (hoje em diante) — base dos lembretes. */
export function revisoesPorDia(itens: ItemRevisao[], hoje: string): { dia: string; quantidade: number }[] {
  const contagem = new Map<string, number>();
  itens
    .filter((r) => !r.feita)
    .forEach((r) => {
      const dia = r.dataAgendada < hoje ? hoje : r.dataAgendada; // atrasadas contam para hoje
      contagem.set(dia, (contagem.get(dia) ?? 0) + 1);
    });
  return [...contagem.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([dia, quantidade]) => ({ dia, quantidade }));
}
