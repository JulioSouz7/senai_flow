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

interface Relato {
  id_relato?: number;
  id?: number;
  id_relatos_sugestoes?: number;
  protocolo?: string;
  nome_remetente?: string;
  tipo_usuario?: string;
  tipo?: string;
  usuario?: {
    nome?: string;
    email?: string;
    tipo?: string;
  };
  assunto?: string;
  descricao?: string;
  conteudo?: string;
  status?: string;
  resposta?: string;
  resposta_institucional?: string;
  dt_envio?: string;
  prazo_resposta?: string;
  criado_em?: string;
  createdAt?: string;
}

type Categoria = 'ENVIADO' | 'RESPONDIDO' | 'CORPORATIVO';
type Filtro = Categoria | 'TODOS';

function extrairRelatos(data: any): Relato[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.relatos)) return data.relatos;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function obterId(item: Relato): number | null {
  const id = item.id_relato ?? item.id ?? item.id_relatos_sugestoes;
  return typeof id === 'number' && Number.isFinite(id) && id > 0 ? id : null;
}

function obterCategoria(item: Relato): Categoria {
  const status = (item.status || '').toUpperCase();

  if (status === 'CORPORATIVO' || status === 'ARQUIVADO') {
    return 'CORPORATIVO';
  }

  if (status === 'LIDO' || status === 'RESPONDIDO') {
    return 'RESPONDIDO';
  }

  return 'ENVIADO';
}

function formatarProtocolo(item: Relato): string {
  if (item.protocolo) return item.protocolo;

  const id = obterId(item);
  return id === null ? 'Protocolo indisponível' : `#RL-${String(id).padStart(4, '0')}`;
}

function formatarRemetente(item: Relato): string {
  const nome = item.nome_remetente || item.usuario?.nome || 'Usuário anônimo';
  const tipo =
    item.tipo_usuario ||
    item.usuario?.tipo ||
    (item.tipo === 'RECLAMACAO' ? 'Reclamação' : 'Geral');

  return `${nome} · ${tipo}`;
}

function formatarData(item: Relato): string {
  const valor = item.dt_envio || item.criado_em || item.createdAt;
  if (!valor) return 'Data não informada';

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calcularPrazo(item: Relato): string {
  const categoria = obterCategoria(item);
  if (categoria === 'CORPORATIVO') return 'Arquivado';
  if (categoria === 'RESPONDIDO') return 'Concluído';

  const dataPrazo = item.prazo_resposta
    ? new Date(item.prazo_resposta)
    : (() => {
        const envio = item.dt_envio || item.criado_em || item.createdAt;
        if (!envio) return null;

        const data = new Date(envio);
        if (Number.isNaN(data.getTime())) return null;
        data.setDate(data.getDate() + 5);
        return data;
      })();

  if (!dataPrazo || Number.isNaN(dataPrazo.getTime())) return 'Prazo não informado';

  const dias = Math.ceil(
    (dataPrazo.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  if (dias < 0) return 'Prazo expirado';
  if (dias === 0) return 'Prazo vence hoje';
  if (dias === 1) return '1 dia restante';
  return `${dias} dias restantes`;
}

export function SuggestionsScreen({ notify }: Props) {
  const [relatos, setRelatos] = useState<Relato[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('TODOS');

  const [relatoSelecionado, setRelatoSelecionado] = useState<Relato | null>(null);
  const [resposta, setResposta] = useState('');
  const [statusSelecionado, setStatusSelecionado] =
    useState<Categoria>('RESPONDIDO');

  const carregarRelatos = useCallback(async (atualizar = false) => {
    if (atualizar) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/relatos-sugestoes');
      setRelatos(extrairRelatos(response.data));
      if (atualizar) notify?.('Relatos e sugestões atualizados.');
    } catch (error: any) {
      console.error('Erro ao carregar relatos:', {
        status: error?.response?.status,
        url: error?.config?.url,
        resposta: error?.response?.data,
      });
      notify?.(
        error?.response?.data?.message ||
          error?.response?.data?.mensagem ||
          'Não foi possível carregar os relatos.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notify]);

  useEffect(() => {
    void carregarRelatos();
  }, [carregarRelatos]);

  const abrirRelato = (item: Relato) => {
    setRelatoSelecionado(item);
    setResposta(item.resposta || item.resposta_institucional || '');
    setStatusSelecionado(obterCategoria(item));
  };

  const salvarAtendimento = async () => {
    if (!relatoSelecionado) return;

    const id = obterId(relatoSelecionado);
    if (id === null) {
      notify?.('Este relato não possui um ID válido para atualização.');
      return;
    }

    // A API usa LIDO para representar o status Respondido.
    const statusApi =
      statusSelecionado === 'RESPONDIDO' ? 'LIDO' : statusSelecionado;

    try {
      setSubmitting(true);

      await api.patch(`/relatos-sugestoes/${id}/responder`, {
        status: statusApi,
        resposta: resposta.trim(),
      });

      notify?.(`Relato ${formatarProtocolo(relatoSelecionado)} atualizado.`);
      setRelatoSelecionado(null);
      await carregarRelatos(true);
    } catch (error: any) {
      console.error('Erro ao atualizar relato:', {
        status: error?.response?.status,
        resposta: error?.response?.data,
      });

      notify?.(
        error?.response?.data?.message ||
          error?.response?.data?.mensagem ||
          'Não foi possível atualizar o atendimento.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const arquivarRelato = (item: Relato) => {
    const id = obterId(item);
    if (id === null) {
      notify?.('Este relato não possui um ID válido para arquivamento.');
      return;
    }

    Alert.alert(
      'Arquivar relato',
      `Deseja arquivar ${formatarProtocolo(item)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arquivar',
          onPress: async () => {
            try {
              await api.patch(`/relatos-sugestoes/${id}/arquivar`);
              notify?.(`Relato ${formatarProtocolo(item)} arquivado.`);
              await carregarRelatos(true);
            } catch (error: any) {
              console.error('Erro ao arquivar relato:', error?.response?.data);
              notify?.('Não foi possível arquivar o relato.');
            }
          },
        },
      ],
    );
  };

  const excluirRelato = (item: Relato) => {
    const id = obterId(item);
    if (id === null) {
      notify?.('Este relato não possui um ID válido para exclusão.');
      return;
    }

    Alert.alert(
      'Excluir relato',
      `Excluir definitivamente ${formatarProtocolo(item)}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/relatos-sugestoes/${id}`);
              setRelatos((lista) =>
                lista.filter((relato) => obterId(relato) !== id),
              );
              if (obterId(relatoSelecionado || {}) === id) {
                setRelatoSelecionado(null);
              }
              notify?.(`Relato ${formatarProtocolo(item)} excluído.`);
            } catch (error: any) {
              console.error('Erro ao excluir relato:', error?.response?.data);
              notify?.('Não foi possível excluir o relato.');
            }
          },
        },
      ],
    );
  };

  const contagens = useMemo(() => ({
    ENVIADO: relatos.filter((item) => obterCategoria(item) === 'ENVIADO').length,
    RESPONDIDO: relatos.filter((item) => obterCategoria(item) === 'RESPONDIDO').length,
    CORPORATIVO: relatos.filter((item) => obterCategoria(item) === 'CORPORATIVO').length,
    TODOS: relatos.length,
  }), [relatos]);

  const relatosFiltrados = useMemo(() => {
    const termo = search.toLowerCase().trim().replace('#rl-', '').replace('#', '');

    return relatos.filter((item) => {
      if (filtro !== 'TODOS' && obterCategoria(item) !== filtro) return false;
      if (!termo) return true;

      const id = obterId(item);
      const texto = [
        id === null ? '' : String(id),
        item.protocolo || '',
        item.nome_remetente || '',
        item.usuario?.nome || '',
        item.assunto || '',
        item.descricao || '',
        item.conteudo || '',
      ]
        .join(' ')
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [relatos, filtro, search]);

  const filtros: { key: Filtro; label: string }[] = [
    { key: 'TODOS', label: 'Todos' },
    { key: 'ENVIADO', label: 'Enviados' },
    { key: 'RESPONDIDO', label: 'Respondidos' },
    { key: 'CORPORATIVO', label: 'Arquivados' },
  ];

  const assunto = (item: Relato) =>
    item.assunto ||
    (item.tipo === 'RECLAMACAO' ? 'Reclamação' : 'Sugestão');

  const conteudo = (item: Relato) =>
    item.descricao || item.conteudo || 'Sem detalhamento.';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void carregarRelatos(true)}
          tintColor="#dc2626"
        />
      }
    >
      <Text style={styles.eyebrow}>ATENDIMENTO INSTITUCIONAL</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={styles.title}>Relatos e sugestões</Text>
        <RefreshButton refreshing={refreshing} onPress={() => void carregarRelatos(true)} />
      </View>
      <Text style={styles.subtitle}>
        Consulte, responda e acompanhe os relatos enviados.
      </Text>

      <TextInput
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Pesquisar por protocolo, nome ou assunto"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
      >
        {filtros.map((item) => {
          const ativo = filtro === item.key;

          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterButton, ativo && styles.filterButtonActive]}
              onPress={() => setFiltro(item.key)}
            >
              <Text
                style={[styles.filterText, ativo && styles.filterTextActive]}
              >
                {item.label} ({contagens[item.key]})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color="#dc2626" style={styles.loader} />
      ) : relatosFiltrados.length === 0 ? (
        <Text style={styles.empty}>
          Nenhum relato encontrado para os filtros aplicados.
        </Text>
      ) : (
        relatosFiltrados.map((item, index) => {
          const categoria = obterCategoria(item);
          const id = obterId(item);

          return (
            <View key={String(id ?? index)} style={styles.card}>
              <TouchableOpacity onPress={() => abrirRelato(item)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.protocol}>
                    {formatarProtocolo(item)}
                  </Text>
                  <Text
                    style={[
                      styles.badge,
                      categoria === 'ENVIADO' && styles.badgeSent,
                      categoria === 'RESPONDIDO' && styles.badgeAnswered,
                      categoria === 'CORPORATIVO' && styles.badgeArchived,
                    ]}
                  >
                    {categoria === 'ENVIADO'
                      ? 'Enviado'
                      : categoria === 'RESPONDIDO'
                        ? 'Respondido'
                        : 'Arquivado'}
                  </Text>
                </View>

                <Text style={styles.sender}>{formatarRemetente(item)}</Text>
                <Text style={styles.meta}>{formatarData(item)}</Text>
                <Text style={styles.subject}>{assunto(item)}</Text>
                <Text style={styles.bodyPreview} numberOfLines={3}>
                  {conteudo(item)}
                </Text>

                {!!(item.resposta || item.resposta_institucional) && (
                  <Text style={styles.answerPreview} numberOfLines={2}>
                    Resposta: {item.resposta || item.resposta_institucional}
                  </Text>
                )}

                <Text style={styles.deadline}>
                  Prazo: {calcularPrazo(item)}
                </Text>
              </TouchableOpacity>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => abrirRelato(item)}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionText}>
                    {categoria === 'RESPONDIDO' ? 'Editar resposta' : 'Ver / responder'}
                  </Text>
                </TouchableOpacity>

                {categoria !== 'CORPORATIVO' && (
                  <TouchableOpacity
                    onPress={() => arquivarRelato(item)}
                    style={styles.actionButton}
                  >
                    <Text style={styles.archiveText}>Arquivar</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => excluirRelato(item)}
                  style={styles.actionButton}
                >
                  <Text style={styles.deleteText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <Modal
        visible={relatoSelecionado !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRelatoSelecionado(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Atendimento · {relatoSelecionado
                    ? formatarProtocolo(relatoSelecionado)
                    : ''}
                </Text>
                <TouchableOpacity onPress={() => setRelatoSelecionado(null)}>
                  <Text style={styles.closeText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              {relatoSelecionado && (
                <>
                  <Text style={styles.detail}>
                    <Text style={styles.detailLabel}>Remetente: </Text>
                    {formatarRemetente(relatoSelecionado)}
                  </Text>
                  <Text style={styles.detail}>
                    <Text style={styles.detailLabel}>Enviado: </Text>
                    {formatarData(relatoSelecionado)}
                  </Text>
                  <Text style={styles.detail}>
                    <Text style={styles.detailLabel}>Assunto: </Text>
                    {assunto(relatoSelecionado)}
                  </Text>

                  <Text style={styles.sectionTitle}>Relato</Text>
                  <Text style={styles.fullContent}>
                    {conteudo(relatoSelecionado)}
                  </Text>

                  <Text style={styles.sectionTitle}>Status</Text>
                  <View style={styles.statusOptions}>
                    {(
                      ['ENVIADO', 'RESPONDIDO', 'CORPORATIVO'] as Categoria[]
                    ).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusOption,
                          statusSelecionado === status && styles.statusOptionActive,
                        ]}
                        onPress={() => setStatusSelecionado(status)}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            statusSelecionado === status &&
                              styles.statusOptionTextActive,
                          ]}
                        >
                          {status === 'ENVIADO'
                            ? 'Pendente'
                            : status === 'RESPONDIDO'
                              ? 'Respondido'
                              : 'Arquivado'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>Resposta institucional</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={resposta}
                    onChangeText={setResposta}
                    placeholder="Escreva uma resposta. Ela pode ficar em branco."
                    multiline
                    textAlignVertical="top"
                  />

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      submitting && styles.disabledButton,
                    ]}
                    onPress={() => void salvarAtendimento()}
                    disabled={submitting}
                  >
                    <Text style={styles.primaryButtonText}>
                      {submitting ? 'Salvando...' : 'Salvar atendimento'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
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
    fontSize: 24,
    fontWeight: '800',
    marginTop: 5,
  },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 5, marginBottom: 16 },
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
  filters: { marginBottom: 12, flexGrow: 0 },
  filterButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  filterButtonActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  filterText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  loader: { marginVertical: 24 },
  empty: { color: '#64748b', textAlign: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  protocol: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  badge: {
    overflow: 'hidden',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeSent: { backgroundColor: '#e0f2fe', color: '#0369a1' },
  badgeAnswered: { backgroundColor: '#d1fae5', color: '#047857' },
  badgeArchived: { backgroundColor: '#f3e8ff', color: '#7e22ce' },
  sender: { color: '#334155', fontSize: 13, marginTop: 10 },
  meta: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  subject: { color: '#0f172a', fontSize: 14, fontWeight: '700', marginTop: 10 },
  bodyPreview: { color: '#64748b', fontSize: 13, lineHeight: 19, marginTop: 5 },
  answerPreview: { color: '#047857', fontSize: 12, marginTop: 8 },
  deadline: { color: '#64748b', fontSize: 11, marginTop: 8 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 12,
    paddingTop: 10,
  },
  actionButton: { marginRight: 18, marginBottom: 4 },
  actionText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  archiveText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  deleteText: { color: '#b91c1c', fontSize: 12, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    padding: 16,
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  closeText: { color: '#dc2626', fontWeight: '700', paddingLeft: 10 },
  detail: { color: '#475569', fontSize: 13, marginBottom: 8 },
  detailLabel: { color: '#0f172a', fontWeight: '700' },
  sectionTitle: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  fullContent: {
    color: '#334155',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    lineHeight: 20,
  },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusOption: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusOptionActive: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  statusOptionText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  statusOptionTextActive: { color: '#dc2626' },
  multilineInput: { minHeight: 110, marginTop: 4 },
  primaryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
});