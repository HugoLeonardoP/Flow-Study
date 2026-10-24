'use strict';
const express = require('express');
const os = require('os');
const banco = require('./src/db');
const R = require('./src/regras');

const PORTA = Number(process.env.PORT) || 3000;
const db = banco.carregar();

const app = express();
app.use(express.json({ limit: '100kb' }));

// CORS simples (útil para testar pelo navegador/Expo Web; o app nativo não exige).
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// O app informa o "hoje" no fuso do usuário em todas as chamadas (?hoje=yyyy-mm-dd).
app.use((req, _res, next) => {
  req.hoje = R.resolverHoje(req.query.hoje);
  next();
});

// Toda resposta de sucesso devolve o estado completo atualizado ("dados"),
// já com resumo e estatísticas calculados aqui — o app só exibe.
function responder(req, res, status, extra = {}) {
  banco.salvar(db);
  res.status(status).json({ ...extra, dados: R.montarSnapshot(db, req.hoje) });
}
const corpo = (req) => req.body || {};

// ------------------------------------------------------------------ rotas
app.get('/api/saude', (_req, res) => res.json({ ok: true }));

app.get('/api/dados', (req, res) => res.json({ dados: R.montarSnapshot(db, req.hoje) }));

app.delete('/api/dados', (req, res) => {
  db.materias = [];
  db.sessoes = [];
  db.itensRevisao = [];
  db.avaliacoes = [];
  responder(req, res, 200);
});

// Matérias
app.post('/api/materias', (req, res) => {
  const v = R.validarMateria(corpo(req), db.materias);
  const materia = { id: R.gerarId('mat'), ...v, criadoEm: new Date().toISOString() };
  db.materias.unshift(materia);
  responder(req, res, 201, { materia });
});

app.put('/api/materias/:id', (req, res) => {
  const materia = R.exigirMateria(db, req.params.id);
  Object.assign(materia, R.validarMateria(corpo(req), db.materias, materia.id));
  responder(req, res, 200, { materia });
});

app.delete('/api/materias/:id', (req, res) => {
  R.exigirMateria(db, req.params.id);
  R.removerMateriaEmCascata(db, req.params.id);
  responder(req, res, 200);
});

// Itens de revisão
app.post('/api/itens-revisao', (req, res) => {
  const v = R.validarNovoItem(corpo(req), db);
  const item = {
    id: R.gerarId('rev'),
    materiaId: v.materiaId,
    tema: v.tema,
    dataAgendada: R.somarDias(req.hoje, v.dias),
    intervaloAtualDias: 1,
    fatorFacilidade: 2.5,
    repeticoes: 0,
    criadoEm: req.hoje,
  };
  db.itensRevisao.unshift(item);
  responder(req, res, 201, { item });
});

app.put('/api/itens-revisao/:id', (req, res) => {
  const item = db.itensRevisao.find((r) => r.id === req.params.id);
  if (!item) throw new R.ErroNegocio(404, 'Item de revisão não encontrado.');
  item.tema = R.validarTema(corpo(req).tema);
  responder(req, res, 200, { item });
});

app.delete('/api/itens-revisao/:id', (req, res) => {
  if (!db.itensRevisao.some((r) => r.id === req.params.id))
    throw new R.ErroNegocio(404, 'Item de revisão não encontrado.');
  R.removerItemEmCascata(db, req.params.id);
  responder(req, res, 200);
});

app.post('/api/itens-revisao/:id/avaliacao', (req, res) => {
  const item = R.avaliarItem(db, req.params.id, corpo(req).nivel, req.hoje);
  responder(req, res, 200, { item });
});

// Sessões Pomodoro
app.post('/api/sessoes', (req, res) => {
  const v = R.validarNovaSessao(corpo(req), db, req.hoje);
  const sessao = { id: R.gerarId('ses'), ...v };
  db.sessoes.unshift(sessao);
  responder(req, res, 201, { sessao });
});

// ------------------------------------------------------------- erros
app.use('/api', (_req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// eslint-disable-next-line no-unused-vars
app.use((erro, _req, res, _next) => {
  if (erro instanceof R.ErroNegocio) {
    return res.status(erro.status).json({ erro: erro.message, campos: erro.campos });
  }
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido na requisição.' });
  }
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

app.listen(PORTA, '0.0.0.0', () => {
  console.log(`FlowStudy API rodando na porta ${PORTA} (dados em ${banco.ARQUIVO})`);
  Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .forEach((i) => console.log(`  → no celular, use: http://${i.address}:${PORTA}`));
});
