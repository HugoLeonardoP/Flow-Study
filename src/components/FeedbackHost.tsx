import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamilies, radius, spacing, type } from '@/theme';
import { limparFeedback, useFeedbackAtual } from '@/services/feedback';

const DURACAO_MS = 3200;

const fundoPorTipo = {
  sucesso: colors.sageDark,
  erro: colors.rustDark,
  info: colors.ink,
};

// Exibe a mensagem atual acima da barra de abas e a remove sozinha.
export function FeedbackHost() {
  const mensagem = useFeedbackAtual();
  const insets = useSafeAreaInsets();
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!mensagem) return;
    const { id, texto } = mensagem;

    AccessibilityInfo.announceForAccessibility(texto);
    Animated.timing(opacidade, { toValue: 1, duration: 180, useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacidade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
        limparFeedback(id)
      );
    }, DURACAO_MS);
    return () => clearTimeout(timer);
  }, [mensagem, opacidade]);

  if (!mensagem) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        { backgroundColor: fundoPorTipo[mensagem.tipo], opacity: opacidade, bottom: insets.bottom + 72 },
      ]}
    >
      <Text style={styles.texto}>{mensagem.texto}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  texto: {
    color: colors.white,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.bodySmall.fontSize,
    lineHeight: type.bodySmall.lineHeight,
  },
});
