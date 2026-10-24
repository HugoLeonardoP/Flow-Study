'use strict';
// Regras de negócio e validações do FlowStudy. É aqui (e não no app) que ficam:
// validação de entradas, cascata de exclusões, reagendamento de revisões
// (simulação do SM-2) e cálculo do resumo/estatísticas.
const crypto = require('crypto');

const CATEGORIAS = ['Exatas', 'Humanas', 'Biológicas', 'Idiomas', 'Concurso', 'Outra'];
const NIVEIS = ['nao_lembrei', 'dificil', 'facil'];
// Simulação do SM-2 (NÃO é o algoritmo real): dias até a próxima revisão por nível.
const DIAS_POR_NIVEL = { nao_lembrei: 1, dificil: 3, facil: 6 };
const REGEX_DIA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_COR = /^#[0-9A-Fa-f]{6}$/;

class ErroNegocio extends Error {
  constructor(status, mensagem, campos) {
    super(mensagem);
    this.status = status;
    this.campos = campos;
  }
}

// ---------------------------------------------------------------- datas
function formatarLocal(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function hojeDoServidor() {
  return formatarLocal(new Date());
}
function somarDias(diaISO, n) {
  const [a, m, d] = diaISO.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
// O "hoje" vem do app (fuso do usuário); se não vier, usa o do servidor.
function resolverHoje(valor) {
  return typeof valor === 'string' && REGEX_DIA.test(valor) ? valor : hojeDoServidor();
}
function gerarId(prefixo) {
  return `${prefixo}-${crypto.randomUUID().slice(0, 8)}`;
}

// ------------------------------------------------------------ validações
function lancarSeHouverErros(campos) {
  if (Object.keys(campos).length > 0) throw new ErroNegocio(400, 'Dados inválidos.', campos);
}

function validarMateria(corpo, materias, idAtual) {
  const campos = {};
  const nome = typeof corpo.nome === 'string' ? corpo.nome.trim().replace(/\s+/g, ' ') : '';
  if (nome.length < 2) campos.nome = 'Use pelo menos 2 caracteres.';
  else if (nome.length > 40) campos.nome = 'Use no máximo 40 caracteres.';
  else if (materias.some((m) => m.id !== idAtual && m.nome.toLowerCase() === nome.toLowerCase()))
    campos.nome = 'Já existe uma matéria com esse nome.';
  if (typeof corpo.cor !== 'string' || !REGEX_COR.test(corpo.cor)) campos.cor = 'Cor inválida.';
  if (!CATEGORIAS.includes(corpo.categoria)) campos.categoria = 'Categoria inválida.';
  lancarSeHouverErros(campos);
  return { nome, cor: corpo.cor, categoria: corpo.categoria };
}

function validarTema(valor) {
  const tema = typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '';
  const campos = {};
  if (tema.length < 2) campos.tema = 'Use pelo menos 2 caracteres.';
  else if (tema.length > 80) campos.tema = 'Use no máximo 80 caracteres.';
  lancarSeHouverErros(campos);
  return tema;
}

function exigirMateria(db, id) {
  const materia = db.materias.find((m) => m.id === id);
  if (!materia) throw new ErroNegocio(404, 'Matéria não encontrada.');
  return materia;
}

function validarNovoItem(corpo, db) {
  const tema = validarTema(corpo.tema);
  exigirMateria(db, corpo.materiaId);
  const dias = corpo.primeiraRevisaoEmDias;
  if (!Number.isInteger(dias) || dias < 0 || dias > 30)
    throw new ErroNegocio(400, 'Dados inválidos.', { primeiraRevisaoEmDias: 'Escolha entre 0 e 30 dias.' });
  return { tema, materiaId: corpo.materiaId, dias };
}

function validarNovaSessao(corpo, db, hoje) {
  const campos = {};
  if (corpo.materiaId !== null && corpo.materiaId !== undefined) exigirMateria(db, corpo.materiaId);
  if (!['foco', 'descanso'].includes(corpo.tipo)) campos.tipo = 'Tipo inválido.';
  if (typeof corpo.duracaoMin !== 'number' || !(corpo.duracaoMin > 0) || corpo.duracaoMin > 180)
    campos.duracaoMin = 'Duração deve estar entre 1 e 180 minutos.';
  if (typeof corpo.inicio !== 'string' || Number.isNaN(new Date(corpo.inicio).getTime()))
    campos.inicio = 'Data de início inválida.';
  lancarSeHouverErros(campos);
  return {
    materiaId: corpo.materiaId ?? null,
    inicio: corpo.inicio,
    dia: typeof corpo.dia === 'string' && REGEX_DIA.test(corpo.dia) ? corpo.dia : hoje,
    duracaoMin: corpo.duracaoMin,
    tipo: corpo.tipo,
    concluida: corpo.concluida !== false,
  };
}

// --------------------------------------------------------------- operações
function removerMateriaEmCascata(db, id) {
  db.materias = db.materias.filter((m) => m.id !== id);
  db.sessoes = db.sessoes.filter((s) => s.materiaId !== id);
  db.itensRevisao = db.itensRevisao.filter((r) => r.materiaId !== id);
  db.avaliacoes = db.avaliacoes.filter((a) => a.materiaId !== id);
}

function removerItemEmCascata(db, id) {
  db.itensRevisao = db.itensRevisao.filter((r) => r.id !== id);
  db.avaliacoes = db.avaliacoes.filter((a) => a.itemId !== id);
}

function avaliarItem(db, id, nivel, hoje) {
  if (!NIVEIS.includes(nivel)) throw new ErroNegocio(400, 'Dados inválidos.', { nivel: 'Nível inválido.' });
  const item = db.itensRevisao.find((r) => r.id === id);
  if (!item) throw new ErroNegocio(404, 'Item de revisão não encontrado.');
  if (item.ultimaAvaliacaoEm === hoje) throw new ErroNegocio(409, 'Este item já foi avaliado hoje.');

  const dias = DIAS_POR_NIVEL[nivel];
  item.ultimaAvaliacao = nivel;
  item.ultimaAvaliacaoEm = hoje;
  item.intervaloAtualDias = dias;
  item.repeticoes = nivel === 'nao_lembrei' ? 0 : item.repeticoes + 1;
  item.dataAgendada = somarDias(hoje, dias);

  db.avaliacoes.unshift({
    id: gerarId('ava'),
    itemId: item.id,
    materiaId: item.materiaId,
    nivel,
    avaliadaEm: new Date().toISOString(),
  });
  return item;
}

// ------------------------------------------------- dados derivados (snapshot)
function porDataAgendada(a, b) {
  return a.dataAgendada < b.dataAgendada ? -1 : a.dataAgendada > b.dataAgendada ? 1 : 0;
}

function minutosDeFoco(db, dia) {
  return db.sessoes
    .filter((s) => s.tipo === 'foco' && s.concluida && s.dia === dia)
    .reduce((acc, s) => acc + s.duracaoMin, 0);
}

function montarSnapshot(db, hoje) {
  const doDia = db.itensRevisao
    .filter((r) => r.dataAgendada <= hoje && r.ultimaAvaliacaoEm !== hoje)
    .sort(porDataAgendada);

  const estatisticasSemana = [];
  for (let offset = -6; offset <= 0; offset++) {
    const data = somarDias(hoje, offset);
    estatisticasSemana.push({ data, minutosEstudados: minutosDeFoco(db, data) });
  }

  const conta = (n) => db.avaliacoes.filter((a) => a.nivel === n).length;
  const taxa = { facil: conta('facil'), dificil: conta('dificil'), naoLembrei: conta('nao_lembrei') };
  const focoConcluido = db.sessoes.filter((s) => s.tipo === 'foco' && s.concluida);

  return {
    materias: db.materias,
    sessoes: db.sessoes,
    itensRevisao: db.itensRevisao,
    avaliacoes: db.avaliacoes,
    derivados: {
      resumoDoDia: { minutosEstudadosHoje: minutosDeFoco(db, hoje), revisoesPendentesHoje: doDia.length },
      revisoesDoDiaIds: doDia.map((r) => r.id),
      estatisticasSemana,
      taxaLembranca: { ...taxa, total: taxa.facil + taxa.dificil + taxa.naoLembrei },
      totais: {
        materias: db.materias.length,
        sessoesFoco: focoConcluido.length,
        minutosFoco: focoConcluido.reduce((acc, s) => acc + s.duracaoMin, 0),
        itensRevisao: db.itensRevisao.length,
        avaliacoes: db.avaliacoes.length,
      },
    },
  };
}

module.exports = {
  ErroNegocio,
  resolverHoje,
  hojeDoServidor,
  somarDias,
  gerarId,
  validarMateria,
  validarTema,
  validarNovoItem,
  validarNovaSessao,
  exigirMateria,
  removerMateriaEmCascata,
  removerItemEmCascata,
  avaliarItem,
  montarSnapshot,
};
