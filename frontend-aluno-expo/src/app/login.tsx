import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const { login, session, pendingSession, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (session) router.replace("/(tabs)");
    else if (pendingSession) router.replace("/primeiro-acesso");
  }, [loading, pendingSession, router, session]);

  async function submit() {
    if (!email.trim() || !senha) {
      setErrorMessage("Informe seu e-mail e sua senha.");
      return;
    }
    setErrorMessage("");
    setSubmitting(true);
    try {
      const result = await login(email.trim(), senha);
      router.replace(result.requiresPasswordChange ? "/primeiro-acesso" : "/(tabs)");
    } catch (error) {
      const message = error instanceof ApiError && error.status === 401
        ? "E-mail ou senha inválidos."
        : error instanceof Error ? error.message : "Não foi possível entrar. Verifique a conexão.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandHeader}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}><Text style={styles.markText}>S</Text></View>
              <View>
                <Text style={styles.brand}><Text style={styles.brandSenai}>SENAI</Text> <Text style={styles.brandFlow}>Flow</Text></Text>
                <Text style={styles.brandSubtitle}>ALMIRANTE TAMANDARÉ</Text>
              </View>
            </View>
          </View>

          <View style={styles.intro}>
            <Text style={styles.eyebrow}>PORTAL INSTITUCIONAL</Text>
            <Text style={styles.title}>Bem-vindo ao <Text style={styles.titleSenai}>SENAI</Text> <Text style={styles.titleFlow}>Flow</Text></Text>
            <Text style={styles.subtitle}>Acesse com suas credenciais educacionais.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>E-mail institucional</Text>
            <TextInput style={styles.input} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="nome@aluno.senai.br" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} returnKeyType="next" />

            <Text style={styles.label}>Senha</Text>
            <TextInput style={styles.input} autoCapitalize="none" secureTextEntry placeholder="Sua senha" placeholderTextColor="#9ca3af" value={senha} onChangeText={setSenha} onSubmitEditing={submit} returnKeyType="go" />

            {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primary, (pressed || submitting) && styles.buttonPressed]} onPress={submit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Entrar na plataforma</Text>}
            </Pressable>
            <Text style={styles.secureNote}>Acesso exclusivo da comunidade SENAI</Text>
          </View>
          <Text style={styles.footer}>Espaços que fluem. Ensino que transforma.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f5f7" },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingVertical: 24, justifyContent: "center", alignItems: "center" },
  brandHeader: { width: "100%", maxWidth: 520, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 42 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandMark: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: "#e30613" },
  markText: { color: "#fff", fontSize: 28, fontStyle: "italic", fontWeight: "800" },
  brand: { color: "#111827", fontSize: 21, fontWeight: "400", letterSpacing: -0.5 },
  brandSenai: { fontWeight: "800" },
  brandFlow: { fontWeight: "400" },
  brandSubtitle: { color: "#6b7280", fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginTop: 3 },
  intro: { width: "100%", maxWidth: 520, marginBottom: 24 },
  eyebrow: { marginBottom: 8, color: "#e30613", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: "#111827", fontSize: 27, fontWeight: "800", lineHeight: 33 },
  titleSenai: { fontWeight: "800" },
  titleFlow: { fontWeight: "400" },
  subtitle: { marginTop: 7, color: "#6b7280", fontSize: 14, lineHeight: 21 },
  formCard: { width: "100%", maxWidth: 520, padding: 20, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, backgroundColor: "#fff" },
  label: { marginTop: 12, marginBottom: 7, color: "#374151", fontSize: 13, fontWeight: "700" },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, color: "#111827", fontSize: 15, backgroundColor: "#fff" },
  error: { marginTop: 14, padding: 12, borderRadius: 9, color: "#b91c1c", backgroundColor: "#fef2f2", fontSize: 13, lineHeight: 19 },
  primary: { minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 14, borderRadius: 10, backgroundColor: "#e30613" },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  buttonPressed: { opacity: 0.78 },
  secureNote: { marginTop: 16, color: "#6b7280", fontSize: 12, textAlign: "center" },
  footer: { width: "100%", maxWidth: 520, marginTop: 30, color: "#9ca3af", fontSize: 12, textAlign: "center" },
});