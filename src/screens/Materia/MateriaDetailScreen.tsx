import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/AppNavigator';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { Badge } from '@/components/Badge';
import { colors, fontFamilies, spacing, type, radius, shadow } from '@/theme';
import {
  getMateriaById,
  getHistoricoSessoes,
  getRevisoesDaMateria,
} from '@/mocks/data';
import { ItemRevisao, SessaoPomodoro } from '@/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'MateriaDetail'>;

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function MateriaDetailScreen({ route, navigation }: Props) {
  const { materiaId } = route.params;
  const materia = getMateriaById(materiaId);

  const [historico, setHistorico] = useState<SessaoPomodoro[]>([]);
  const [revisoes, setRevisoes] = useState<ItemRevisao[]>([]);

  useFocusEffect(
    useCallback(() => {
      setHistorico(getHistoricoSessoes(materiaId));
      setRevisoes(getRevisoesDaMateria(materiaId));
      navigation.setOptions({ title: materia?.nome ?? 'Matéria' });
    }, [materiaId])
  );

  if (!materia) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.vazio}>
          <Text style={styles.vazioTexto}>Matéria não encontrada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalMinutos = historico.reduce((acc, s) => acc + s.duracaoMin, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextos}>
            <View style={styles.categoriaRow}>
              <View style={[styles.ponto, { backgroundColor: materia.cor }]} />
              <Text style={styles.categoria}>{materia.categoria}</Text>
            </View>
            <Text style={styles.titulo}>{materia.nome}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('MateriaForm', { materiaId: materia.id })}
            style={styles.editarBotao}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.sage} />
          </Pressable>
        </View>

        <View style={styles.resumoRow}>
          <View style={[styles.resumoCard, shadow.card]}>
            <Text style={styles.resumoNumero}>{totalMinutos}min</Text>
            <Text style={styles.resumoLabel}>tempo total estudado</Text>
          </View>
          <View style={[styles.resumoCard, shadow.card]}>
            <Text style={styles.resumoNumero}>{revisoes.length}</Text>
            <Text style={styles.resumoLabel}>itens de revisão</Text>
          </View>
        </View>

        <BotaoPrimario
          label="Iniciar sessão Pomodoro"
          variant="amber"
          icon={<Ionicons name="play" size={18} color={colors.white} />}
          onPress={() => navigation.navigate('Pomodoro', { materiaId: materia.id })}
          style={styles.cta}
        />

        <Text style={styles.secaoTitulo}>Histórico de sessões</Text>
        {historico.length === 0 ? (
          <Text style={styles.listaVazia}>Nenhuma sessão registrada ainda.</Text>
        ) : (
          historico.map((s) => (
            <View key={s.id} style={styles.linhaHistorico}>
              <Ionicons name="flame-outline" size={16} color={colors.amberDark} />
              <Text style={styles.linhaHistoricoTexto}>
                {s.duracaoMin} min de foco · {formatarDataHora(s.inicio)}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.secaoTitulo}>Itens de revisão</Text>
        {revisoes.length === 0 ? (
          <Text style={styles.listaVazia}>Nenhum item de revisão associado.</Text>
        ) : (
          revisoes.map((r) => (
            <View key={r.id} style={[styles.itemRevisao, shadow.card]}>
              <Text style={styles.itemRevisaoTema} numberOfLines={1}>
                {r.tema}
              </Text>
              {r.concluidaHoje ? (
                <Badge label="Avaliado hoje" tone="sage" />
              ) : (
                <Badge label={formatarDataHora(r.dataAgendada)} tone="neutral" />
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  conteudo: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTextos: { flex: 1 },
  categoriaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  categoria: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.caption.fontSize,
    color: colors.inkFaint,
  },
  titulo: {
    fontFamily: fontFamilies.display,
    fontSize: type.display2.fontSize,
    color: colors.ink,
  },
  editarBotao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumoRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
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
  cta: { marginTop: spacing.lg, marginBottom: spacing.xl },
  secaoTitulo: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.subtitle.fontSize,
    color: colors.ink,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  listaVazia: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkFaint,
  },
  linhaHistorico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  linhaHistoricoTexto: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkSoft,
  },
  itemRevisao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  itemRevisaoTema: {
    flex: 1,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.bodySmall.fontSize,
    color: colors.ink,
    marginRight: spacing.sm,
  },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vazioTexto: {
    fontFamily: fontFamilies.body,
    color: colors.inkFaint,
  },
});
