import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { api, getApiError } from '@/services/api';
import type { ApiRecord } from '@/types/mobile';
import { RefreshButton } from '@/components/RefreshButton';
import { useFeedback } from '@/components/FeedbackProvider';

function collection(data: unknown): ApiRecord[] {
  return Array.isArray(data)
    ? data.filter((item): item is ApiRecord => Boolean(item) && typeof item === 'object')
    : [];
}

export default function RiskMapScreen() {
  const { notify } = useFeedback();
  const [areas, setAreas] = useState<ApiRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(1);
  const translation = useRef({ x: 0, y: 0 });
  const initialScale = useRef(1);
  const initialDistance = useRef(0);
  const initialTranslation = useRef({ x: 0, y: 0 });
  const { width } = useWindowDimensions();
  const frameWidth = Math.max(240, width - 72);
  const frameHeight = Math.max(220, width * 0.72);
  const frameSize = useRef({ width: frameWidth, height: frameHeight });
  frameSize.current = { width: frameWidth, height: frameHeight };

  const setZoom = (value: number) => {
    const next = Math.max(0.75, Math.min(4, value));
    scaleValue.current = next;
    scale.setValue(next);
    if (next === 1) {
      translation.current = { x: 0, y: 0 };
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: (event) => event.nativeEvent.touches.length > 1 || scaleValue.current > 1,
    onMoveShouldSetPanResponder: (event) => event.nativeEvent.touches.length > 1 || scaleValue.current > 1,
    onPanResponderGrant: (event) => {
      const touches = event.nativeEvent.touches;
      initialDistance.current = touches.length > 1
        ? Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY)
        : 0;
      initialScale.current = scaleValue.current;
      initialTranslation.current = { ...translation.current };
    },
    onPanResponderMove: (event, gesture) => {
      const touches = event.nativeEvent.touches;
      if (touches.length > 1) {
        const distance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
        if (initialDistance.current > 0) setZoom(initialScale.current * distance / initialDistance.current);
        return;
      }

      if (scaleValue.current <= 1) return;
      const maxX = frameSize.current.width * (scaleValue.current - 1) / 2;
      const maxY = frameSize.current.height * (scaleValue.current - 1) / 2;
      const x = Math.max(-maxX, Math.min(maxX, initialTranslation.current.x + gesture.dx));
      const y = Math.max(-maxY, Math.min(maxY, initialTranslation.current.y + gesture.dy));
      translation.current = { x, y };
      translateX.setValue(x);
      translateY.setValue(y);
    },
  })).current;

  const loadAreas = async (manual = false) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/areas-risco');
      const results = collection(data);
      setAreas(results);
      if (!results.some((area) => String(area.id_area ?? area.id ?? '') === selectedId)) {
        setSelectedId(String(results[0]?.id_area ?? results[0]?.id ?? ''));
      }
      if (manual) notify('Mapa de riscos atualizado.', 'success');
    } catch (requestError: unknown) {
      const message = getApiError(requestError, 'Não foi possível carregar o mapa de riscos.');
      setError(message);
      notify(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAreas();
  }, []);

  const selected = areas.find((area) => String(area.id_area ?? area.id ?? '') === selectedId);
  const imageUrl = selected?.imagem_url ?? selected?.imagem ?? selected?.imagemUrl;

  if (loading) {
    return <View style={styles.status}><ActivityIndicator color="#e30613" /><Text style={styles.muted}>Carregando mapa...</Text></View>;
  }
  if (error) {
    return <View style={styles.panel}><Text style={styles.error}>{error}</Text></View>;
  }
  if (!areas.length) {
    return <View style={styles.panel}><Text style={styles.muted}>Nenhum mapa de risco cadastrado.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {areas.map((area, index) => {
          const id = String(area.id_area ?? area.id ?? index);
          const name = String(area.nome ?? area.titulo ?? `Área ${index + 1}`);
          return (
            <Pressable
              key={id}
              onPress={() => {
                setSelectedId(id);
                setImageError(false);
                setZoom(1);
              }}
              style={[styles.chip, selectedId === id && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedId === id && styles.chipTextActive]}>
                {name}{area.andar !== undefined ? ` • Andar ${String(area.andar)}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.panel}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{String(selected?.nome ?? selected?.titulo ?? 'Mapa de riscos')}</Text>
          <RefreshButton label="mapa de riscos" refreshing={refreshing} onPress={async () => {
            if (refreshing) return;
            setRefreshing(true);
            await loadAreas(true);
            setRefreshing(false);
          }} />
        </View>
        {selected?.descricao ? <Text style={styles.muted}>{String(selected.descricao)}</Text> : null}
        {typeof imageUrl === 'string' && imageUrl.length > 0 && !imageError ? (
          <>
            <View style={styles.zoomControls}>
              <Pressable onPress={() => setZoom(scaleValue.current + 0.25)} style={styles.zoomButton}>
                <Text style={styles.zoomText}>Zoom +</Text>
              </Pressable>
              <Pressable onPress={() => setZoom(scaleValue.current - 0.25)} style={styles.zoomButton}>
                <Text style={styles.zoomText}>Zoom −</Text>
              </Pressable>
              <Pressable onPress={() => setZoom(1)} style={styles.zoomButton}>
                <Text style={styles.zoomText}>Centralizar</Text>
              </Pressable>
            </View>
            <View
              {...panResponder.panHandlers}
              style={{ width: frameWidth, height: frameHeight, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
            >
              <Animated.Image
                accessibilityLabel={`Mapa de riscos: ${String(selected?.nome ?? 'área selecionada')}`}
                onError={() => setImageError(true)}
                resizeMode="contain"
                source={{ uri: imageUrl }}
                style={{
                  width: frameWidth,
                  height: frameHeight,
                  transform: [{ translateX }, { translateY }, { scale }],
                }}
              />
            </View>
          </>
        ) : (
          <Text style={styles.muted}>
            {imageError ? 'Não foi possível carregar a imagem do mapa.' : 'Esta área não possui imagem de mapa cadastrada.'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  status: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  container: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, backgroundColor: '#fff' },
  chipActive: { borderColor: '#e30613', backgroundColor: '#fff0f1' },
  chipText: { color: '#4b5563', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#bd0010' },
  panel: { padding: 14, borderRadius: 13, backgroundColor: '#fff' },
  title: { marginBottom: 8, color: '#111827', fontSize: 16, fontWeight: '800' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  muted: { color: '#6b7280', fontSize: 13, lineHeight: 19 },
  error: { color: '#991b1b', fontSize: 13, lineHeight: 19 },
  zoomControls: { flexDirection: 'row', gap: 7, marginVertical: 10 },
  zoomButton: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 7, backgroundColor: '#f3f4f6' },
  zoomText: { color: '#374151', fontSize: 11, fontWeight: '700' },
});
