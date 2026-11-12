import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import LoginScreen from '@/features/auth/LoginScreen';
import WorkspaceScreen from '@/features/workspace/WorkspaceScreen';
import { FeedbackProvider } from '@/components/FeedbackProvider';
import { clearStoredSession, getStoredSession } from '@/services/api';
import type { MobileSession } from '@/types/mobile';

export default function IndexScreen() {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const [logoutMessage, setLogoutMessage] = useState('');

  useEffect(() => {
    getStoredSession()
      .then(setSession)
      .catch(() => setRestoreError('Não foi possível restaurar sua sessão segura.'))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await clearStoredSession();
    setLogoutMessage('Logout realizado com sucesso.');
    setSession(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color="#e30613" size="large" />
        <Text style={styles.loadingText}>Carregando SENAI Flow...</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return <LoginScreen onAuthenticated={setSession} restoreError={restoreError} logoutMessage={logoutMessage} />;
  }
  if (session.mustChangePassword) {
    return <LoginScreen initialSession={session} onAuthenticated={setSession} restoreError={restoreError} logoutMessage={logoutMessage} />;
  }

  return (
    <FeedbackProvider>
      <WorkspaceScreen session={session} onLogout={logout} />
    </FeedbackProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f5f7',
    gap: 12,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
