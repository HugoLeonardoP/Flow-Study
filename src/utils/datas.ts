// Utilitários de data. Todas as datas "só dia" do app (yyyy-mm-dd) usam o
// fuso LOCAL do aparelho — usar toISOString() aqui trocaria o dia após as
// 21h no Brasil (UTC-3), porque ele converte para UTC.

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatarDataISO(d: Date): string {
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

export function hojeISO(offsetDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return formatarDataISO(d);
}

/** Dia local (yyyy-mm-dd) de um instante ISO (com ou sem "Z"). */
export function diaLocalDe(instanteISO: string): string {
  return formatarDataISO(new Date(instanteISO));
}

/** Converte "yyyy-mm-dd" em Date à meia-noite LOCAL (new Date("yyyy-mm-dd") seria UTC). */
export function parseDataISO(dataISO: string): Date {
  return new Date(`${dataISO}T00:00:00`);
}

export function formatarDataCurta(dataISO: string): string {
  return parseDataISO(dataISO).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatarDataHora(instanteISO: string): string {
  const d = new Date(instanteISO);
  const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const hora = `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
  return `${dia}, ${hora}`;
}
