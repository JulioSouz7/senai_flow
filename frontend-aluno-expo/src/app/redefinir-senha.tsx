import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "@/services/authService";
import { ApiError } from "@/lib/api";
import { useFeedback } from "@/context/FeedbackContext";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const router = useRouter();
  const [token, setToken] = useState(() => typeof params.token === "string" ? params.token : "");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showFeedback } = useFeedback();

  async function submit() {
    if (!token.trim()) {
      showFeedback("Cole o token recebido no link de recuperação.", "error");
      return;
    }
    if (novaSenha !== confirmacao) {
      showFeedback("Confira a nova senha e a confirmação.", "error");
      return;
    }
    if (new TextEncoder().encode(novaSenha).length < 8 || new TextEncoder().encode(novaSenha).length > 72) {
      showFeedback("Use uma senha entre 8 e 72 bytes.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword(token.trim(), novaSenha);
      showFeedback("Senha redefinida. Entre com sua nova senha.", "success");
      router.replace("/login");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Não foi possível redefinir a senha.";
      showFeedback(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Link href="/login" style={styles.back}><Ionicons name="arrow-back" size={17} color="#bd0010" /> Voltar ao login</Link>
          <Text style={styles.eyebrow}>RECUPERAÇÃO DE ACESSO</Text>
          <Text style={styles.title}>Crie uma nova senha</Text>
          <Text style={styles.subtitle}>O link expira em 30 minutos e só pode ser usado uma vez. Se o e-mail abriu no navegador, cole abaixo o token da URL.</Text>
          {!token && <><Text style={styles.label}>Token do e-mail</Text><TextInput style={styles.input} autoCapitalize="none" autoCorrect={false} autoComplete="one-time-code" value={token} onChangeText={setToken} placeholder="Cole seu token aqui" placeholderTextColor="#9aa3b0" /></>}
          <Text style={styles.label}>Nova senha</Text>
          <TextInput style={styles.input} secureTextEntry autoComplete="new-password" value={novaSenha} onChangeText={setNovaSenha} maxLength={72} placeholder="Mínimo de 8 bytes" placeholderTextColor="#9aa3b0" />
          <Text style={styles.label}>Confirme a nova senha</Text>
          <TextInput style={styles.input} secureTextEntry autoComplete="new-password" value={confirmacao} onChangeText={setConfirmacao} maxLength={72} placeholder="Repita a nova senha" placeholderTextColor="#9aa3b0" />
          <Pressable style={[styles.button, submitting && styles.disabled]} onPress={submit} disabled={submitting || !novaSenha || !confirmacao}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Redefinir senha</Text>}</Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f5f7" },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 12 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 24, color: "#bd0010", fontSize: 13, fontWeight: "700" },
  eyebrow: { color: "#e30613", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#111a2e", fontSize: 29, fontWeight: "800" },
  subtitle: { marginBottom: 8, color: "#788398", fontSize: 13, lineHeight: 20 },
  label: { color: "#38445a", fontSize: 13, fontWeight: "700" },
  input: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: "#dce1e8", borderRadius: 11, backgroundColor: "#fff", color: "#111a2e", fontSize: 14 },
  button: { minHeight: 54, alignItems: "center", justifyContent: "center", marginTop: 8, borderRadius: 11, backgroundColor: "#e30613" },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.6 },
});