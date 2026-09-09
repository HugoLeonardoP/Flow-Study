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

export function MateriaFormScreen({ route, navigation }: Props) {
  const materiaExistente = route.params?.materiaId ? getMateriaById(route.params.materiaId) : undefined;

  const [nome, setNome] = useState(materiaExistente?.nome ?? '');
  const [cor, setCor] = useState(materiaExistente?.cor ?? materiaColorOptions[0]);
  const [categoria, setCategoria] = useState<Categoria>(materiaExistente?.categoria ?? 'Exatas');

  const nomeValido = nome.trim().length >= 2;

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
          placeholder="Ex: Química Orgânica"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
        />

        <Text style={styles.rotulo}>Cor</Text>
        <View style={styles.coresRow}>
          {materiaColorOptions.map((opcao) => (
            <Pressable key={opcao} onPress={() => setCor(opcao)} style={styles.corBotaoWrap}>
              <View style={[styles.corBotao, { backgroundColor: opcao }]}>
                {cor === opcao && <Ionicons name="checkmark" size={18} color={colors.white} />}
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.rotulo}>Categoria</Text>
        <View style={styles.categoriasWrap}>
          {categorias.map((opcao) => {
            const ativo = categoria === opcao;
            return (
              <Pressable
                key={opcao}
                onPress={() => setCategoria(opcao)}
                style={[
                  styles.categoriaChip,
                  ativo && { backgroundColor: colors.sage, borderColor: colors.sage },
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
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: fontFamilies.body,
    fontSize: type.body.fontSize,
    color: colors.ink,
  },
  coresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  corBotaoWrap: { padding: 2 },
  corBotao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriasWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  categoriaChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paperRaised,
  },
  categoriaLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.bodySmall.fontSize,
    color: colors.ink,
  },
  salvar: { marginTop: spacing.xl },
});
