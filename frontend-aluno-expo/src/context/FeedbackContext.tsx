import { Ionicons } from "@expo/vector-icons";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FeedbackKind = "success" | "error" | "info";
interface FeedbackMessage { id: number; kind: FeedbackKind; message: string }
interface FeedbackContextValue { showFeedback: (message: string, kind?: FeedbackKind) => void }

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: PropsWithChildren) {
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const showFeedback = useCallback((message: string, kind: FeedbackKind = "info") => {
    if (timer.current) clearTimeout(timer.current);
    counter.current += 1;
    setFeedback({ id: counter.current, kind, message });
    timer.current = setTimeout(() => setFeedback(null), 3200);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const contextValue = useMemo(() => ({ showFeedback }), [showFeedback]);

  return <FeedbackContext.Provider value={contextValue}>
    {children}
    {feedback && <SafeAreaView pointerEvents="box-none" edges={["top"]} style={styles.overlay}>
      <View accessibilityRole="alert" style={[styles.toast, feedback.kind === "success" ? styles.success : feedback.kind === "error" ? styles.error : styles.info]}>
        <Ionicons name={feedback.kind === "success" ? "checkmark-circle" : feedback.kind === "error" ? "alert-circle" : "information-circle"} size={21} color={feedback.kind === "success" ? "#1c7547" : feedback.kind === "error" ? "#a5000b" : "#315d9b"} />
        <Text style={styles.message}>{feedback.message}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar notificação" onPress={() => setFeedback(null)}><Ionicons name="close" size={18} color="#788398" /></Pressable>
      </View>
    </SafeAreaView>}
  </FeedbackContext.Provider>;
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback deve ser usado dentro de FeedbackProvider.");
  return context;
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", zIndex: 100, top: 0, left: 0, right: 0, paddingHorizontal: 14 },
  toast: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderRadius: 13, shadowColor: "#111a2e", shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 8 },
  success: { borderColor: "#cfe7d7", backgroundColor: "#f2faf4" },
  error: { borderColor: "#ffc9cc", backgroundColor: "#fff7f7" },
  info: { borderColor: "#cbdcf5", backgroundColor: "#f3f7ff" },
  message: { flex: 1, color: "#263248", fontSize: 13, lineHeight: 18, fontWeight: "600" },
});