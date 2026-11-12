import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api, getApiError } from '@/services/api';
import type { ApiRecord } from '@/types/mobile';
import { RefreshButton } from '@/components/RefreshButton';
import { useFeedback } from '@/components/FeedbackProvider';

interface Announcement extends ApiRecord {
  id_comunicado: number;
  titulo: string;
  conteudo: string;
  abrangencia: string;
  dt_publicacao?: string;
  administrador?: { usuario?: { nome?: string } };
  reserva?: { sala?: { nome: string } };
}

export default function NotificationScreen() {
  const { notify } = useFeedback();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadAnnouncements = async (manual = false) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get<Announcement[]>('/comunicados');
      setAnnouncements(Array.isArray(data) ? data.filter((item) => item.abrangencia === 'GERAL') : []);
      if (manual) notify('Comunicados atualizados.', 'success');
    } catch (requestError: unknown) {
      const message = getApiError(requestError, 'Não foi possível carregar os comunicados gerais.');
      setError(message);
      notify(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnnouncements();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.pageHeader}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>QUADRO DE AVISOS</Text>
            <Text style={styles.pageTitle}>Comunicados</Text>
          </View>
          <RefreshButton label="comunicados" refreshing={refreshing} onPress={async () => {
            if (refreshing) return;
            setRefreshing(true);
            await loadAnnouncements(true);
            setRefreshing(false);
          }} />
        </View>
        <Text style={styles.pageSubtitle}>
          Acompanhe os avisos institucionais gerais destinados à comunidade docente e à instituição.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Comunicados Gerais ({announcements.length})</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#e30613" style={{ marginTop: 40 }} />
        ) : error ? (
          <Text accessibilityRole="alert" style={styles.emptyText}>{error}</Text>
        ) : announcements.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum comunicado geral disponível.</Text>
        ) : announcements.map((item) => (
          <View key={item.id_comunicado} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.titulo || 'Comunicado sem título'}</Text>
              {formatDate(item.dt_publicacao) ? (
                <Text style={styles.cardDate}>{formatDate(item.dt_publicacao)}</Text>
              ) : null}
            </View>
            <Text style={styles.cardContent}>{item.conteudo || ''}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardAuthor}>
                <Text style={styles.bold}>Enviado por: </Text>
                {item.administrador?.usuario?.nome || 'Coordenação'}
              </Text>
              {item.reserva?.sala?.nome ? (
                <View style={styles.roomBadge}>
                  <Text style={styles.roomBadgeText}>{item.reserva.sala.nome}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { paddingBottom: 40 },
  pageHeader: { marginBottom: 24 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 10, fontWeight: '700', color: '#e30613', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  pageSubtitle: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  section: { gap: 0 },
  sectionHeader: { paddingBottom: 8, marginBottom: 16, borderBottomWidth: 2, borderBottomColor: '#e2e8f0' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 24, fontSize: 14 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0f172a' },
  cardDate: { fontSize: 12, color: '#94a3b8' },
  cardContent: { fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  cardAuthor: { fontSize: 12, color: '#64748b' },
  bold: { fontWeight: '700' },
  roomBadge: { backgroundColor: '#fee2e2', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  roomBadgeText: { color: '#e30613', fontWeight: '700', fontSize: 11 },
});
