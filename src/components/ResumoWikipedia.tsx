import React, { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamilies, radius, spacing, type } from '@/theme';
import { BotaoPrimario } from './BotaoPrimario';
import { BotaoSecundario } from './BotaoSecundario';
import { ResultadoResumo, ResumoSalvo } from '@/types';
import { consultarResumoTema } from '@/services/dataService';
import { mensagemDeErro } from '@/services/api';
import { mostrarFeedback } from '@/services/feedback';
import { formatarDataHora } from '@/utils/datas';

// Estados da consulta à Wikipédia.
type Estado =
  | { tipo: 'inicial' }
  | { tipo: 'carregando' }
  | { tipo: 'sucesso'; resultado: ResultadoResumo }
  | { tipo: 'ausente'; termo: string; motivo?: ResultadoResumo['motivo']; url?: string | null }
  | { tipo: 'erro'; mensagem: string };

interface Props {
  temaInicial: string;
  salvo: ResumoSalvo | null;
  onSalvar: (resumo: { titulo: string; texto: string; url: string }) => Promise<unknown>;
  onRemover: () => Promise<unknown>;
}

function abrirArtigo(url: string) {
  Linking.openURL(url).catch(() => mostrarFeedback('Não foi possível abrir o link.', 'erro'));
}

function mensagemAusencia(termo: string, motivo?: ResultadoResumo['motivo']): string {
  if (motivo === 'ambiguo')
    return `“${termo}” tem vários significados na Wikipédia. Tente um termo mais específico.`;
  if (motivo === 'sem-resumo') return `O artigo de “${termo}” existe, mas não tem um resumo disponível.`;
  return `Não encontramos um artigo na Wikipédia para “${termo}”. Tente outro termo.`;
}

function CartaoResumo(props: {
  titulo: string;
  descricao?: string | null;
  texto: string;
  url: string;
  nota?: string;
}) {
  return (
    <View style={styles.cartao}>
      <Text style={styles.cartaoTitulo}>{props.titulo}</Text>
      {props.descricao ? <Text style={styles.cartaoDescricao}>{props.descricao}</Text> : null}
      <Text style={styles.cartaoTexto}>{props.texto}</Text>
      {props.nota ? <Text style={styles.nota}>{props.nota}</Text> : null}
      <Pressable
        onPress={() => abrirArtigo(props.url)}
        accessibilityRole="link"
        accessibilityLabel={`Ler o artigo completo de ${props.titulo} na Wikipédia`}
        style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="open-outline" size={16} color={colors.sage} />
        <Text style={styles.linkTexto}>Ler artigo completo</Text>
      </Pressable>
    </View>
  );
}

export function ResumoWikipedia({ temaInicial, salvo, onSalvar, onRemover }: Props) {
  const [termo, setTermo] = useState(temaInicial);
  const [estado, setEstado] = useState<Estado>({ tipo: 'inicial' });
  const [salvando, setSalvando] = useState(false);
  const requisicaoAtual = useRef(0);

  async function buscar() {
    const consulta = termo.trim();
    if (consulta.length < 2) {
      setEstado({ tipo: 'erro', mensagem: 'Digite pelo menos 2 caracteres para buscar.' });
      return;
    }

    const numero = ++requisicaoAtual.current;
    setEstado({ tipo: 'carregando' });
    try {
      const resultado = await consultarResumoTema(consulta);
      if (numero !== requisicaoAtual.current) return; // resposta antiga, ignora
      setEstado(
        resultado.encontrado
          ? { tipo: 'sucesso', resultado }
          : { tipo: 'ausente', termo: consulta, motivo: resultado.motivo, url: resultado.url }
      );
    } catch (erro) {
      if (numero !== requisicaoAtual.current) return;
      setEstado({ tipo: 'erro', mensagem: mensagemDeErro(erro) });
    }
  }

  async function salvarResultado(resultado: ResultadoResumo) {
    if (!resultado.titulo || !resultado.texto || !resultado.url) return;
    setSalvando(true);
    try {
      await onSalvar({ titulo: resultado.titulo, texto: resultado.texto, url: resultado.url });
      mostrarFeedback('Resumo salvo no item.');
      setEstado({ tipo: 'inicial' });
    } catch (erro) {
      mostrarFeedback(mensagemDeErro(erro), 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function removerSalvo() {
    setSalvando(true);
    try {
      await onRemover();
      mostrarFeedback('Resumo removido do item.');
    } catch (erro) {
      mostrarFeedback(mensagemDeErro(erro), 'erro');
    } finally {
      setSalvando(false);
    }
  }

  const carregando = estado.tipo === 'carregando';

  return (
    <View style={styles.bloco}>
      <View style={styles.cabecalho}>
        <Ionicons name="book-outline" size={18} color={colors.sage} />
        <Text style={styles.titulo}>Resumo na Wikipédia</Text>
      </View>

      {/* Resumo já guardado no item (visível mesmo sem buscar de novo) */}
      {salvo && estado.tipo === 'inicial' ? (
        <>
          <CartaoResumo
            titulo={salvo.titulo}
            texto={salvo.texto}
            url={salvo.url}
            nota={`Salvo em ${formatarDataHora(salvo.salvoEm)} · Fonte: ${salvo.fonte} (CC BY-SA 4.0)`}
          />
          <BotaoSecundario
            label={salvando ? 'Removendo…' : 'Remover resumo salvo'}
            tone="rust"
            onPress={() => {
              if (!salvando) void removerSalvo();
            }}
            style={styles.espaco}
          />
        </>
      ) : null}

      <Text style={styles.rotulo}>Termo de busca</Text>
      <TextInput
        value={termo}
        onChangeText={setTermo}
        placeholder="Ex: Era Vargas"
        placeholderTextColor={colors.inkFaint}
        accessibilityLabel="Termo de busca na Wikipédia"
        returnKeyType="search"
        onSubmitEditing={() => void buscar()}
        maxLength={80}
        style={styles.input}
      />

      {/* CARREGANDO */}
      {carregando ? (
        <View style={styles.status} accessibilityLiveRegion="polite" accessibilityLabel="Consultando a Wikipédia">
          <ActivityIndicator color={colors.sage} />
          <Text style={styles.statusTexto}>Consultando a Wikipédia…</Text>
        </View>
      ) : null}

      {/* SUCESSO */}
      {estado.tipo === 'sucesso' && estado.resultado.titulo && estado.resultado.texto && estado.resultado.url ? (
        <>
          <CartaoResumo
            titulo={estado.resultado.titulo}
            descricao={estado.resultado.descricao}
            texto={estado.resultado.texto}
            url={estado.resultado.url}
            nota={
              (estado.resultado.buscaAproximada ? 'Resultado mais próximo do termo buscado. ' : '') +
              'Fonte: Wikipédia (CC BY-SA 4.0)'
            }
          />
          <BotaoPrimario
            label={salvo ? 'Substituir resumo salvo' : 'Salvar no item'}
            onPress={() => void salvarResultado(estado.resultado)}
            loading={salvando}
            style={styles.espaco}
          />
        </>
      ) : null}

      {/* AUSÊNCIA DE DADOS (não é erro: a consulta funcionou, mas não há resumo) */}
      {estado.tipo === 'ausente' ? (
        <View style={[styles.aviso, styles.avisoNeutro]} accessibilityLiveRegion="polite">
          <Ionicons name="search-outline" size={18} color={colors.inkSoft} />
          <View style={{ flex: 1 }}>
            <Text style={styles.avisoTexto}>{mensagemAusencia(estado.termo, estado.motivo)}</Text>
            {estado.url ? (
              <Pressable
                onPress={() => abrirArtigo(estado.url as string)}
                accessibilityRole="link"
                style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.linkTexto}>Ver opções na Wikipédia</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* ERRO */}
      {estado.tipo === 'erro' ? (
        <View style={[styles.aviso, styles.avisoErro]} accessibilityLiveRegion="polite" accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={18} color={colors.rustDark} />
          <Text style={[styles.avisoTexto, { color: colors.rustDark }]}>{estado.mensagem}</Text>
        </View>
      ) : null}

      {!carregando ? (
        <BotaoSecundario
          label={estado.tipo === 'erro' ? 'Tentar novamente' : 'Buscar resumo'}
          onPress={() => void buscar()}
          style={styles.espaco}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  titulo: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.body.fontSize,
    color: colors.ink,
  },
  rotulo: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkSoft,
    marginTop: spacing.sm,
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
  espaco: { marginTop: spacing.sm },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    marginTop: spacing.sm,
  },
  statusTexto: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkSoft,
  },
  cartao: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartaoTitulo: {
    fontFamily: fontFamilies.display,
    fontSize: type.subtitle.fontSize,
    color: colors.ink,
  },
  cartaoDescricao: {
    fontFamily: fontFamilies.displayItalic,
    fontSize: type.bodySmall.fontSize,
    color: colors.inkSoft,
    marginTop: 2,
  },
  cartaoTexto: {
    fontFamily: fontFamilies.body,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  nota: {
    fontFamily: fontFamilies.body,
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: colors.inkFaint,
    marginTop: spacing.xs,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  linkTexto: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.bodySmall.fontSize,
    color: colors.sage,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  avisoNeutro: { backgroundColor: colors.border },
  avisoErro: { backgroundColor: colors.rustSoft },
  avisoTexto: {
    flex: 1,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: type.bodySmall.fontSize,
    lineHeight: type.bodySmall.lineHeight,
    color: colors.inkSoft,
  },
});
