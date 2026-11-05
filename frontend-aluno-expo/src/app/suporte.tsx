import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { ContentCard } from "@/components/ContentCard";
import { EmptyState, ErrorState, LoadingState, ScreenShell } from "@/components/ScreenShell";
import { useAuth } from "@/context/AuthContext";
import { useFeedback } from "@/context/FeedbackContext";
import type { Faq } from "@/lib/types";
import { studentService } from "@/services/studentService";

export default function SupportScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { showFeedback } = useFeedback();
  const token = session?.token;
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [category, setCategory] = useState("TODAS");
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!session) return;
    studentService.faqs(session.token)
      .then((result) => { if (active) setFaqs(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as perguntas."); })
      .finally(() => { if (active) { setLoading(false); setRefreshing(false); } });
    return () => { active = false; };
  }, [reloadKey, session]);

  if (!session) return <Redirect href="/login" />;
  const categories = ["TODAS", ...new Set(faqs.map((item) => item.categoria).filter((value): value is string => Boolean(value)))];
  const visibleFaqs = category === "TODAS" ? faqs : faqs.filter((item) => item.categoria === category);
  const refresh = () => { setRefreshing(true); setError(""); setReloadKey((value) => value + 1); };

  async function submitTicket() {
    if (!token || !assunto.trim() || descricao.trim().length < 30) {
      showFeedback("Informe o assunto e uma descrição com pelo menos 30 caracteres.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await studentService.abrirChamado(token, assunto.trim(), descricao.trim());
      setAssunto("");
      setDescricao("");
      showFeedback("Chamado enviado com sucesso.", "success");
    } catch (cause) {
      showFeedback(cause instanceof Error ? cause.message : "Tente novamente.", "error");
    } finally { setSubmitting(false); }
  }

  return <ScreenShell eyebrow="AJUDA SENAI FLOW" title="Central de Suporte" subtitle="Consulte as respostas ou abra um chamado." refreshing={refreshing} onRefresh={refresh}>
    <Pressable style={styles.homeReturn} onPress={() => router.replace("/(tabs)")}><Ionicons name="home-outline" size={17} color="#bd0010" /><Text style={styles.homeReturnText}>Voltar para Minha Turma</Text></Pressable>
    <Text style={styles.section}>Perguntas frequentes</Text>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={refresh} /> : <>
      <View style={styles.categories}>{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}><Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text></Pressable>)}</View>
      {visibleFaqs.length ? visibleFaqs.map((item) => <ContentCard key={item.id_faq} style={styles.faq}>
        <Pressable onPress={() => setOpenFaq(openFaq === item.id_faq ? null : item.id_faq)} style={styles.question}><Text style={styles.questionText}>{item.pergunta}</Text><Ionicons name={openFaq === item.id_faq ? "chevron-up" : "chevron-down"} size={18} color="#8993a3" /></Pressable>
        {openFaq === item.id_faq && <Text style={styles.answer}>{item.resposta}</Text>}
      </ContentCard>) : <EmptyState title="Nenhuma pergunta cadastrada" detail="As perguntas frequentes aparecerão aqui quando forem publicadas." />}
    </>}
    <Text style={styles.section}>Abrir chamado</Text>
    <ContentCard style={styles.ticketForm}>
      <Text style={styles.label}>Assunto</Text><TextInput style={styles.input} maxLength={255} value={assunto} onChangeText={setAssunto} placeholder="Ex.: acesso ao portal" placeholderTextColor="#9aa3b0" />
      <Text style={styles.label}>Descreva a dúvida ou problema</Text><TextInput style={[styles.input, styles.multiline]} multiline textAlignVertical="top" maxLength={255} value={descricao} onChangeText={setDescricao} placeholder="Inclua detalhes para que possamos ajudar..." placeholderTextColor="#9aa3b0" />
      <Text style={styles.counter}>{descricao.length}/255 · mínimo 30</Text>
      <Pressable style={[styles.submit, submitting && styles.disabled]} onPress={submitTicket} disabled={submitting}><Text style={styles.submitText}>{submitting ? "Enviando..." : "Enviar chamado"}</Text></Pressable>
    </ContentCard>
  </ScreenShell>;
}

const styles = StyleSheet.create({
  section: { color: "#111a2e", fontSize: 16, fontWeight: "800", marginTop: 4 },
  homeReturn: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 6 },
  homeReturnText: { color: "#bd0010", fontSize: 13, fontWeight: "700" },
  categories: { flexDirection: "row", gap: 7 },
  category: { minHeight: 35, justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: "#e2e7ee", borderRadius: 20, backgroundColor: "#fff" },
  categoryActive: { borderColor: "#e30613", backgroundColor: "#e30613" },
  categoryText: { color: "#5d687c", fontSize: 11, fontWeight: "700" },
  categoryTextActive: { color: "#fff" },
  faq: { gap: 10 },
  question: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 9 },
  questionText: { flex: 1, color: "#263248", fontSize: 13, fontWeight: "700", lineHeight: 19 },
  answer: { color: "#647086", fontSize: 12, lineHeight: 18 },
  ticketForm: { gap: 10 },
  label: { color: "#465166", fontSize: 12, fontWeight: "800" },
  input: { minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: "#d8dee8", borderRadius: 10, backgroundColor: "#fbfcfd", color: "#111a2e", fontSize: 14 },
  multiline: { minHeight: 115, paddingTop: 12 },
  counter: { alignSelf: "flex-end", marginTop: -7, color: "#8a94a4", fontSize: 10 },
  submit: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#e30613" },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.6 },
});