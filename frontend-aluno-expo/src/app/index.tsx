import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function HomeScreen() {
  const router = useRouter();
  const { session, pendingSession, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (session) router.replace("/(tabs)");
    else if (pendingSession) router.replace("/primeiro-acesso");
    else router.replace("/login");
  }, [loading, pendingSession, router, session]);

  return (
    <View style={styles.loading}><ActivityIndicator color="#e30613" size="large" /></View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f3f5f7" },
});
