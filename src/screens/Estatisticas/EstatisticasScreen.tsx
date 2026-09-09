import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { GraficoEstudo } from '@/components/GraficoEstudo';
import { colors, fontFamilies, spacing, type, radius, shadow } from '@/theme';
import { estatisticasSemanaMock, taxaAcertoRevisoesMock } from '@/mocks/data';

export function EstatisticasScreen() {
  const { width } = useWindowDimensions();
  const larguraPizza = Math.min(width - spacing.lg * 2 - spacing.md * 2, 520);

  const totalMinutosSemana = estatisticasSemanaMock.reduce((acc, d) => acc + d.minutosEstudados, 0);
  const totalAvaliacoes =
    taxaAcertoRevisoesMock.facil + taxaAcertoRevisoesMock.dificil + taxaAcertoRevisoesMock.naoLembrei;

  const dadosPizza = [
    {
      name: 'Fácil',
      value: taxaAcertoRevisoesMock.facil,
      color: colors.sage,
      legendFontColor: colors.inkSoft,
      legendFontSize: 12,
    },
    {
      name: 'Difícil',
      value: taxaAcertoRevisoesMock.dificil,
      color: colors.gold,
      legendFontColor: colors.inkSoft,
      legendFontSize: 12,
    },
    {
      name: 'Não lembrei',
      value: taxaAcertoRevisoesMock.naoLembrei,
      color: colors.rust,
      legendFontColor: colors.inkSoft,
      legendFontSize: 12,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.titulo}>Estatísticas</Text>
        <Text style={styles.subtitulo}>Um retrato de como o seu estudo tem evoluído.</Text>

        <View style={styles.resumoRow}>
          <View style={[styles.resumoCard, shadow.card]}>
            <Text style={styles.resumoNumero}>{totalMinutosSemana}min</Text>
            <Text style={styles.resumoLabel}>estudados nos últimos 7 dias</Text>
          </View>
          <View style={[styles.resumoCard, shadow.card]}>
            <Text style={styles.resumoNumero}>{totalAvaliacoes}</Text>
            <Text style={styles.resumoLabel}>revisões avaliadas</Text>
          </View>
        </View>

        <GraficoEstudo titulo="Tempo estudado por dia" dados={estatisticasSemanaMock} />

        <View style={[styles.card, shadow.card]}>
          <Text style={styles.cardTitulo}>Taxa de lembrança nas revisões</Text>
          <PieChart
            data={dadosPizza}
            width={larguraPizza}
            height={170}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="8"
            chartConfig={{ color: () => colors.ink }}
            hasLegend
          />
        </View>

        <View style={[styles.card, shadow.card]}>
          <Text style={styles.cardTitulo}>Histórico geral</Text>
          <Text style={styles.historicoTexto}>
            Nas últimas semanas, o tempo de foco tem se mantido consistente e a maior parte das
            revisões tem sido lembrada com facilidade — um bom sinal de que os intervalos de
            repetição espaçada estão funcionando para você.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  conteudo: { padding: spacing.lg, paddingBottom: spacing.xxl },
  titulo: {
    fontFamily: fontFamilies.display,
    fontSize: type.display2.fontSize,
    color: colors.ink,
  },
  subtitulo: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkFaint,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  resumoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  resumoCard: {
    flex: 1,
    backgroundColor: colors.paperRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  resumoNumero: {
    fontFamily: fontFamilies.display,
    fontSize: type.title.fontSize,
    color: colors.ink,
  },
  resumoLabel: {
    fontFamily: fontFamilies.body,
    fontSize: type.caption.fontSize,
    color: colors.inkFaint,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitulo: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.body.fontSize,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  historicoTexto: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkSoft,
    lineHeight: 20,
  },
});
