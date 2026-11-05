import { StyleSheet, View } from "react-native";
import type { PropsWithChildren } from "react";

export function ContentCard({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { padding: 15, borderWidth: 1, borderColor: "#e2e7ee", borderRadius: 13, backgroundColor: "#fff" },
});