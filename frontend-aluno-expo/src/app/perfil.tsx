import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { ContentCard } from "@/components/ContentCard";
import { ScreenShell } from "@/components/ScreenShell";
import { useFeedback } from "@/context/FeedbackContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, logout } = useAuth();
  const { showFeedback } = useFeedback();

  if (!session) return <Redirect href="/login" />;
  const student = session.usuario.aluno;
  const initials = session.usuario.nome.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  async function handleLogout() {
    await logout();
    showFeedback("Logout realizado com sucesso!", "success");
    router.replace("/login");
  }

  return <ScreenShell eyebrow="MINHA CONTA" title="Perfil" subtitle="Seus dados de acesso." showProfile={false}>
    <Pressable style={styles.homeReturn} onPress={() => router.replace("/(tabs)")}><Ionicons name="home-outline" size={17} color="#bd0010" /><Text style={styles.homeReturnText}>Voltar para Minha Turma</Text></Pressable>
    <ContentCard style={styles.identity}><View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View><View style={styles.identityText}><Text style={styles.name}>{session.usuario.nome}</Text><Text style={styles.role}>ALUNO</Text></View></ContentCard>
    <ContentCard style={styles.info}>
      <Field label="E-mail institucional" value={session.usuario.email} />
      <View style={styles.columns}><Field label="Turma" value={student?.turma?.nome || "Turma não atribuída"} /><Field label="Matrícula" value={student?.matricula || "Não informada"} /></View>
    </ContentCard>
    <Pressable style={styles.supportButton} onPress={() => router.push("/suporte")}><Ionicons name="headset-outline" size={20} color="#fff" /><Text style={styles.supportText}>Central de Suporte / FAQ</Text></Pressable>
    <Pressable style={styles.logout} onPress={handleLogout}><Ionicons name="log-out-outline" size={19} color="#788398" /><Text style={styles.logoutText}>Sair da conta</Text></Pressable>
  </ScreenShell>;
}

function Field({ label, value }: { label: string; value: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  identity: { flexDirection: "row", alignItems: "center", gap: 13 },
  avatar: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 29, backgroundColor: "#ffe2e4" },
  avatarText: { color: "#bd0010", fontSize: 17, fontWeight: "900" },
  identityText: { flex: 1, gap: 6 },
  name: { color: "#111a2e", fontSize: 19, fontWeight: "800" },
  role: { alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 8, overflow: "hidden", borderRadius: 6, backgroundColor: "#fff0f1", color: "#e30613", fontSize: 10, fontWeight: "900" },
  info: { gap: 18 },
  columns: { flexDirection: "row", gap: 16 },
  field: { flex: 1, gap: 5 },
  label: { color: "#929bab", fontSize: 12, fontWeight: "700" },
  value: { color: "#263248", fontSize: 14, fontWeight: "700" },
  supportButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: 11, backgroundColor: "#111a2e" },
  homeReturn: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 6 },
  homeReturnText: { color: "#bd0010", fontSize: 13, fontWeight: "700" },
  supportText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  logout: { minHeight: 45, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  logoutText: { color: "#788398", fontSize: 13, fontWeight: "600" },
});