import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamilies, radius, spacing, type } from '@/theme';
import { getStatusConexao, sincronizar, useDados } from '@/services/dataService';

// Faixa exibida quando o app não consegue falar com o servidor.
export function AvisoConexao() {
  useDados();
  if (getStatusConexao() !== 'offline') return null;

  return (
    <Pressable
      onPress={() => void sincronizar()}
      accessibilityRole="button"
      accessibilityLabel="Sem conexão com o servidor. Toque para tentar novamente."
      style={({ pressed }) => [styles.faixa, pressed && { opacity: 0.85 }]}
    >
      <Ionicons name="cloud-offline-outline" size={20} color={colors.rustDark} />
      <Text style={styles.texto}>
        Sem conexão com o servidor. Mostrando os últimos dados salvos; para criar ou alterar, é preciso
        conexão. Toque para tentar novamente.
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.rustSoft,
  },
  texto: {
    flex: 1,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: colors.rustDark,
  },
});
