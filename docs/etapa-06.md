# FlowStudy — Etapa 06: Integração com Serviço Externo (Wikipédia)

O app passou a mostrar o **resumo de um tema de revisão** usando a API pública da
**Wikipédia**. A chamada é feita pelo **backend** (e não direto pelo celular), mantendo a
divisão de responsabilidades da etapa 05.

---

## 1. API/serviço utilizado

| Item | Valor |
|---|---|
| Serviço | **Wikipédia (Wikimedia)** — API REST + API de busca do MediaWiki |
| Tipo | API pública, HTTPS, JSON, **sem chave/credencial** |
| Uso no app | Resumo (parágrafo inicial) do artigo correspondente ao tema do item de revisão |
| Termos de uso | Identificar o app com um `User-Agent` descritivo; uso moderado; o conteúdo é **CC BY-SA 4.0** (o app exibe a fonte e o link do artigo) |
| Quem chama | O **backend** (`backend/src/wikipedia.js`); o app chama apenas o próprio backend |

---

## 2. Endereços (base URL)

| Serviço | Base URL |
|---|---|
| Wikipédia (padrão) | `https://pt.wikipedia.org` — o idioma muda com `WIKIPEDIA_LANG` (ex.: `en`, `es`) |
| Backend do FlowStudy | `http://SEU_IP:3000/api` (o app descobre o IP sozinho; ver `etapa-05.md`) |

---

## 3. Endpoints utilizados e métodos HTTP

**Serviço externo (Wikipédia) — chamados pelo backend**

| # | Método | Endpoint | Para quê |
|---|---|---|---|
| E1 | `GET` | `{BASE}/api/rest_v1/page/summary/{titulo}?redirect=true` | Resumo do artigo pelo título (redirecionamentos seguidos) |
| E2 | `GET` | `{BASE}/w/api.php?action=query&list=search&srsearch={termo}&srlimit=1&srnamespace=0&format=json&formatversion=2&utf8=1` | Achar o título mais próximo quando o título exato não existe |

**API do FlowStudy — chamadas pelo app**

| Operação | Método | Endpoint | Tipo |
|---|---|---|---|
| Buscar resumo do tema | `GET` | `/api/resumo?tema={tema}` | **Consulta** (usa E1/E2) |
| Salvar / remover o resumo no item | `PUT` | `/api/itens-revisao/:id/resumo` | **Atualização** |
| Criar item de revisão (tema) | `POST` | `/api/itens-revisao` | **Envio** (etapa 05) |

---

## 4. Estrutura dos dados

**Resposta da Wikipédia (E1)** — campos usados: `type`, `title`, `description`, `extract`, `lang`, `content_urls.desktop.page`.
Resposta da busca (E2): `query.search[0].title`.

**`GET /api/resumo?tema=Era Vargas`** → `200`

```json
{
  "tema": "Era Vargas",
  "encontrado": true,
  "titulo": "Era Vargas",
  "descricao": "período da história do Brasil",
  "texto": "Parágrafo inicial do artigo (máx. 1200 caracteres)…",
  "url": "https://pt.wikipedia.org/wiki/Era_Vargas",
  "buscaAproximada": false,
  "idioma": "pt",
  "fonte": "Wikipédia",
  "licenca": "CC BY-SA 4.0"
}
```

Ausência de dados (também `200`, `encontrado: false`):

```json
{ "tema": "Xyzxyz", "encontrado": false, "motivo": "nao-encontrado" }
```

`motivo`: `nao-encontrado` · `ambiguo` (vários significados; inclui `titulo` e `url`) · `sem-resumo`.
`buscaAproximada: true` indica que o artigo veio da busca (E2), não do título exato.

**`PUT /api/itens-revisao/{id}/resumo`** — corpo enviado:

```json
{ "resumo": { "titulo": "Era Vargas", "texto": "…", "url": "https://pt.wikipedia.org/wiki/Era_Vargas" } }
```

Para **remover**: `{ "resumo": null }`. Resposta `200`: `{ "item": { …, "resumo": { "titulo", "texto", "url", "fonte", "salvoEm" } }, "dados": { …estado atualizado } }`.
Validação: título 1–150, texto 1–1500, `url` obrigatoriamente `https://*.wikipedia.org/…`.

**Erros** (`{ "erro": "mensagem", "campos": { … } }`):

| Situação | HTTP |
|---|---|
| Tema com menos de 2 ou mais de 80 caracteres | `400` (+ `campos.tema`) |
| Resumo inválido / URL que não é da Wikipédia | `400` (+ `campos`) |
| Item de revisão inexistente | `404` |
| Wikipédia limitou as consultas (`429`) | `503` |
| Wikipédia fora do ar / resposta inválida | `502` |
| Servidor sem acesso à Wikipédia | `502` |
| Wikipédia demorou mais que o limite | `504` |

---

## 5. Fluxo de comunicação

```
App (celular)                 Backend (Node)                    Wikipédia
     │  GET /api/resumo?tema=…     │                                │
     │ ───────────────────────────▶│  valida o tema (2–80)          │
     │                             │  cache (30 min)? → responde    │
     │                             │  GET …/page/summary/{tema} ───▶│ (E1)
     │                             │◀──────────────── 200 ou 404 ───│
     │                             │  se 404: GET …list=search ────▶│ (E2)
     │                             │  → GET …/page/summary/{achado} │ (E1)
     │◀── JSON do resumo / erro ───│  guarda no cache, monta resposta
     │  (usuário toca "Salvar")    │
     │  PUT …/itens-revisao/:id/resumo ─▶ valida, grava no db.json e devolve o estado
```

1. No Detalhe da matéria, o usuário toca em um item de revisão; o modal mostra o bloco **Resumo na Wikipédia**, com o campo "Termo de busca" já preenchido com o tema (pode ser ajustado sem renomear o item).
2. **Buscar resumo** → `GET /api/resumo` (limite de 15 s no app).
3. O backend tenta o título exato (E1). Se não existir, busca o título mais próximo (E2) e pede o resumo dele (E1), marcando `buscaAproximada`.
4. O app exibe o resultado. **Salvar no item** envia `PUT`; o resumo passa a ficar guardado no item (e aparece mesmo sem nova consulta, com um ícone de livro na lista).
5. Respostas de sucesso/ausência ficam em cache no backend por 30 min (erros nunca são guardados).

---

## 6. Tratamento dos estados

Componente: `src/components/ResumoWikipedia.tsx`. O botão de busca fica oculto durante o carregamento (evita pedidos duplicados) e respostas antigas são ignoradas.

| Estado | Quando ocorre | O que o usuário vê |
|---|---|---|
| **Carregando** | Do toque em "Buscar resumo" até a resposta | Indicador de progresso + "Consultando a Wikipédia…" |
| **Sucesso (consulta)** | `encontrado: true` | Cartão com título, descrição, texto, aviso de "resultado mais próximo" (se aproximado), fonte/licença e link "Ler artigo completo"; botão **Salvar no item** (ou "Substituir resumo salvo") |
| **Sucesso (salvar)** | `PUT` concluído | Aviso "Resumo salvo no item." e o resumo salvo passa a aparecer no bloco |
| **Ausência de dados** | `encontrado: false` (não é erro) | Mensagem neutra: "Não encontramos um artigo… Tente outro termo." / "tem vários significados…" (com link "Ver opções na Wikipédia") / "não tem um resumo disponível" |
| **Erro** | Rede, timeout, `4xx/5xx` | Mensagem em vermelho (ex.: "A Wikipédia demorou demais…", "Não foi possível conectar ao servidor…") e botão **Tentar novamente** |
| **Validação** | Termo com menos de 2 caracteres | "Digite pelo menos 2 caracteres para buscar." (sem chamar a rede) |

As mensagens de estado são anunciadas por leitores de tela (`accessibilityLiveRegion`), os botões têm rótulos e os alvos de toque têm ≥ 44 px.

---

## 7. Como executar e testar a integração

**Executar** (veja também o `README.md`)

```bash
# terminal 1 — backend (precisa de INTERNET para consultar a Wikipédia)
cd backend
npm install
npm start

# terminal 2 — app
npx expo start -c
```

**Testar pelo app:** Matérias → *História do Brasil* → toque no item **Era Vargas** → **Buscar resumo**.

| Teste | Como | Resultado esperado |
|---|---|---|
| Sucesso | Termo `Era Vargas` | Cartão com o resumo e o link do artigo |
| Busca aproximada | Termo `Progressões Aritméticas` | Resultado "Progressão aritmética" com o aviso de resultado mais próximo |
| Ambiguidade | Termo `Mercúrio` | Mensagem de "vários significados" (pode variar conforme a Wikipédia) |
| Ausência | Termo `asdfghjkl` | Mensagem "Não encontramos um artigo…" |
| Validação | Termo `a` | Mensagem local de 2 caracteres, sem chamada de rede |
| Atualização | **Salvar no item**, feche o modal e reabra o item | O resumo salvo aparece sem nova consulta; ícone de livro na lista |
| Remoção | **Remover resumo salvo** | Aviso "Resumo removido do item." |
| Erro (servidor) | Pare o backend e busque | "Não foi possível conectar ao servidor…" + **Tentar novamente** |
| Erro (Wikipédia) | Reinicie o backend com `WIKIPEDIA_BASE_URL=http://localhost:9` | "Não foi possível acessar a Wikipédia agora…" (`502`) |

**Testar só o backend** (sem o app):

```bash
curl "http://localhost:3000/api/resumo?tema=Era%20Vargas"
curl -X PUT "http://localhost:3000/api/itens-revisao/rev-2/resumo" \
  -H "Content-Type: application/json" \
  -d '{"resumo":{"titulo":"Era Vargas","texto":"Teste","url":"https://pt.wikipedia.org/wiki/Era_Vargas"}}'
```

(No PowerShell use `curl.exe`, ou `Invoke-RestMethod`.)

**O que foi verificado nesta entrega:** o ambiente onde o código foi desenvolvido não tem acesso à Wikipédia, então os testes automatizados usaram um **servidor de Wikipédia simulado** que imita o formato documentado das respostas (sucesso, 404 + busca, ambíguo, sem extrato, `429`, `500`, resposta inválida, timeout e serviço inacessível), além do backend e da camada de dados do app reais. O type-check e o empacotamento Android do app passam. **A consulta à Wikipédia real deve ser validada por você** com o roteiro acima; se o formato de alguma resposta real divergir, o backend trata como "sem resumo" ou como erro (`502`) em vez de quebrar.

---

## 8. Configuração do serviço

A Wikipédia **não exige chave, token nem login**. Nada sensível é necessário.

| Variável (backend, opcional) | Padrão | Função |
|---|---|---|
| `WIKIPEDIA_LANG` | `pt` | Idioma da Wikipédia consultada |
| `WIKIPEDIA_USER_AGENT` | `FlowStudy/1.0 (projeto academico de estudos)` | Identifica o app para a Wikimedia; recomenda-se incluir um contato **seu** |
| `WIKIPEDIA_TIMEOUT_MS` | `4000` | Tempo máximo de cada chamada à Wikipédia |
| `WIKIPEDIA_BASE_URL` | `https://{lang}.wikipedia.org` | Sobrescreve a URL base (útil para testes) |

Como definir: copie `backend/.env.example` para `backend/.env`, edite e rode `npm run start:env` (Node 20.6+); ou, no PowerShell, `$env:WIKIPEDIA_USER_AGENT="FlowStudy/1.0 (seu-email)"; npm start`.
O `.env` está no `.gitignore` — **não versione** o seu. No app não há configuração nova.

---

## 9. Limitações

- O backend precisa de acesso à internet; sem ele, a consulta falha com mensagem clara (o restante do app continua funcionando).
- O cache (30 min) fica na memória e some ao reiniciar o backend; o texto é limitado a 1200 caracteres.
- A busca aproximada pode trazer um artigo diferente do esperado — por isso o app avisa "resultado mais próximo" e mostra o título encontrado antes de salvar.
- Um idioma por vez (o configurado no backend). Respeite os limites de uso da Wikimedia.
