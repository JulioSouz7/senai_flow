import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FeedbackProvider } from "@/context/FeedbackContext";
import { StudentBottomNav } from "@/components/StudentBottomNav";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FeedbackProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </AuthProvider>
      </FeedbackProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const { session } = useAuth();

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f3f5f7" } }} />
      {session && <StudentBottomNav />}
    </>
  );
}
