import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { ContentCard } from "@/components/ContentCard";
import { EmptyState, ErrorState, LoadingState, ScreenShell } from "@/components/ScreenShell";
import { useAuth } from "@/context/AuthContext";
import type { MinhaTurma } from "@/lib/types";
import { studentService } from "@/services/studentService";
import { useClock } from "@/hooks/useClock";

export default function MyClassScreen() {
  const { session } = useAuth();
  const [data, setData] = useState<MinhaTurma | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const { now, updateNow } = useClock();

  useEffect(() => {
    let active = true;
    if (!session) return;
    studentService.minhaTurma(session.token)
      .then((result) => { if (active) { setData(result); updateNow(); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar sua turma."); })
      .finally(() => { if (active) { setLoading(false); setRefreshing(false); } });
    return () => { active = false; };
  }, [reloadKey, session, updateNow]);

  if (!session) return <Redirect href="/login" />;

  const notices = (data?.comunicados || []).filter((item) => {
    const published = Date.parse(item.dt_publicacao);
    return now === 0 || (Number.isFinite(published) && now >= published && now - published < 48 * 60 * 60 * 1000);
  });
  const refresh = () => { setRefreshing(true); setError(""); setReloadKey((value) => value + 1); };

  return (
    <ScreenShell eyebrow="ESPAÇO DA TURMA" title="Minha Turma" subtitle="Avisos e informações da sua turma." refreshing={refreshing} onRefresh={refresh}>
      {loading ? <LoadingState label="Carregando os dados da turma..." /> : error ? <ErrorState message={error} onRetry={refresh} /> : <>
        <View style={styles.classBanner}>
          <Text style={styles.bannerLabel}>SUA TURMA</Text>
          <Text style={styles.className}>{data?.turma?.nome || "Turma não atribuída"}</Text>
          <View style={styles.divider} />
          <Text style={styles.bannerMeta}>Curso</Text><Text style={styles.bannerValue}>{data?.turma?.curso || "Não informado pela API"}</Text>
          <Text style={styles.bannerMeta}>Docentes</Text><Text style={styles.bannerValue}>{data?.docentes?.length ? data.docentes.map((item) => item.nome).join(", ") : "Nenhum docente vinculado"}</Text>
        </View>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Mural da turma</Text><Text style={styles.count}>{notices.length}</Text></View>
        {notices.length ? notices.map((item) => <ContentCard key={item.id_comunicado} style={styles.noticeCard}>
          <Text style={styles.noticeType}>AVISO DA TURMA</Text><Text style={styles.noticeTitle}>{item.titulo}</Text><Text style={styles.noticeBody}>{item.conteudo}</Text><Text style={styles.noticeDate}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(item.dt_publicacao))}</Text>
        </ContentCard>) : <EmptyState title="Sem avisos por enquanto" detail="Os comunicados recentes da sua turma aparecerão aqui." />}
      </>}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  classBanner: { padding: 18, borderRadius: 15, backgroundColor: "#111a2e" },
  bannerLabel: { color: "#ff747c", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  className: { marginTop: 7, color: "#fff", fontSize: 21, fontWeight: "800" },
  divider: { height: 1, marginVertical: 15, backgroundColor: "rgba(255,255,255,0.12)" },
  bannerMeta: { marginTop: 8, color: "#aeb9ca", fontSize: 11, fontWeight: "700" },
  bannerValue: { marginTop: 3, color: "#fff", fontSize: 13, lineHeight: 19, fontWeight: "600" },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  sectionTitle: { color: "#111a2e", fontSize: 17, fontWeight: "800" },
  count: { minWidth: 26, paddingVertical: 4, paddingHorizontal: 7, borderRadius: 8, backgroundColor: "#fff0f1", color: "#e30613", textAlign: "center", fontSize: 12, fontWeight: "800" },
  noticeCard: { gap: 7 },
  noticeType: { color: "#e30613", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  noticeTitle: { color: "#111a2e", fontSize: 15, fontWeight: "800" },
  noticeBody: { color: "#596579", fontSize: 13, lineHeight: 19 },
  noticeDate: { marginTop: 3, color: "#909aaa", fontSize: 11 },
});