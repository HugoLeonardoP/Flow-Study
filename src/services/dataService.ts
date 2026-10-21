import { useSyncExternalStore } from 'react';
import {
  Materia,
  SessaoPomodoro,
  ItemRevisao,
  AvaliacaoRevisao,
  NivelLembranca,
  EstatisticaDia,
  ResumoDia,
  MetaArmazenamento,
} from '@/types';
import { gerarDadosIniciais } from '@/mocks/data';
import { CHAVES, lerJSON, salvarJSON } from '@/storage/armazenamento';
import { hojeISO, diaLocalDe } from '@/utils/datas';

// ===========================================================================
// Serviço de dados do FlowStudy — persistência local com AsyncStorage.
//
// Como funciona:
//  1. `iniciarDados()` roda UMA vez ao abrir o app (ver App.tsx): lê tudo do
//     AsyncStorage para um cache em memória (ou semeia dados de exemplo na
//     primeira execução).
//  2. As telas LEEM do cache (rápido e síncrono) e se inscrevem nas mudanças
//     com o hook `useDados()`.
//  3. Toda ESCRITA (criar/atualizar/remover) altera o cache, avisa as telas
//     e grava a coleção alterada no AsyncStorage em segundo plano.
// ===========================================================================

const SCHEMA_VERSION = 1;

type Colecao = 'materias' | 'sessoes' | 'itensRevisao' | 'avaliacoes';

interface Estado {
  materias: Materia[];
  sessoes: SessaoPomodoro[];
  itensRevisao: ItemRevisao[];
  avaliacoes: AvaliacaoRevisao[];
}

let estado: Estado = { materias: [], sessoes: [], itensRevisao: [], avaliacoes: [] };
let versao = 0;
let iniciado = false;
// Se a leitura inicial falhar, o app segue funcionando só em memória e NÃO
// grava nada — assim dados já salvos nunca são sobrescritos por engano.
let somenteMemoria = false;

// ---------------------------------------------------------------------------
// Inscrição de telas (reatividade)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Persistência (escrita em fila para preservar a ordem das gravações)
// ---------------------------------------------------------------------------
let filaDeEscrita: Promise<void> = Promise.resolve();

function persistir(colecoes: Colecao[]) {
  if (somenteMemoria) return;
  colecoes.forEach((colecao) => {
    filaDeEscrita = filaDeEscrita
      // lê `estado[colecao]` só na hora de gravar: sempre salva a versão mais recente
      .then(() => salvarJSON(CHAVES[colecao], estado[colecao]))
      .catch((erro) => console.warn(`[FlowStudy] Falha ao gravar "${colecao}":`, erro));
  });
}

function atualizarEstado(parcial: Partial<Estado>) {
  estado = { ...estado, ...parcial };
  persistir(Object.keys(parcial) as Colecao[]);
  notificar();
}

function gerarId(prefixo: string): string {
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function listaOuVazia<T>(valor: unknown): T[] {
  return Array.isArray(valor) ? (valor as T[]) : [];
}

// ---------------------------------------------------------------------------
// Inicialização — recuperação dos dados ao (re)abrir o app
// ---------------------------------------------------------------------------
export async function iniciarDados(): Promise<void> {
  if (iniciado) return;
  iniciado = true;

  try {
    const meta = await lerJSON<MetaArmazenamento>(CHAVES.meta);

    if (meta === null) {
      // Primeira execução: grava os dados de exemplo.
      const inicial = gerarDadosIniciais();
      estado = { ...inicial };
      await Promise.all([
        salvarJSON(CHAVES.materias, estado.materias),
        salvarJSON(CHAVES.sessoes, estado.sessoes),
        salvarJSON(CHAVES.itensRevisao, estado.itensRevisao),
        salvarJSON(CHAVES.avaliacoes, estado.avaliacoes),
      ]);
      // `meta` por último: se o app fechar no meio, a próxima abertura refaz a semeadura.
      const novaMeta: MetaArmazenamento = {
        schemaVersion: SCHEMA_VERSION,
        criadoEm: new Date().toISOString(),
      };
      await salvarJSON(CHAVES.meta, novaMeta);
    } else {
      const [materias, sessoes, itensRevisao, avaliacoes] = await Promise.all([
        lerJSON<Materia[]>(CHAVES.materias),
        lerJSON<SessaoPomodoro[]>(CHAVES.sessoes),
        lerJSON<ItemRevisao[]>(CHAVES.itensRevisao),
        lerJSON<AvaliacaoRevisao[]>(CHAVES.avaliacoes),
      ]);
      estado = {
        materias: listaOuVazia<Materia>(materias),
        sessoes: listaOuVazia<SessaoPomodoro>(sessoes),
        itensRevisao: listaOuVazia<ItemRevisao>(itensRevisao),
        avaliacoes: listaOuVazia<AvaliacaoRevisao>(avaliacoes),
      };
      // Ponto de extensão: se `meta.schemaVersion < SCHEMA_VERSION`, migrar aqui.
    }
  } catch (erro) {
    console.warn('[FlowStudy] Armazenamento indisponível; usando apenas memória.', erro);
    somenteMemoria = true;
    estado = { ...gerarDadosIniciais() };
  }

  notificar();
}

// ===========================================================================
// MATÉRIAS
// ===========================================================================
export function listarMaterias(): Materia[] {
  return estado.materias;
}

export function getMateriaById(id: string | null | undefined): Materia | undefined {
  return estado.materias.find((m) => m.id === id);
}

export function criarMateria(dados: Pick<Materia, 'nome' | 'cor' | 'categoria'>): Materia {
  const nova: Materia = { ...dados, id: gerarId('mat'), criadoEm: new Date().toISOString() };
  atualizarEstado({ materias: [nova, ...estado.materias] });
  return nova;
}

export function atualizarMateria(materia: Materia): void {
  atualizarEstado({
    materias: estado.materias.map((m) => (m.id === materia.id ? materia : m)),
  });
}

/** Remove a matéria e tudo que depende dela (sessões, itens de revisão e avaliações). */
export function removerMateria(id: string): void {
  atualizarEstado({
    materias: estado.materias.filter((m) => m.id !== id),
    sessoes: estado.sessoes.filter((s) => s.materiaId !== id),
    itensRevisao: estado.itensRevisao.filter((r) => r.materiaId !== id),
    avaliacoes: estado.avaliacoes.filter((a) => a.materiaId !== id),
  });
}

// ===========================================================================
// SESSÕES POMODORO
// ===========================================================================
export function registrarSessaoConcluida(sessao: SessaoPomodoro): void {
  atualizarEstado({ sessoes: [sessao, ...estado.sessoes] });
}

export function getHistoricoSessoes(materiaId: string): SessaoPomodoro[] {
  return estado.sessoes
    .filter((s) => s.materiaId === materiaId && s.tipo === 'foco')
    .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
}

// ===========================================================================
// ITENS DE REVISÃO
// ===========================================================================
export function criarItemRevisao(dados: {
  materiaId: string;
  tema: string;
  primeiraRevisaoEmDias: number;
}): ItemRevisao {
  const novo: ItemRevisao = {
    id: gerarId('rev'),
    materiaId: dados.materiaId,
    tema: dados.tema.trim(),
    dataAgendada: hojeISO(dados.primeiraRevisaoEmDias),
    intervaloAtualDias: 1,
    fatorFacilidade: 2.5,
    repeticoes: 0,
    criadoEm: hojeISO(),
  };
  atualizarEstado({ itensRevisao: [novo, ...estado.itensRevisao] });
  return novo;
}

export function atualizarTemaItemRevisao(id: string, tema: string): void {
  atualizarEstado({
    itensRevisao: estado.itensRevisao.map((r) => (r.id === id ? { ...r, tema: tema.trim() } : r)),
  });
}

export function removerItemRevisao(id: string): void {
  atualizarEstado({
    itensRevisao: estado.itensRevisao.filter((r) => r.id !== id),
    avaliacoes: estado.avaliacoes.filter((a) => a.itemId !== id),
  });
}

export function getRevisoesDaMateria(materiaId: string): ItemRevisao[] {
  return estado.itensRevisao
    .filter((r) => r.materiaId === materiaId)
    .sort((a, b) => (a.dataAgendada < b.dataAgendada ? -1 : a.dataAgendada > b.dataAgendada ? 1 : 0));
}

export function foiAvaliadoHoje(item: ItemRevisao): boolean {
  return item.ultimaAvaliacaoEm === hojeISO();
}

/** Itens vencidos ou agendados para hoje que ainda não foram avaliados hoje. */
export function getRevisoesDoDia(): ItemRevisao[] {
  const hoje = hojeISO();
  return estado.itensRevisao
    .filter((r) => r.dataAgendada <= hoje && !foiAvaliadoHoje(r))
    .sort((a, b) => (a.dataAgendada < b.dataAgendada ? -1 : a.dataAgendada > b.dataAgendada ? 1 : 0));
}

// -----------------------------------------------------------------------
// Simulação do algoritmo SM-2. NÃO é o SM-2 real — apenas define um número
// fixo de dias até a próxima revisão para cada nível de lembrança.
// -----------------------------------------------------------------------
export function recalcularProximaRevisao(item: ItemRevisao, avaliacao: NivelLembranca): ItemRevisao {
  const diasPorNivel: Record<NivelLembranca, number> = {
    nao_lembrei: 1,
    dificil: 3,
    facil: 6,
  };
  const novoIntervalo = diasPorNivel[avaliacao];

  return {
    ...item,
    ultimaAvaliacao: avaliacao,
    ultimaAvaliacaoEm: hojeISO(),
    intervaloAtualDias: novoIntervalo,
    repeticoes: avaliacao === 'nao_lembrei' ? 0 : item.repeticoes + 1,
    dataAgendada: hojeISO(novoIntervalo),
  };
}

export function avaliarItemRevisao(id: string, nivel: NivelLembranca): void {
  const item = estado.itensRevisao.find((r) => r.id === id);
  if (!item) return;

  const registro: AvaliacaoRevisao = {
    id: gerarId('ava'),
    itemId: item.id,
    materiaId: item.materiaId,
    nivel,
    avaliadaEm: new Date().toISOString(),
  };

  atualizarEstado({
    itensRevisao: estado.itensRevisao.map((r) => (r.id === id ? recalcularProximaRevisao(r, nivel) : r)),
    avaliacoes: [registro, ...estado.avaliacoes],
  });
}

// ===========================================================================
// DADOS DERIVADOS (Home e Estatísticas)
// ===========================================================================
export function getResumoDoDia(): ResumoDia {
  const hoje = hojeISO();
  const minutosEstudadosHoje = estado.sessoes
    .filter((s) => s.tipo === 'foco' && s.concluida && diaLocalDe(s.inicio) === hoje)
    .reduce((acc, s) => acc + s.duracaoMin, 0);

  return { minutosEstudadosHoje, revisoesPendentesHoje: getRevisoesDoDia().length };
}

/** Minutos de foco por dia nos últimos 7 dias (do mais antigo ao de hoje). */
export function getEstatisticasSemana(): EstatisticaDia[] {
  const dias: EstatisticaDia[] = [];
  for (let offset = -6; offset <= 0; offset++) {
    const dia = hojeISO(offset);
    const minutos = estado.sessoes
      .filter((s) => s.tipo === 'foco' && s.concluida && diaLocalDe(s.inicio) === dia)
      .reduce((acc, s) => acc + s.duracaoMin, 0);
    dias.push({ data: dia, minutosEstudados: minutos });
  }
  return dias;
}

export function getTaxaLembranca() {
  const facil = estado.avaliacoes.filter((a) => a.nivel === 'facil').length;
  const dificil = estado.avaliacoes.filter((a) => a.nivel === 'dificil').length;
  const naoLembrei = estado.avaliacoes.filter((a) => a.nivel === 'nao_lembrei').length;
  return { facil, dificil, naoLembrei, total: facil + dificil + naoLembrei };
}

export function getTotaisArmazenados() {
  const sessoesFoco = estado.sessoes.filter((s) => s.tipo === 'foco' && s.concluida);
  return {
    materias: estado.materias.length,
    sessoesFoco: sessoesFoco.length,
    minutosFoco: sessoesFoco.reduce((acc, s) => acc + s.duracaoMin, 0),
    itensRevisao: estado.itensRevisao.length,
    avaliacoes: estado.avaliacoes.length,
  };
}

/** Apaga TODOS os dados do usuário (os dados de exemplo não voltam sozinhos). */
export function limparTodosOsDados(): void {
  atualizarEstado({ materias: [], sessoes: [], itensRevisao: [], avaliacoes: [] });
}
