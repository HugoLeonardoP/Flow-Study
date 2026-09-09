import {
  Materia,
  SessaoPomodoro,
  ItemRevisao,
  EstatisticaDia,
  NivelLembranca,
} from '@/types';

// ---------------------------------------------------------------------------
// Dados fake em memória. Nada aqui é persistido: ao reiniciar o app, tudo
// volta ao estado inicial abaixo. Os arrays exportados como `let` simulam
// um "banco de dados" local só para o front-end funcionar de ponta a ponta;
// no futuro, essas funções podem ser trocadas por chamadas a SQLite/API
// mantendo a mesma assinatura.
// ---------------------------------------------------------------------------

function hojeISO(offsetDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

export let materiasMock: Materia[] = [
  { id: 'mat-1', nome: 'Matemática', cor: '#3F5B4E', categoria: 'Exatas', criadoEm: hojeISO(-30) },
  { id: 'mat-2', nome: 'História do Brasil', cor: '#B85440', categoria: 'Humanas', criadoEm: hojeISO(-24) },
  { id: 'mat-3', nome: 'Inglês', cor: '#5F8CA6', categoria: 'Idiomas', criadoEm: hojeISO(-18) },
  { id: 'mat-4', nome: 'Biologia Celular', cor: '#4C7A5E', categoria: 'Biológicas', criadoEm: hojeISO(-12) },
  { id: 'mat-5', nome: 'Direito Constitucional', cor: '#8B5FA6', categoria: 'Concurso', criadoEm: hojeISO(-6) },
];

export let sessoesMock: SessaoPomodoro[] = [
  { id: 'ses-1', materiaId: 'mat-1', inicio: `${hojeISO(0)}T08:10:00`, duracaoMin: 25, tipo: 'foco', concluida: true },
  { id: 'ses-2', materiaId: 'mat-1', inicio: `${hojeISO(0)}T08:40:00`, duracaoMin: 5, tipo: 'descanso', concluida: true },
  { id: 'ses-3', materiaId: 'mat-2', inicio: `${hojeISO(0)}T09:00:00`, duracaoMin: 25, tipo: 'foco', concluida: true },
  { id: 'ses-4', materiaId: 'mat-3', inicio: `${hojeISO(-1)}T19:00:00`, duracaoMin: 25, tipo: 'foco', concluida: true },
  { id: 'ses-5', materiaId: 'mat-4', inicio: `${hojeISO(-2)}T15:00:00`, duracaoMin: 25, tipo: 'foco', concluida: true },
];

export let itensRevisaoMock: ItemRevisao[] = [
  { id: 'rev-1', materiaId: 'mat-1', tema: 'Progressões Aritméticas', dataAgendada: hojeISO(0), intervaloAtualDias: 3, fatorFacilidade: 2.5, repeticoes: 1 },
  { id: 'rev-2', materiaId: 'mat-2', tema: 'Era Vargas', dataAgendada: hojeISO(0), intervaloAtualDias: 1, fatorFacilidade: 2.3, repeticoes: 0 },
  { id: 'rev-3', materiaId: 'mat-3', tema: 'Phrasal verbs — parte 1', dataAgendada: hojeISO(0), intervaloAtualDias: 6, fatorFacilidade: 2.6, repeticoes: 2 },
  { id: 'rev-4', materiaId: 'mat-4', tema: 'Respiração celular', dataAgendada: hojeISO(0), intervaloAtualDias: 1, fatorFacilidade: 2.2, repeticoes: 0 },
  { id: 'rev-5', materiaId: 'mat-5', tema: 'Controle de constitucionalidade', dataAgendada: hojeISO(0), intervaloAtualDias: 3, fatorFacilidade: 2.4, repeticoes: 1 },
  { id: 'rev-6', materiaId: 'mat-1', tema: 'Funções quadráticas', dataAgendada: hojeISO(-1), intervaloAtualDias: 6, fatorFacilidade: 2.5, repeticoes: 2, ultimaAvaliacao: 'facil', concluidaHoje: true },
];

export const estatisticasSemanaMock: EstatisticaDia[] = [
  { data: hojeISO(-6), minutosEstudados: 50 },
  { data: hojeISO(-5), minutosEstudados: 25 },
  { data: hojeISO(-4), minutosEstudados: 75 },
  { data: hojeISO(-3), minutosEstudados: 0 },
  { data: hojeISO(-2), minutosEstudados: 100 },
  { data: hojeISO(-1), minutosEstudados: 25 },
  { data: hojeISO(0), minutosEstudados: 50 },
];

export const taxaAcertoRevisoesMock = {
  facil: 14,
  dificil: 6,
  naoLembrei: 3,
};

export function getMateriaById(id: string | null | undefined): Materia | undefined {
  return materiasMock.find((m) => m.id === id);
}

export function getResumoDoDia() {
  const hoje = hojeISO(0);
  const minutosEstudadosHoje = sessoesMock
    .filter((s) => s.tipo === 'foco' && s.concluida && s.inicio.startsWith(hoje))
    .reduce((acc, s) => acc + s.duracaoMin, 0);

  const revisoesPendentesHoje = itensRevisaoMock.filter(
    (r) => r.dataAgendada <= hoje && !r.concluidaHoje
  ).length;

  return { minutosEstudadosHoje, revisoesPendentesHoje };
}

export function getRevisoesDoDia(): ItemRevisao[] {
  const hoje = hojeISO(0);
  return itensRevisaoMock.filter((r) => r.dataAgendada <= hoje && !r.concluidaHoje);
}

export function getHistoricoSessoes(materiaId: string): SessaoPomodoro[] {
  return sessoesMock
    .filter((s) => s.materiaId === materiaId && s.tipo === 'foco')
    .sort((a, b) => (a.inicio < b.inicio ? 1 : -1));
}

export function getRevisoesDaMateria(materiaId: string): ItemRevisao[] {
  return itensRevisaoMock.filter((r) => r.materiaId === materiaId);
}

export function registrarSessaoConcluida(sessao: SessaoPomodoro) {
  sessoesMock = [sessao, ...sessoesMock];
}

export function criarMateria(materia: Materia) {
  materiasMock = [materia, ...materiasMock];
}

export function atualizarMateria(materia: Materia) {
  materiasMock = materiasMock.map((m) => (m.id === materia.id ? materia : m));
}

// -----------------------------------------------------------------------
// Simulação do algoritmo SM-2. Isso NÃO é a implementação real do SM-2 —
// é um mock que apenas soma dias fixos por nível de lembrança, só para que
// a tela de revisões tenha um comportamento plausível. Trocar por SM-2 de
// verdade é trabalho de uma fase futura (fora do escopo deste front-end).
// -----------------------------------------------------------------------
export function recalcularProximaRevisao(
  item: ItemRevisao,
  avaliacao: NivelLembranca
): ItemRevisao {
  const incrementoFixo: Record<NivelLembranca, number> = {
    nao_lembrei: 1,
    dificil: 3,
    facil: 6,
  };

  const novoIntervalo = incrementoFixo[avaliacao];

  return {
    ...item,
    ultimaAvaliacao: avaliacao,
    concluidaHoje: true,
    intervaloAtualDias: novoIntervalo,
    repeticoes: avaliacao === 'nao_lembrei' ? 0 : item.repeticoes + 1,
    dataAgendada: hojeISO(novoIntervalo),
  };
}

export function avaliarItemRevisao(id: string, avaliacao: NivelLembranca) {
  itensRevisaoMock = itensRevisaoMock.map((item) =>
    item.id === id ? recalcularProximaRevisao(item, avaliacao) : item
  );
}
