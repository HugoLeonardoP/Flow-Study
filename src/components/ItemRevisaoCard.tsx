import React, { useState } from 'react';
import { Pressable, View, Text, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemRevisao, Materia, NivelLembranca } from '@/types';
import { colors, radius, spacing, type, fontFamilies, shadow } from '@/theme';
import { Badge } from './Badge';

interface Props {
  item: ItemRevisao;
  materia?: Materia;
  onAvaliar: (id: string, nivel: NivelLembranca) => void;
}

const opcoes: { nivel: NivelLembranca; label: string; tone: 'rust' | 'gold' | 'sage' }[] = [
  { nivel: 'nao_lembrei', label: 'Não lembrei', tone: 'rust' },
  { nivel: 'dificil', label: 'Lembrei com dificuldade', tone: 'gold' },
  { nivel: 'facil', label: 'Lembrei fácil', tone: 'sage' },
];

function formatarData(dataISO: string): string {
  const hoje = new Date().toISOString().slice(0, 10);
  if (dataISO === hoje) return 'Hoje';
  const d = new Date(`${dataISO}T00:00:00`);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function ItemRevisaoCard({ item, materia, onAvaliar }: Props) {
  const [modalAberto, setModalAberto] = useState(false);

  function handleEscolher(nivel: NivelLembranca) {
    setModalAberto(false);
    onAvaliar(item.id, nivel);
  }

  return (
    <>
      <Pressable
        onPress={() => setModalAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`Avaliar revisão: ${item.tema}, ${materia?.nome ?? 'matéria'}`}
        style={({ pressed }) => [styles.card, shadow.card, pressed && styles.pressed]}
      >
        <View style={[styles.ponto, { backgroundColor: materia?.cor ?? colors.inkFaint }]} />
        <View style={styles.textos}>
          <Text style={styles.tema} numberOfLines={2}>
            {item.tema}
          </Text>
          <Text style={styles.materiaNome}>{materia?.nome ?? 'Matéria'}</Text>
        </View>
        <Badge label={formatarData(item.dataAgendada)} tone="neutral" />
      </Pressable>

      <Modal visible={modalAberto} transparent animationType="fade" onRequestClose={() => setModalAberto(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalAberto(false)}>
          <Pressable style={styles.folha} onPress={(e) => e.stopPropagation()}>
            <View style={styles.alcinha} />

            <View style={styles.folhaHeader}>
              <Text style={styles.folhaTitulo} numberOfLines={2}>
                {item.tema}
              </Text>
              <Pressable
                onPress={() => setModalAberto(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                hitSlop={8}
                style={({ pressed }) => [styles.fecharBotao, pressed && styles.fecharBotaoPressed]}
              >
                <Ionicons name="close" size={20} color={colors.inkSoft} />
              </Pressable>
            </View>
            <Text style={styles.folhaSubtitulo}>Como foi lembrar deste conteúdo?</Text>

            {opcoes.map((op) => (
              <Pressable
                key={op.nivel}
                onPress={() => handleEscolher(op.nivel)}
                accessibilityRole="button"
                accessibilityLabel={op.label}
                style={({ pressed }) => [
                  styles.opcao,
                  { borderColor: colors.borderStrong },
                  pressed && { backgroundColor: colors.paper },
                ]}
              >
                <View style={[styles.opcaoPonto, { backgroundColor: corPorTom(op.tone) }]} />
                <Text style={styles.opcaoLabel}>{op.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
              </Pressable>
            ))}

            <Pressable
              onPress={() => setModalAberto(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancelar avaliação"
              style={({ pressed }) => [styles.cancelar, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.cancelarLabel}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function corPorTom(tone: 'rust' | 'gold' | 'sage') {
  return { rust: colors.rust, gold: colors.gold, sage: colors.sage }[tone];
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.9 },
  ponto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  textos: { flex: 1 },
  tema: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.body.fontSize,
    color: colors.ink,
  },
  materiaNome: {
    fontFamily: fontFamilies.body,
    fontSize: type.caption.fontSize,
    color: colors.inkFaint,
    marginTop: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  folha: {
    backgroundColor: colors.paperRaised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  alcinha: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  folhaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  folhaTitulo: {
    flex: 1,
    fontFamily: fontFamilies.display,
    fontSize: type.title.fontSize,
    color: colors.ink,
    marginBottom: spacing.xxs,
  },
  fecharBotao: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.xs,
    marginRight: -spacing.xs,
  },
  fecharBotaoPressed: {
    backgroundColor: colors.paper,
  },
  cancelar: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  cancelarLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.body.fontSize,
    color: colors.inkSoft,
  },
  folhaSubtitulo: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkSoft,
    marginBottom: spacing.lg,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  opcaoPonto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  opcaoLabel: {
    flex: 1,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.body.fontSize,
    color: colors.ink,
  },
});
