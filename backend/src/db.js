'use strict';
// Persistência do backend: um arquivo JSON (data/db.json), gravado de forma
// atômica (escreve num temporário e renomeia). Suficiente para uma primeira
// versão com um único usuário; trocar por SQLite/Postgres só exige mudar este arquivo.
const fs = require('fs');
const path = require('path');
const { gerarSeed } = require('./seed');

const ARQUIVO = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');

function salvar(db) {
  fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
  const temporario = `${ARQUIVO}.tmp`;
  fs.writeFileSync(temporario, JSON.stringify(db, null, 2));
  fs.renameSync(temporario, ARQUIVO);
}

function carregar() {
  if (!fs.existsSync(ARQUIVO)) {
    const inicial = gerarSeed();
    salvar(inicial);
    return inicial;
  }
  // Se o JSON estiver corrompido, falha em voz alta em vez de sobrescrever os dados.
  const bruto = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
  return {
    materias: Array.isArray(bruto.materias) ? bruto.materias : [],
    sessoes: Array.isArray(bruto.sessoes) ? bruto.sessoes : [],
    itensRevisao: Array.isArray(bruto.itensRevisao) ? bruto.itensRevisao : [],
    avaliacoes: Array.isArray(bruto.avaliacoes) ? bruto.avaliacoes : [],
  };
}

module.exports = { carregar, salvar, ARQUIVO };
