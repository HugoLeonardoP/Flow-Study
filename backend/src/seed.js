'use strict';
// Dados de exemplo gravados UMA vez, quando o arquivo do banco ainda não existe.
const { hojeDoServidor, somarDias } = require('./regras');

function gerarSeed() {
  const hoje = hojeDoServidor();
  const dia = (offset) => somarDias(hoje, offset);

  const materias = [
    { id: 'mat-1', nome: 'Matemática', cor: '#3F5B4E', categoria: 'Exatas', criadoEm: `${dia(-30)}T09:00:00.000Z` },
    { id: 'mat-2', nome: 'História do Brasil', cor: '#B85440', categoria: 'Humanas', criadoEm: `${dia(-24)}T09:00:00.000Z` },
    { id: 'mat-3', nome: 'Inglês', cor: '#5F8CA6', categoria: 'Idiomas', criadoEm: `${dia(-18)}T09:00:00.000Z` },
    { id: 'mat-4', nome: 'Biologia Celular', cor: '#4C7A5E', categoria: 'Biológicas', criadoEm: `${dia(-12)}T09:00:00.000Z` },
    { id: 'mat-5', nome: 'Direito Constitucional', cor: '#8B5FA6', categoria: 'Concurso', criadoEm: `${dia(-6)}T09:00:00.000Z` },
  ];

  // [deslocamento em dias, ciclos de foco de 25 min]
  const plano = [[-6, 2], [-5, 1], [-4, 3], [-2, 4], [-1, 1], [0, 2]];
  const sessoes = [];
  let seq = 0;
  plano.forEach(([offset, qtd]) => {
    for (let k = 0; k < qtd; k++) {
      seq += 1;
      sessoes.push({
        id: `ses-${seq}`,
        materiaId: materias[seq % materias.length].id,
        inicio: `${dia(offset)}T${String(8 + k).padStart(2, '0')}:00:00`,
        dia: dia(offset),
        duracaoMin: 25,
        tipo: 'foco',
        concluida: true,
      });
    }
  });

  const item = (id, materiaId, tema, agendada, intervalo, fator, rep, criado, extra = {}) => ({
    id, materiaId, tema, dataAgendada: agendada, intervaloAtualDias: intervalo,
    fatorFacilidade: fator, repeticoes: rep, criadoEm: criado, ...extra,
  });
  const itensRevisao = [
    item('rev-1', 'mat-1', 'Progressões Aritméticas', dia(0), 3, 2.5, 1, dia(-3)),
    item('rev-2', 'mat-2', 'Era Vargas', dia(0), 1, 2.3, 0, dia(-1)),
    item('rev-3', 'mat-3', 'Phrasal verbs — parte 1', dia(0), 6, 2.6, 2, dia(-8)),
    item('rev-4', 'mat-4', 'Respiração celular', dia(0), 1, 2.2, 0, dia(-1)),
    item('rev-5', 'mat-5', 'Controle de constitucionalidade', dia(0), 3, 2.4, 1, dia(-3)),
    item('rev-6', 'mat-1', 'Funções quadráticas', dia(6), 6, 2.5, 2, dia(-10), {
      ultimaAvaliacao: 'facil',
      ultimaAvaliacaoEm: dia(0),
    }),
  ];

  const niveis = ['facil', 'facil', 'facil', 'dificil', 'dificil', 'nao_lembrei'];
  const avaliacoes = niveis.map((nivel, i) => ({
    id: `ava-${i + 1}`,
    itemId: 'rev-6',
    materiaId: 'mat-1',
    nivel,
    avaliadaEm: `${dia(-i)}T10:00:00.000Z`,
  }));

  return { materias, sessoes, itensRevisao, avaliacoes };
}

module.exports = { gerarSeed };
