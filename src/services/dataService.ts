import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import {
  Materia,
  SessaoPomodoro,
  ItemRevisao,
  NivelLembranca,
  SnapshotDados,
} from '@/types';
import { api, ErroApi } from '@/services/api';
import { CHAVES, lerJSON, salvarJSON } from '@/storage/armazenamento';
import { hojeISO } from '@/utils/datas';

// ===========================================================================
// Serviço de dados do app (cliente do backend).
//
// Divisão de responsabilidades:
//  • BACKEND: guarda os dados, valida entradas, aplica regras de negócio
//    (cascata de exclusões, reagendamento de revisões, resumo e estatísticas).
//  • APP (este arquivo): envia as ações do usuário ao servidor, guarda em
//    memória a última cópia recebida e a replica em cache local (AsyncStorage)
//    para abrir rápido e mostrar os últimos dados quando estiver sem conexão.
//
// Toda alteração exige conexão: o servidor responde com o estado atualizado e
// o app o substitui por inteiro. As telas leem os dados daqui e se inscrevem
// com `useDados()`.
// ===========================================================================

const DADOS_VAZIOS: SnapshotDados = {
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

let dados: SnapshotDados = DADOS_VAZIOS;
let status: StatusConexao = 'conectando';
let versao = 0;
let iniciado = false;

// ---------------------------------------------------------------- reatividade
const ouvintes = new Set<() => void>();

function inscrever(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function notificar() {
  versao += 1;
  ouvintes.forEach((o) => o());
}

/** Chame no topo de toda tela que exibe dados: ela re-renderiza quando os dados mudam. */
export function useDados(): number {
  return useSyncExternalStore(inscrever, () => versao);
}

// ------------------------------------------------------------- sincronização
function aplicar(novos: SnapshotDados) {
  dados = novos;
  status = 'online';
  notificar();
  salvarJSON(CHAVES.cache, novos).catch((erro) =>
    console.warn('[FlowStudy] Falha ao gravar o cache local:', erro)
  );
}

/** Busca no servidor o estado atual. Em caso de falha, mantém os dados em cache e marca "offline". */
export async function sincronizar(): Promise<void> {
  if (status !== 'online') {
    status = 'conectando';
    notificar();
  }
  try {
    const resposta = await api.get<{ dados: SnapshotDados }>('/dados');
    aplicar(resposta.dados);
  } catch {
    status = 'offline';
    notificar();
  }
}

/** Chamada ao abrir o app: carrega o cache local e sincroniza com o servidor em segundo plano. */
export async function iniciarDados(): Promise<void> {
  if (iniciado) return;
  iniciado = true;

  try {
    const cache = await lerJSON<SnapshotDados>(CHAVES.cache);
    if (cache && Array.isArray(cache.materias) && cache.derivados) dados = cache;
  } catch (erro) {
    console.warn('[FlowStudy] Cache local indisponível:', erro);
  }
  notificar();

  void sincronizar();
  // Ao voltar para o app, atualiza (ex.: virou o dia ou os dados mudaram no servidor).
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') void sincronizar();
  });
}

export function getStatusConexao(): StatusConexao {
  return status;
}

type ComDados = { dados: SnapshotDados };

/** Executa uma alteração no servidor e, se der certo, adota o estado devolvido por ele. */
async function chamar<T extends ComDados>(requisicao: Promise<T>): Promise<T> {
  try {
    const resposta = await requisicao;
    aplicar(resposta.dados);
    return resposta;
  } catch (erro) {
    if (erro instanceof ErroApi && erro.semConexao) {
      status = 'offline';
      notificar();
    }
    throw erro;
  }
}

// ===========================================================================
// LEITURA (a partir da última cópia recebida)
// ===========================================================================
export function listarMaterias(): Materia[] {
  return dados.materias;
}

export function getMateriaById(id: string | null | undefined): Materia | undefined {
  return dados.materias.find((m) => m.id === id);
}

export function getHistoricoSessoes(materiaId: string): SessaoPomodoro[] {
  return dados.sessoes
    .filter((s) => s.materiaId === materiaId && s.tipo === 'foco')
    .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
}

export function getRevisoesDaMateria(materiaId: string): ItemRevisao[] {
  return dados.itensRevisao
    .filter((r) => r.materiaId === materiaId)
    .sort((a, b) => (a.dataAgendada < b.dataAgendada ? -1 : a.dataAgendada > b.dataAgendada ? 1 : 0));
}

export function foiAvaliadoHoje(item: ItemRevisao): boolean {
  return item.ultimaAvaliacaoEm === hojeISO();
}

/** Itens a revisar hoje — a lista é decidida pelo servidor. */
export function getRevisoesDoDia(): ItemRevisao[] {
  return dados.derivados.revisoesDoDiaIds
    .map((id) => dados.itensRevisao.find((r) => r.id === id))
    .filter((r): r is ItemRevisao => r !== undefined);
}

export const getResumoDoDia = () => dados.derivados.resumoDoDia;
export const getEstatisticasSemana = () => dados.derivados.estatisticasSemana;
export const getTaxaLembranca = () => dados.derivados.taxaLembranca;
export const getTotaisArmazenados = () => dados.derivados.totais;

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

/** O servidor registra a avaliação e calcula a próxima data de revisão (devolvida no item). */
export async function avaliarItemRevisao(id: string, nivel: NivelLembranca): Promise<ItemRevisao> {
  const r = await chamar(api.post<{ item: ItemRevisao } & ComDados>(`/itens-revisao/${id}/avaliacao`, { nivel }));
  return r.item;
}

export async function registrarSessaoConcluida(sessao: Omit<SessaoPomodoro, 'id'>): Promise<void> {
  await chamar(api.post<ComDados>('/sessoes', sessao));
}

/** Apaga TODOS os dados no servidor. */
export async function limparTodosOsDados(): Promise<void> {
  await chamar(api.del<ComDados>('/dados'));
}
