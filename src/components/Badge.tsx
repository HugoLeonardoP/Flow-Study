import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, type, fontFamilies } from '@/theme';

interface Props {
  label: string;
  tone?: 'sage' | 'amber' | 'sky' | 'rust' | 'gold' | 'neutral';
}


const toneMap: Record<string, { bg: string; fg: string }> = {
  sage: { bg: colors.sageLight, fg: colors.sageDark },
  amber: { bg: colors.amberSoft, fg: colors.amberDark },
  sky: { bg: colors.skySoft, fg: colors.skyDark },
  rust: { bg: colors.rustSoft, fg: colors.rustDark },
  gold: { bg: colors.goldSoft, fg: colors.goldDark },
  neutral: { bg: colors.border, fg: colors.inkSoft },
};

export function Badge({ label, tone = 'neutral' }: Props) {
  const c = toneMap[tone];
  return (
    <View style={[styles.wrap, { backgroundColor: c.bg }]}>
      <Text style={[styles.label, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.caption.fontSize,
  },
});
