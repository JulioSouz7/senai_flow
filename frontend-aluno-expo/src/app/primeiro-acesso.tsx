import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useFeedback } from "@/context/FeedbackContext";

export default function FirstAccessScreen() {
  const router = useRouter();
  const { pendingSession, changePassword } = useAuth();
  const { showFeedback } = useFeedback();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!pendingSession) {
      router.replace("/login");
      return;
    }
    if (novaSenha !== confirmacao) {
      showFeedback("Confira a nova senha e a confirmação.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(senhaAtual, novaSenha);
      showFeedback("Senha atualizada com sucesso.", "success");
      router.replace("/(tabs)");
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "Tente novamente.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>PRIMEIRO ACESSO</Text>
          <Text style={styles.title}>Crie sua nova senha</Text>
          <Text style={styles.subtitle}>Atualize a senha provisória para continuar no portal.</Text>
          <Text style={styles.label}>Senha atual</Text><TextInput style={styles.input} secureTextEntry autoComplete="current-password" value={senhaAtual} onChangeText={setSenhaAtual} />
          <Text style={styles.label}>Nova senha</Text><TextInput style={styles.input} secureTextEntry autoComplete="new-password" value={novaSenha} onChangeText={setNovaSenha} />
          <Text style={styles.label}>Confirme a nova senha</Text><TextInput style={styles.input} secureTextEntry autoComplete="new-password" value={confirmacao} onChangeText={setConfirmacao} />
          <Pressable style={[styles.button, submitting && styles.disabled]} onPress={submit} disabled={submitting || !senhaAtual || !novaSenha || !confirmacao}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Atualizar senha</Text>}</Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f5f7" },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 12 },
  eyebrow: { color: "#e30613", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#111a2e", fontSize: 29, fontWeight: "800" },
  subtitle: { marginBottom: 12, color: "#788398", fontSize: 14, lineHeight: 21 },
  label: { color: "#38445a", fontSize: 13, fontWeight: "700" },
  input: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: "#dce1e8", borderRadius: 11, backgroundColor: "#fff", color: "#111a2e", fontSize: 14 },
  button: { minHeight: 54, alignItems: "center", justifyContent: "center", marginTop: 8, borderRadius: 11, backgroundColor: "#e30613" },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.6 },
});