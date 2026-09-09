import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/AppNavigator';
import { TimerCircular } from '@/components/TimerCircular';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { BotaoSecundario } from '@/components/BotaoSecundario';
import { colors, fontFamilies, spacing, type } from '@/theme';
import { getMateriaById, registrarSessaoConcluida } from '@/mocks/data';
import { TipoCiclo } from '@/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Pomodoro'>;

const DURACAO_FOCO_SEG = 25 * 60;
const DURACAO_DESCANSO_SEG = 5 * 60;

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(segundos % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export function PomodoroScreen({ route, navigation }: Props) {
  const materiaId = route.params?.materiaId;
  const materia = getMateriaById(materiaId);
  const { width } = useWindowDimensions();
  const timerSize = Math.min(width - spacing.lg * 4, 280);

  const [tipo, setTipo] = useState<TipoCiclo>('foco');
  const [restanteSeg, setRestanteSeg] = useState(DURACAO_FOCO_SEG);
  const [rodando, setRodando] = useState(false);
  const [ciclosConcluidos, setCiclosConcluidos] = useState(0);

  const duracaoTotal = tipo === 'foco' ? DURACAO_FOCO_SEG : DURACAO_DESCANSO_SEG;
  const progresso = 1 - restanteSeg / duracaoTotal;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (rodando) {
      intervalRef.current = setInterval(() => {
        setRestanteSeg((atual) => {
          if (atual <= 1) {
            finalizarCiclo();
            return 0;
          }
          return atual - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodando, tipo]);

  function finalizarCiclo() {
    setRodando(false);

    registrarSessaoConcluida({
      id: `ses-${Date.now()}`,
      materiaId: materiaId ?? null,
      inicio: new Date().toISOString(),
      duracaoMin: duracaoTotal / 60,
      tipo,
      concluida: true,
    });

    if (tipo === 'foco') {
      setCiclosConcluidos((c) => c + 1);
      Alert.alert('Ciclo de foco concluído!', 'Hora de descansar um pouco.', [
        {
          text: 'Iniciar descanso',
          onPress: () => {
            setTipo('descanso');
            setRestanteSeg(DURACAO_DESCANSO_SEG);
            setRodando(true);
          },
        },
      ]);
    } else {
      Alert.alert('Descanso concluído', 'O que você quer fazer agora?', [
        {
          text: 'Novo ciclo de foco',
          onPress: () => {
            setTipo('foco');
            setRestanteSeg(DURACAO_FOCO_SEG);
            setRodando(true);
          },
        },
        {
          text: 'Voltar para a Home',
          style: 'cancel',
          onPress: () => navigation.navigate('HomeMain'),
        },
      ]);
    }
  }

  function alternarPlayPausa() {
    setRodando((r) => !r);
  }

  function pularCiclo() {
    setRodando(false);
    if (tipo === 'foco') {
      setTipo('descanso');
      setRestanteSeg(DURACAO_DESCANSO_SEG);
    } else {
      setTipo('foco');
      setRestanteSeg(DURACAO_FOCO_SEG);
    }
  }

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

        <TimerCircular progresso={progresso} tempoLabel={formatarTempo(restanteSeg)} tipo={tipo} size={timerSize} />

        <View style={styles.ciclosWrap}>
          <Ionicons name="checkmark-done-outline" size={16} color={colors.inkFaint} />
          <Text style={styles.ciclosTexto}>
            {ciclosConcluidos} {ciclosConcluidos === 1 ? 'ciclo concluído' : 'ciclos concluídos'} nesta sessão
          </Text>
        </View>

        <View style={styles.controles}>
          <Pressable onPress={pularCiclo} style={styles.controleSecundario}>
            <Ionicons name="play-skip-forward" size={22} color={colors.inkSoft} />
          </Pressable>

          <Pressable onPress={alternarPlayPausa} style={styles.controlePrincipal}>
            <Ionicons name={rodando ? 'pause' : 'play'} size={30} color={colors.white} />
          </Pressable>

          <View style={{ width: 48 }} />
        </View>

        <BotaoSecundario label="Encerrar sessão" tone="rust" onPress={() => navigation.navigate('HomeMain')} />
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
  controlePrincipal: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
