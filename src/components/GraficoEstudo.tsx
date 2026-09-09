import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { EstatisticaDia } from '@/types';
import { colors, fontFamilies, spacing, type, radius, shadow } from '@/theme';

interface Props {
  titulo: string;
  dados: EstatisticaDia[];
}

function diaCurto(dataISO: string): string {
  const d = new Date(`${dataISO}T00:00:00`);
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').slice(0, 3);
}

export function GraficoEstudo({ titulo, dados }: Props) {
  const { width } = useWindowDimensions();
  const largura = Math.min(width - spacing.lg * 2 - spacing.md * 2, 520);

  return (
    <View style={[styles.card, shadow.card]}>
      <Text style={styles.titulo}>{titulo}</Text>
      <BarChart
        data={{
          labels: dados.map((d) => diaCurto(d.data)),
          datasets: [{ data: dados.map((d) => d.minutosEstudados) }],
        }}
        width={largura}
        height={180}
        fromZero
        withInnerLines={false}
        yAxisLabel=""
        yAxisSuffix="m"
        chartConfig={{
          backgroundGradientFrom: colors.paperRaised,
          backgroundGradientTo: colors.paperRaised,
          decimalPlaces: 0,
          color: () => colors.sage,
          labelColor: () => colors.inkFaint,
          barPercentage: 0.55,
          propsForBackgroundLines: { stroke: colors.border },
          propsForLabels: { fontSize: 11 },
        }}
        style={{ borderRadius: radius.md, marginLeft: -spacing.md }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  titulo: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.body.fontSize,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
});
