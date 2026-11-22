import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePomodoroStore } from '@/store/usePomodoroStore';
import { revisoesPorDia, useEstudosStore } from '@/store/useEstudosStore';
import { reagendarLembretesDeRevisao } from '@/services/notificacoes';
import { hojeISO } from '@/utils/datas';

// Montado uma vez em App.tsx (não desenha nada). Mantém funcionando, de qualquer tela:
//  1. o fim do ciclo do Pomodoro (e a volta do app ao primeiro plano);
//  2. os lembretes de revisão, reagendados sempre que as revisões mudam.
export function ServicosGlobais() {
  const fimEm = usePomodoroStore((s) => s.fimEm);
  const finalizarCiclo = usePomodoroStore((s) => s.finalizarCiclo);
  const itensRevisao = useEstudosStore((s) => s.dados.itensRevisao);

  useEffect(() => {
    if (fimEm === null) return;
    const verificar = () => {
      if (Date.now() >= fimEm) finalizarCiclo();
    };
    const timer = setInterval(verificar, 1000);
    const assinatura = AppState.addEventListener('change', (s) => {
      if (s === 'active') verificar();
    });
    verificar();
    return () => {
      clearInterval(timer);
      assinatura.remove();
    };
  }, [fimEm, finalizarCiclo]);

  useEffect(() => {
    const timer = setTimeout(() => void reagendarLembretesDeRevisao(revisoesPorDia(itensRevisao, hojeISO())), 800);
    return () => clearTimeout(timer);
  }, [itensRevisao]);

  return null;
}
