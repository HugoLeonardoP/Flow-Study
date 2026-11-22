import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamilies, radius, spacing, type } from '@/theme';
import { usePomodoroStore } from '@/store/usePomodoroStore';
import { useEstudosStore } from '@/store/useEstudosStore';

function formatar(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// Faixa da Home que mostra o ciclo em andamento (lê o mesmo estado da tela de Pomodoro).
export function PomodoroEmAndamento({ onPress }: { onPress: (materiaId: string | null) => void }) {
  const fimEm = usePomodoroStore((s) => s.fimEm);
  const fase = usePomodoroStore((s) => s.fase);
  const materiaId = usePomodoroStore((s) => s.materiaId);
  const nomeMateria = useEstudosStore((s) => s.dados.materias.find((m) => m.id === materiaId)?.nome);
  const [agora, setAgora] = useState(Date.now());

  useEffect(() => {
    if (fimEm === null) return;
    setAgora(Date.now());
    const timer = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [fimEm]);

  if (fimEm === null) return null;

  const rotulo = `${fase === 'descanso' ? 'Descanso' : 'Foco'} em andamento · ${formatar(fimEm - agora)}`;
  return (
    <Pressable
      onPress={() => onPress(materiaId)}
      accessibilityRole="button"
      accessibilityLabel={`${rotulo}. Toque para abrir o timer.`}
      style={({ pressed }) => [styles.faixa, pressed && { opacity: 0.85 }]}
    >
      <Ionicons name="timer-outline" size={20} color={colors.ink} />
      <Text style={styles.texto} numberOfLines={1}>
        {rotulo}
        {nomeMateria ? ` · ${nomeMateria}` : ''}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.amberSoft,
  },
  texto: {
    flex: 1,
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.bodySmall.fontSize,
    color: colors.ink,
  },
});
