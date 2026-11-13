import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Redirect } from "expo-router";
import { ContentCard } from "@/components/ContentCard";
import { EmptyState, ErrorState, LoadingState, ScreenShell } from "@/components/ScreenShell";
import { useAuth } from "@/context/AuthContext";
import type { Comunicado } from "@/lib/types";
import { studentService } from "@/services/studentService";
import { useClock } from "@/hooks/useClock";

export default function AnnouncementsScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const { now, updateNow } = useClock();

  useEffect(() => {
    let active = true;
    if (!session) return;
    studentService.comunicados(session.token)
      .then((result) => { if (active) { setItems(result); updateNow(); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar os comunicados."); })
      .finally(() => { if (active) { setLoading(false); setRefreshing(false); } });
    return () => { active = false; };
  }, [reloadKey, session, updateNow]);

  if (!session) return <Redirect href="/login" />;
  const visible = items.filter((item) => {
    const date = Date.parse(item.dt_publicacao);
    return now === 0 || (Number.isFinite(date) && now >= date && now - date < 48 * 60 * 60 * 1000);
  });
  const refresh = () => { setRefreshing(true); setError(""); setReloadKey((value) => value + 1); };

  return <ScreenShell eyebrow="INSTITUIÇÃO" title="Comunicados" subtitle="Avisos gerais publicados para a comunidade SENAI." refreshing={refreshing} onRefresh={refresh}>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refresh} /> : visible.length ? visible.map((item) => <ContentCard key={item.id_comunicado} style={{ gap: 8 }}>
      <TextTag text="AVISO INSTITUCIONAL" /><TextTitle text={item.titulo} /><TextBody text={item.conteudo} /><TextDate value={item.dt_publicacao} />
    </ContentCard>) : <EmptyState title="Nenhum comunicado recente" detail="Comunicados gerais são exibidos por até 48 horas após a publicação." />}
  </ScreenShell>;
}

function TextTag({ text }: { text: string }) { return <Text style={styles.tag}>{text}</Text>; }
function TextTitle({ text }: { text: string }) { return <Text style={styles.title}>{text}</Text>; }
function TextBody({ text }: { text: string }) { return <Text style={styles.body}>{text}</Text>; }
function TextDate({ value }: { value: string }) { return <Text style={styles.date}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value))}</Text>; }

const styles = StyleSheet.create({
  tag: { color: "#e30613", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  title: { color: "#111a2e", fontSize: 15, fontWeight: "800" },
  body: { color: "#596579", fontSize: 13, lineHeight: 19 },
  date: { color: "#909aaa", fontSize: 11 },
});