import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/AppNavigator';
import { CardMateria } from '@/components/CardMateria';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { colors, fontFamilies, spacing, type, radius, shadow } from '@/theme';
import { materiasMock, getResumoDoDia } from '@/mocks/data';
import { Materia, ResumoDia } from '@/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

export function HomeScreen({ navigation }: Props) {
  const [materias, setMaterias] = useState<Materia[]>(materiasMock);
  const [resumo, setResumo] = useState<ResumoDia>(getResumoDoDia());

  useFocusEffect(
    useCallback(() => {
      setMaterias([...materiasMock]);
      setResumo(getResumoDoDia());
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={materias}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <>
            <View style={styles.saudacaoWrap}>
              <Text style={styles.saudacaoEyebrow}>Bem-vindo de volta</Text>
              <Text style={styles.saudacao}>Vamos manter o ritmo hoje?</Text>
            </View>

            <View style={styles.resumoRow}>
              <View style={[styles.resumoCard, shadow.card]}>
                <Ionicons name="time-outline" size={20} color={colors.sage} />
                <Text style={styles.resumoNumero}>{resumo.minutosEstudadosHoje}min</Text>
                <Text style={styles.resumoLabel}>estudados hoje</Text>
              </View>
              <View style={[styles.resumoCard, shadow.card]}>
                <Ionicons name="repeat-outline" size={20} color={colors.rust} />
                <Text style={styles.resumoNumero}>{resumo.revisoesPendentesHoje}</Text>
                <Text style={styles.resumoLabel}>revisões pendentes</Text>
              </View>
            </View>

            <BotaoPrimario
              label="Iniciar sessão Pomodoro"
              variant="amber"
              onPress={() => navigation.navigate('Pomodoro', undefined)}
              icon={<Ionicons name="play" size={18} color={colors.white} />}
              style={styles.cta}
            />

            <View style={styles.secaoHeader}>
              <Text style={styles.secaoTitulo}>Suas matérias</Text>
              <Pressable
                onPress={() => navigation.navigate('MateriaForm', undefined)}
                hitSlop={8}
                style={styles.addBotao}
              >
                <Ionicons name="add" size={18} color={colors.sage} />
                <Text style={styles.addLabel}>Nova</Text>
              </Pressable>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <CardMateria
            materia={item}
            onPress={() => navigation.navigate('MateriaDetail', { materiaId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="book-outline" size={28} color={colors.inkFaint} />
            <Text style={styles.vazioTexto}>Cadastre sua primeira matéria para começar.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  lista: { padding: spacing.lg, paddingBottom: spacing.xxl },
  saudacaoWrap: { marginBottom: spacing.lg },
  saudacaoEyebrow: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.bodySmall.fontSize,
    color: colors.sage,
    marginBottom: 2,
  },
  saudacao: {
    fontFamily: fontFamilies.display,
    fontSize: type.display2.fontSize,
    color: colors.ink,
  },
  resumoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
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
    marginTop: spacing.xs,
  },
  resumoLabel: {
    fontFamily: fontFamilies.body,
    fontSize: type.caption.fontSize,
    color: colors.inkFaint,
    marginTop: 2,
  },
  cta: { marginBottom: spacing.xl },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  secaoTitulo: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.subtitle.fontSize,
    color: colors.ink,
  },
  addBotao: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.bodySmall.fontSize,
    color: colors.sage,
  },
  vazio: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  vazioTexto: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkFaint,
    textAlign: 'center',
  },
});
