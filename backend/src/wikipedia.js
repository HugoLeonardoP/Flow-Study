'use strict';
// Integração com a Wikipédia (serviço externo, sem chave de API).
// Docs: https://www.mediawiki.org/wiki/API:REST_API  e  https://www.mediawiki.org/wiki/API:Search
//
// Endpoints usados (todos GET, JSON):
//   1. {BASE}/api/rest_v1/page/summary/{titulo}   → resumo do artigo
//   2. {BASE}/w/api.php?action=query&list=search  → título mais próximo (se o título exato não existir)
const { ErroNegocio } = require('./regras');

const IDIOMA = process.env.WIKIPEDIA_LANG || 'pt';
const BASE_URL = (process.env.WIKIPEDIA_BASE_URL || `https://${IDIOMA}.wikipedia.org`).replace(/\/+$/, '');
// A Wikimedia exige um User-Agent que identifique o app (de preferência com um contato).
const USER_AGENT = process.env.WIKIPEDIA_USER_AGENT || 'FlowStudy/1.0 (projeto academico de estudos)';
const TEMPO_LIMITE_MS = Number(process.env.WIKIPEDIA_TIMEOUT_MS) || 4000;

const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX = 200;
const LIMITE_TEXTO = 1200;
const cache = new Map(); // termo (minúsculo) → { ate, resultado }

async function pedir(url) {
  let resposta;
  try {
    resposta = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
  } catch (erro) {
    const demorou = erro && (erro.name === 'TimeoutError' || erro.name === 'AbortError');
    // 504 = demorou (timeout); 502 = não foi possível alcançar o serviço externo.
    throw demorou
      ? new ErroNegocio(504, 'A Wikipédia demorou demais para responder. Tente novamente.')
      : new ErroNegocio(502, 'Não foi possível acessar a Wikipédia agora. Verifique a conexão do servidor e tente novamente.');
  }

  if (resposta.status === 404) return { status: 404, json: null };
  if (resposta.status === 429)
    throw new ErroNegocio(503, 'A Wikipédia limitou as consultas. Aguarde um instante e tente de novo.');
  if (!resposta.ok)
    throw new ErroNegocio(502, 'A Wikipédia está indisponível ou recusou a consulta. Tente mais tarde.');

  try {
    return { status: resposta.status, json: await resposta.json() };
  } catch {
    throw new ErroNegocio(502, 'A Wikipédia enviou uma resposta inválida. Tente novamente.');
  }
}

// Resumo de um artigo pelo título exato (redirecionamentos são seguidos). null se não existir.
async function resumoPorTitulo(titulo) {
  const caminho = encodeURIComponent(titulo.replace(/ /g, '_'));
  const { json } = await pedir(`${BASE_URL}/api/rest_v1/page/summary/${caminho}?redirect=true`);
  return json;
}

// Título do artigo mais relacionado ao termo (ex.: "Progressões Aritméticas" → "Progressão aritmética").
async function tituloMaisProximo(termo) {
  const url =
    `${BASE_URL}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}` +
    '&srlimit=1&srnamespace=0&format=json&formatversion=2&utf8=1';
  const { json } = await pedir(url);
  const primeiro = json && json.query && Array.isArray(json.query.search) ? json.query.search[0] : null;
  return primeiro && typeof primeiro.title === 'string' ? primeiro.title : null;
}

function cortar(texto) {
  return texto.length > LIMITE_TEXTO ? `${texto.slice(0, LIMITE_TEXTO).trimEnd()}…` : texto;
}

function urlDoArtigo(json) {
  const informada = json.content_urls && json.content_urls.desktop && json.content_urls.desktop.page;
  return informada || `${BASE_URL}/wiki/${encodeURIComponent(String(json.title).replace(/ /g, '_'))}`;
}

function montarResultado(json, buscaAproximada) {
  if (json.type === 'disambiguation') {
    // O termo tem vários significados: não há um resumo único para mostrar.
    return { encontrado: false, motivo: 'ambiguo', titulo: json.title, url: urlDoArtigo(json) };
  }
  const texto = typeof json.extract === 'string' ? json.extract.trim() : '';
  if (!json.title || !texto) return { encontrado: false, motivo: 'sem-resumo' };

  return {
    encontrado: true,
    titulo: json.title,
    descricao: typeof json.description === 'string' ? json.description : null,
    texto: cortar(texto),
    url: urlDoArtigo(json),
    buscaAproximada,
    idioma: json.lang || IDIOMA,
    fonte: 'Wikipédia',
    licenca: 'CC BY-SA 4.0',
  };
}

function guardarNoCache(chave, resultado) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(chave, { ate: Date.now() + CACHE_TTL_MS, resultado });
}

async function buscarResumo(temaBruto) {
  const tema = temaBruto.trim().replace(/\s+/g, ' ');
  const chave = tema.toLowerCase();

  const guardado = cache.get(chave);
  if (guardado && guardado.ate > Date.now()) return { tema, ...guardado.resultado };

  let json = await resumoPorTitulo(tema);
  let aproximada = false;

  if (!json) {
    const titulo = await tituloMaisProximo(tema);
    if (titulo) {
      json = await resumoPorTitulo(titulo);
      aproximada = titulo.toLowerCase() !== chave;
    }
  }

  const resultado = json ? montarResultado(json, aproximada) : { encontrado: false, motivo: 'nao-encontrado' };
  guardarNoCache(chave, resultado); // erros de rede lançam antes e nunca vão para o cache
  return { tema, ...resultado };
}

module.exports = { buscarResumo, BASE_URL };
