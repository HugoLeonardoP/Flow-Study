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
  inicio: string; // ISO date
  duracaoMin: number;
  tipo: TipoCiclo;
  concluida: boolean;
}

export type NivelLembranca = 'nao_lembrei' | 'dificil' | 'facil';

export interface ItemRevisao {
  id: string;
  materiaId: string;
  tema: string;
  dataAgendada: string; // ISO date (yyyy-mm-dd)
  intervaloAtualDias: number;
  fatorFacilidade: number;
  repeticoes: number;
  ultimaAvaliacao?: NivelLembranca;
  concluidaHoje?: boolean;
}

export interface EstatisticaDia {
  data: string; // yyyy-mm-dd
  minutosEstudados: number;
}

export interface ResumoDia {
  minutosEstudadosHoje: number;
  revisoesPendentesHoje: number;
}
