import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "@/services/authService";
import { ApiError } from "@/lib/api";
import { useFeedback } from "@/context/FeedbackContext";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showFeedback } = useFeedback();

  async function submit() {
    if (!email.trim()) {
      showFeedback("Informe seu e-mail institucional.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "A recuperação está indisponível. Tente novamente mais tarde.";
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
          <Text style={styles.title}>Esqueceu sua senha?</Text>
          <Text style={styles.subtitle}>Informe seu e-mail institucional. Se ele estiver cadastrado, enviaremos instruções para redefinir a senha.</Text>
          {!submitted && <>
            <Text style={styles.label}>E-mail institucional</Text>
            <TextInput style={styles.input} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="nome@aluno.senai.br" placeholderTextColor="#9aa3b0" value={email} onChangeText={setEmail} maxLength={150} />
            <Pressable style={[styles.button, submitting && styles.disabled]} onPress={submit} disabled={submitting || !email.trim()}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar instruções</Text>}</Pressable>
          </>}
          {submitted && <View accessibilityRole="alert" style={styles.notice}>
            <Ionicons name="checkmark-circle" size={20} color="#26734a" />
            <Text style={styles.noticeText}>Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.</Text>
          </View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f5f7" },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 12 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 32, color: "#bd0010", fontSize: 13, fontWeight: "700" },
  eyebrow: { color: "#e30613", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#111a2e", fontSize: 29, fontWeight: "800" },
  subtitle: { marginBottom: 18, color: "#788398", fontSize: 14, lineHeight: 21 },
  label: { color: "#38445a", fontSize: 13, fontWeight: "700" },
  input: { minHeight: 54, paddingHorizontal: 14, borderWidth: 1, borderColor: "#dce1e8", borderRadius: 11, backgroundColor: "#fff", color: "#111a2e", fontSize: 15 },
  button: { minHeight: 54, alignItems: "center", justifyContent: "center", marginTop: 6, borderRadius: 11, backgroundColor: "#e30613" },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 14, borderWidth: 1, borderColor: "#cfe7d7", borderRadius: 11, backgroundColor: "#f2faf4" },
  noticeText: { flex: 1, color: "#236942", fontSize: 14, lineHeight: 21 },
});