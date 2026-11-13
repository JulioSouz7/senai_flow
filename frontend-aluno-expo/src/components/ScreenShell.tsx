import { Ionicons } from "@expo/vector-icons";
import { RefreshControl, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PropsWithChildren, ReactNode } from "react";
import { PortalHeader } from "@/components/PortalHeader";

interface ScreenShellProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  subtitle: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  showProfile?: boolean;
  headingAction?: ReactNode;
}

export function ScreenShell({ eyebrow, title, subtitle, refreshing = false, onRefresh, showProfile = true, headingAction, children }: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e30613" colors={["#e30613"]} /> : undefined}
      >
        <PortalHeader showProfile={showProfile} />
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {(headingAction || onRefresh) && <View style={styles.headingActions}>
            {headingAction}
            {onRefresh && <Pressable accessibilityRole="button" accessibilityLabel={`Atualizar ${title}`} onPress={onRefresh} disabled={refreshing} style={styles.refreshButton}>
              <Ionicons name="refresh" size={19} color={refreshing ? "#9aa3b0" : "#596579"} />
            </Pressable>}
          </View>}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return <View style={styles.state}><Text style={styles.stateText}>{label}</Text></View>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <View style={styles.error}><Text style={styles.errorText}>{message}</Text>{onRetry && <Pressable onPress={onRetry}><Text style={styles.retry}>Tentar novamente</Text></Pressable>}</View>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="information-circle-outline" size={22} color="#e30613" /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyText}>{detail}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f5f7" },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 112, gap: 14 },
  headingRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 4 },
  headingCopy: { flex: 1, minWidth: 0, gap: 5 },
  eyebrow: { color: "#e30613", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  title: { flexShrink: 1, color: "#111a2e", fontSize: 28, lineHeight: 34, fontWeight: "800" },
  subtitle: { color: "#788398", fontSize: 14, lineHeight: 20 },
  headingActions: { flexDirection: "row", alignItems: "center", gap: 7 },
  refreshButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e2e7ee", borderRadius: 11, backgroundColor: "#fff" },
  state: { padding: 22, alignItems: "center", borderRadius: 14, backgroundColor: "#fff" },
  stateText: { color: "#788398", fontSize: 13 },
  error: { padding: 16, gap: 12, borderWidth: 1, borderColor: "#ffc9cc", borderRadius: 13, backgroundColor: "#fff7f7" },
  errorText: { color: "#a5000b", fontSize: 13, lineHeight: 19 },
  retry: { color: "#bd0010", fontSize: 13, fontWeight: "800" },
  empty: { padding: 25, alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e2e7ee", borderRadius: 14, backgroundColor: "#fff" },
  emptyIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#fff0f1" },
  emptyTitle: { color: "#111a2e", fontSize: 15, fontWeight: "800", textAlign: "center" },
  emptyText: { color: "#788398", fontSize: 12, lineHeight: 18, textAlign: "center" },
});