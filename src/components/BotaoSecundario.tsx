import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, type, fontFamilies } from '@/theme';

interface Props {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  tone?: 'ink' | 'rust';
}

export function BotaoSecundario({ label, onPress, style, tone = 'ink' }: Props) {
  const color = tone === 'rust' ? colors.rust : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { borderColor: color },
        pressed && { backgroundColor: colors.paper },
        style,
      ]}
    >
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.subtitle.fontSize,
  },
});
