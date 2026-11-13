import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface RefreshButtonProps {
  label: string;
  refreshing: boolean;
  onPress: () => void;
}

export function RefreshButton({ label, refreshing, onPress }: RefreshButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Atualizar ${label}`}
      disabled={refreshing}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, refreshing && styles.disabled]}
    >
      {refreshing
        ? <ActivityIndicator size="small" color="#596579" />
        : <Feather name="refresh-cw" size={17} color="#596579" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e7ee', borderRadius: 10, backgroundColor: '#fff' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.65 },
});
