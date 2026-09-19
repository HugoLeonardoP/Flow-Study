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

const labelColorByVariant = {
  sage: colors.white,
  amber: colors.ink,
  ink: colors.white,
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
  const corTexto = labelColorByVariant[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: backgroundByVariant[variant] },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon && React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, { color: corTexto })
        : icon}
      {loading ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <Text style={[styles.label, { color: corTexto }]}>{label}</Text>
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
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.subtitle.fontSize,
  },
});
