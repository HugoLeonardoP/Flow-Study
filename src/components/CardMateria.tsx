import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Materia } from '@/types';
import { colors, radius, spacing, type, fontFamilies, shadow } from '@/theme';

interface Props {
  materia: Materia;
  onPress: () => void;
  subtitulo?: string;
}

const iconeByCategoria: Record<string, keyof typeof Ionicons.glyphMap> = {
  Exatas: 'calculator-outline',
  Humanas: 'globe-outline',
  'Biológicas': 'leaf-outline',
  Idiomas: 'chatbubble-ellipses-outline',
  Concurso: 'ribbon-outline',
  Outra: 'bookmark-outline',
};

export function CardMateria({ materia, onPress, subtitulo }: Props) {
  const icone = iconeByCategoria[materia.categoria] ?? 'book-outline';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalhes de ${materia.nome}, categoria ${materia.categoria}`}
      style={({ pressed }) => [styles.card, shadow.card, pressed && styles.pressed]}
    >
      <View style={[styles.faixa, { backgroundColor: materia.cor }]} />
      <View style={[styles.iconeWrap, { backgroundColor: `${materia.cor}22` }]}>
        <Ionicons name={icone} size={20} color={materia.cor} />
      </View>
      <View style={styles.textos}>
        <Text style={styles.nome} numberOfLines={1}>
          {materia.nome}
        </Text>
        <Text style={styles.categoria}>{subtitulo ?? materia.categoria}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
  },
  faixa: {
    width: 5,
    alignSelf: 'stretch',
    marginRight: spacing.md,
    borderTopRightRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
  },
  iconeWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textos: {
    flex: 1,
  },
  nome: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.body.fontSize,
    color: colors.ink,
  },
  categoria: {
    fontFamily: fontFamilies.body,
    fontSize: type.caption.fontSize,
    color: colors.inkFaint,
    marginTop: 2,
  },
});
