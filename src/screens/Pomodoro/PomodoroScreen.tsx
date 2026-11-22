import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/AppNavigator';
import { TimerCircular } from '@/components/TimerCircular';
import { BotaoSecundario } from '@/components/BotaoSecundario';
import { colors, fontFamilies, spacing, type } from '@/theme';
import { DURACAO_MS, usePomodoroStore } from '@/store/usePomodoroStore';
import { useEstudosStore } from '@/store/useEstudosStore';

type Props = NativeStackScreenProps<HomeStackParamList, 'Pomodoro'>;

function formatarTempo(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function PomodoroScreen({ route, navigation }: Props) {
  const { width } = useWindowDimensions();
  const timerSize = Math.min(width - spacing.lg * 4, 280);

  // Estado do timer vem da store global (seletores: só re-renderiza o que mudou).
  const fase = usePomodoroStore((s) => s.fase);
  const materiaId = usePomodoroStore((s) => s.materiaId);
  const fimEm = usePomodoroStore((s) => s.fimEm);
  const restanteMs = usePomodoroStore((s) => s.restanteMs);
  const ciclosConcluidos = usePomodoroStore((s) => s.ciclosConcluidos);
  const preparar = usePomodoroStore((s) => s.preparar);
  const alternar = usePomodoroStore((s) => s.alternar);
  const pular = usePomodoroStore((s) => s.pular);
  const encerrar = usePomodoroStore((s) => s.encerrar);
  const materia = useEstudosStore((s) => s.dados.materias.find((m) => m.id === materiaId));

  // Ao abrir: prepara um ciclo de foco, a menos que já haja um em andamento.
  useEffect(() => {
    preparar(route.params?.materiaId ?? null);
  }, [preparar, route.params?.materiaId]);

  // Só um "relógio de tela" para redesenhar; o tempo em si vem de fimEm - Date.now().
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    if (fimEm === null) return;
    setAgora(Date.now());
    const timer = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(timer);
  }, [fimEm]);

  const tipo = fase === 'descanso' ? 'descanso' : 'foco';
  const duracao = DURACAO_MS[tipo];
  const restante = fimEm !== null ? Math.max(0, fimEm - agora) : restanteMs ?? duracao;
  const progresso = 1 - restante / duracao;
  const rodando = fimEm !== null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.conteudo}>
        <View style={styles.materiaWrap}>
          {materia ? (
            <>
              <View style={[styles.ponto, { backgroundColor: materia.cor }]} />
              <Text style={styles.materiaNome}>{materia.nome}</Text>
            </>
          ) : (
            <Text style={styles.materiaNome}>Sessão livre</Text>
          )}
        </View>

        <TimerCircular progresso={progresso} tempoLabel={formatarTempo(restante)} tipo={tipo} size={timerSize} />

        <View style={styles.ciclosWrap}>
          <Ionicons name="checkmark-done-outline" size={16} color={colors.inkFaint} />
          <Text style={styles.ciclosTexto}>
            {ciclosConcluidos} {ciclosConcluidos === 1 ? 'ciclo concluído' : 'ciclos concluídos'} nesta sessão
          </Text>
        </View>

        <View style={styles.controles}>
          <Pressable
            onPress={pular}
            accessibilityRole="button"
            accessibilityLabel="Pular ciclo"
            style={({ pressed }) => [styles.controleSecundario, pressed && styles.controleSecundarioPressed]}
          >
            <Ionicons name="play-skip-forward" size={22} color={colors.inkSoft} />
          </Pressable>

          <Pressable
            onPress={alternar}
            accessibilityRole="button"
            accessibilityLabel={rodando ? 'Pausar' : 'Iniciar'}
            style={({ pressed }) => [styles.controlePrincipal, pressed && styles.controlePrincipalPressed]}
          >
            <Ionicons name={rodando ? 'pause' : 'play'} size={30} color={colors.ink} />
          </Pressable>

          <View style={{ width: 48 }} />
        </View>

        <BotaoSecundario
          label="Encerrar sessão"
          tone="rust"
          onPress={() => {
            encerrar();
            navigation.goBack();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  conteudo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  materiaWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  materiaNome: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.subtitle.fontSize,
    color: colors.inkSoft,
  },
  ciclosWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ciclosTexto: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkFaint,
  },
  controles: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  controleSecundario: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controleSecundarioPressed: {
    backgroundColor: colors.border,
  },
  controlePrincipal: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlePrincipalPressed: {
    backgroundColor: colors.amberDark,
    transform: [{ scale: 0.96 }],
  },
});
