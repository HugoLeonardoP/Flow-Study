import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { colors, radius, spacing, type, fontFamilies } from '@/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'sage' | 'amber' | 'ink';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

const backgroundByVariant = {
  sage: colors.sage,
  amber: colors.amber,
  ink: colors.ink,
};

export function BotaoPrimario({
  label,
  onPress,
  variant = 'sage',
  disabled,
  loading,
  style,
  icon,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: backgroundByVariant[variant] },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    color: colors.white,
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.subtitle.fontSize,
  },
});
