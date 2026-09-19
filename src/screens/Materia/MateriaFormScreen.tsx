import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/AppNavigator';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { colors, fontFamilies, spacing, type, radius } from '@/theme';
import { materiaColorOptions } from '@/theme/colors';
import { categorias, Categoria } from '@/types';
import { criarMateria, atualizarMateria, getMateriaById } from '@/mocks/data';

type Props = NativeStackScreenProps<HomeStackParamList, 'MateriaForm'>;

// Nomes legíveis para leitor de tela e para a mensagem de validação —
// sem isso, cada swatch de cor seria anunciado só como "botão".
const nomesDeCor: Record<string, string> = {
  '#3F5B4E': 'sálvia',
  '#B85440': 'terracota',
  '#5F8CA6': 'azul-céu',
  '#C79A2E': 'ouro',
  '#8B5FA6': 'ameixa',
  '#4C7A5E': 'folha',
  '#A65F82': 'vinho-rosado',
  '#6E6259': 'grafite',
};

export function MateriaFormScreen({ route, navigation }: Props) {
  const materiaExistente = route.params?.materiaId ? getMateriaById(route.params.materiaId) : undefined;

  const [nome, setNome] = useState(materiaExistente?.nome ?? '');
  const [cor, setCor] = useState(materiaExistente?.cor ?? materiaColorOptions[0]);
  const [categoria, setCategoria] = useState<Categoria>(materiaExistente?.categoria ?? 'Exatas');

  const [nomeTocado, setNomeTocado] = useState(false);
  const nomeValido = nome.trim().length >= 2;
  const mostrarErroNome = nomeTocado && !nomeValido;

  function salvar() {
    if (!nomeValido) return;

    if (materiaExistente) {
      atualizarMateria({ ...materiaExistente, nome: nome.trim(), cor, categoria });
      navigation.navigate('MateriaDetail', { materiaId: materiaExistente.id });
    } else {
      const novaMateria = {
        id: `mat-${Date.now()}`,
        nome: nome.trim(),
        cor,
        categoria,
        criadoEm: new Date().toISOString(),
      };
      criarMateria(novaMateria);
      navigation.navigate('MateriaDetail', { materiaId: novaMateria.id });
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.rotulo}>Nome da matéria</Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          onBlur={() => setNomeTocado(true)}
          placeholder="Ex: Química Orgânica"
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel="Nome da matéria"
          style={[styles.input, mostrarErroNome && styles.inputComErro]}
        />
        <Text style={[styles.ajuda, mostrarErroNome && styles.ajudaErro]}>
          {mostrarErroNome ? 'Use pelo menos 2 caracteres.' : 'Esse nome aparece nos cards e no timer.'}
        </Text>

        <Text style={styles.rotulo}>Cor</Text>
        <View style={styles.coresRow}>
          {materiaColorOptions.map((opcao) => {
            const selecionada = cor === opcao;
            const nomeCor = nomesDeCor[opcao] ?? 'cor';
            return (
              <Pressable
                key={opcao}
                onPress={() => setCor(opcao)}
                accessibilityRole="button"
                accessibilityLabel={`Cor ${nomeCor}`}
                accessibilityState={{ selected: selecionada }}
                style={({ pressed }) => [styles.corBotaoWrap, pressed && styles.corBotaoWrapPressed]}
              >
                <View style={[styles.corBotao, { backgroundColor: opcao }]}>
                  {selecionada && <Ionicons name="checkmark" size={18} color={colors.white} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.rotulo}>Categoria</Text>
        <View style={styles.categoriasWrap}>
          {categorias.map((opcao) => {
            const ativo = categoria === opcao;
            return (
              <Pressable
                key={opcao}
                onPress={() => setCategoria(opcao)}
                accessibilityRole="button"
                accessibilityLabel={`Categoria ${opcao}`}
                accessibilityState={{ selected: ativo }}
                style={({ pressed }) => [
                  styles.categoriaChip,
                  ativo && { backgroundColor: colors.sage, borderColor: colors.sage },
                  pressed && !ativo && { backgroundColor: colors.paper },
                ]}
              >
                <Text style={[styles.categoriaLabel, ativo && { color: colors.white }]}>{opcao}</Text>
              </Pressable>
            );
          })}
        </View>

        <BotaoPrimario
          label={materiaExistente ? 'Salvar alterações' : 'Criar matéria'}
          onPress={salvar}
          disabled={!nomeValido}
          style={styles.salvar}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  conteudo: { padding: spacing.lg, paddingBottom: spacing.xxl },
  rotulo: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1.5,
    // borderStrong dá ~3,6:1 de contraste contra o fundo branco do input —
    // o `border` original dava ~1,3:1, deixando o campo pouco definido.
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: fontFamilies.body,
    fontSize: type.body.fontSize,
    color: colors.ink,
  },
  inputComErro: {
    borderColor: colors.rustDark,
  },
  ajuda: {
    fontFamily: fontFamilies.body,
    fontSize: type.caption.fontSize,
    color: colors.inkFaint,
    marginTop: spacing.xxs,
  },
  ajudaErro: {
    color: colors.rustDark,
    fontFamily: fontFamilies.bodyMedium,
  },
  coresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  // padding aumentado de 2 para 6: com o swatch de 40px, a área tocável
  // total passa a ficar em ~52px, acima do mínimo recomendado de 44px.
  corBotaoWrap: { padding: 6, borderRadius: radius.md },
  corBotaoWrapPressed: { backgroundColor: colors.border },
  corBotao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriasWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  categoriaChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.paperRaised,
  },
  categoriaLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.bodySmall.fontSize,
    color: colors.ink,
  },
  salvar: { marginTop: spacing.xl },
});
