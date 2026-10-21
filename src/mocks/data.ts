import { Materia, SessaoPomodoro, ItemRevisao, AvaliacaoRevisao } from '@/types';
import { hojeISO } from '@/utils/datas';

// ---------------------------------------------------------------------------
// DADOS DE EXEMPLO — usados UMA ÚNICA VEZ, na primeira execução do app, para
// popular o armazenamento (ver `iniciarDados` em src/services/dataService.ts).
// Depois disso, tudo o que aparece nas telas vem do armazenamento persistente:
// editar/remover estes dados não os traz de volta ao reabrir o app.
// ---------------------------------------------------------------------------

export interface DadosIniciais {
  materias: Materia[];
  sessoes: SessaoPomodoro[];
  itensRevisao: ItemRevisao[];
  avaliacoes: AvaliacaoRevisao[];
}

export function gerarDadosIniciais(): DadosIniciais {
  const materias: Materia[] = [
    { id: 'mat-1', nome: 'Matemática', cor: '#3F5B4E', categoria: 'Exatas', criadoEm: `${hojeISO(-30)}T09:00:00` },
    { id: 'mat-2', nome: 'História do Brasil', cor: '#B85440', categoria: 'Humanas', criadoEm: `${hojeISO(-24)}T09:00:00` },
    { id: 'mat-3', nome: 'Inglês', cor: '#5F8CA6', categoria: 'Idiomas', criadoEm: `${hojeISO(-18)}T09:00:00` },
    { id: 'mat-4', nome: 'Biologia Celular', cor: '#4C7A5E', categoria: 'Biológicas', criadoEm: `${hojeISO(-12)}T09:00:00` },
    { id: 'mat-5', nome: 'Direito Constitucional', cor: '#8B5FA6', categoria: 'Concurso', criadoEm: `${hojeISO(-6)}T09:00:00` },
  ];

  // [deslocamento em dias, quantidade de ciclos de foco de 25 min]
  const planoSessoes: [number, number][] = [[-6, 2], [-5, 1], [-4, 3], [-2, 4], [-1, 1], [0, 2]];
  const sessoes: SessaoPomodoro[] = [];
  let seq = 0;
  planoSessoes.forEach(([offset, qtd]) => {
    for (let k = 0; k < qtd; k++) {
      seq += 1;
      sessoes.push({
        id: `ses-${seq}`,
        materiaId: materias[seq % materias.length].id,
        inicio: `${hojeISO(offset)}T${String(8 + k).padStart(2, '0')}:00:00`,
        duracaoMin: 25,
        tipo: 'foco',
        concluida: true,
      });
    }
  });

  const itensRevisao: ItemRevisao[] = [
    { id: 'rev-1', materiaId: 'mat-1', tema: 'Progressões Aritméticas', dataAgendada: hojeISO(0), intervaloAtualDias: 3, fatorFacilidade: 2.5, repeticoes: 1, criadoEm: hojeISO(-3) },
    { id: 'rev-2', materiaId: 'mat-2', tema: 'Era Vargas', dataAgendada: hojeISO(0), intervaloAtualDias: 1, fatorFacilidade: 2.3, repeticoes: 0, criadoEm: hojeISO(-1) },
    { id: 'rev-3', materiaId: 'mat-3', tema: 'Phrasal verbs — parte 1', dataAgendada: hojeISO(0), intervaloAtualDias: 6, fatorFacilidade: 2.6, repeticoes: 2, criadoEm: hojeISO(-8) },
    { id: 'rev-4', materiaId: 'mat-4', tema: 'Respiração celular', dataAgendada: hojeISO(0), intervaloAtualDias: 1, fatorFacilidade: 2.2, repeticoes: 0, criadoEm: hojeISO(-1) },
    { id: 'rev-5', materiaId: 'mat-5', tema: 'Controle de constitucionalidade', dataAgendada: hojeISO(0), intervaloAtualDias: 3, fatorFacilidade: 2.4, repeticoes: 1, criadoEm: hojeISO(-3) },
    { id: 'rev-6', materiaId: 'mat-1', tema: 'Funções quadráticas', dataAgendada: hojeISO(6), intervaloAtualDias: 6, fatorFacilidade: 2.5, repeticoes: 2, ultimaAvaliacao: 'facil', ultimaAvaliacaoEm: hojeISO(0), criadoEm: hojeISO(-10) },
  ];

  const niveisIniciais: AvaliacaoRevisao['nivel'][] = ['facil', 'facil', 'facil', 'dificil', 'dificil', 'nao_lembrei'];
  const avaliacoes: AvaliacaoRevisao[] = niveisIniciais.map((nivel, i) => ({
    id: `ava-${i + 1}`,
    itemId: 'rev-6',
    materiaId: 'mat-1',
    nivel,
    avaliadaEm: `${hojeISO(-i)}T10:00:00`,
  }));

  return { materias, sessoes, itensRevisao, avaliacoes };
}
