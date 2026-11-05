import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/context/AuthContext";

export function PortalHeader({ showProfile = true }: { showProfile?: boolean }) {
  const router = useRouter();
  const { session } = useAuth();
  const initials = session?.usuario.nome.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S";

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.brandMark}><Text style={styles.markText}>S</Text></View>
        <View><Text style={styles.brandText}>SENAI <Text style={styles.brandStrong}>Flow</Text></Text><Text style={styles.brandCaption}>PORTAL DO ALUNO</Text></View>
      </View>
      {showProfile ? <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" style={styles.avatar} onPress={() => router.push("/perfil")}>
        <Text style={styles.avatarText}>{initials}</Text>
      </Pressable> : <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 22 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#e30613", alignItems: "center", justifyContent: "center" },
  markText: { color: "#fff", fontSize: 24, fontWeight: "900" },
  brandText: { color: "#111a2e", fontSize: 16, fontWeight: "600" },
  brandStrong: { fontWeight: "900" },
  brandCaption: { marginTop: 2, color: "#8691a3", fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ffd1d4", backgroundColor: "#fff0f1" },
  avatarText: { color: "#bd0010", fontSize: 13, fontWeight: "800" },
});