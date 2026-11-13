import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { EmptyState, ErrorState, LoadingState, ScreenShell } from "@/components/ScreenShell";
import { useAuth } from "@/context/AuthContext";
import type { AreaRisco, Predio } from "@/lib/types";
import { studentService } from "@/services/studentService";

type PanHandlers = ReturnType<typeof PanResponder.create>["panHandlers"];

export default function RiskMapScreen() {
  const { session } = useAuth();
  const [predios, setPredios] = useState<Predio[]>([]);
  const [areas, setAreas] = useState<AreaRisco[]>([]);
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [floor, setFloor] = useState<number | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageRetryKey, setImageRetryKey] = useState(0);
  const sessionToken = session?.token;

  useEffect(() => {
    let active = true;
    if (!sessionToken) return;
    Promise.all([studentService.predios(sessionToken), studentService.areasRisco(sessionToken)])
      .then(([buildingData, areaData]) => {
        if (!active) return;
        setPredios(buildingData);
        setAreas(areaData);
        setBuildingId((current) => buildingData.some((item) => item.id_predio === current) ? current : buildingData[0]?.id_predio ?? null);
        setSelectedAreaId((current) => areaData.some((item) => item.id_area === current) ? current : areaData[0]?.id_area ?? null);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o mapa de risco."); })
      .finally(() => { if (active) { setLoading(false); setRefreshing(false); } });
    return () => { active = false; };
  }, [reloadKey, sessionToken]);

  const buildingAreas = useMemo(() => areas.filter((item) => item.id_predio === buildingId), [areas, buildingId]);
  const floors = useMemo(() => [...new Set(buildingAreas.map((item) => item.andar))].sort((a, b) => a - b), [buildingAreas]);
  const selectedFloor = floor !== null && floors.includes(floor) ? floor : floors[0] ?? null;
  const visibleAreas = buildingAreas.filter((item) => selectedFloor === null || item.andar === selectedFloor);
  const selectedArea = visibleAreas.find((item) => item.id_area === selectedAreaId) ?? visibleAreas[0];
  const imageUrl = selectedArea?.imagem_url;

  if (!session) return <Redirect href="/login" />;
  const refresh = () => { setRefreshing(true); setError(""); setImageError(false); setReloadKey((value) => value + 1); };

  return <ScreenShell eyebrow="SEGURANÇA NO CAMPUS" title="Mapa de Risco" subtitle="Áreas e orientações por bloco e andar." refreshing={refreshing} onRefresh={refresh}>
    {loading ? <LoadingState label="Carregando mapa..." /> : error ? <ErrorState message={error} onRetry={refresh} /> : <>
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Bloco</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
          {predios.map((item) => <Pressable key={item.id_predio} onPress={() => {
            const firstArea = areas.find((area) => area.id_predio === item.id_predio);
            setBuildingId(item.id_predio);
            setFloor(null);
            setSelectedAreaId(firstArea?.id_area ?? null);
            setImageError(false);
          }} style={[styles.locationButton, item.id_predio === buildingId && styles.locationActive]}>
            <Ionicons name="business-outline" size={17} color={item.id_predio === buildingId ? "#bd0010" : "#4b5563"} />
            <Text style={[styles.locationText, item.id_predio === buildingId && styles.locationTextActive]}>{item.nome}</Text>
          </Pressable>)}
        </ScrollView>
      </View>
      {predios.length === 0 ? <EmptyState title="Nenhum bloco disponível" detail="Não há blocos cadastrados para exibir." /> : <>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Andar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
            {floors.map((item) => <Pressable key={item} onPress={() => {
              const firstArea = buildingAreas.find((area) => area.andar === item);
              setFloor(item);
              setSelectedAreaId(firstArea?.id_area ?? null);
              setImageError(false);
            }} style={[styles.locationButton, item === selectedFloor && styles.locationActive]}>
              <Text style={[styles.locationText, item === selectedFloor && styles.locationTextActive]}>{item}º andar</Text>
            </Pressable>)}
            {!floors.length && <Text style={styles.noFloor}>Sem andares cadastrados</Text>}
          </ScrollView>
        </View>
        {visibleAreas.length ? <>
          <View style={styles.areaChoices}>
            {visibleAreas.map((item) => <Pressable key={item.id_area} onPress={() => {
              setSelectedAreaId(item.id_area);
              setImageError(false);
            }} style={[styles.areaChoice, selectedArea?.id_area === item.id_area && styles.areaChoiceActive]}>
              <Text style={[styles.areaChoiceText, selectedArea?.id_area === item.id_area && styles.areaChoiceTextActive]}>{item.nome}</Text>
            </Pressable>)}
          </View>
          {selectedArea ? <View style={styles.panel}>
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <Text style={styles.areaTitle}>{selectedArea.nome}</Text>
                <Text style={styles.muted}>{selectedArea.tipo} · {selectedArea.andar}º andar</Text>
              </View>
              <Ionicons name="warning-outline" size={21} color="#e30613" />
            </View>
            <Text style={styles.orientation}>{selectedArea.orientacao_seguranca}</Text>
            {imageUrl ? imageError ? <View style={styles.imageError}>
              <Text style={styles.errorText}>Não foi possível carregar a imagem do mapa.</Text>
              <Pressable onPress={() => { setImageError(false); setImageRetryKey((value) => value + 1); }} style={styles.zoomButton}>
                <Text style={styles.zoomText}>Tentar novamente</Text>
              </Pressable>
            </View> : <InteractiveRiskImage key={`${selectedArea.id_area}-${imageRetryKey}`} uri={imageUrl} label={`Mapa de riscos: ${selectedArea.nome}`} onError={() => setImageError(true)} />
              : <Text style={styles.muted}>Esta área não possui imagem de mapa cadastrada.</Text>}
          </View> : null}
        </> : <EmptyState title="Nenhuma área de risco cadastrada" detail="Não há registros para este bloco e andar." />}
      </>}
    </>}
  </ScreenShell>;
}

function InteractiveRiskImage({ uri, label, onError }: { uri: string; label: string; onError: () => void }) {
  const { width } = useWindowDimensions();
  const frameWidth = Math.max(240, width - 72);
  const frameHeight = Math.max(220, width * 0.72);
  const frameSize = useRef({ width: frameWidth, height: frameHeight });
  const [scale] = useState(() => new Animated.Value(1));
  const [translateX] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(0));
  const scaleValue = useRef(1);
  const translation = useRef({ x: 0, y: 0 });
  const initialDistance = useRef(0);
  const initialScale = useRef(1);
  const initialTranslation = useRef({ x: 0, y: 0 });
  const [panHandlers, setPanHandlers] = useState<PanHandlers | null>(null);

  useEffect(() => {
    frameSize.current = { width: frameWidth, height: frameHeight };
  }, [frameHeight, frameWidth]);

  const setZoom = useCallback((value: number) => {
    const next = Math.max(0.75, Math.min(4, value));
    scaleValue.current = next;
    scale.setValue(next);
    if (next === 1) {
      translation.current = { x: 0, y: 0 };
      translateX.setValue(0);
      translateY.setValue(0);
    }
  }, [scale, translateX, translateY]);

  const reset = () => setZoom(1);
  useEffect(() => {
    const responder = PanResponder.create({
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
    });
    setPanHandlers(responder.panHandlers);
  }, [setZoom, translateX, translateY]);

  return (
    <View style={styles.interactiveMap}>
      <View style={styles.mapControls}>
        <Pressable onPress={() => setZoom(scaleValue.current + 0.25)} style={styles.mapControl}>
          <Text style={styles.mapControlText}>Zoom +</Text>
        </Pressable>
        <Pressable onPress={() => setZoom(scaleValue.current - 0.25)} style={styles.mapControl}>
          <Text style={styles.mapControlText}>Zoom −</Text>
        </Pressable>
        <Pressable onPress={reset} style={styles.mapControl}>
          <Text style={styles.mapControlText}>Centralizar</Text>
        </Pressable>
      </View>
      <View
        {...(panHandlers ?? {})}
        style={{ width: frameWidth, height: frameHeight, overflow: "hidden", alignItems: "center", justifyContent: "center" }}
      >
        <Animated.Image
          source={{ uri }}
          onError={onError}
          style={{
            width: frameWidth,
            height: frameHeight,
            transform: [{ translateX }, { translateY }, { scale }],
          }}
          resizeMode="contain"
          accessibilityLabel={label}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterGroup: { gap: 7 },
  filterLabel: { color: "#4b5563", fontSize: 12, fontWeight: "800" },
  optionRow: { flexDirection: "row", gap: 8, paddingVertical: 3 },
  locationButton: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 13, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 22, backgroundColor: "#fff" },
  locationActive: { borderColor: "#e30613", backgroundColor: "#fff0f1" },
  locationText: { color: "#4b5563", fontSize: 12, fontWeight: "600" },
  locationTextActive: { color: "#bd0010" },
  noFloor: { alignSelf: "center", color: "#6b7280", fontSize: 12 },
  areaChoices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  areaChoice: { paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 18, backgroundColor: "#fff" },
  areaChoiceActive: { borderColor: "#e30613", backgroundColor: "#fff0f1" },
  areaChoiceText: { color: "#4b5563", fontSize: 12, fontWeight: "600" },
  areaChoiceTextActive: { color: "#bd0010" },
  panel: { padding: 14, gap: 10, borderRadius: 13, backgroundColor: "#fff" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  titleCopy: { flex: 1, gap: 4 },
  areaTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  muted: { color: "#6b7280", fontSize: 13, lineHeight: 19 },
  orientation: { color: "#58647a", fontSize: 13, lineHeight: 19 },
  interactiveMap: { width: "100%", alignItems: "center" },
  mapControls: { width: "100%", flexDirection: "row", justifyContent: "flex-end", gap: 7, marginBottom: 8 },
  mapControl: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 7, backgroundColor: "#f3f4f6" },
  mapControlText: { color: "#374151", fontSize: 11, fontWeight: "700" },
  imageError: { alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  errorText: { color: "#991b1b", fontSize: 13, lineHeight: 19 },
  zoomButton: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 7, backgroundColor: "#f3f4f6" },
  zoomText: { color: "#374151", fontSize: 11, fontWeight: "700" },
});