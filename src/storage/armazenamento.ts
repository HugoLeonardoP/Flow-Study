import AsyncStorage from '@react-native-async-storage/async-storage';

// Camada mais baixa da persistência: só sabe ler/gravar JSON no AsyncStorage.
// Cada coleção do app fica em uma chave própria (equivalente a uma "tabela").
export const CHAVES = {
  meta: '@flowstudy/meta',
  materias: '@flowstudy/materias',
  sessoes: '@flowstudy/sessoes',
  itensRevisao: '@flowstudy/itens-revisao',
  avaliacoes: '@flowstudy/avaliacoes',
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
