import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { GraficoEstudo } from '@/components/GraficoEstudo';
import { BotaoSecundario } from '@/components/BotaoSecundario';
import { mensagemDeErro } from '@/services/api';
import { mostrarFeedback } from '@/services/feedback';
import { colors, fontFamilies, spacing, type, radius, shadow } from '@/theme';
import {
  useDados,
  getEstatisticasSemana,
  getTaxaLembranca,
  getTotaisArmazenados,
  limparTodosOsDados,
} from '@/services/dataService';

export function EstatisticasScreen() {
  // Re-renderiza sempre que os dados persistidos mudam.
  useDados();

  const { width } = useWindowDimensions();
  const larguraPizza = Math.min(width - spacing.lg * 2 - spacing.md * 2, 520);

  const semana = getEstatisticasSemana();
  const taxa = getTaxaLembranca();
  const totais = getTotaisArmazenados();
  const totalMinutosSemana = semana.reduce((acc, d) => acc + d.minutosEstudados, 0);

  const dadosPizza = [
    { name: 'Fácil', value: taxa.facil, color: colors.sage, legendFontColor: colors.inkSoft, legendFontSize: 12 },
    { name: 'Difícil', value: taxa.dificil, color: colors.gold, legendFontColor: colors.inkSoft, legendFontSize: 12 },
    { name: 'Não lembrei', value: taxa.naoLembrei, color: colors.rust, legendFontColor: colors.inkSoft, legendFontSize: 12 },
  ];

  function confirmarApagarTudo() {
    Alert.alert(
      'Apagar todos os dados?',
      'Todas as matérias, sessões, itens de revisão e avaliações serão removidos do servidor. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              await limparTodosOsDados();
              mostrarFeedback('Todos os dados foram apagados.');
            } catch (erro) {
              mostrarFeedback(mensagemDeErro(erro), 'erro');
            }
          },
        },
      ]
    );
  }

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
            <Text style={styles.resumoNumero}>{taxa.total}</Text>
            <Text style={styles.resumoLabel}>revisões avaliadas</Text>
          </View>
        </View>

        {totalMinutosSemana > 0 ? (
          <GraficoEstudo titulo="Tempo estudado por dia" dados={semana} />
        ) : (
          <View style={[styles.card, shadow.card]}>
            <Text style={styles.cardTitulo}>Tempo estudado por dia</Text>
            <Text style={styles.vazioTexto}>
              Nenhuma sessão de foco concluída nos últimos 7 dias. Conclua um ciclo do Pomodoro para ver o gráfico.
            </Text>
          </View>
        )}

        <View style={[styles.card, shadow.card]}>
          <Text style={styles.cardTitulo}>Taxa de lembrança nas revisões</Text>
          {taxa.total > 0 ? (
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
          ) : (
            <Text style={styles.vazioTexto}>
              Ainda não há revisões avaliadas. Avalie um item na aba Revisões para ver a distribuição aqui.
            </Text>
          )}
        </View>

        <View style={[styles.card, shadow.card]}>
          <Text style={styles.cardTitulo}>Dados armazenados no servidor</Text>
          <View style={styles.totaisLinha}>
            <Text style={styles.totaisRotulo}>Matérias</Text>
            <Text style={styles.totaisValor}>{totais.materias}</Text>
          </View>
          <View style={styles.totaisLinha}>
            <Text style={styles.totaisRotulo}>Sessões de foco concluídas</Text>
            <Text style={styles.totaisValor}>{totais.sessoesFoco}</Text>
          </View>
          <View style={styles.totaisLinha}>
            <Text style={styles.totaisRotulo}>Tempo total de foco</Text>
            <Text style={styles.totaisValor}>{totais.minutosFoco} min</Text>
          </View>
          <View style={styles.totaisLinha}>
            <Text style={styles.totaisRotulo}>Itens de revisão</Text>
            <Text style={styles.totaisValor}>{totais.itensRevisao}</Text>
          </View>
          <View style={styles.totaisLinha}>
            <Text style={styles.totaisRotulo}>Autoavaliações registradas</Text>
            <Text style={styles.totaisValor}>{totais.avaliacoes}</Text>
          </View>
          <BotaoSecundario
            label="Apagar todos os dados"
            tone="rust"
            onPress={confirmarApagarTudo}
            style={styles.apagarTudo}
          />
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
  vazioTexto: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  totaisLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  totaisRotulo: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkSoft,
  },
  totaisValor: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.bodySmall.fontSize,
    color: colors.ink,
  },
  apagarTudo: { marginTop: spacing.md },
  historicoTexto: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkSoft,
    lineHeight: 20,
  },
});
