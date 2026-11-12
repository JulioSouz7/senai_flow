import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ApiRecord } from '@/types/mobile';

interface RecordListProps {
  records: ApiRecord[];
  loading: boolean;
  error: string;
  emptyMessage?: string;
  onRetry: () => void;
  onAction?: (record: ApiRecord) => void;
  actionLabel?: string;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'object') {
    const text = JSON.stringify(value);
    return text.length > 110 ? `${text.slice(0, 107)}...` : text;
  }
  return String(value);
}

function labelFor(key: string): string {
  return key.replaceAll('_', ' ').replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export default function RecordList({
  records,
  loading,
  error,
  emptyMessage = 'Nenhum registro encontrado.',
  onRetry,
  onAction,
  actionLabel,
}: RecordListProps) {
  if (loading) {
    return (
      <View style={styles.status}>
        <ActivityIndicator color="#e30613" />
        <Text style={styles.statusText}>Carregando dados...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.notice}>
        <Text style={styles.errorTitle}>Não foi possível carregar os dados</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (!records.length) {
    return <Text style={styles.empty}>{emptyMessage}</Text>;
  }

  return (
    <View style={styles.list}>
      {records.map((record, index) => {
        const titleKey = ['titulo', 'nome', 'pergunta', 'assunto', 'nome_sala', 'descricao']
          .find((key) => record[key] !== undefined);
        const title = titleKey ? formatValue(record[titleKey]) : `Registro ${index + 1}`;
        const details = Object.entries(record)
          .filter(([key, value]) => key !== titleKey && value !== undefined)
          .slice(0, 6);

        return (
          <View key={String(record.id ?? record.id_reserva ?? record.id_sala ?? index)} style={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>
            {details.map(([key, value]) => (
              <View key={key} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{labelFor(key)}</Text>
                <Text selectable style={styles.detailValue}>{formatValue(value)}</Text>
              </View>
            ))}
            {onAction ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => onAction(record)}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>{actionLabel ?? 'Ação'}</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  status: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  statusText: { color: '#6b7280', fontSize: 13 },
  notice: { padding: 16, borderRadius: 12, backgroundColor: '#fff' },
  errorTitle: { color: '#991b1b', fontWeight: '800', fontSize: 15 },
  errorText: { marginTop: 6, color: '#7f1d1d', fontSize: 13, lineHeight: 19 },
  retryButton: { alignSelf: 'flex-start', marginTop: 14, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 8, backgroundColor: '#fff0f1' },
  retryText: { color: '#bd0010', fontWeight: '800', fontSize: 13 },
  empty: { padding: 18, borderRadius: 12, color: '#6b7280', backgroundColor: '#fff', fontSize: 14, textAlign: 'center' },
  list: { gap: 12 },
  card: { padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 13, backgroundColor: '#fff' },
  cardTitle: { marginBottom: 8, color: '#111827', fontSize: 16, fontWeight: '800' },
  detailRow: { paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  detailLabel: { color: '#6b7280', fontSize: 11, fontWeight: '700' },
  detailValue: { marginTop: 2, color: '#374151', fontSize: 13, lineHeight: 19 },
  actionButton: { alignItems: 'center', marginTop: 12, paddingVertical: 11, borderRadius: 8, backgroundColor: '#fff0f1' },
  actionText: { color: '#bd0010', fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.75 },
});
