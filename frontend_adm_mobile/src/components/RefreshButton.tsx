import React from 'react';
import { ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { RefreshCw } from 'lucide-react-native';

export function RefreshButton({
  refreshing,
  onPress,
}: {
  refreshing: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={refreshing ? 'Atualizando dados' : 'Atualizar dados'}
      disabled={refreshing}
      onPress={onPress}
      style={{
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 9,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        opacity: refreshing ? 0.65 : 1,
      }}
    >
      {refreshing ? <ActivityIndicator size="small" color="#dc2626" /> : <RefreshCw size={16} color="#475569" />}
      <Text style={{ color: '#334155', fontSize: 12, fontWeight: '700' }}>
        {refreshing ? 'Atualizando...' : 'Atualizar'}
      </Text>
    </TouchableOpacity>
  );
}
