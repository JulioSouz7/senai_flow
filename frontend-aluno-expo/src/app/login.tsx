import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useFeedback } from "@/context/FeedbackContext";
import { ApiError } from "@/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const { login, session, pendingSession, loading } = useAuth();
  const { showFeedback } = useFeedback();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (session) router.replace("/(tabs)");
    else if (pendingSession) router.replace("/primeiro-acesso");
  }, [loading, pendingSession, router, session]);

  async function submit() {
    if (!email.trim() || !senha) {
      showFeedback("Informe seu e-mail e sua senha.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const result = await login(email.trim(), senha);
      router.replace(result.requiresPasswordChange ? "/primeiro-acesso" : "/(tabs)");
    } catch (error) {
      const message = error instanceof ApiError && error.status === 401
        ? "E-mail ou senha inválidos."
        : error instanceof Error ? error.message : "Não foi possível entrar. Verifique a conexão.";
      showFeedback(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.markText}>S</Text></View><Text style={styles.brand}>SENAI <Text style={styles.brandBold}>Flow</Text></Text></View>
          <View style={styles.intro}><Text style={styles.eyebrow}>PORTAL DO ALUNO</Text><Text style={styles.title}>Seu SENAI,{"\n"}mais perto.</Text><Text style={styles.subtitle}>Entre com suas credenciais institucionais.</Text></View>
          <View style={styles.form}>
            <Text style={styles.label}>E-mail institucional</Text>
            <View style={styles.inputWrap}><Ionicons name="mail-outline" size={19} color="#8993a3" /><TextInput style={styles.input} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="nome@aluno.senai.br" placeholderTextColor="#a4adba" value={email} onChangeText={setEmail} returnKeyType="next" /></View>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrap}><Ionicons name="lock-closed-outline" size={19} color="#8993a3" /><TextInput style={styles.input} autoComplete="password" secureTextEntry={!showPassword} placeholder="Sua senha" placeholderTextColor="#a4adba" value={senha} onChangeText={setSenha} onSubmitEditing={submit} returnKeyType="go" /><Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"} onPress={() => setShowPassword((value) => !value)}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#788398" /></Pressable></View>
            <Link href="/esqueci-senha" style={styles.forgot}>Esqueci minha senha</Link>
            <Pressable accessibilityRole="button" style={[styles.primary, submitting && styles.disabled]} onPress={submit} disabled={submitting}>{submitting ? <ActivityIndicator color="#fff" /> : <><Text style={styles.primaryText}>Entrar na plataforma</Text><Ionicons name="arrow-forward" size={19} color="#fff" /></>}</Pressable>
          </View>
          <View style={styles.footer}><Ionicons name="shield-checkmark-outline" size={18} color="#8993a3" /><Text style={styles.footerText}>Acesso exclusivo da comunidade SENAI</Text></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f5f7" },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 28 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 52 },
  brandMark: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#e30613" },
  markText: { color: "#fff", fontSize: 26, fontWeight: "900" },
  brand: { color: "#111a2e", fontSize: 19, fontWeight: "600" },
  brandBold: { fontWeight: "900" },
  intro: { gap: 9, marginBottom: 32 },
  eyebrow: { color: "#e30613", fontSize: 11, fontWeight: "900", letterSpacing: 1.15 },
  title: { color: "#111a2e", fontSize: 35, lineHeight: 40, fontWeight: "800" },
  subtitle: { color: "#788398", fontSize: 15, lineHeight: 22 },
  form: { gap: 11 },
  label: { marginTop: 6, color: "#38445a", fontSize: 13, fontWeight: "700" },
  inputWrap: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, borderWidth: 1, borderColor: "#dce1e8", borderRadius: 11, backgroundColor: "#fff" },
  input: { flex: 1, minWidth: 0, paddingVertical: 14, color: "#111a2e", fontSize: 15 },
  forgot: { alignSelf: "flex-end", marginTop: 1, marginBottom: 8, color: "#bd0010", fontSize: 12, fontWeight: "700" },
  primary: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 11, backgroundColor: "#e30613" },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.65 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 24 },
  footerText: { color: "#8993a3", fontSize: 11 },
});