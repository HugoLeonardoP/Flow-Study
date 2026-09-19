import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fontFamilies, type } from '@/theme';
import { TipoCiclo } from '@/types';

interface Props {
  progresso: number; // 0 a 1 — quanto do ciclo já passou
  tempoLabel: string; // "12:34"
  tipo: TipoCiclo;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function TimerCircular({ progresso, tempoLabel, tipo, size = 260 }: Props) {
  const strokeWidth = 14;
  const radiusPx = (size - strokeWidth) / 2;
  const circunferencia = 2 * Math.PI * radiusPx;
  const anim = useRef(new Animated.Value(progresso)).current;

  const corAtiva = tipo === 'foco' ? colors.amber : colors.sky;
  const corTrilha = tipo === 'foco' ? colors.amberSoft : colors.skySoft;
  const corTexto = tipo === 'foco' ? colors.amberDark : colors.skyDark;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progresso,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progresso]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circunferencia, 0],
  });

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${tempoLabel} restantes, ${tipo === 'foco' ? 'tempo de foco' : 'tempo de descanso'}`}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusPx}
          stroke={corTrilha}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radiusPx}
          stroke={corAtiva}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circunferencia}, ${circunferencia}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.centro}>
        <Text style={styles.tempo}>{tempoLabel}</Text>
        <Text style={[styles.rotulo, { color: corTexto }]}>
          {tipo === 'foco' ? 'Tempo de foco' : 'Tempo de descanso'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    position: 'absolute',
    alignItems: 'center',
  },
  tempo: {
    fontFamily: fontFamilies.display,
    fontSize: type.display1.fontSize,
    color: colors.ink,
  },
  rotulo: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.caption.fontSize,
    letterSpacing: 0.4,
    marginTop: 4,
  },
});
