import { API_URL } from '@/config';
import { hojeISO } from '@/utils/datas';

const TEMPO_LIMITE_MS = 8000;

// Erro padronizado para qualquer falha de chamada ao backend.
export class ErroApi extends Error {
  status: number;
  semConexao: boolean;
  campos?: Record<string, string>;

  constructor(
    mensagem: string,
    opcoes: { status: number; semConexao?: boolean; campos?: Record<string, string> }
  ) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = opcoes.status;
    this.semConexao = opcoes.semConexao ?? false;
    this.campos = opcoes.campos;
  }
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ErroApi) {
    const primeiroCampo = erro.campos ? Object.values(erro.campos)[0] : undefined;
    return primeiroCampo ?? erro.message;
  }
  return 'Algo deu errado. Tente novamente.';
}

async function requisitar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  // O app informa o "hoje" no fuso do usuário; o servidor usa isso nas regras de data.
  const url = `${API_URL}/api${caminho}?hoje=${hojeISO()}`;
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);

  let resposta: Response;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: controle.signal,
    });
  } catch {
    throw new ErroApi(
      'Não foi possível conectar ao servidor. Verifique se o backend está rodando e se o celular está na mesma rede.',
      { status: 0, semConexao: true }
    );
  } finally {
    clearTimeout(timer);
  }

  let json: { erro?: string; campos?: Record<string, string> } | null = null;
  try {
    json = await resposta.json();
  } catch {
    /* resposta sem corpo JSON */
  }

  if (!resposta.ok) {
    throw new ErroApi(json?.erro ?? `Erro ${resposta.status} no servidor.`, {
      status: resposta.status,
      campos: json?.campos,
    });
  }
  return json as T;
}

export const api = {
  get: <T>(caminho: string) => requisitar<T>('GET', caminho),
  post: <T>(caminho: string, corpo?: unknown) => requisitar<T>('POST', caminho, corpo ?? {}),
  put: <T>(caminho: string, corpo: unknown) => requisitar<T>('PUT', caminho, corpo),
  del: <T>(caminho: string) => requisitar<T>('DELETE', caminho),
};
