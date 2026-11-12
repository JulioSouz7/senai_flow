import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useFeedback } from "@/context/FeedbackContext";
import { ContentCard } from "@/components/ContentCard";
import { EmptyState, ErrorState, LoadingState, ScreenShell } from "@/components/ScreenShell";
import type { Relato } from "@/lib/types";
import { studentService } from "@/services/studentService";

export default function ReportsScreen() {
  const { session } = useAuth();
  const { showFeedback } = useFeedback();
  const [items, setItems] = useState<Relato[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [tipo, setTipo] = useState<"SUGESTAO" | "RECLAMACAO">("SUGESTAO");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idUsuario = session?.usuario.id_usuario;

  useEffect(() => {
    let active = true;
    if (!session || !idUsuario) return;

    studentService.relatosDoUsuario(session.token, idUsuario)
      .then((result) => { if (active) setItems(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar seus relatos."); })
      .finally(() => { if (active) { setLoading(false); setRefreshing(false); } });

    return () => { active = false; };
  }, [idUsuario, reloadKey, session]);

  if (!session) return <Redirect href="/login" />;

  const refresh = () => {
    if (!idUsuario) {
      showFeedback("Não foi possível identificar o usuário autenticado.", "warning");
      return;
    }
    setRefreshing(true);
    setError("");
    setReloadKey((value) => value + 1);
  };

  async function submit() {
    if (!session || !descricao.trim()) {
      showFeedback("Preencha a descrição do relato.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await studentService.criarRelato(session.token, tipo, descricao.trim());
      setDescricao("");
      setCreating(false);
      showFeedback("Relato enviado para a administração.", "success");
      refresh();
    } catch (cause) {
      showFeedback(cause instanceof Error ? cause.message : "Não foi possível enviar o relato.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return <ScreenShell eyebrow="SUA VOZ IMPORTA" title="Relatos" subtitle="Sugestões e reclamações enviadas à administração." refreshing={refreshing} onRefresh={refresh}>
    {creating ? <ContentCard style={styles.form}>
      <Pressable onPress={() => setCreating(false)} style={styles.back}><Ionicons name="arrow-back" size={17} color="#bd0010" /><Text style={styles.backText}>Voltar aos relatos</Text></Pressable>
      <Text style={styles.label}>Tipo de relato</Text>
      <View style={styles.segment}>
        <Pressable onPress={() => setTipo("SUGESTAO")} style={[styles.segmentButton, tipo === "SUGESTAO" && styles.segmentActive]}><Text style={[styles.segmentText, tipo === "SUGESTAO" && styles.segmentTextActive]}>Sugestão</Text></Pressable>
        <Pressable onPress={() => setTipo("RECLAMACAO")} style={[styles.segmentButton, tipo === "RECLAMACAO" && styles.segmentActive]}><Text style={[styles.segmentText, tipo === "RECLAMACAO" && styles.segmentTextActive]}>Reclamação</Text></Pressable>
      </View>
      <Text style={styles.label}>Descrição</Text>
      <TextInput multiline textAlignVertical="top" style={styles.textarea} maxLength={255} placeholder="Escreva sua mensagem..." placeholderTextColor="#9aa3b0" value={descricao} onChangeText={setDescricao} />
      <Text style={styles.counter}>{descricao.length}/255</Text>
      <Pressable style={[styles.primary, (submitting || !descricao.trim()) && styles.disabled]} onPress={submit} disabled={submitting || !descricao.trim()}><Text style={styles.primaryText}>{submitting ? "Enviando..." : "Enviar relato"}</Text></Pressable>
    </ContentCard> : <>
      <Pressable style={styles.create} onPress={() => setCreating(true)}><Ionicons name="add" size={21} color="#fff" /><Text style={styles.createText}>Criar relato</Text></Pressable>
      {!idUsuario ? <ErrorState message="Não foi possível identificar o usuário autenticado." /> : loading ? <LoadingState label="Carregando seus relatos..." /> : error ? <ErrorState message={error} onRetry={refresh} /> : items.length ? items.map((item) => <ReportCard key={item.id_relato} item={item} />) : <EmptyState title="Nenhum relato enviado" detail="Seus relatos enviados aparecerão aqui." />}
    </>}
  </ScreenShell>;
}

function ReportCard({ item }: { item: Relato }) {
  const answered = Boolean(item.resposta?.trim());
  const statusLabel = item.status === "CORPORATIVO" ? "Encaminhado ao corporativo" : item.status === "LIDO" ? "Lido" : item.status === "ENVIADO" ? "Enviado" : item.status === "PENDENTE" ? "Pendente" : item.status;
  const adminName = item.admin?.usuario?.nome;

  return <ContentCard style={styles.reportCard}>
    <View style={styles.cardTop}><Text style={styles.kind}>{item.tipo === "SUGESTAO" ? "SUGESTÃO" : "RECLAMAÇÃO"}</Text><Text style={[styles.status, item.status === "PENDENTE" ? styles.pending : item.status === "LIDO" ? styles.read : item.status === "CORPORATIVO" ? styles.corporate : styles.sent]}>{statusLabel}</Text></View>
    <Text style={styles.description}>{item.descricao}</Text>
    <Text style={styles.date}>Enviado em {formatDate(item.dt_envio)}</Text>
    {item.prazo_resposta && <Text style={styles.date}>Prazo de resposta: {formatDate(item.prazo_resposta)}</Text>}
    <View style={styles.answerRow}><View style={[styles.dot, answered && styles.greenDot]} /><Text style={styles.answerLabel}>{answered ? "Resposta recebida" : "Aguardando retorno"}</Text></View>
    {answered && <View style={styles.response}><Text style={styles.responseTitle}>{adminName ? `Resposta de ${adminName}` : "Resposta da administração"}</Text><Text style={styles.responseText}>{item.resposta}</Text></View>}
  </ContentCard>;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não disponível";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  backText: { color: "#bd0010", fontSize: 13, fontWeight: "700" },
  label: { color: "#465166", fontSize: 12, fontWeight: "800" },
  segment: { flexDirection: "row", gap: 8 },
  segmentButton: { flex: 1, minHeight: 43, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e2e7ee", borderRadius: 10, backgroundColor: "#fff" },
  segmentActive: { borderColor: "#ffd1d4", backgroundColor: "#fff0f1" },
  segmentText: { color: "#596579", fontSize: 13, fontWeight: "700" },
  segmentTextActive: { color: "#bd0010" },
  textarea: { minHeight: 140, padding: 13, borderWidth: 1, borderColor: "#d8dee8", borderRadius: 10, backgroundColor: "#fbfcfd", color: "#111a2e", fontSize: 14 },
  counter: { alignSelf: "flex-end", marginTop: -7, color: "#8a94a4", fontSize: 10 },
  primary: { minHeight: 49, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#e30613" },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.58 },
  create: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 11, backgroundColor: "#e30613" },
  createText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  reportCard: { gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  kind: { color: "#68748a", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  status: { paddingVertical: 5, paddingHorizontal: 8, overflow: "hidden", borderRadius: 99, fontSize: 10, fontWeight: "800" },
  pending: { backgroundColor: "#fff0f1", color: "#b9000c" },
  sent: { backgroundColor: "#eef4ff", color: "#315d9b" },
  read: { backgroundColor: "#edf7f0", color: "#26734a" },
  corporate: { backgroundColor: "#f0eff7", color: "#5e567e" },
  description: { color: "#263248", fontSize: 14, lineHeight: 20 },
  date: { color: "#929bab", fontSize: 11 },
  answerRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#c0c6d0" },
  greenDot: { backgroundColor: "#22a365" },
  answerLabel: { color: "#667187", fontSize: 11, fontWeight: "700" },
  response: { padding: 11, borderLeftWidth: 3, borderLeftColor: "#22a365", borderRadius: 8, backgroundColor: "#f5faf7", gap: 5 },
  responseTitle: { color: "#38835c", fontSize: 10, fontWeight: "800" },
  responseText: { color: "#43564a", fontSize: 12, lineHeight: 18 },
});
