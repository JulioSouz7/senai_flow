import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { api, getApiError } from '@/services/api';
import type { ApiRecord } from '@/types/mobile';
import { RefreshButton } from '@/components/RefreshButton';
import { useFeedback } from '@/components/FeedbackProvider';

interface ClassRecord extends ApiRecord {
  id_turma: number;
  curso?: string;
  docente_turma?: Array<{
    docente?: {
      usuario?: { nome?: string; email?: string };
    };
  }>;
}

interface Announcement extends ApiRecord {
  id_comunicado: number;
  id_turma: number | null;
  abrangencia: string;
  titulo: string;
  conteudo: string;
  dt_publicacao?: string;
  administrador?: { usuario?: { nome?: string } };
}

interface MyClassScreenProps {
  classes: ClassRecord[];
  selectedClassId: number | null;
  onSelectClass: (id: number) => void;
  loading: boolean;
  error: string;
  onRefresh: () => Promise<boolean>;
}

export default function MyClassScreen({
  classes,
  selectedClassId,
  onSelectClass,
  loading,
  error,
  onRefresh,
}: MyClassScreenProps) {
  const { notify } = useFeedback();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const loadAnnouncements = useCallback(async (): Promise<boolean> => {
    const currentRequestId = ++requestId.current;
    if (selectedClassId === null) {
      setAnnouncements([]);
      setAnnouncementsLoading(false);
      setAnnouncementsError('');
      return true;
    }

    setAnnouncementsLoading(true);
    setAnnouncementsError('');
    try {
      const { data } = await api.get<{ comunicados?: Announcement[] }>('/comunicados/minha-turma', {
        params: { id_turma: selectedClassId },
      });
      if (requestId.current !== currentRequestId) return false;
      const rows = Array.isArray(data.comunicados) ? data.comunicados : [];
      setAnnouncements(rows.filter((item) => item.abrangencia === 'TURMA' && item.id_turma === selectedClassId));
      return true;
    } catch (requestError: unknown) {
      if (requestId.current !== currentRequestId) return false;
      const message = getApiError(requestError, 'Não foi possível carregar os comunicados desta turma.');
      setAnnouncementsError(message);
      notify(message, 'error');
      return false;
    } finally {
      if (requestId.current === currentRequestId) setAnnouncementsLoading(false);
    }
  }, [selectedClassId, notify]);

  const refreshClass = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const [classesLoaded, announcementsLoaded] = await Promise.all([onRefresh(), loadAnnouncements()]);
      if (classesLoaded && announcementsLoaded) notify('Turma e comunicados atualizados.', 'success');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAnnouncements();
    return () => {
      requestId.current += 1;
    };
  }, [loadAnnouncements]);

  const turma = classes.find((item) => item.id_turma === selectedClassId);
  const professores = turma?.docente_turma
    ?.map((vinculo) => vinculo.docente?.usuario)
    .filter((usuario): usuario is { nome?: string; email?: string } => Boolean(usuario)) ?? [];
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#e30613" style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.message}>{error}</Text>
      ) : classes.length === 0 ? (
        <Text style={styles.message}>Nenhuma turma está vinculada ao seu perfil.</Text>
      ) : (
        <>
          {classes.length > 1 ? (
            <View style={styles.selector}>
              {classes.map((item) => (
                <Pressable
                  key={item.id_turma}
                  onPress={() => onSelectClass(item.id_turma)}
                  style={[styles.selectorItem, selectedClassId === item.id_turma && styles.selectorItemActive]}
                >
                  <Text style={[styles.selectorText, selectedClassId === item.id_turma && styles.selectorTextActive]}>
                    {item.nome ?? `Turma ${item.id_turma}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {turma ? (
            <View style={styles.card}>
              <Text style={styles.eyebrow}>MINHA TURMA</Text>
              <Text style={styles.title}>{turma.nome ?? 'Turma'}</Text>
              <Text style={styles.course}>{turma.curso ?? 'Curso não informado pela API'}</Text>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Professores relacionados</Text>
              {professores.length === 0 ? (
                <Text style={styles.message}>Nenhum professor relacionado retornado pela API.</Text>
              ) : professores.map((professor, index) => (
                <View key={`${professor.email ?? professor.nome ?? 'professor'}-${index}`} style={styles.teacher}>
                  <Text style={styles.teacherName}>{professor.nome ?? 'Nome não informado'}</Text>
                  {professor.email ? <Text style={styles.teacherEmail}>{professor.email}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}

          <View>
            <View style={styles.announcementsHeading}>
              <Text style={styles.sectionTitle}>Comunicados da Turma</Text>
              <RefreshButton label="turma e comunicados" refreshing={refreshing} onPress={() => void refreshClass()} />
            </View>
            {announcementsLoading ? (
              <ActivityIndicator size="small" color="#e30613" style={{ marginTop: 16 }} />
            ) : announcementsError ? (
              <Text accessibilityRole="alert" style={styles.message}>{announcementsError}</Text>
            ) : announcements.length === 0 ? (
              <Text style={styles.message}>Nenhum comunicado destinado a esta turma.</Text>
            ) : announcements.map((item) => (
              <View key={item.id_comunicado} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <Text style={styles.announcementTitle}>{item.titulo}</Text>
                  {formatDate(item.dt_publicacao) ? (
                    <Text style={styles.announcementDate}>{formatDate(item.dt_publicacao)}</Text>
                  ) : null}
                </View>
                <Text style={styles.announcementContent}>{item.conteudo}</Text>
                <Text style={styles.announcementAuthor}>
                  <Text style={styles.bold}>Enviado por: </Text>
                  {item.administrador?.usuario?.nome ?? 'Coordenação'}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingBottom: 24 },
  selector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorItem: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  selectorItemActive: { backgroundColor: '#fff0f1', borderColor: '#e30613' },
  selectorText: { color: '#4b5563', fontSize: 12, fontWeight: '600' },
  selectorTextActive: { color: '#bd0010' },
  card: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', padding: 18 },
  eyebrow: { color: '#e30613', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#111827', fontSize: 22, fontWeight: '800', marginTop: 8 },
  course: { color: '#6b7280', fontSize: 14, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 16 },
  sectionTitle: { color: '#111827', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  announcementsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  message: { color: '#6b7280', fontSize: 13, lineHeight: 19, padding: 14 },
  teacher: { paddingVertical: 8 },
  teacherName: { color: '#1f2937', fontSize: 14, fontWeight: '600' },
  teacherEmail: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  announcementCard: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, marginBottom: 12 },
  announcementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  announcementTitle: { flex: 1, color: '#111827', fontSize: 16, fontWeight: '700' },
  announcementDate: { color: '#6b7280', fontSize: 11 },
  announcementContent: { color: '#374151', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  announcementAuthor: { color: '#6b7280', fontSize: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  bold: { fontWeight: '700' },
});
