import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const items = [
  { route: "/(tabs)", match: "/", label: "Minha Turma", icon: "home-outline" as const },
  { route: "/(tabs)/comunicados", match: "/comunicados", label: "Comunicados", icon: "notifications-outline" as const },
  { route: "/(tabs)/ranking", match: "/ranking", label: "Ranking", icon: "trophy-outline" as const },
  { route: "/(tabs)/relatos", match: "/relatos", label: "Relatos", icon: "chatbox-outline" as const },
  { route: "/(tabs)/mapa", match: "/mapa", label: "Mapa de Risco", icon: "location-outline" as const },
] as const;

export function StudentBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navWidth = Math.min(width - 32, 1000);
  const selected = items.find((item) => item.match !== "/" && pathname.endsWith(item.match))
    || items[0];

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={[styles.nav, { width: navWidth, bottom: Math.max(insets.bottom, 12) + 10 }]}>
        {items.map((item) => {
          const active = selected === item;
          return (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              onPress={() => router.replace(item.route)}
              style={[styles.item, active && styles.activeItem]}
            >
              <Ionicons name={item.icon} size={23} color={active ? "#e30613" : "#7d8899"} />
              <Text numberOfLines={1} style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 20, alignItems: "center" },
  nav: {
    position: "absolute",
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    padding: 7,
    borderWidth: 1,
    borderColor: "rgba(17, 26, 46, 0.08)",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.98)",
    shadowColor: "#111a2e",
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  item: {
    minWidth: 0,
    height: 62,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 2,
    borderRadius: 13,
  },
  activeItem: { backgroundColor: "#fff0f1" },
  label: { maxWidth: "100%", color: "#7d8899", fontSize: 10, fontWeight: "700" },
  activeLabel: { color: "#e30613" },
});
