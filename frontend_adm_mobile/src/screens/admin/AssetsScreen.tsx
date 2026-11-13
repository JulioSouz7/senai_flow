import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, Search, X } from 'lucide-react-native';
import { api, resolverUrlImagemMobile } from '../../services/api';
import { RefreshButton } from '../../components/RefreshButton';

interface Props {
  notify?: (text: string) => void;
}

const filtros = ['Abertos', 'Em análise', 'Concluídos', 'Todos'];

function normalizarStatus(status?: string) {
  return (status || 'ENCAMINHADO')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-_]/g, '');
}

function statusFinalizado(status?: string) {
  const normalizado = normalizarStatus(status);
  return normalizado === 'FINALIZADO' || normalizado === 'CONCLUIDO';
}

function formatarStatus(status?: string) {
  const normalizado = normalizarStatus(status);
  if (normalizado === 'EMANALISE') return 'Em análise';
  if (statusFinalizado(status)) return 'Concluído';
  if (['ENCAMINHADO', 'ABERTO', 'PENDENTE', 'NOVO'].includes(normalizado)) {
    return 'Aberto';
  }
  return status || 'Aberto';
}

export function AssetsScreen({ notify }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avarias, setAvarias] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndex, setFilterIndex] = useState(0);
  const [selectedAvaria, setSelectedAvaria] = useState<any | null>(null);
  const [imageError, setImageError] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const carregarAvarias = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);

    try {
      const response = await api.get('/avarias');
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.avarias || [];
      setAvarias(data);
      if (refresh) notify?.('Avarias e ativos atualizados.');
    } catch (error) {
      console.error('Erro ao carregar avarias:', error);
      notify?.('Erro ao carregar a lista de avarias.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarAvarias();
  }, []);

  const atualizarStatus = async (id: number, novoStatus: string) => {
    if (selectedAvaria && statusFinalizado(selectedAvaria.status)) {
      notify?.('Chamados finalizados não podem voltar para Em análise.');
      return;
    }

    setUpdatingStatus(true);

    try {
      const tentativas = [
        () => api.patch(`/avarias/${id}/status`, { status: novoStatus }),
        () => api.put(`/avarias/${id}/status`, { status: novoStatus }),
        () => api.patch(`/avarias/${id}`, { status: novoStatus }),
        () => api.put(`/avarias/${id}`, { status: novoStatus }),
      ];

      let ultimoErro: any;
      let sucesso = false;

      for (const tentativa of tentativas) {
        try {
          await tentativa();
          sucesso = true;
          break;
        } catch (error) {
          ultimoErro = error;
        }
      }

      if (!sucesso) throw ultimoErro;

      const atualizada = { ...selectedAvaria, status: novoStatus };
      setAvarias((lista) =>
        lista.map((item) =>
          Number(item.id_avaria) === id ? { ...item, status: novoStatus } : item,
        ),
      );
      setSelectedAvaria(atualizada);
      notify?.(`#AV-${id} alterado para ${formatarStatus(novoStatus)}.`);
      await carregarAvarias(true);
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      notify?.(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          'Erro ao atualizar o status no servidor.',
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const solicitarFinalizacao = (id: number) => {
    Alert.alert(
      'Confirmar finalização',
      'Deseja finalizar este chamado? Esta ação não poderá ser revertida.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: () => atualizarStatus(id, 'FINALIZADO'),
        },
      ],
    );
  };

  const avariasFiltradas = [...avarias]
    .sort((a, b) => Number(a.id_avaria) - Number(b.id_avaria))
    .filter((item) => {
      const status = normalizarStatus(item.status);
      let correspondeFiltro = true;

      if (filterIndex === 0) {
        correspondeFiltro = ['ENCAMINHADO', 'ABERTO', 'PENDENTE', 'NOVO'].includes(status);
      } else if (filterIndex === 1) {
        correspondeFiltro = status === 'EMANALISE';
      } else if (filterIndex === 2) {
        correspondeFiltro = statusFinalizado(item.status);
      }

      const busca = searchTerm.trim().toLowerCase();
      const textoBusca = [
        item.equipamento?.nome,
        item.equipamento?.nif,
        item.sala?.nome,
        `#av-${item.id_avaria}`,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return correspondeFiltro && textoBusca.includes(busca);
    });

  const fotoUrl = resolverUrlImagemMobile(selectedAvaria?.foto);
  const selecionadoEmAnalise =
    normalizarStatus(selectedAvaria?.status) === 'EMANALISE';
  const selecionadoFinalizado = statusFinalizado(selectedAvaria?.status);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => carregarAvarias(true)}
            colors={['#dc2626']}
          />
        }
      >
        <Text style={styles.eyebrow}>PATRIMÔNIO E MANUTENÇÃO</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text style={styles.title}>Avarias e ativos</Text>
          <RefreshButton refreshing={refreshing} onPress={() => void carregarAvarias(true)} />
        </View>
        <Text style={styles.description}>
          Acompanhe os chamados por equipamento, local e prioridade.
        </Text>

        <View style={styles.searchBox}>
          <Search size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar NIF, ativo ou sala..."
            placeholderTextColor="#94a3b8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
        >
          {filtros.map((filtro, index) => (
            <TouchableOpacity
              key={filtro}
              style={[
                styles.filterButton,
                filterIndex === index && styles.filterButtonActive,
              ]}
              onPress={() => setFilterIndex(index)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterIndex === index && styles.filterTextActive,
                ]}
              >
                {filtro}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#dc2626"
            style={styles.loader}
          />
        ) : avariasFiltradas.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nenhum registro de avaria encontrado para este filtro.
            </Text>
          </View>
        ) : (
          avariasFiltradas.map((item) => {
            const gravidade = item.gravidade
              ? `${item.gravidade.charAt(0).toUpperCase()}${item.gravidade
                  .slice(1)
                  .toLowerCase()}`
              : 'Média';

            return (
              <View style={styles.card} key={item.id_avaria}>
                <View style={styles.cardHeader}>
                  <Text style={styles.protocol}>#AV-{item.id_avaria}</Text>
                  <StatusBadge status={item.status} />
                </View>

                <Text style={styles.equipmentName}>
                  {item.equipamento?.nome || 'Equipamento não informado'}
                </Text>
                <Text style={styles.detailText}>
                  {item.equipamento?.nif
                    ? `NIF ${item.equipamento.nif}`
                    : 'Sem NIF'}
                  {' • '}
                  {item.sala?.nome || 'Local não informado'}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.priority}>Prioridade: {gravidade}</Text>
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => {
                      setSelectedAvaria(item);
                      setImageError(false);
                    }}
                  >
                    <Text style={styles.detailsButtonText}>Detalhes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={!!selectedAvaria}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAvaria(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedAvaria && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeading}>
                    <Text style={styles.modalTitle}>
                      Chamado #AV-{selectedAvaria.id_avaria}
                    </Text>
                    <StatusBadge status={selectedAvaria.status} />
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedAvaria(null)}
                    accessibilityLabel="Fechar detalhes"
                  >
                    <X size={23} color="#475569" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  <Detail label="Equipamento">
                    {selectedAvaria.equipamento?.nome || 'Não informado'}
                    {' • '}
                    {selectedAvaria.equipamento?.nif || 'Sem NIF'}
                  </Detail>
                  <Detail label="Ambiente">
                    {selectedAvaria.sala?.nome || 'Não informado'}
                  </Detail>
                  <Detail label="Relator">
                    {selectedAvaria.docente?.usuario?.nome || 'Não informado'}
                  </Detail>
                  <Detail label="Gravidade">
                    {selectedAvaria.gravidade || 'Média'}
                  </Detail>
                  <Detail label="Descrição">
                    {selectedAvaria.descricao || 'Sem descrição.'}
                  </Detail>

                  <Text style={styles.detailLabel}>Evidência em foto</Text>
                  {fotoUrl && !imageError ? (
                    <Image
                      source={{ uri: fotoUrl }}
                      style={styles.evidenceImage}
                      resizeMode="contain"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <Text style={styles.noImage}>
                      Nenhuma imagem disponível para este chamado.
                    </Text>
                  )}

                  <Text style={styles.actionsLabel}>Ações operacionais</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        (selecionadoEmAnalise ||
                          selecionadoFinalizado ||
                          updatingStatus) &&
                          styles.buttonDisabled,
                      ]}
                      disabled={
                        selecionadoEmAnalise ||
                        selecionadoFinalizado ||
                        updatingStatus
                      }
                      onPress={() =>
                        atualizarStatus(
                          Number(selectedAvaria.id_avaria),
                          'EM_ANALISE',
                        )
                      }
                    >
                      <Text style={styles.secondaryButtonText}>
                        Em análise
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.finishButton,
                        (selecionadoFinalizado || updatingStatus) &&
                          styles.buttonDisabled,
                      ]}
                      disabled={selecionadoFinalizado || updatingStatus}
                      onPress={() =>
                        solicitarFinalizacao(
                          Number(selectedAvaria.id_avaria),
                        )
                      }
                    >
                      <Text style={styles.finishButtonText}>
                        {updatingStatus ? 'Salvando…' : 'Finalizar'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {selecionadoFinalizado && (
                    <Text style={styles.finalizedNote}>
                      Este chamado foi finalizado e não pode voltar para
                      “Em análise”.
                    </Text>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailBlock}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{children}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const normalizado = normalizarStatus(status);
  const concluido = statusFinalizado(status);
  const emAnalise = normalizado === 'EMANALISE';

  return (
    <View
      style={[
        styles.statusBadge,
        concluido
          ? styles.statusDone
          : emAnalise
            ? styles.statusAnalysis
            : styles.statusOpen,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          concluido
            ? styles.statusDoneText
            : emAnalise
              ? styles.statusAnalysisText
              : styles.statusOpenText,
        ]}
      >
        {formatarStatus(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  eyebrow: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    color: '#0f172a',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 5,
  },
  description: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 11,
    marginTop: 16,
  },
  searchInput: { flex: 1, height: 42, color: '#0f172a', fontSize: 13 },
  filterRow: { marginTop: 12, marginBottom: 8, flexGrow: 0 },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 7,
  },
  filterButtonActive: { backgroundColor: '#fef2f2', borderColor: '#dc2626' },
  filterText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  filterTextActive: { color: '#dc2626' },
  loader: { marginTop: 30 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    marginTop: 8,
  },
  emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  protocol: { color: '#dc2626', fontSize: 12, fontWeight: '800' },
  equipmentName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },
  detailText: { color: '#64748b', fontSize: 12, marginTop: 5 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  priority: { color: '#475569', fontSize: 11, fontWeight: '600' },
  detailsButton: {
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailsButtonText: { color: '#334155', fontSize: 11, fontWeight: '700' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  statusDone: { backgroundColor: '#dcfce7' },
  statusAnalysis: { backgroundColor: '#fef3c7' },
  statusOpen: { backgroundColor: '#e2e8f0' },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusDoneText: { color: '#166534' },
  statusAnalysisText: { color: '#92400e' },
  statusOpenText: { color: '#475569' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHeading: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  modalScroll: { marginTop: 12 },
  detailBlock: { marginBottom: 12 },
  detailLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  detailValue: {
    color: '#334155',
    backgroundColor: '#f8fafc',
    borderRadius: 7,
    padding: 9,
    fontSize: 13,
    lineHeight: 19,
  },
  evidenceImage: {
    width: '100%',
    height: 190,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginTop: 5,
  },
  noImage: { color: '#94a3b8', fontSize: 12, marginTop: 5 },
  actionsLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 9,
  },
  actionRow: { flexDirection: 'row', gap: 9, marginBottom: 12 },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  finishButton: {
    flex: 1,
    minHeight: 42,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  buttonDisabled: { opacity: 0.45 },
  finalizedNote: { color: '#64748b', fontSize: 11, marginBottom: 8 },
});