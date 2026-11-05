import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthContext";
import { FeedbackProvider } from "@/context/FeedbackContext";

export default function RootLayout() {
  return (
    <FeedbackProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f3f5f7" } }} />
      </AuthProvider>
    </FeedbackProvider>
  );
}
