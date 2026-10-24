import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache local: guarda a última cópia dos dados recebida do servidor, para o app
// abrir já com dados (e funcionar em modo leitura) quando estiver sem conexão.
// A fonte da verdade dos dados é o backend.
export const CHAVES = {
  cache: '@flowstudy/cache-v2',
} as const;

export async function lerJSON<T>(chave: string): Promise<T | null> {
  const bruto = await AsyncStorage.getItem(chave);
  if (bruto === null) return null;
  try {
    return JSON.parse(bruto) as T;
  } catch {
    console.warn(`[FlowStudy] JSON inválido na chave ${chave}; ignorando conteúdo.`);
    return null;
  }
}

export async function salvarJSON(chave: string, valor: unknown): Promise<void> {
  await AsyncStorage.setItem(chave, JSON.stringify(valor));
}
