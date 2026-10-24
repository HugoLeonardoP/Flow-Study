import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/AppNavigator';
import { BotaoPrimario } from '@/components/BotaoPrimario';
import { BotaoSecundario } from '@/components/BotaoSecundario';
import { Badge } from '@/components/Badge';
import { RevisaoFormModal } from '@/components/RevisaoFormModal';
import { colors, fontFamilies, spacing, type, radius, shadow } from '@/theme';
import {
  useDados,
  getMateriaById,
  getHistoricoSessoes,
  getRevisoesDaMateria,
  criarItemRevisao,
  atualizarTemaItemRevisao,
  removerItemRevisao,
  removerMateria,
  foiAvaliadoHoje,
} from '@/services/dataService';
import { mensagemDeErro } from '@/services/api';
import { mostrarFeedback } from '@/services/feedback';
import { ItemRevisao } from '@/types';
import { formatarDataCurta, formatarDataHora } from '@/utils/datas';

type Props = NativeStackScreenProps<HomeStackParamList, 'MateriaDetail'>;

const LIMITE_HISTORICO = 10;

export function MateriaDetailScreen({ route, navigation }: Props) {
  // Re-renderiza sempre que os dados persistidos mudam.
  useDados();

  const { materiaId } = route.params;
  const materia = getMateriaById(materiaId);

  const [removida, setRemovida] = useState(false);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemRevisao | null>(null);
  const [salvandoItem, setSalvandoItem] = useState(false);
  const [erroItem, setErroItem] = useState<string | null>(null);

  useEffect(() => {
    if (materia) navigation.setOptions({ title: materia.nome });
  }, [materia?.nome, navigation]);

  if (removida || !materia) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.vazio}>
          {!removida && <Text style={styles.vazioTexto}>Matéria não encontrada.</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const historico = getHistoricoSessoes(materiaId);
  const revisoes = getRevisoesDaMateria(materiaId);
  const totalMinutos = historico.reduce((acc, s) => acc + s.duracaoMin, 0);

  function confirmarExclusaoMateria() {
    if (!materia) return;
    Alert.alert(
      'Excluir matéria?',
      `“${materia.nome}”, o histórico de sessões e todos os itens de revisão dela serão apagados. Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setRemovida(true); // evita piscar "não encontrada" enquanto o servidor responde
            try {
              await removerMateria(materia.id);
              mostrarFeedback('Matéria excluída.');
              navigation.goBack();
            } catch (erro) {
              setRemovida(false);
              mostrarFeedback(mensagemDeErro(erro), 'erro');
            }
          },
        },
      ]
    );
  }

  // Executa uma operação do modal: mostra "salvando", erros do servidor no próprio modal.
  async function salvarItem(operacao: () => Promise<void>) {
    setSalvandoItem(true);
    setErroItem(null);
    try {
      await operacao();
    } catch (erro) {
      setErroItem(mensagemDeErro(erro));
    } finally {
      setSalvandoItem(false);
    }
  }

  function confirmarExclusaoItem() {
    if (!itemEmEdicao) return;
    const item = itemEmEdicao;
    Alert.alert('Excluir item de revisão?', `“${item.tema}” será removido.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await removerItemRevisao(item.id);
            setItemEmEdicao(null);
            mostrarFeedback('Item de revisão excluído.');
          } catch (erro) {
            mostrarFeedback(mensagemDeErro(erro), 'erro');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextos}>
            <View style={styles.categoriaRow}>
              <View style={[styles.ponto, { backgroundColor: materia.cor }]} />
              <Text style={styles.categoria}>{materia.categoria}</Text>
            </View>
            <Text style={styles.titulo}>{materia.nome}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('MateriaForm', { materiaId: materia.id })}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${materia.nome}`}
            style={({ pressed }) => [styles.editarBotao, pressed && styles.editarBotaoPressed]}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.sage} />
          </Pressable>
        </View>

        <View style={styles.resumoRow}>
          <View style={[styles.resumoCard, shadow.card]}>
            <Text style={styles.resumoNumero}>{totalMinutos}min</Text>
            <Text style={styles.resumoLabel}>tempo total estudado</Text>
          </View>
          <View style={[styles.resumoCard, shadow.card]}>
            <Text style={styles.resumoNumero}>{revisoes.length}</Text>
            <Text style={styles.resumoLabel}>itens de revisão</Text>
          </View>
        </View>

        <BotaoPrimario
          label="Iniciar sessão Pomodoro"
          variant="amber"
          icon={<Ionicons name="play" size={18} color={colors.white} />}
          onPress={() => navigation.navigate('Pomodoro', { materiaId: materia.id })}
          style={styles.cta}
        />

        <Text style={styles.secaoTitulo}>Histórico de sessões</Text>
        {historico.length === 0 ? (
          <Text style={styles.listaVazia}>Nenhuma sessão registrada ainda.</Text>
        ) : (
          <>
            {historico.slice(0, LIMITE_HISTORICO).map((s) => (
              <View key={s.id} style={styles.linhaHistorico}>
                <Ionicons name="flame-outline" size={16} color={colors.amberDark} />
                <Text style={styles.linhaHistoricoTexto}>
                  {s.duracaoMin} min de foco · {formatarDataHora(s.inicio)}
                </Text>
              </View>
            ))}
            {historico.length > LIMITE_HISTORICO && (
              <Text style={styles.notaHistorico}>
                Mostrando as {LIMITE_HISTORICO} sessões mais recentes de {historico.length}.
              </Text>
            )}
          </>
        )}

        <View style={styles.secaoHeader}>
          <Text style={[styles.secaoTitulo, { marginTop: 0, marginBottom: 0 }]}>Itens de revisão</Text>
          <Pressable
            onPress={() => {
              setErroItem(null);
              setModalCriarAberto(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Adicionar item de revisão"
            hitSlop={8}
            style={({ pressed }) => [styles.adicionarBotao, pressed && styles.adicionarBotaoPressed]}
          >
            <Ionicons name="add" size={18} color={colors.sage} />
            <Text style={styles.adicionarLabel}>Adicionar</Text>
          </Pressable>
        </View>
        {revisoes.length === 0 ? (
          <Text style={styles.listaVazia}>
            Nenhum item de revisão ainda. Toque em “Adicionar” para registrar um tema estudado.
          </Text>
        ) : (
          revisoes.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => {
                setErroItem(null);
                setItemEmEdicao(r);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Editar item de revisão: ${r.tema}`}
              style={({ pressed }) => [styles.itemRevisao, shadow.card, pressed && styles.itemRevisaoPressed]}
            >
              <Text style={styles.itemRevisaoTema} numberOfLines={1}>
                {r.tema}
              </Text>
              {foiAvaliadoHoje(r) ? (
                <Badge label="Avaliado hoje" tone="sage" />
              ) : (
                <Badge label={formatarDataCurta(r.dataAgendada)} tone="neutral" />
              )}
            </Pressable>
          ))
        )}

        <BotaoSecundario
          label="Excluir matéria"
          tone="rust"
          onPress={confirmarExclusaoMateria}
          style={styles.excluirMateria}
        />
      </ScrollView>

      <RevisaoFormModal
        visivel={modalCriarAberto}
        modo="criar"
        onFechar={() => setModalCriarAberto(false)}
        erro={erroItem}
        salvando={salvandoItem}
        onSalvar={({ tema, primeiraRevisaoEmDias }) =>
          salvarItem(async () => {
            await criarItemRevisao({ materiaId, tema, primeiraRevisaoEmDias });
            setModalCriarAberto(false);
            mostrarFeedback('Item de revisão adicionado.');
          })
        }
      />

      <RevisaoFormModal
        visivel={itemEmEdicao !== null}
        modo="editar"
        temaInicial={itemEmEdicao?.tema}
        onFechar={() => setItemEmEdicao(null)}
        erro={erroItem}
        salvando={salvandoItem}
        onSalvar={({ tema }) =>
          salvarItem(async () => {
            if (itemEmEdicao) await atualizarTemaItemRevisao(itemEmEdicao.id, tema);
            setItemEmEdicao(null);
            mostrarFeedback('Item de revisão atualizado.');
          })
        }
        onExcluir={confirmarExclusaoItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  conteudo: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTextos: { flex: 1 },
  categoriaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  categoria: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.caption.fontSize,
    color: colors.inkFaint,
  },
  titulo: {
    fontFamily: fontFamilies.display,
    fontSize: type.display2.fontSize,
    color: colors.ink,
  },
  editarBotao: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editarBotaoPressed: {
    backgroundColor: colors.border,
  },
  resumoRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  resumoCard: {
    flex: 1,
    backgroundColor: colors.paperRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  resumoNumero: {
    fontFamily: fontFamilies.display,
    fontSize: type.title.fontSize,
    color: colors.ink,
  },
  resumoLabel: {
    fontFamily: fontFamilies.body,
    fontSize: type.caption.fontSize,
    color: colors.inkFaint,
    marginTop: 2,
  },
  cta: { marginTop: spacing.lg, marginBottom: spacing.xl },
  secaoTitulo: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.subtitle.fontSize,
    color: colors.ink,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  listaVazia: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkFaint,
  },
  linhaHistorico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  linhaHistoricoTexto: {
    fontFamily: fontFamilies.body,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkSoft,
  },
  itemRevisao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  itemRevisaoTema: {
    flex: 1,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.bodySmall.fontSize,
    color: colors.ink,
    marginRight: spacing.sm,
  },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  adicionarBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  adicionarBotaoPressed: { backgroundColor: colors.sageLight },
  adicionarLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.bodySmall.fontSize,
    color: colors.sage,
  },
  itemRevisaoPressed: { opacity: 0.85 },
  notaHistorico: {
    fontFamily: fontFamilies.body,
    fontSize: type.caption.fontSize,
    color: colors.inkFaint,
    marginTop: spacing.xxs,
  },
  excluirMateria: { marginTop: spacing.xl },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vazioTexto: {
    fontFamily: fontFamilies.body,
    color: colors.inkFaint,
  },
});
