import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../services/api';
import { RefreshButton } from '../../components/RefreshButton';

interface Props {
  notify?: (text: string) => void;
}

interface Comunicado {
  id_comunicado: number;
  id_turma?: number | null;
  titulo: string;
  conteudo: string;
  abrangencia: 'GERAL' | 'TURMA' | string;
  publico_alvo?: string | null;
  dt_publicacao?: string;
  criado_em?: string;
  createdAt?: string;
  turma?: {
    id_turma?: number;
    nome?: string;
  } | null;
}

function extrairComunicados(data: any): Comunicado[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  if (Array.isArray(data.comunicados)) return data.comunicados;
  if (Array.isArray(data.data)) return data.data;
  if (data.comunicado) return extrairComunicados(data.comunicado);
  if (data.data && typeof data.data === 'object') {
    return extrairComunicados(data.data);
  }
  if (data.id_comunicado) return [data];

  return [];
}

function statusDoErro(error: any): number | undefined {
  return error?.response?.status;
}

function formatarData(item: Comunicado): string {
  const data = item.dt_publicacao || item.criado_em || item.createdAt;
  if (!data) return 'Data indisponível';

  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return data;

  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NoticesScreen({ notify }: Props) {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const [abrangencia, setAbrangencia] = useState<'GERAL' | 'TURMA'>('GERAL');
  const [idTurma, setIdTurma] = useState('');
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Comunicado | null>(null);

  const carregarComunicados = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const rotas = [
          '/comunicados',
          '/comunicados/gerais',
          '/comunicados/minha-turma',
        ];

        const resultadosListagem = await Promise.allSettled(
          rotas.map((rota) => api.get(rota)),
        );

        const mapa = new Map<number, Comunicado>();

        resultadosListagem.forEach((resultado) => {
          if (resultado.status !== 'fulfilled') return;

          extrairComunicados(resultado.value.data).forEach((item) => {
            if (!item?.id_comunicado) return;

            const id = Number(item.id_comunicado);
            mapa.set(id, {
              ...mapa.get(id),
              ...item,
            });
          });
        });

        // Repete a varredura por ID feita no desktop para encontrar comunicados
        // que não aparecem nas rotas de listagem, incluindo os de turma.
        const resultadosPorId = await Promise.allSettled(
          Array.from({ length: 50 }, (_, index) =>
            api.get(`/comunicados/${index + 1}`),
          ),
        );

        resultadosPorId.forEach((resultado) => {
          if (resultado.status !== 'fulfilled') return;

          extrairComunicados(resultado.value.data).forEach((item) => {
            if (!item?.id_comunicado) return;

            const id = Number(item.id_comunicado);
            mapa.set(id, {
              ...mapa.get(id),
              ...item,
            });
          });
        });

        const lista = Array.from(mapa.values()).sort(
          (a, b) => Number(b.id_comunicado) - Number(a.id_comunicado),
        );

        setComunicados(lista);

        const todasListagensFalharam = resultadosListagem.every(
          (resultado) => resultado.status === 'rejected',
        );
        const todasBuscasPorIdFalharam = resultadosPorId.every(
          (resultado) => resultado.status === 'rejected',
        );

        if (todasListagensFalharam && todasBuscasPorIdFalharam) {
          notify?.('Não foi possível carregar os comunicados.');
        } else if (isRefresh) {
          notify?.('Comunicados atualizados.');
        }
      } catch (error: any) {
        console.error('Erro ao carregar comunicados:', {
          status: error?.response?.status,
          url: error?.config?.url,
          resposta: error?.response?.data,
        });

        notify?.(
          error?.response?.data?.mensagem ||
            error?.response?.data?.message ||
            'Não foi possível carregar os comunicados.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [notify],
  );

  useEffect(() => {
    void carregarComunicados();
  }, [carregarComunicados]);

  const limparFormulario = () => {
    setTitulo('');
    setConteudo('');
    setAbrangencia('GERAL');
    setIdTurma('');
    setEditingId(null);
  };

  const iniciarEdicao = (item: Comunicado) => {
    setTitulo(item.titulo || '');
    setConteudo(item.conteudo || '');
    setAbrangencia(item.abrangencia === 'TURMA' ? 'TURMA' : 'GERAL');
    setIdTurma(item.id_turma ? String(item.id_turma) : '');
    setEditingId(item.id_comunicado);
    setSelectedNotice(null);
  };

  const salvarComunicado = async () => {
    if (!titulo.trim() || !conteudo.trim()) {
      notify?.('Preencha o título e a mensagem do comunicado.');
      return;
    }

    const turmaId = Number(idTurma);

    if (
      abrangencia === 'TURMA' &&
      (!idTurma.trim() || !Number.isInteger(turmaId) || turmaId <= 0)
    ) {
      notify?.('Informe um ID de turma válido.');
      return;
    }

    const payload = {
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      abrangencia,
      id_turma: abrangencia === 'TURMA' ? turmaId : null,
    };

    try {
      setSubmitting(true);

      let response: any;

      if (editingId !== null) {
        response = await api.put(`/comunicados/${editingId}`, payload);
        notify?.('Comunicado atualizado com sucesso!');
      } else if (abrangencia === 'TURMA') {
        try {
          response = await api.post('/comunicados/turma', payload);
        } catch (error: any) {
          // Só tenta a rota genérica se a rota específica não existir.
          const status = statusDoErro(error);
          if (status !== 404 && status !== 405) throw error;

          response = await api.post('/comunicados', payload);
        }
        notify?.('Comunicado publicado para a turma com sucesso!');
      } else {
        response = await api.post('/comunicados/geral', payload).catch(
          async (error: any) => {
            const status = statusDoErro(error);
            if (status !== 404 && status !== 405) throw error;

            return api.post('/comunicados', payload);
          },
        );
        notify?.('Comunicado publicado com sucesso!');
      }

      const comunicadoSalvo = extrairComunicados(response?.data)[0];

      limparFormulario();
      await carregarComunicados();

      // Inclui o item retornado pela API caso ainda não esteja nas listagens.
      if (comunicadoSalvo?.id_comunicado) {
        setComunicados((atuais) => {
          const mapa = new Map(
            atuais.map((item) => [Number(item.id_comunicado), item]),
          );

          const id = Number(comunicadoSalvo.id_comunicado);
          mapa.set(id, {
            ...mapa.get(id),
            ...comunicadoSalvo,
          });

          return Array.from(mapa.values()).sort(
            (a, b) => Number(b.id_comunicado) - Number(a.id_comunicado),
          );
        });
      }
    } catch (error: any) {
      console.error('Erro ao salvar comunicado:', {
        status: error?.response?.status,
        url: error?.config?.url,
        resposta: error?.response?.data,
      });

      notify?.(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          'Não foi possível salvar o comunicado.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const excluirComunicado = (item: Comunicado) => {
    Alert.alert(
      'Excluir comunicado',
      `Deseja excluir “${item.titulo}”? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              try {
                await api.delete(`/comunicados/${item.id_comunicado}`);
              } catch (error: any) {
                const status = statusDoErro(error);
                if (status !== 404 && status !== 405) throw error;

                try {
                  await api.delete(`/comunicados/turma/${item.id_comunicado}`);
                } catch (turmaError: any) {
                  const turmaStatus = statusDoErro(turmaError);
                  if (turmaStatus !== 404 && turmaStatus !== 405) {
                    throw turmaError;
                  }

                  await api.delete(`/comunicados/geral/${item.id_comunicado}`);
                }
              }

              setComunicados((lista) =>
                lista.filter(
                  (comunicado) =>
                    comunicado.id_comunicado !== item.id_comunicado,
                ),
              );

              if (selectedNotice?.id_comunicado === item.id_comunicado) {
                setSelectedNotice(null);
              }

              if (editingId === item.id_comunicado) limparFormulario();
              notify?.('Comunicado excluído com sucesso!');
            } catch (error: any) {
              console.error('Erro ao excluir comunicado:', {
                status: error?.response?.status,
                url: error?.config?.url,
                resposta: error?.response?.data,
              });

              notify?.(
                error?.response?.data?.mensagem ||
                  error?.response?.data?.message ||
                  'Não foi possível excluir o comunicado.',
              );
            }
          },
        },
      ],
    );
  };

  const comunicadosFiltrados = useMemo(() => {
    const termo = search.trim().toLowerCase().replace(/^#/, '');
    if (!termo) return comunicados;

    return comunicados.filter((item) =>
      [
        String(item.id_comunicado),
        item.titulo || '',
        item.conteudo || '',
        item.turma?.nome || '',
        String(item.id_turma ?? ''),
      ]
        .join(' ')
        .toLowerCase()
        .includes(termo),
    );
  }, [comunicados, search]);

  // A pesquisa é aplicada à lista completa antes de limitar a exibição a cinco.
  const comunicadosVisiveis = comunicadosFiltrados.slice(0, 5);

  const publicoLabel = (item: Comunicado) => {
    if (item.abrangencia === 'TURMA' || item.id_turma) {
      const nomeTurma = item.turma?.nome;
      return nomeTurma
        ? `Turma ${item.id_turma ?? item.turma?.id_turma ?? ''} · ${nomeTurma}`
        : `Turma #${item.id_turma ?? 'específica'}`;
    }

    return item.publico_alvo || 'Toda a instituição';
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void carregarComunicados(true)}
          tintColor="#dc2626"
        />
      }
    >
      <Text style={styles.eyebrow}>CANAL OFICIAL DO CAMPUS</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={styles.title}>Comunicados</Text>
        <RefreshButton refreshing={refreshing} onPress={() => void carregarComunicados(true)} />
      </View>
      <Text style={styles.subtitle}>
        Publique avisos gerais ou direcionados a uma turma.
      </Text>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>
          {editingId !== null
            ? `Editando comunicado #${editingId}`
            : 'Novo comunicado'}
        </Text>

        <Text style={styles.label}>Público</Text>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[
              styles.segmentOption,
              abrangencia === 'GERAL' && styles.segmentSelected,
            ]}
            onPress={() => setAbrangencia('GERAL')}
          >
            <Text
              style={[
                styles.segmentText,
                abrangencia === 'GERAL' && styles.segmentTextSelected,
              ]}
            >
              Geral
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentOption,
              abrangencia === 'TURMA' && styles.segmentSelected,
            ]}
            onPress={() => setAbrangencia('TURMA')}
          >
            <Text
              style={[
                styles.segmentText,
                abrangencia === 'TURMA' && styles.segmentTextSelected,
              ]}
            >
              Turma
            </Text>
          </TouchableOpacity>
        </View>

        {abrangencia === 'TURMA' && (
          <>
            <Text style={styles.label}>ID da turma</Text>
            <TextInput
              style={styles.input}
              value={idTurma}
              onChangeText={setIdTurma}
              placeholder="Ex.: 1"
              keyboardType="numeric"
            />
            <Text style={styles.helper}>
              Informe o ID de uma turma existente no sistema.
            </Text>
          </>
        )}

        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Título do comunicado"
          maxLength={150}
        />

        <Text style={styles.label}>Mensagem</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={conteudo}
          onChangeText={setConteudo}
          placeholder="Escreva a mensagem..."
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.disabledButton]}
          onPress={() => void salvarComunicado()}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>
            {submitting
              ? 'Salvando...'
              : editingId !== null
                ? 'Salvar alterações'
                : 'Publicar comunicado'}
          </Text>
        </TouchableOpacity>

        {editingId !== null && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={limparFormulario}
            disabled={submitting}
          >
            <Text style={styles.secondaryButtonText}>Cancelar edição</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.listHeader}>
        <View>
          <Text style={styles.sectionTitle}>Publicações</Text>
          <Text style={styles.helper}>
            {search.trim()
              ? 'Resultados da pesquisa (máx. 5).'
              : 'Publicações recentes (máx. 5).'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => void carregarComunicados(true)}
          disabled={refreshing}
        >
          <Text style={styles.refreshText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Pesquisar por ID, título ou conteúdo"
      />

      {loading ? (
        <ActivityIndicator color="#dc2626" style={styles.loader} />
      ) : comunicadosVisiveis.length === 0 ? (
        <Text style={styles.empty}>
          {comunicados.length === 0
            ? 'Nenhum comunicado encontrado.'
            : 'Nenhum resultado para essa pesquisa.'}
        </Text>
      ) : (
        comunicadosVisiveis.map((item) => (
          <View key={item.id_comunicado} style={styles.noticeCard}>
            <TouchableOpacity
              style={styles.noticeContent}
              onPress={() => setSelectedNotice(item)}
            >
              <Text style={styles.noticeTitle}>{item.titulo}</Text>
              <Text style={styles.noticeAudience}>{publicoLabel(item)}</Text>
              <Text style={styles.noticeDate}>{formatarData(item)}</Text>
              <Text style={styles.noticePreview} numberOfLines={2}>
                {item.conteudo}
              </Text>
            </TouchableOpacity>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => iniciarEdicao(item)}
                style={styles.actionButton}
              >
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => excluirComunicado(item)}
                style={styles.actionButton}
              >
                <Text style={styles.deleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Modal
        visible={selectedNotice !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalEyebrow}>
                COMUNICADO #{selectedNotice?.id_comunicado}
              </Text>
              <Text style={styles.modalTitle}>{selectedNotice?.titulo}</Text>
              <Text style={styles.noticeAudience}>
                {selectedNotice ? publicoLabel(selectedNotice) : ''}
              </Text>
              <Text style={styles.noticeDate}>
                {selectedNotice ? formatarData(selectedNotice) : ''}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.modalBody}>{selectedNotice?.conteudo}</Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setSelectedNotice(null)}
            >
              <Text style={styles.primaryButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 16, paddingBottom: 32 },
  eyebrow: { color: '#dc2626', fontSize: 10, fontWeight: '800' },
  title: {
    color: '#0f172a',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 5,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 5,
    marginBottom: 16,
  },
  panel: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
    marginBottom: 10,
  },
  multilineInput: { minHeight: 120, paddingTop: 12 },
  helper: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 8,
  },
  segmentOption: {
    flex: 1,
    alignItems: 'center',
    padding: 9,
    borderRadius: 6,
  },
  segmentSelected: { backgroundColor: '#fff' },
  segmentText: { color: '#64748b', fontWeight: '600' },
  segmentTextSelected: { color: '#dc2626' },
  primaryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  secondaryButton: { padding: 12, alignItems: 'center', marginTop: 4 },
  secondaryButtonText: { color: '#475569', fontWeight: '700' },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshText: { color: '#dc2626', fontWeight: '700' },
  loader: { marginVertical: 24 },
  empty: { color: '#64748b', textAlign: 'center', padding: 24 },
  noticeCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
  },
  noticeContent: { paddingBottom: 8 },
  noticeTitle: { color: '#0f172a', fontSize: 15, fontWeight: '800' },
  noticeAudience: { color: '#475569', fontSize: 12, marginTop: 6 },
  noticeDate: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  noticePreview: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  actionButton: { marginRight: 20, paddingVertical: 4 },
  editText: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  deleteText: { color: '#dc2626', fontWeight: '700', fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalEyebrow: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  modalTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },
  modalBody: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
});