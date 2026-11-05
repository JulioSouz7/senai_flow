import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useFeedback } from "@/context/FeedbackContext";
import { ContentCard } from "@/components/ContentCard";
import { EmptyState, ScreenShell } from "@/components/ScreenShell";
import type { Relato } from "@/lib/types";
import { studentService } from "@/services/studentService";

export default function ReportsScreen() {
  const { session } = useAuth();
  const { showFeedback } = useFeedback();
  const token = session?.token;
  const [items, setItems] = useState<Relato[]>([]);
  const [creating, setCreating] = useState(false);
  const [tipo, setTipo] = useState<"SUGESTAO" | "RECLAMACAO">("SUGESTAO");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!session) return <Redirect href="/login" />;

  async function submit() {
    if (!token || !descricao.trim()) return;
    setSubmitting(true);
    try {
      const result = await studentService.criarRelato(token, tipo, descricao.trim());
      setItems((current) => [result.relato, ...current]);
      setDescricao("");
      setCreating(false);
      showFeedback("Relato enviado para a administração.", "success");
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "Tente novamente.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const refreshUnavailable = () => showFeedback("O histórico privado de relatos não está disponível na API atual.", "info");

  return <ScreenShell eyebrow="SUA VOZ IMPORTA" title="Relatos" subtitle="Sugestões e reclamações enviadas à administração." onRefresh={refreshUnavailable}>
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
      {items.length ? items.map((item) => <ReportCard key={item.id_relato} item={item} />) : <EmptyState title="Nenhum relato nesta sessão" detail="O histórico privado não está disponível na API atual. Os relatos criados agora serão exibidos aqui sem consultar dados de outros usuários." />}
      {items.length > 0 && <Text style={styles.disclaimer}>O histórico completo não pode ser atualizado até a API oferecer uma consulta limitada ao aluno autenticado.</Text>}
    </>}
  </ScreenShell>;
}

function ReportCard({ item }: { item: Relato }) {
  const answered = Boolean(item.resposta?.trim());
  const statusLabel = item.status === "CORPORATIVO" ? "Encaminhado ao corporativo" : item.status === "LIDO" ? "Lido" : item.status === "ENVIADO" ? "Enviado" : item.status;
  return <ContentCard style={styles.reportCard}>
    <View style={styles.cardTop}><Text style={styles.kind}>{item.tipo === "SUGESTAO" ? "SUGESTÃO" : "RECLAMAÇÃO"}</Text><Text style={[styles.status, item.status === "PENDENTE" ? styles.pending : item.status === "LIDO" ? styles.read : item.status === "CORPORATIVO" ? styles.corporate : styles.sent]}>{statusLabel}</Text></View>
    <Text style={styles.description}>{item.descricao}</Text>
    <Text style={styles.date}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.dt_envio))}</Text>
    <View style={styles.answerRow}><View style={[styles.dot, answered && styles.greenDot]} /><Text style={styles.answerLabel}>{answered ? "Resposta recebida" : "Aguardando retorno"}</Text></View>
    {answered && <View style={styles.response}><Text style={styles.responseTitle}>Resposta da administração</Text><Text style={styles.responseText}>{item.resposta}</Text></View>}
  </ContentCard>;
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
  disclaimer: { color: "#838d9d", fontSize: 11, lineHeight: 16 },
});