import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function StudentTabs() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: "#e30613",
      tabBarInactiveTintColor: "#7d8899",
      tabBarStyle: { display: "none" },
      tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
    }}>
      <Tabs.Screen name="index" options={{ title: "Minha Turma", tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={String(color)} size={size} /> }} />
      <Tabs.Screen name="comunicados" options={{ title: "Comunicados", tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" color={String(color)} size={size} /> }} />
      <Tabs.Screen name="ranking" options={{ title: "Ranking", tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" color={String(color)} size={size} /> }} />
      <Tabs.Screen name="relatos" options={{ title: "Relatos", tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" color={String(color)} size={size} /> }} />
      <Tabs.Screen name="mapa" options={{ title: "Mapa de Risco", tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={String(color)} size={size} /> }} />
    </Tabs>
  );
}