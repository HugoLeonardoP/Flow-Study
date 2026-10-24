import { useSyncExternalStore } from 'react';

// Mensagens rápidas ("toast") para confirmar o resultado de uma operação.
// Qualquer tela chama `mostrarFeedback(...)`; o <FeedbackHost /> (em App.tsx) exibe.
export type TipoFeedback = 'sucesso' | 'erro' | 'info';

export interface MensagemFeedback {
  id: number;
  texto: string;
  tipo: TipoFeedback;
}

let atual: MensagemFeedback | null = null;
let contador = 0;
const ouvintes = new Set<() => void>();

function inscrever(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function notificar() {
  ouvintes.forEach((o) => o());
}

export function mostrarFeedback(texto: string, tipo: TipoFeedback = 'sucesso') {
  contador += 1;
  atual = { id: contador, texto, tipo };
  notificar();
}

export function limparFeedback(id: number) {
  if (atual?.id === id) {
    atual = null;
    notificar();
  }
}

export function useFeedbackAtual(): MensagemFeedback | null {
  return useSyncExternalStore(inscrever, () => atual);
}
