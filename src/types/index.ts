// Tipagens compartilhadas do FlowStudy.
// Nenhum destes tipos assume persistência real: hoje eles descrevem os
// dados mockados em `src/mocks`, mas a forma já está pronta para receber
// dados vindos de SQLite/API no futuro sem mudar a camada de UI.

export type Categoria =
  | 'Exatas'
  | 'Humanas'
  | 'Biológicas'
  | 'Idiomas'
  | 'Concurso'
  | 'Outra';

export const categorias: Categoria[] = [
  'Exatas',
  'Humanas',
  'Biológicas',
  'Idiomas',
  'Concurso',
  'Outra',
];

export interface Materia {
  id: string;
  nome: string;
  cor: string;
  categoria: Categoria;
  criadoEm: string; // ISO date
}

export type TipoCiclo = 'foco' | 'descanso';

export interface SessaoPomodoro {
  id: string;
  materiaId: string | null;
  inicio: string; // ISO datetime
  dia: string; // yyyy-mm-dd (dia LOCAL do usuário em que a sessão ocorreu)
  duracaoMin: number;
  tipo: TipoCiclo;
  concluida: boolean;
}

export type NivelLembranca = 'nao_lembrei' | 'dificil' | 'facil';

export interface ItemRevisao {
  id: string;
  materiaId: string;
  tema: string;
  dataAgendada: string; // yyyy-mm-dd (dia local)
  intervaloAtualDias: number;
  fatorFacilidade: number;
  repeticoes: number;
  ultimaAvaliacao?: NivelLembranca;
  ultimaAvaliacaoEm?: string; // yyyy-mm-dd (dia local) da última autoavaliação
  resumo?: ResumoSalvo; // resumo da Wikipédia guardado no item (opcional)
  criadoEm: string; // yyyy-mm-dd
}

// Resumo da Wikipédia que o usuário escolheu guardar em um item de revisão.
export interface ResumoSalvo {
  titulo: string;
  texto: string;
  url: string;
  fonte: string; // "Wikipédia"
  salvoEm: string; // ISO datetime
}

// Resposta da consulta de resumo (GET /api/resumo). `encontrado: false` indica
// AUSÊNCIA de dados (não é erro): `motivo` explica o porquê.
export interface ResultadoResumo {
  tema: string;
  encontrado: boolean;
  motivo?: 'ambiguo' | 'sem-resumo' | 'nao-encontrado';
  titulo?: string;
  descricao?: string | null;
  texto?: string;
  url?: string | null;
  buscaAproximada?: boolean; // o artigo veio de uma busca, não do título exato
  idioma?: string;
  fonte?: string;
  licenca?: string;
}

// Registro histórico de cada autoavaliação — alimenta a taxa de lembrança
// da tela de Estatísticas.
export interface AvaliacaoRevisao {
  id: string;
  itemId: string;
  materiaId: string;
  nivel: NivelLembranca;
  avaliadaEm: string; // ISO datetime
}

export interface EstatisticaDia {
  data: string; // yyyy-mm-dd
  minutosEstudados: number;
}

export interface ResumoDia {
  minutosEstudadosHoje: number;
  revisoesPendentesHoje: number;
}

// ---------------------------------------------------------------------------
// Resposta da API: o servidor devolve o estado completo + dados já calculados
// (resumo, estatísticas). O app apenas exibe — não recalcula regras de negócio.
// ---------------------------------------------------------------------------
export interface TaxaLembranca {
  facil: number;
  dificil: number;
  naoLembrei: number;
  total: number;
}

export interface TotaisArmazenados {
  materias: number;
  sessoesFoco: number;
  minutosFoco: number;
  itensRevisao: number;
  avaliacoes: number;
}

export interface Derivados {
  resumoDoDia: ResumoDia;
  revisoesDoDiaIds: string[];
  estatisticasSemana: EstatisticaDia[];
  taxaLembranca: TaxaLembranca;
  totais: TotaisArmazenados;
}

export interface SnapshotDados {
  materias: Materia[];
  sessoes: SessaoPomodoro[];
  itensRevisao: ItemRevisao[];
  avaliacoes: AvaliacaoRevisao[];
  derivados: Derivados;
}
