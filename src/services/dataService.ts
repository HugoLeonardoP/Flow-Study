import { AppState } from 'react-native';
import { Materia, SessaoPomodoro, ItemRevisao, ResultadoResumo } from '@/types';
import { api } from '@/services/api';
import { hojeISO } from '@/utils/datas';
import { chamar, ComDados, pendentesDe, StatusConexao, useEstudosStore } from '@/store/useEstudosStore';

// ===========================================================================
// Serviço de dados do app (cliente do backend).
//
//  • BACKEND: guarda os dados, valida entradas e aplica as regras de negócio.
//  • useEstudosStore (src/store): guarda em memória a última cópia recebida e a
//    persiste no aparelho (cache para abrir rápido e ler sem conexão).
//  • Este arquivo: leituras simples sobre essa cópia + alterações (CRUD) que
//    passam pelo servidor. Registrar sessão e concluir revisão ficam na store.
// ===========================================================================

export type { StatusConexao };

const estado = () => useEstudosStore.getState().dados;

/** Chame no topo de toda tela que exibe dados: ela re-renderiza quando os dados mudam. */
export function useDados() {
  return useEstudosStore((s) => s.dados);
}

/** Chamada ao abrir o app: aguarda a cópia salva no aparelho e sincroniza com o servidor em segundo plano. */
export async function iniciarDados(): Promise<void> {
  if (!useEstudosStore.persist.hasHydrated()) {
    await new Promise<void>((resolver) => {
      const parar = useEstudosStore.persist.onFinishHydration(() => {
        parar();
        resolver();
      });
    });
  }
  void sincronizar();
  // Ao voltar para o app, atualiza (ex.: virou o dia ou os dados mudaram no servidor).
  AppState.addEventListener('change', (s) => {
    if (s === 'active') void sincronizar();
  });
}

export function sincronizar(): Promise<void> {
  return useEstudosStore.getState().sincronizar();
}

export function getStatusConexao(): StatusConexao {
  return useEstudosStore.getState().status;
}

// ===========================================================================
// LEITURA
// ===========================================================================
export function listarMaterias(): Materia[] {
  return estado().materias;
}

export function getMateriaById(id: string | null | undefined): Materia | undefined {
  return estado().materias.find((m) => m.id === id);
}

export function getHistoricoSessoes(materiaId: string): SessaoPomodoro[] {
  return estado()
    .sessoes.filter((s) => s.materiaId === materiaId && s.tipo === 'foco')
    .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
}

export function getRevisoesDaMateria(materiaId: string): ItemRevisao[] {
  return estado()
    .itensRevisao.filter((r) => r.materiaId === materiaId)
    .sort((a, b) => (a.dataAgendada < b.dataAgendada ? -1 : a.dataAgendada > b.dataAgendada ? 1 : 0));
}

export function foiAvaliadoHoje(item: ItemRevisao): boolean {
  return item.ultimaAvaliacaoEm === hojeISO();
}

export function getRevisoesDoDia(): ItemRevisao[] {
  return pendentesDe(estado().itensRevisao, hojeISO());
}

export const getResumoDoDia = () => estado().derivados.resumoDoDia;
export const getEstatisticasSemana = () => estado().derivados.estatisticasSemana;
export const getTaxaLembranca = () => estado().derivados.taxaLembranca;
export const getTotaisArmazenados = () => estado().derivados.totais;

// ===========================================================================
// ALTERAÇÕES (todas passam pelo servidor)
// ===========================================================================
export async function criarMateria(
  entrada: Pick<Materia, 'nome' | 'cor' | 'categoria'>
): Promise<Materia> {
  const r = await chamar(api.post<{ materia: Materia } & ComDados>('/materias', entrada));
  return r.materia;
}

export async function atualizarMateria(materia: Materia): Promise<Materia> {
  const { nome, cor, categoria } = materia;
  const r = await chamar(api.put<{ materia: Materia } & ComDados>(`/materias/${materia.id}`, { nome, cor, categoria }));
  return r.materia;
}

/** O servidor remove também sessões, itens de revisão e avaliações da matéria. */
export async function removerMateria(id: string): Promise<void> {
  await chamar(api.del<ComDados>(`/materias/${id}`));
}

export async function criarItemRevisao(entrada: {
  materiaId: string;
  tema: string;
  primeiraRevisaoEmDias: number;
}): Promise<ItemRevisao> {
  const r = await chamar(api.post<{ item: ItemRevisao } & ComDados>('/itens-revisao', entrada));
  return r.item;
}

export async function atualizarTemaItemRevisao(id: string, tema: string): Promise<ItemRevisao> {
  const r = await chamar(api.put<{ item: ItemRevisao } & ComDados>(`/itens-revisao/${id}`, { tema }));
  return r.item;
}

export async function removerItemRevisao(id: string): Promise<void> {
  await chamar(api.del<ComDados>(`/itens-revisao/${id}`));
}

// O backend consulta a Wikipédia (até 2 chamadas, ~4 s cada), por isso o tempo limite é maior.
const TEMPO_LIMITE_RESUMO_MS = 15000;

/** CONSULTA (GET): busca o resumo de um tema na Wikipédia, via backend. Não altera dados. */
export async function consultarResumoTema(tema: string): Promise<ResultadoResumo> {
  return api.get<ResultadoResumo>(`/resumo?tema=${encodeURIComponent(tema)}`, TEMPO_LIMITE_RESUMO_MS);
}

/** ATUALIZAÇÃO (PUT): guarda no item o resumo escolhido; `null` remove o resumo salvo. */
export async function salvarResumoNoItem(
  itemId: string,
  resumo: { titulo: string; texto: string; url: string } | null
): Promise<ItemRevisao> {
  const r = await chamar(api.put<{ item: ItemRevisao } & ComDados>(`/itens-revisao/${itemId}/resumo`, { resumo }));
  return r.item;
}

/** Apaga TODOS os dados no servidor. */
export async function limparTodosOsDados(): Promise<void> {
  await chamar(api.del<ComDados>('/dados'));
}
