import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { ContentCard } from "@/components/ContentCard";
import { EmptyState, ErrorState, LoadingState, ScreenShell } from "@/components/ScreenShell";
import { useAuth } from "@/context/AuthContext";
import type { AreaRisco, Predio } from "@/lib/types";
import { studentService } from "@/services/studentService";

export default function RiskMapScreen() {
  const { session } = useAuth();
  const [predios, setPredios] = useState<Predio[]>([]);
  const [areas, setAreas] = useState<AreaRisco[]>([]);
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [floor, setFloor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (!session) return;
    Promise.all([studentService.predios(session.token), studentService.areasRisco(session.token)])
      .then(([buildingData, areaData]) => {
        if (!active) return;
        setPredios(buildingData);
        setAreas(areaData);
        setBuildingId((current) => current ?? buildingData[0]?.id_predio ?? null);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o mapa de risco."); })
      .finally(() => { if (active) { setLoading(false); setRefreshing(false); } });
    return () => { active = false; };
  }, [reloadKey, session]);

  const buildingAreas = useMemo(() => areas.filter((item) => item.id_predio === buildingId), [areas, buildingId]);
  const floors = useMemo(() => [...new Set(buildingAreas.map((item) => item.andar))].sort((a, b) => a - b), [buildingAreas]);
  const selectedFloor = floor !== null && floors.includes(floor) ? floor : floors[0] ?? null;
  const visibleAreas = buildingAreas.filter((item) => selectedFloor === null || item.andar === selectedFloor);

  if (!session) return <Redirect href="/login" />;
  const refresh = () => { setRefreshing(true); setError(""); setReloadKey((value) => value + 1); };

  return <ScreenShell eyebrow="SEGURANÇA NO CAMPUS" title="Mapa de Risco" subtitle="Áreas e orientações por bloco e andar." refreshing={refreshing} onRefresh={refresh}>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refresh} /> : <>
      <Text style={styles.filterLabel}>Bloco</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
        {predios.map((item) => <Pressable key={item.id_predio} onPress={() => { setBuildingId(item.id_predio); setFloor(null); }} style={[styles.locationButton, item.id_predio === buildingId && styles.locationActive]}><Ionicons name="business-outline" size={17} color={item.id_predio === buildingId ? "#fff" : "#344057"} /><Text style={[styles.locationText, item.id_predio === buildingId && styles.locationTextActive]}>{item.nome}</Text></Pressable>)}
      </ScrollView>
      <Text style={styles.filterLabel}>Andar</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
        {floors.map((item) => <Pressable key={item} onPress={() => setFloor(item)} style={[styles.locationButton, item === selectedFloor && styles.locationActive]}><Text style={[styles.locationText, item === selectedFloor && styles.locationTextActive]}>{item}º andar</Text></Pressable>)}
        {!floors.length && <Text style={styles.noFloor}>Sem andares cadastrados</Text>}
      </ScrollView>
      {visibleAreas.length ? visibleAreas.map((item) => <RiskCard key={item.id_area} item={item} />) : <EmptyState title="Nenhuma área de risco cadastrada" detail="Não há registros para este bloco e andar." />}
    </>}
  </ScreenShell>;
}

function RiskCard({ item }: { item: AreaRisco }) {
  const validImage = isCloudinaryImage(item.imagem_url);
  return <ContentCard style={styles.card}>
    <View style={styles.cardTop}><View style={styles.riskIcon}><Ionicons name="warning-outline" size={19} color="#e30613" /></View><Text style={styles.type}>{item.tipo}</Text><Text style={styles.floor}>{item.andar}º andar</Text></View>
    <Text style={styles.name}>{item.nome}</Text>
    <Text style={styles.orientation}>{item.orientacao_seguranca}</Text>
    <View style={styles.imageFrame}>
      {validImage ? <InteractiveRiskImage key={item.id_area} uri={item.imagem_url!} label={`Imagem da área de risco ${item.nome}`} /> : <View style={styles.imageEmpty}><Ionicons name="image-outline" size={23} color="#8a94a4" /><Text style={styles.imageEmptyText}>Imagem não cadastrada</Text></View>}
    </View>
  </ContentCard>;
}

function InteractiveRiskImage({ uri, label }: { uri: string; label: string }) {
  const { width } = useWindowDimensions();
  const frameWidth = Math.max(220, width - 76);
  const frameHeight = frameWidth * 9 / 16;
  const frameSize = useRef({ width: frameWidth, height: frameHeight });
  frameSize.current = { width: frameWidth, height: frameHeight };
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(1);
  const translation = useRef({ x: 0, y: 0 });
  const initialDistance = useRef(0);
  const initialScale = useRef(1);
  const initialTranslation = useRef({ x: 0, y: 0 });

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

  const reset = () => setZoom(1);
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
        {...panResponder.panHandlers}
        style={{ width: frameWidth, height: frameHeight, overflow: "hidden", alignItems: "center", justifyContent: "center" }}
      >
        <Animated.Image
          source={{ uri }}
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

function isCloudinaryImage(value?: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch { return false; }
}

const styles = StyleSheet.create({
  filterLabel: { color: "#566176", fontSize: 12, fontWeight: "800" },
  optionRow: { flexDirection: "row", gap: 8, paddingVertical: 3 },
  locationButton: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 13, borderWidth: 1, borderColor: "#dfe4ea", borderRadius: 22, backgroundColor: "#fff" },
  locationActive: { borderColor: "#111a2e", backgroundColor: "#111a2e" },
  locationText: { color: "#344057", fontSize: 12, fontWeight: "700" },
  locationTextActive: { color: "#fff" },
  noFloor: { alignSelf: "center", color: "#788398", fontSize: 12 },
  card: { gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  riskIcon: { width: 35, height: 35, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#fff0f1" },
  type: { color: "#3e4a60", fontSize: 11, fontWeight: "800" },
  floor: { marginLeft: "auto", color: "#8993a3", fontSize: 10 },
  name: { color: "#111a2e", fontSize: 15, fontWeight: "800" },
  orientation: { color: "#58647a", fontSize: 13, lineHeight: 19 },
  imageFrame: { width: "100%", minHeight: 150, overflow: "hidden", alignItems: "center", justifyContent: "center", marginTop: 2, borderWidth: 1, borderColor: "#e4e8ee", borderRadius: 10, backgroundColor: "#f5f7f9", padding: 8 },
  image: { width: "100%", height: "100%" },
  interactiveMap: { width: "100%", alignItems: "center" },
  mapControls: { width: "100%", flexDirection: "row", justifyContent: "flex-end", gap: 7, marginBottom: 8 },
  mapControl: { paddingVertical: 7, paddingHorizontal: 9, borderRadius: 8, backgroundColor: "#fff0f1" },
  mapControlText: { color: "#bd0010", fontSize: 11, fontWeight: "800" },
  imageEmpty: { alignItems: "center", gap: 8 },
  imageEmptyText: { color: "#8a94a4", fontSize: 11 },
});