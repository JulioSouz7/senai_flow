import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, PackageCheck } from 'lucide-react-native';
import { api } from '../../services/api';
import { RefreshButton } from '../../components/RefreshButton';

interface Props {
  notify: (text: string) => void;
}

export function EquipmentApprovalsScreen({ notify }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [equipmentWithIssues, setEquipmentWithIssues] = useState<number[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadRequests = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    let failedRequests = false;

    try {
      const [requestsRes, issuesRes] = await Promise.all([
        api
          .get('/solicitacoes-equipamentos')
          .catch(() => api.get('/solicitacoes').catch((error) => {
            failedRequests = true;
            throw error;
          })),
        api.get('/avarias').catch(() => {
          failedRequests = true;
          return { data: [] };
        }),
      ]);

      const issues = Array.isArray(issuesRes.data)
        ? issuesRes.data
        : issuesRes.data?.avarias || [];

      const issueIds = issues
        .filter((issue: any) => {
          const status = String(issue.status || '').toUpperCase();
          return status !== 'FINALIZADO' && status !== 'CONCLUIDO';
        })
        .map((issue: any) =>
          Number(issue.id_equipamento || issue.equipamento?.id_equipamento),
        )
        .filter((id: number) => Number.isFinite(id) && id > 0);

      setEquipmentWithIssues(issueIds);

      const data = Array.isArray(requestsRes.data)
        ? requestsRes.data
        : requestsRes.data?.solicitacoes || [];

      setRequests(
        data.filter((request: any) => {
          const status = String(request.status || '').toUpperCase();
          return (
            !status ||
            ['PENDENTE', 'ENVIADO', 'EM_ANALISE'].includes(status)
          );
          if (refresh) notify(failedRequests ? 'Solicitações atualizadas parcialmente; algumas informações não foram carregadas.' : 'Solicitações de equipamentos atualizadas.');
        }),
      );
    } catch (error) {
      console.error('Erro ao carregar solicitações de equipamentos:', error);
      notify('Erro ao carregar solicitações de equipamentos.');
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notify]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const decide = async (
    id: number,
    status: 'APROVADO' | 'RECUSADO',
  ) => {
    setProcessingId(id);

    try {
      await api
        .patch(`/solicitacoes-equipamentos/${id}/status`, { status })
        .catch(() =>
          api.patch(`/solicitacoes/${id}/status`, { status }),
        );

      setRequests((current) =>
        current.filter(
          (request) => Number(request.id_solicitacao || request.id) !== id,
        ),
      );
      notify(`#EQ-${id} ${status === 'APROVADO' ? 'aprovada' : 'recusada'} com sucesso.`);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || `Erro ao processar #EQ-${id}.`;
      notify(message);
    } finally {
      setProcessingId(null);
    }
  };

  const getRequestDetails = (request: any) => {
    const id = Number(request.id_solicitacao || request.id);
    const items = Array.isArray(request.itens) && request.itens.length
      ? request.itens
      : Array.isArray(request.itens_solicitacao)
        ? request.itens_solicitacao
        : [];

    const firstItem = items[0];
    const equipment = firstItem?.equipamento || request.equipamento;
    const equipmentName =
      equipment?.nome ||
      request.nome_equipamento ||
      request.descricao ||
      `Equipamento #${id}`;

    const unavailable = items.length
      ? items.some((item: any) => {
          const itemEquipment = item.equipamento || {};
          const status = String(itemEquipment.status || '').toUpperCase();
          const equipmentId = Number(
            item.id_equipamento || itemEquipment.id_equipamento,
          );
          return (
            ['MANUTENCAO', 'INDISPONIVEL', 'INATIVO'].includes(status) ||
            equipmentWithIssues.includes(equipmentId)
          );
        })
      : (() => {
          const status = String(
            equipment?.status || request.status_equipamento || 'DISPONIVEL',
          ).toUpperCase();
          const equipmentId = Number(
            request.id_equipamento || equipment?.id_equipamento,
          );
          return (
            ['MANUTENCAO', 'INDISPONIVEL', 'INATIVO'].includes(status) ||
            equipmentWithIssues.includes(equipmentId)
          );
        })();

    return {
      id,
      equipmentName,
      unavailable,
      quantity: firstItem?.quantidade || request.quantidade || 1,
      requester:
        request.usuario?.nome ||
        request.reserva?.docente?.usuario?.nome ||
        request.reserva?.docente?.nome ||
        request.reserva?.usuario?.nome ||
        request.docente?.nome ||
        'Docente',
      room:
        request.reserva?.sala?.nome ||
        request.sala?.nome ||
        (request.reserva?.id_sala
          ? `Sala ${request.reserva.id_sala}`
          : 'Sala de aula'),
    };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadRequests(true)}
          colors={['#dc2626']}
        />
      }
    >
      <Text style={styles.eyebrow}>ESTOQUE E RECURSOS</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={styles.title}>Solicitações de equipamentos</Text>
        <RefreshButton refreshing={refreshing} onPress={() => void loadRequests(true)} />
      </View>
      <Text style={styles.description}>
        Aprove pedidos conforme a disponibilidade do estoque.
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#dc2626"
          style={styles.loader}
        />
      ) : requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <PackageCheck size={30} color="#64748b" />
          <Text style={styles.emptyText}>
            Nenhuma solicitação de equipamento pendente.
          </Text>
        </View>
      ) : (
        requests.map((request) => {
          const details = getRequestDetails(request);
          const isProcessing = processingId === details.id;

          return (
            <View style={styles.card} key={details.id}>
              <View style={styles.cardHeader}>
                <Text style={styles.protocol}>#EQ-{details.id}</Text>
                <View
                  style={[
                    styles.stockBadge,
                    details.unavailable && styles.unavailableBadge,
                  ]}
                >
                  {details.unavailable && (
                    <AlertTriangle size={13} color="#991b1b" />
                  )}
                  <Text
                    style={[
                      styles.stockText,
                      details.unavailable && styles.unavailableText,
                    ]}
                  >
                    {details.unavailable
                      ? 'Em manutenção / avaria'
                      : 'Estoque disponível'}
                  </Text>
                </View>
              </View>

              <Text style={styles.equipmentName}>{details.equipmentName}</Text>
              <Text style={styles.details}>
                {details.requester} • {details.room} • {details.quantity} un.
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.rejectButton,
                    isProcessing && styles.disabledButton,
                  ]}
                  disabled={isProcessing}
                  onPress={() => decide(details.id, 'RECUSADO')}
                >
                  <Text style={styles.rejectText}>
                    {isProcessing ? 'Processando…' : 'Recusar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.approveButton,
                    (details.unavailable || isProcessing) &&
                      styles.disabledButton,
                  ]}
                  disabled={details.unavailable || isProcessing}
                  onPress={() => decide(details.id, 'APROVADO')}
                >
                  <Text style={styles.approveText}>Aprovar pedido</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
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
    fontSize: 22,
    fontWeight: '800',
    marginTop: 5,
  },
  description: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 16,
  },
  loader: { marginTop: 32 },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  protocol: { color: '#dc2626', fontSize: 12, fontWeight: '800' },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  unavailableBadge: { backgroundColor: '#fee2e2' },
  stockText: { color: '#166534', fontSize: 10, fontWeight: '700' },
  unavailableText: { color: '#991b1b' },
  equipmentName: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  details: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  rejectButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  approveButton: {
    flex: 1,
    minHeight: 42,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 26,
    gap: 10,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
});