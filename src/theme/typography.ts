// Sistema tipográfico do FlowStudy.
// Fraunces (serifada, com contraste) carrega a personalidade em números
// grandes e títulos — o timer e os totais do dia merecem peso editorial.
// Inter cuida do texto de interface, rótulos e corpo, onde a leitura em
// telas pequenas importa mais do que o caráter.

export const fontFamilies = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_500Medium_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

export const fontFamiliesFallback = {
  display: 'System',
  displayItalic: 'System',
  body: 'System',
  bodyMedium: 'System',
  bodySemiBold: 'System',
  bodyBold: 'System',
};

export const type = {
  display1: { fontSize: 44, lineHeight: 48, letterSpacing: -0.5 },
  display2: { fontSize: 32, lineHeight: 38, letterSpacing: -0.3 },
  title: { fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  subtitle: { fontSize: 17, lineHeight: 23, letterSpacing: 0 },
  body: { fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  bodySmall: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
};
