import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, getApiError } from '@/services/api';
import type { ApiRecord } from '@/types/mobile';
import { RefreshButton } from '@/components/RefreshButton';
import { useFeedback } from '@/components/FeedbackProvider';

function collection(data: unknown): ApiRecord[] {
  return Array.isArray(data)
    ? data.filter((item): item is ApiRecord => Boolean(item) && typeof item === 'object')
    : [];
}

function recordId(record: ApiRecord, primary: 'id_predio' | 'id_area'): number {
  return Number(record[primary] ?? record.id ?? 0);
}

function areaName(area: ApiRecord): string {
  return String(area.nome ?? area.titulo ?? 'Área de risco');
}

function areaBuildingId(area: ApiRecord): number {
  return Number(area.id_predio ?? 0);
}

function resolveImageUrl(url: string): string {
  const imageUrl = url.trim();
  if (!imageUrl) return '';

  const baseUrl = api.defaults.baseURL ?? '';
  const serverOrigin = baseUrl.match(/^(https?:\/\/[^/]+)/i)?.[1] ?? '';

  if (/^https?:\/\//i.test(imageUrl)) {
    return serverOrigin
      ? imageUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, serverOrigin)
      : imageUrl;
  }

  if (/^(file:|content:|data:|blob:)/i.test(imageUrl)) return imageUrl;

  const path = imageUrl.replace(/\\/g, '/').replace(/^\/+/, '');
  return serverOrigin ? `${serverOrigin}/${path}` : imageUrl;
}

export default function RiskMapScreen() {
  const { notify } = useFeedback();
  const [buildings, setBuildings] = useState<ApiRecord[]>([]);
  const [areas, setAreas] = useState<ApiRecord[]>([]);
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [floor, setFloor] = useState<number | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [imageRetryKey, setImageRetryKey] = useState(0);
  const { width } = useWindowDimensions();

  const fetchData = useCallback(async () => {
    const [buildingResponse, areaResponse] = await Promise.all([
      api.get('/predios'),
      api.get('/areas-risco'),
    ]);
    return {
      buildings: collection(buildingResponse.data),
      areas: collection(areaResponse.data),
    };
  }, []);

  const applyData = useCallback((data: Awaited<ReturnType<typeof fetchData>>) => {
    setBuildings(data.buildings);
    setAreas(data.areas);
    setBuildingId((current) => data.buildings.some((item) => recordId(item, 'id_predio') === current)
      ? current
      : (data.buildings[0] ? recordId(data.buildings[0], 'id_predio') : null));
    setSelectedAreaId((current) => data.areas.some((item) => recordId(item, 'id_area') === current)
      ? current
      : (data.areas[0] ? recordId(data.areas[0], 'id_area') : null));
  }, []);

  useEffect(() => {
    let active = true;
    fetchData()
      .then((data) => {
        if (!active) return;
        setError('');
        applyData(data);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const message = getApiError(requestError, 'Não foi possível carregar o mapa de riscos.');
        setError(message);
        notify(message, 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyData, fetchData, notify]);

  const buildingsWithAreas = useMemo(() => {
    const listedIds = new Set(buildings.map((item) => recordId(item, 'id_predio')));
    const related = areas.flatMap((area) => {
      const id = areaBuildingId(area);
      const name = area.predio?.nome;
      return id && !listedIds.has(id) && typeof name === 'string'
        ? [{ id_predio: id, nome: name }]
        : [];
    });
    return [...buildings, ...related];
  }, [areas, buildings]);
  const buildingAreas = useMemo(
    () => areas.filter((area) => areaBuildingId(area) === buildingId),
    [areas, buildingId],
  );
  const floors = useMemo(
    () => [...new Set(buildingAreas.flatMap((area) => typeof area.andar === 'number' ? [area.andar] : []))]
      .sort((a, b) => a - b),
    [buildingAreas],
  );
  const selectedFloor = floor !== null && floors.includes(floor) ? floor : floors[0] ?? null;
  const visibleAreas = buildingAreas.filter((area) => selectedFloor === null || area.andar === selectedFloor);
  const selectedArea = visibleAreas.find((area) => recordId(area, 'id_area') === selectedAreaId) ?? visibleAreas[0];
  const imageUrl = selectedArea?.imagem_url ?? selectedArea?.imagem ?? selectedArea?.imagemUrl;
  const resolvedImageUrl = typeof imageUrl === 'string' ? resolveImageUrl(imageUrl) : '';

  const selectBuilding = (building: ApiRecord) => {
    const nextId = recordId(building, 'id_predio');
    const firstArea = areas.find((area) => areaBuildingId(area) === nextId);
    setBuildingId(nextId);
    setFloor(null);
    setSelectedAreaId(firstArea ? recordId(firstArea, 'id_area') : null);
    setImageError(false);
  };

  const selectFloor = (nextFloor: number) => {
    const firstArea = buildingAreas.find((area) => area.andar === nextFloor);
    setFloor(nextFloor);
    setSelectedAreaId(firstArea ? recordId(firstArea, 'id_area') : null);
    setImageError(false);
  };

  const refresh = () => {
    setImageError(false);
    setRefreshing(true);
    fetchData()
      .then((data) => {
        applyData(data);
        setError('');
        notify('Mapa de riscos atualizado.', 'success');
      })
      .catch((requestError: unknown) => {
        const message = getApiError(requestError, 'Não foi possível carregar o mapa de riscos.');
        setError(message);
        notify(message, 'error');
      })
      .finally(() => setRefreshing(false));
  };

  if (loading) {
    return <View style={styles.status}><ActivityIndicator color="#e30613" /><Text style={styles.muted}>Carregando mapa...</Text></View>;
  }
  if (error) {
    return (
      <View style={styles.notice}>
        <Text style={styles.errorTitle}>Não foi possível carregar o mapa de risco</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.introRow}>
        <View style={styles.introCopy}>
        </View>
        <RefreshButton label="mapa de riscos" refreshing={refreshing} onPress={refresh} />
      </View>

      {buildingsWithAreas.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={30} color="#94a3b8" />
          <Text style={styles.emptyTitle}>Nenhum bloco disponível</Text>
          <Text style={styles.muted}>Não há blocos cadastrados para exibir.</Text>
        </View>
      ) : (
        <>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Bloco</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
              {buildingsWithAreas.map((building, index) => {
                const id = recordId(building, 'id_predio');
                const active = id === buildingId;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={id || index}
                    onPress={() => selectBuilding(building)}
                    style={[styles.locationButton, active && styles.locationActive]}
                  >
                    <Ionicons name="business-outline" size={17} color={active ? '#bd0010' : '#4b5563'} />
                    <Text style={[styles.locationText, active && styles.locationTextActive]}>{String(building.nome ?? `Bloco ${index + 1}`)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {buildingAreas.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhuma área de risco cadastrada</Text>
              <Text style={styles.muted}>Não há registros para este bloco.</Text>
            </View>
          ) : (
            <>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Andar</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
                  {floors.map((item) => {
                    const active = item === selectedFloor;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        key={item}
                        onPress={() => selectFloor(item)}
                        style={[styles.locationButton, active && styles.locationActive]}
                      >
                        <Text style={[styles.locationText, active && styles.locationTextActive]}>{item}º andar</Text>
                      </Pressable>
                    );
                  })}
                  {!floors.length ? <Text style={styles.noFloor}>Sem andares cadastrados</Text> : null}
                </ScrollView>
              </View>

              {visibleAreas.length ? (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.areaChoices}>
                    {visibleAreas.map((area, index) => {
                      const id = recordId(area, 'id_area');
                      const active = selectedArea && recordId(selectedArea, 'id_area') === id;
                      return (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected: Boolean(active) }}
                          key={id || index}
                          onPress={() => {
                            setSelectedAreaId(id);
                            setImageError(false);
                          }}
                          style={[styles.areaChoice, active && styles.areaChoiceActive]}
                        >
                          <Text style={[styles.areaChoiceText, active && styles.areaChoiceTextActive]}>{areaName(area)}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  {selectedArea ? (
                    <View style={styles.panel}>
                      <View style={styles.titleRow}>
                        <View style={styles.titleCopy}>
                          <Text style={styles.areaTitle}>{areaName(selectedArea)}</Text>
                          <Text style={styles.muted}>
                            {String(selectedArea.tipo ?? 'Área de risco')}
                            {typeof selectedArea.andar === 'number' ? ` · ${selectedArea.andar}º andar` : ''}
                          </Text>
                        </View>
                        <Ionicons name="warning-outline" size={21} color="#e30613" />
                      </View>
                      {typeof selectedArea.orientacao_seguranca === 'string' && selectedArea.orientacao_seguranca.length > 0 ? (
                        <Text style={styles.orientation}>{selectedArea.orientacao_seguranca}</Text>
                      ) : typeof selectedArea.descricao === 'string' && selectedArea.descricao.length > 0 ? (
                        <Text style={styles.orientation}>{selectedArea.descricao}</Text>
                      ) : null}
                      {resolvedImageUrl ? imageError ? (
                        <View style={styles.imageError}>
                          <Text style={styles.errorText}>Não foi possível carregar a imagem do mapa.</Text>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => {
                              setImageError(false);
                              setImageRetryKey((value) => value + 1);
                            }}
                            style={styles.retryButton}
                          >
                            <Text style={styles.retryText}>Tentar novamente</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <InteractiveRiskImage
                          key={`${recordId(selectedArea, 'id_area')}-${imageRetryKey}`}
                          uri={resolvedImageUrl}
                          label={`Mapa de riscos: ${areaName(selectedArea)}`}
                          availableWidth={width}
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <Text style={styles.muted}>Esta área não possui imagem de mapa cadastrada.</Text>
                      )}
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Nenhuma área de risco cadastrada</Text>
                  <Text style={styles.muted}>Não há registros para este bloco e andar.</Text>
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

function InteractiveRiskImage({
  uri,
  label,
  availableWidth,
  onError,
}: {
  uri: string;
  label: string;
  availableWidth: number;
  onError: () => void;
}) {
  const frameWidth = Math.max(220, Math.min(620, availableWidth - 48));
  const frameHeight = Math.max(220, frameWidth * 0.72);
  const frameSize = useRef({ width: frameWidth, height: frameHeight });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const scaleValue = useRef(1);
  const translation = useRef({ x: 0, y: 0 });
  const dragOrigin = useRef({ x: 0, y: 0 });
  const previousTouchCount = useRef(0);
  const initialDistance = useRef(0);
  const initialScale = useRef(1);
  const initialTranslation = useRef({ x: 0, y: 0 });
  const [zoom, setZoomValue] = useState(1);

  const setZoom = useCallback((value: number) => {
    const next = Math.max(0.75, Math.min(4, value));
    scaleValue.current = next;
    setZoomValue(next);
    if (next === 1) {
      translation.current = { x: 0, y: 0 };
      setOffset({ x: 0, y: 0 });
    }
  }, []);

  useEffect(() => {
    frameSize.current = { width: frameWidth, height: frameHeight };
  }, [frameHeight, frameWidth]);

  const shouldSetResponder = useCallback((event: GestureResponderEvent) => (
    event.nativeEvent.touches.length > 1 || scaleValue.current > 1
  ), []);
  const onResponderGrant = useCallback((event: GestureResponderEvent) => {
    const touches = event.nativeEvent.touches;
    const firstTouch = touches[0] ?? { pageX: event.nativeEvent.pageX, pageY: event.nativeEvent.pageY };
    initialDistance.current = touches.length > 1
      ? Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY)
      : 0;
    initialScale.current = scaleValue.current;
    initialTranslation.current = { ...translation.current };
    previousTouchCount.current = touches.length;
    dragOrigin.current = { x: firstTouch.pageX, y: firstTouch.pageY };
  }, []);
  const onResponderMove = useCallback((event: GestureResponderEvent) => {
    const touches = event.nativeEvent.touches;
    if (touches.length > 1) {
      const distance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
      if (initialDistance.current === 0) {
        initialDistance.current = distance;
        initialScale.current = scaleValue.current;
      } else {
        setZoom(initialScale.current * distance / initialDistance.current);
      }
      previousTouchCount.current = touches.length;
      return;
    }

    const currentPoint = touches[0] ?? { pageX: event.nativeEvent.pageX, pageY: event.nativeEvent.pageY };
    if (previousTouchCount.current > 1) {
      initialTranslation.current = { ...translation.current };
      dragOrigin.current = { x: currentPoint.pageX, y: currentPoint.pageY };
    }
    previousTouchCount.current = touches.length;
    if (scaleValue.current <= 1) return;
    const maxX = frameSize.current.width * (scaleValue.current - 1) / 2;
    const maxY = frameSize.current.height * (scaleValue.current - 1) / 2;
    const x = Math.max(-maxX, Math.min(maxX, initialTranslation.current.x + currentPoint.pageX - dragOrigin.current.x));
    const y = Math.max(-maxY, Math.min(maxY, initialTranslation.current.y + currentPoint.pageY - dragOrigin.current.y));
    translation.current = { x, y };
    setOffset({ x, y });
  }, [setZoom]);

  return (
    <View style={styles.mapSection}>
      <View style={styles.zoomControls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Aumentar zoom" onPress={() => setZoom(zoom + 0.25)} style={styles.zoomButton}>
          <Ionicons name="add" size={19} color="#374151" />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Reduzir zoom" onPress={() => setZoom(zoom - 0.25)} style={styles.zoomButton}>
          <Ionicons name="remove" size={19} color="#374151" />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Centralizar mapa" onPress={() => setZoom(1)} style={styles.zoomButton}>
          <Ionicons name="scan-outline" size={17} color="#374151" />
          <Text style={styles.zoomText}>Centralizar</Text>
        </Pressable>
      </View>
      <View style={styles.gestureHint}>
        <Ionicons name="hand-left-outline" size={15} color="#64748b" />
        <Text style={styles.gestureHintText}>Use pinça para ampliar e arraste para mover o mapa.</Text>
      </View>
      <View
        onStartShouldSetResponder={shouldSetResponder}
        onMoveShouldSetResponder={shouldSetResponder}
        onResponderGrant={onResponderGrant}
        onResponderMove={onResponderMove}
        style={[styles.mapFrame, { width: frameWidth, height: frameHeight }]}
      >
        <Image
          accessibilityLabel={label}
          onError={onError}
          resizeMode="contain"
          source={{ uri }}
          style={{
            width: frameWidth,
            height: frameHeight,
            transform: [{ translateX: offset.x }, { translateY: offset.y }, { scale: zoom }],
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  status: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  introRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  introCopy: { flex: 1, minWidth: 0 },
  introTitle: { color: '#111827', fontSize: 16, fontWeight: '800', marginBottom: 3 },
  muted: { color: '#6b7280', fontSize: 13, lineHeight: 19 },
  filterGroup: { gap: 7 },
  filterLabel: { color: '#374151', fontSize: 13, fontWeight: '700' },
  optionRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  locationButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 39, paddingVertical: 8, paddingHorizontal: 11, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, backgroundColor: '#fff' },
  locationActive: { borderColor: '#e30613', backgroundColor: '#fff0f1' },
  locationText: { color: '#4b5563', fontSize: 12, fontWeight: '600' },
  locationTextActive: { color: '#bd0010' },
  noFloor: { color: '#6b7280', fontSize: 12, paddingVertical: 9 },
  areaChoices: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  areaChoice: { paddingVertical: 8, paddingHorizontal: 11, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 18, backgroundColor: '#fff' },
  areaChoiceActive: { borderColor: '#e30613', backgroundColor: '#fff0f1' },
  areaChoiceText: { color: '#4b5563', fontSize: 12, fontWeight: '600' },
  areaChoiceTextActive: { color: '#bd0010' },
  panel: { padding: 14, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef0f3' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titleCopy: { flex: 1, minWidth: 0 },
  areaTitle: { marginBottom: 4, color: '#111827', fontSize: 17, fontWeight: '800' },
  orientation: { marginTop: 10, marginBottom: 4, color: '#374151', fontSize: 13, lineHeight: 20 },
  mapSection: { alignItems: 'center', marginTop: 10 },
  zoomControls: { width: '100%', flexDirection: 'row', justifyContent: 'flex-end', gap: 7 },
  zoomButton: { minWidth: 38, minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 9, borderRadius: 8, backgroundColor: '#f3f4f6' },
  zoomText: { color: '#374151', fontSize: 11, fontWeight: '700' },
  gestureHint: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  gestureHintText: { flex: 1, color: '#64748b', fontSize: 11, lineHeight: 16 },
  mapFrame: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#f8fafc' },
  emptyState: { alignItems: 'center', gap: 7, padding: 22, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef0f3' },
  emptyTitle: { color: '#111827', fontSize: 14, fontWeight: '700' },
  notice: { padding: 16, borderRadius: 12, backgroundColor: '#fff' },
  errorTitle: { color: '#991b1b', fontWeight: '800', fontSize: 15 },
  errorText: { marginTop: 6, color: '#7f1d1d', fontSize: 13, lineHeight: 19 },
  retryButton: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 8, backgroundColor: '#fff0f1' },
  retryText: { color: '#bd0010', fontWeight: '800', fontSize: 13 },
  imageError: { marginTop: 14, padding: 14, borderRadius: 10, backgroundColor: '#fef2f2' },
});
