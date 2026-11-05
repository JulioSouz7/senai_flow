import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { ContentCard } from "@/components/ContentCard";
import { EmptyState, ErrorState, LoadingState, ScreenShell } from "@/components/ScreenShell";
import { useAuth } from "@/context/AuthContext";
import type { RankingSala } from "@/lib/types";
import { studentService } from "@/services/studentService";
import { StyleSheet, Text, View } from "react-native";

export default function RankingScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<RankingSala[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (!session) return;
    studentService.ranking(session.token)
      .then((result) => { if (active) setItems(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o ranking."); })
      .finally(() => { if (active) { setLoading(false); setRefreshing(false); } });
    return () => { active = false; };
  }, [reloadKey, session]);

  if (!session) return <Redirect href="/login" />;
  const refresh = () => { setRefreshing(true); setError(""); setReloadKey((value) => value + 1); };

  return <ScreenShell eyebrow="CUIDADO COM OS ESPAÇOS" title="Ranking de salas" subtitle="Pontuação de organização registrada no semestre." refreshing={refreshing} onRefresh={refresh}>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refresh} /> : items.length ? items.map((item) => <ContentCard key={item.id_sala} style={styles.row}>
      <View style={[styles.position, item.posicao === 1 && styles.first]}><Text style={styles.positionText}>{item.posicao === 1 ? "★" : String(item.posicao).padStart(2, "0")}</Text></View>
      <View style={styles.details}><Text style={styles.room}>{item.nome_sala}</Text><Text style={styles.building}>{item.predio} · {item.total_avaliacoes} avaliações</Text></View>
      <View style={styles.score}><Text style={styles.points}>{item.total_pontos}</Text><Text style={styles.pointsLabel}>pontos</Text></View>
    </ContentCard>) : <EmptyState title="Ranking ainda sem pontuação" detail="As salas avaliadas aparecerão quando houver registros no semestre." />}
  </ScreenShell>;
}

const styles = StyleSheet.create({
  row: { minHeight: 75, flexDirection: "row", alignItems: "center", gap: 12 },
  position: { width: 39, height: 39, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#f0f2f5" },
  first: { backgroundColor: "#fff2d6" },
  positionText: { color: "#596579", fontSize: 14, fontWeight: "900" },
  details: { flex: 1 },
  room: { color: "#111a2e", fontSize: 14, fontWeight: "800" },
  building: { marginTop: 4, color: "#788398", fontSize: 11 },
  score: { alignItems: "flex-end" },
  points: { color: "#e30613", fontSize: 18, fontWeight: "900" },
  pointsLabel: { color: "#788398", fontSize: 10 },
});