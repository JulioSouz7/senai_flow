import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { ContentCard } from "@/components/ContentCard";
import { EmptyState, ErrorState, LoadingState, ScreenShell } from "@/components/ScreenShell";
import { useAuth } from "@/context/AuthContext";
import { useFeedback } from "@/context/FeedbackContext";
import type { ChamadoSuporte, Faq } from "@/lib/types";
import { studentService } from "@/services/studentService";

export default function SupportScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { showFeedback } = useFeedback();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [tickets, setTickets] = useState<ChamadoSuporte[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [faqError, setFaqError] = useState("");
  const [ticketsError, setTicketsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [category, setCategory] = useState("TODAS");
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idAluno = session?.usuario.aluno?.id_aluno;

  useEffect(() => {
    let active = true;
    if (!session) return;

    const faqRequest = studentService.faqs(session.token)
      .then((result) => { if (active) setFaqs(result); })
      .catch((cause) => { if (active) setFaqError(cause instanceof Error ? cause.message : "Não foi possível carregar as perguntas."); });

    const ticketRequest = idAluno
      ? studentService.chamadosDoAluno(session.token, idAluno)
        .then((result) => { if (active) setTickets(result); })
        .catch((cause) => { if (active) setTicketsError(cause instanceof Error ? cause.message : "Não foi possível carregar seus chamados."); })
      : Promise.resolve();

    Promise.all([faqRequest, ticketRequest]).finally(() => {
      if (active) {
        setLoadingFaqs(false);
        setLoadingTickets(false);
        setRefreshing(false);
      }
    });

    return () => { active = false; };
  }, [idAluno, reloadKey, session]);

  if (!session) return <Redirect href="/login" />;

  const token = session.token;
  const categories = ["TODAS", ...new Set(faqs.map((item) => item.categoria).filter((value): value is string => Boolean(value)))];
  const visibleFaqs = category === "TODAS" ? faqs : faqs.filter((item) => item.categoria === category);
  const refresh = () => {
    if (!idAluno) {
      showFeedback("Não foi possível identificar o aluno autenticado para carregar seus chamados.", "warning");
      return;
    }
    setRefreshing(true);
    setFaqError("");
    setTicketsError("");
    setReloadKey((value) => value + 1);
  };

  async function submitTicket() {
    if (!assunto.trim() || descricao.trim().length < 30) {
      showFeedback("Informe o assunto e uma descrição com pelo menos 30 caracteres.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await studentService.abrirChamado(token, assunto.trim(), descricao.trim());
      setAssunto("");
      setDescricao("");
      showFeedback("Chamado enviado com sucesso.", "success");
      refresh();
    } catch (cause) {
      showFeedback(cause instanceof Error ? cause.message : "Não foi possível enviar o chamado.", "error");
    } finally { setSubmitting(false); }
  }

  return <ScreenShell
    eyebrow="AJUDA SENAI FLOW"
    title="Central de Suporte"
    subtitle="Consulte as respostas, acompanhe seus chamados ou abra um novo."
    refreshing={refreshing}
    onRefresh={refresh}
    headingAction={<Pressable accessibilityRole="button" style={styles.homeAction} onPress={() => router.replace("/(tabs)")}>
      <Ionicons name="home-outline" size={16} color="#bd0010" /><Text style={styles.homeActionText}>Minha Turma</Text>
    </Pressable>}
  >
    <Text style={styles.section}>Perguntas frequentes</Text>
    {loadingFaqs ? <LoadingState label="Carregando perguntas frequentes..." /> : faqError ? <ErrorState message={faqError} onRetry={refresh} /> : <>
      <View style={styles.categories}>{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}><Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text></Pressable>)}</View>
      {visibleFaqs.length ? visibleFaqs.map((item) => <ContentCard key={item.id_faq} style={styles.faq}>
        <Pressable onPress={() => setOpenFaq(openFaq === item.id_faq ? null : item.id_faq)} style={styles.question}><Text style={styles.questionText}>{item.pergunta}</Text><Ionicons name={openFaq === item.id_faq ? "chevron-up" : "chevron-down"} size={18} color="#8993a3" /></Pressable>
        {openFaq === item.id_faq && <Text style={styles.answer}>{item.resposta}</Text>}
      </ContentCard>) : <EmptyState title="Nenhuma pergunta cadastrada" detail="As perguntas frequentes aparecerão aqui quando forem publicadas." />}
    </>}
    <Text style={styles.section}>Acompanhar chamados</Text>
    {!idAluno ? <ErrorState message="Não foi possível identificar o aluno autenticado para carregar seus chamados." /> : loadingTickets ? <LoadingState label="Carregando seus chamados..." /> : ticketsError ? <ErrorState message={ticketsError} onRetry={refresh} /> : tickets.length ? tickets.map((ticket) => <TicketCard key={ticket.id_chamado} ticket={ticket} />) : <EmptyState title="Nenhum chamado encontrado" detail="Os chamados abertos por você aparecerão aqui." />}
    <Text style={styles.section}>Abrir chamado</Text>
    <ContentCard style={styles.ticketForm}>
      <Text style={styles.label}>Assunto</Text><TextInput style={styles.input} maxLength={255} value={assunto} onChangeText={setAssunto} placeholder="Ex.: acesso ao portal" placeholderTextColor="#9aa3b0" />
      <Text style={styles.label}>Descreva a dúvida ou problema</Text><TextInput style={[styles.input, styles.multiline]} multiline textAlignVertical="top" maxLength={255} value={descricao} onChangeText={setDescricao} placeholder="Inclua detalhes para que possamos ajudar..." placeholderTextColor="#9aa3b0" />
      <Text style={styles.counter}>{descricao.length}/255 · mínimo 30</Text>
      <Pressable style={[styles.submit, submitting && styles.disabled]} onPress={submitTicket} disabled={submitting}><Text style={styles.submitText}>{submitting ? "Enviando..." : "Enviar chamado"}</Text></Pressable>
    </ContentCard>
  </ScreenShell>;
}

function TicketCard({ ticket }: { ticket: ChamadoSuporte }) {
  const statusLabel = ticket.status === "ABERTO" ? "Aberto" : ticket.status === "EM_ANDAMENTO" ? "Em andamento" : ticket.status === "RESOLVIDO" ? "Resolvido" : ticket.status;
  const adminName = ticket.admin_resp?.usuario?.nome;

  return <ContentCard style={styles.ticketCard}>
    <View style={styles.ticketTop}>
      <Text style={styles.ticketSubject}>{ticket.assunto}</Text>
      <Text style={[styles.ticketStatus, ticket.status === "RESOLVIDO" ? styles.ticketResolved : ticket.status === "EM_ANDAMENTO" ? styles.ticketInProgress : styles.ticketOpen]}>{statusLabel}</Text>
    </View>
    <Text style={styles.ticketDescription}>{ticket.descricao}</Text>
    <Text style={styles.ticketDate}>Aberto em {formatDate(ticket.dt_abertura)}</Text>
    <Text style={styles.ticketAdmin}>{adminName ? `Responsável: ${adminName}` : "Aguardando responsável"}</Text>
  </ContentCard>;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não disponível";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

const styles = StyleSheet.create({
  section: { color: "#111a2e", fontSize: 16, fontWeight: "800", marginTop: 4 },
  homeAction: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, borderRadius: 10, backgroundColor: "#fff" },
  homeActionText: { color: "#bd0010", fontSize: 12, fontWeight: "700" },
  categories: { flexDirection: "row", gap: 7 },
  category: { minHeight: 35, justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: "#e2e7ee", borderRadius: 20, backgroundColor: "#fff" },
  categoryActive: { borderColor: "#e30613", backgroundColor: "#e30613" },
  categoryText: { color: "#5d687c", fontSize: 11, fontWeight: "700" },
  categoryTextActive: { color: "#fff" },
  faq: { gap: 10 },
  question: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 9 },
  questionText: { flex: 1, color: "#263248", fontSize: 13, fontWeight: "700", lineHeight: 19 },
  answer: { color: "#647086", fontSize: 12, lineHeight: 18 },
  ticketCard: { gap: 9 },
  ticketTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  ticketSubject: { flex: 1, color: "#111a2e", fontSize: 14, fontWeight: "800" },
  ticketStatus: { overflow: "hidden", paddingVertical: 5, paddingHorizontal: 8, borderRadius: 99, fontSize: 10, fontWeight: "800" },
  ticketOpen: { backgroundColor: "#fff0f1", color: "#b9000c" },
  ticketInProgress: { backgroundColor: "#eef4ff", color: "#315d9b" },
  ticketResolved: { backgroundColor: "#edf7f0", color: "#26734a" },
  ticketDescription: { color: "#596579", fontSize: 13, lineHeight: 19 },
  ticketDate: { color: "#929bab", fontSize: 11 },
  ticketAdmin: { color: "#667187", fontSize: 11, fontWeight: "700" },
  ticketForm: { gap: 10 },
  label: { color: "#465166", fontSize: 12, fontWeight: "800" },
  input: { minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: "#d8dee8", borderRadius: 10, backgroundColor: "#fbfcfd", color: "#111a2e", fontSize: 14 },
  multiline: { minHeight: 115, paddingTop: 12 },
  counter: { alignSelf: "flex-end", marginTop: -7, color: "#8a94a4", fontSize: 10 },
  submit: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#e30613" },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.6 },
});
