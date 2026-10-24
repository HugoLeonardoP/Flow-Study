import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamilies, radius, spacing, type } from '@/theme';
import { BotaoPrimario } from './BotaoPrimario';
import { BotaoSecundario } from './BotaoSecundario';

interface Props {
  visivel: boolean;
  modo: 'criar' | 'editar';
  temaInicial?: string;
  onFechar: () => void;
  onSalvar: (dados: { tema: string; primeiraRevisaoEmDias: number }) => void;
  onExcluir?: () => void;
  /** Mensagem de erro devolvida pelo servidor (ex.: validação). */
  erro?: string | null;
  /** Enquanto a operação está em andamento no servidor. */
  salvando?: boolean;
}

const opcoesQuando = [
  { dias: 0, label: 'Hoje' },
  { dias: 1, label: 'Amanhã' },
  { dias: 3, label: 'Em 3 dias' },
];

export function RevisaoFormModal({
  visivel,
  modo,
  temaInicial = '',
  onFechar,
  onSalvar,
  onExcluir,
  erro = null,
  salvando = false,
}: Props) {
  const [tema, setTema] = useState(temaInicial);
  const [dias, setDias] = useState(0);
  const [tocado, setTocado] = useState(false);

  // Sempre que o modal abre, recomeça com os valores corretos.
  useEffect(() => {
    if (visivel) {
      setTema(temaInicial);
      setDias(0);
      setTocado(false);
    }
  }, [visivel, temaInicial]);

  const valido = tema.trim().length >= 2;
  const mensagemErro = erro ?? (tocado && !valido ? 'Use pelo menos 2 caracteres.' : null);
  const mostrarErro = mensagemErro !== null;

  function salvar() {
    setTocado(true);
    if (!valido || salvando) return;
    onSalvar({ tema: tema.trim(), primeiraRevisaoEmDias: dias });
  }

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <KeyboardAvoidingView
        style={styles.raiz}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onFechar}
          accessible={false}
          importantForAccessibility="no"
        />

        <View style={styles.folha}>
          <View style={styles.alcinha} />

          <View style={styles.header}>
            <Text style={styles.titulo}>
              {modo === 'criar' ? 'Novo item de revisão' : 'Editar item de revisão'}
            </Text>
            <Pressable
              onPress={onFechar}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={8}
              style={({ pressed }) => [styles.fechar, pressed && { backgroundColor: colors.paper }]}
            >
              <Ionicons name="close" size={20} color={colors.inkSoft} />
            </Pressable>
          </View>

          <Text style={styles.rotulo}>Tema estudado</Text>
          <TextInput
            value={tema}
            onChangeText={setTema}
            onBlur={() => setTocado(true)}
            placeholder="Ex: Equações do 2º grau"
            placeholderTextColor={colors.inkFaint}
            accessibilityLabel="Tema estudado"
            style={[styles.input, mostrarErro && styles.inputErro]}
          />
          <Text style={[styles.ajuda, mostrarErro && styles.ajudaErro]} accessibilityLiveRegion="polite">
            {mensagemErro ?? 'Aparece na lista de revisões do dia.'}
          </Text>

          {modo === 'criar' && (
            <>
              <Text style={styles.rotulo}>Primeira revisão</Text>
              <View style={styles.chipsRow}>
                {opcoesQuando.map((op) => {
                  const ativo = dias === op.dias;
                  return (
                    <Pressable
                      key={op.dias}
                      onPress={() => setDias(op.dias)}
                      accessibilityRole="button"
                      accessibilityLabel={`Primeira revisão: ${op.label}`}
                      accessibilityState={{ selected: ativo }}
                      style={({ pressed }) => [
                        styles.chip,
                        ativo && { backgroundColor: colors.sage, borderColor: colors.sage },
                        pressed && !ativo && { backgroundColor: colors.paper },
                      ]}
                    >
                      <Text style={[styles.chipLabel, ativo && { color: colors.white }]}>{op.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <BotaoPrimario
            label={modo === 'criar' ? 'Adicionar item' : 'Salvar alterações'}
            onPress={salvar}
            loading={salvando}
            style={styles.salvar}
          />

          {modo === 'editar' && onExcluir && (
            <BotaoSecundario
              label="Excluir item"
              tone="rust"
              onPress={onExcluir}
              style={styles.excluir}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titulo: {
    flex: 1,
    fontFamily: fontFamilies.display,
    fontSize: type.title.fontSize,
    color: colors.ink,
  },
  fechar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.xs,
    marginRight: -spacing.xs,
  },
  rotulo: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkSoft,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: fontFamilies.body,
    fontSize: type.body.fontSize,
    color: colors.ink,
  },
  inputErro: { borderColor: colors.rustDark },
  ajuda: {
    fontFamily: fontFamilies.body,
    fontSize: type.caption.fontSize,
    color: colors.inkFaint,
    marginTop: spacing.xxs,
  },
  ajudaErro: { color: colors.rustDark, fontFamily: fontFamilies.bodyMedium },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.paperRaised,
  },
  chipLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.bodySmall.fontSize,
    color: colors.ink,
  },
  salvar: { marginTop: spacing.lg },
  excluir: { marginTop: spacing.sm },
});
