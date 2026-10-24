import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ItemRevisaoCard } from '@/components/ItemRevisaoCard';
import { AvisoConexao } from '@/components/AvisoConexao';
import { mensagemDeErro } from '@/services/api';
import { mostrarFeedback } from '@/services/feedback';
import { formatarDataCurta } from '@/utils/datas';
import { colors, fontFamilies, spacing, type } from '@/theme';
import { useDados, getRevisoesDoDia, avaliarItemRevisao, getMateriaById } from '@/services/dataService';
import { NivelLembranca } from '@/types';

export function RevisaoScreen() {
  // Re-renderiza sempre que os dados persistidos mudam (inclusive após avaliar).
  useDados();
  const itens = getRevisoesDoDia();

  // O servidor registra a avaliação e decide a próxima data; o app mostra o resultado.
  async function handleAvaliar(id: string, nivel: NivelLembranca) {
    try {
      const item = await avaliarItemRevisao(id, nivel);
      mostrarFeedback(`Revisão registrada. Próxima revisão: ${formatarDataCurta(item.dataAgendada)}.`);
    } catch (erro) {
      mostrarFeedback(mensagemDeErro(erro), 'erro');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Revisões do dia</Text>
        <Text style={styles.subtitulo}>
          {itens.length === 0
            ? 'Tudo em dia por aqui.'
            : `${itens.length} ${itens.length === 1 ? 'item pendente' : 'itens pendentes'}`}
        </Text>
      </View>

      <FlatList
        data={itens}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={<AvisoConexao />}
        renderItem={({ item }) => (
          <ItemRevisaoCard item={item} materia={getMateriaById(item.materiaId)} onAvaliar={handleAvaliar} />
        )}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.sage} />
            <Text style={styles.vazioTitulo}>Nenhuma revisão pendente</Text>
            <Text style={styles.vazioTexto}>
              Quando você estudar novos temas, eles aparecerão aqui na data certa para revisar.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
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
  },
  lista: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  vazio: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, gap: spacing.xs },
  vazioTitulo: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.subtitle.fontSize,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  vazioTexto: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkFaint,
    textAlign: 'center',
  },
});
