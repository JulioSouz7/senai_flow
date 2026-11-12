import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, getApiError } from '@/services/api';
import type { ApiRecord } from '@/types/mobile';
import { useFeedback } from '@/components/FeedbackProvider';
import { RefreshButton } from '@/components/RefreshButton';

function collection(data: unknown): ApiRecord[] {
  return Array.isArray(data)
    ? data.filter((item): item is ApiRecord => Boolean(item) && typeof item === 'object')
    : [];
}

function idOf(record: ApiRecord, ...keys: string[]): string {
  const key = keys.find((candidate) => record[candidate] !== undefined && record[candidate] !== null);
  return key ? String(record[key]) : '';
}

function activeReservation(reservation: ApiRecord): boolean {
  const status = String(reservation.status ?? '').toUpperCase();
  return status !== 'ENCERRADA' && status !== 'CANCELADA' && status !== 'REJEITADA';
}

function availableCount(item: ApiRecord): number {
  const stockItems = Array.isArray(item.sala_equipamento) ? item.sala_equipamento : [];
  return stockItems.reduce((total, entry) => {
    if (!entry || typeof entry !== 'object') return total;
    return total + Number((entry as ApiRecord).quantidade ?? 0);
  }, 0);
}

export default function EquipmentScreen() {
  const { notify } = useFeedback();
  const [equipment, setEquipment] = useState<ApiRecord[]>([]);
  const [reservations, setReservations] = useState<ApiRecord[]>([]);
  const [history, setHistory] = useState<ApiRecord[]>([]);
  const [reservationId, setReservationId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingId, setPendingId] = useState('');
  const [error, setError] = useState('');

  const loadData = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [equipmentResponse, reservationsResponse, historyResponse] = await Promise.all([
        api.get('/equipamentos'),
        api.get('/reservas/minhas-reservas'),
        api.get('/solicitacoes-equipamentos'),
      ]);
      setEquipment(collection(equipmentResponse.data));
      const openReservations = collection(reservationsResponse.data).filter(activeReservation);
      setReservations(openReservations);
      setHistory(collection(historyResponse.data));
      if (!reservationId && openReservations.length) {
        setReservationId(idOf(openReservations[0], 'id_reserva', 'id'));
      }
      if (manual) notify('Equipamentos e histórico atualizados.', 'success');
    } catch (requestError) {
      const message = getApiError(requestError, 'Não foi possível carregar equipamentos, reservas e histórico.');
      setError(message);
      if (manual) notify(message, 'error');
    } finally {
      if (manual) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const request = async (item: ApiRecord) => {
    const equipmentId = idOf(item, 'id_equipamento', 'id');
    const name = String(item.nome ?? 'Equipamento');
    const quantity = Number(quantities[equipmentId] ?? '1');
    if (!reservationId) {
      notify('Selecione uma reserva ativa para vincular ao pedido.', 'warning');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      notify('Informe uma quantidade inteira maior que zero.', 'warning');
      return;
    }
    const maxQuantity = Math.max(1, availableCount(item));
    if (quantity > maxQuantity) {
      notify(`A quantidade máxima disponível é ${maxQuantity}.`, 'warning');
      return;
    }

    setPendingId(equipmentId);
    try {
      await api.post('/solicitacoes-equipamentos', {
        id_reserva: Number(reservationId),
        itens: [{ id_equipamento: Number(equipmentId), quantidade: quantity }],
      });
      notify(`${name} foi solicitado com sucesso.`, 'success');
      await loadData();
    } catch (requestError) {
      notify(getApiError(requestError, 'Tente novamente.'), 'error');
    } finally {
      setPendingId('');
    }
  };

  if (loading) {
    return <View style={styles.status}><ActivityIndicator color="#e30613" /><Text style={styles.muted}>Carregando equipamentos...</Text></View>;
  }
  if (error) {
    return (
      <View style={styles.empty}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => void loadData()} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Solicitar equipamentos</Text>
        <RefreshButton label="equipamentos e histórico" refreshing={refreshing} onPress={() => void loadData(true)} />
      </View>
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Reserva ativa</Text>
        {reservations.length ? (
          <View style={styles.chips}>
            {reservations.map((reservation, index) => {
              const id = idOf(reservation, 'id_reserva', 'id');
              const room = reservation.sala && typeof reservation.sala === 'object'
                ? (reservation.sala as ApiRecord).nome
                : undefined;
              return (
                <Pressable
                  key={id || index}
                  onPress={() => setReservationId(id)}
                  style={[styles.chip, reservationId === id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, reservationId === id && styles.chipTextActive]}>
                    {String(room ?? `Reserva ${id || index + 1}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.muted}>Não há reservas ativas para vincular ao pedido.</Text>
        )}
      </View>

      {equipment.length ? equipment.map((item, index) => {
        const id = idOf(item, 'id_equipamento', 'id');
        const name = String(item.nome ?? 'Equipamento');
        const available = availableCount(item);
        return (
          <View key={id || index} style={styles.card}>
            <Text style={styles.itemTitle}>{name}</Text>
            {item.descricao ? <Text style={styles.muted}>{String(item.descricao)}</Text> : null}
            <Text style={styles.stock}>Disponível: {available}</Text>
            <View style={styles.requestRow}>
              <TextInput
                keyboardType="number-pad"
                onChangeText={(value) => setQuantities((current) => ({ ...current, [id]: value }))}
                placeholder="Qtd."
                style={styles.quantity}
                value={quantities[id] ?? '1'}
              />
              <Pressable
                disabled={!reservations.length || pendingId === id}
                onPress={() => void request(item)}
                style={({ pressed }) => [styles.requestButton, pressed && styles.pressed, !reservations.length && styles.disabled]}
              >
                {pendingId === id
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.requestText}>Solicitar</Text>}
              </Pressable>
            </View>
          </View>
        );
      }) : <Text style={styles.muted}>Nenhum equipamento encontrado.</Text>}

      <View style={styles.historyHeading}>
        <Text style={styles.sectionTitle}>Histórico de solicitações</Text>
      </View>
      {history.length === 0 ? (
        <Text style={styles.muted}>Você ainda não possui solicitações de equipamentos.</Text>
      ) : history.map((request, index) => {
        const requestId = idOf(request, 'id_solicitacao', 'id');
        const requestedAt = typeof request.dt_solicitacao === 'string'
          ? new Date(request.dt_solicitacao).toLocaleString('pt-BR')
          : '';
        const items = Array.isArray(request.itens) ? request.itens as ApiRecord[] : [];
        return (
          <View key={requestId || index} style={styles.historyCard}>
            <Text style={styles.historyStatus}>{String(request.status ?? 'Status não informado')}</Text>
            {requestedAt ? <Text style={styles.muted}>Solicitado em {requestedAt}</Text> : null}
            {items.map((entry, itemIndex) => {
              const equipmentItem = entry.equipamento && typeof entry.equipamento === 'object'
                ? entry.equipamento as ApiRecord
                : {};
              return (
                <Text key={idOf(entry, 'id_item_solicitacao', 'id') || itemIndex} style={styles.historyItem}>
                  {String(equipmentItem.nome ?? 'Equipamento')} · quantidade {String(entry.quantidade ?? 1)}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  status: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  container: { gap: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  historyHeading: { marginTop: 16 },
  panel: { padding: 15, borderRadius: 12, backgroundColor: '#fff' },
  sectionTitle: { marginBottom: 9, color: '#111827', fontSize: 14, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18 },
  chipActive: { borderColor: '#e30613', backgroundColor: '#fff0f1' },
  chipText: { color: '#4b5563', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#bd0010' },
  card: { padding: 15, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff' },
  itemTitle: { color: '#111827', fontSize: 15, fontWeight: '800' },
  muted: { marginTop: 4, color: '#6b7280', fontSize: 12, lineHeight: 18 },
  stock: { marginTop: 8, color: '#374151', fontSize: 12, fontWeight: '700' },
  requestRow: { flexDirection: 'row', gap: 9, marginTop: 12 },
  quantity: { width: 76, minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, color: '#111827', textAlign: 'center' },
  requestButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: 8, backgroundColor: '#e30613' },
  requestText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
  empty: { padding: 16, borderRadius: 12, backgroundColor: '#fff' },
  error: { color: '#991b1b', fontSize: 13, lineHeight: 19 },
  retry: { alignSelf: 'flex-start', marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: '#fff0f1' },
  retryText: { color: '#bd0010', fontSize: 12, fontWeight: '800' },
  historyCard: { padding: 14, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, backgroundColor: '#fff', gap: 6 },
  historyStatus: { color: '#111827', fontSize: 13, fontWeight: '800' },
  historyItem: { color: '#374151', fontSize: 12 },
});
