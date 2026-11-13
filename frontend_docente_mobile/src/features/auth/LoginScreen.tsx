import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, getApiError, login, storeSession } from '@/services/api';
import type { AppRole, MobileSession } from '@/types/mobile';

interface LoginScreenProps {
  onAuthenticated: (session: MobileSession) => void;
  restoreError: string;
  logoutMessage?: string;
  initialSession?: MobileSession;
}

function mapProfile(profile: unknown): AppRole | null {
  switch (String(profile ?? '').toUpperCase()) {
    case 'DOCENTE':
      return 'teacher';
    default:
      return null;
  }
}

export default function LoginScreen({ onAuthenticated, restoreError, logoutMessage, initialSession }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingSession, setPendingSession] = useState<MobileSession | null>(initialSession ?? null);
  const [error, setError] = useState(restoreError);
  const [loading, setLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState<'login' | 'request' | 'reset'>('login');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirmation, setRecoveryConfirmation] = useState('');
  const [success, setSuccess] = useState(logoutMessage ?? '');

  const submitLogin = async () => {
    if (!/@(sp|aluno)\.senai\.br$/i.test(email.trim())) {
      setError('Use seu e-mail educacional @sp.senai.br ou @aluno.senai.br.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      const user = data.usuario;
      const role = mapProfile(user?.perfil);
      if (!data.token || !user || !role) {
        throw new Error('A resposta de autenticação não contém um perfil válido.');
      }

      const mustChangePassword = Boolean(data.requer_troca_senha || !user.senha_alterada);
      const session: MobileSession = { token: data.token, user, role, mustChangePassword };
      await storeSession(session);
      if (mustChangePassword) {
        setPendingSession(session);
        return;
      }
      setSuccess('Login realizado com sucesso.');
      setTimeout(() => onAuthenticated(session), 400);
    } catch (requestError) {
      const message = getApiError(requestError, 'Não foi possível entrar.');
      if (message === 'Senha inválida') {
        setError('Senha incorreta. Verifique os dados e tente novamente.');
      } else if (message === 'Usuário não encontrado') {
        setError('E-mail não cadastrado na plataforma.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 8) {
      setError('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem. Tente novamente.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.post('/usuarios/alterar-senha', {
        senha_atual: password,
        nova_senha: newPassword,
      });
      if (!pendingSession) {
        throw new Error('Não foi possível recuperar a sessão após alterar a senha.');
      }
      const updatedSession: MobileSession = {
        ...pendingSession,
        mustChangePassword: false,
        user: { ...pendingSession.user, senha_alterada: true },
      };

      await storeSession(updatedSession);
      onAuthenticated(updatedSession);
    } catch (requestError) {
      const message = getApiError(requestError, 'Não foi possível atualizar a senha.');
      setError(
        message === 'Senha atual incorreta'
          ? 'A senha provisória informada está incorreta.'
          : message,
      );
    } finally {
      setLoading(false);
    }
  };

  const requestRecovery = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail.trim())) {
      setError('Informe um e-mail institucional válido.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/usuarios/esqueci-senha', { email: recoveryEmail.trim() });
      setSuccess('Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.');
      setRecoveryMode('reset');
    } catch (requestError) {
      setError(getApiError(requestError, 'Não foi possível solicitar a recuperação de senha.'));
    } finally {
      setLoading(false);
    }
  };

  const resetRecoveredPassword = async () => {
    if (!recoveryToken.trim()) {
      setError('Informe o token recebido no e-mail de recuperação.');
      return;
    }
    if (recoveryPassword.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (recoveryPassword !== recoveryConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post('/usuarios/redefinir-senha', {
        token: recoveryToken.trim(),
        nova_senha: recoveryPassword,
      });
      setSuccess(data.mensagem || data.message || 'Senha redefinida com sucesso. Entre com sua nova senha.');
      setRecoveryMode('login');
      setPassword('');
      setRecoveryToken('');
      setRecoveryPassword('');
      setRecoveryConfirmation('');
    } catch (requestError) {
      setError(getApiError(requestError, 'Não foi possível redefinir a senha.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandHeader}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>S</Text>
            </View>
            <View>
              <Text style={styles.brandName}>SENAI <Text style={styles.brandFlow}>Flow</Text></Text>
              <Text style={styles.brandUnit}>ALMIRANTE TAMANDARÉ</Text>
            </View>
          </View>

          <View style={styles.intro}>
            <Text style={styles.eyebrow}>PORTAL INSTITUCIONAL</Text>
            <Text style={styles.title}>
              {pendingSession ? 'Crie uma nova senha' : recoveryMode === 'request' ? 'Recuperar senha' : recoveryMode === 'reset' ? 'Redefinir senha' : 'Bem-vindo ao SENAI Flow'}
            </Text>
            <Text style={styles.subtitle}>
              {pendingSession
                ? 'A senha temporária precisa ser substituída antes de continuar.'
                : recoveryMode === 'request'
                  ? 'Informe seu e-mail institucional para receber as instruções.'
                  : recoveryMode === 'reset'
                    ? 'Informe o token recebido e escolha uma nova senha.'
                    : 'Acesse com suas credenciais educacionais.'}
            </Text>
          </View>

          <View style={styles.form}>
            {!pendingSession && recoveryMode === 'login' ? (
              <>
                <Text style={styles.label}>E-mail institucional</Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="email@sp.senai.br"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                  value={email}
                />
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  onSubmitEditing={submitLogin}
                  placeholder="Sua senha"
                  placeholderTextColor="#9ca3af"
                  returnKeyType="go"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </>
            ) : pendingSession ? (
              <>
                {!password ? (
                  <>
                    <Text style={styles.label}>Senha provisória atual</Text>
                    <TextInput
                      onChangeText={setPassword}
                      placeholder="Informe sua senha provisória"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry
                      style={styles.input}
                      value={password}
                    />
                  </>
                ) : null}
                <Text style={styles.label}>Nova senha</Text>
                <TextInput
                  onChangeText={setNewPassword}
                  placeholder="Mínimo de 8 caracteres"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  style={styles.input}
                  value={newPassword}
                />
                <Text style={styles.label}>Confirmar nova senha</Text>
                <TextInput
                  onChangeText={setConfirmPassword}
                  onSubmitEditing={submitNewPassword}
                  placeholder="Repita a nova senha"
                  placeholderTextColor="#9ca3af"
                  returnKeyType="done"
                  secureTextEntry
                  style={styles.input}
                  value={confirmPassword}
                />
              </>
            ) : recoveryMode === 'request' ? (
              <>
                <Text style={styles.label}>E-mail institucional</Text>
                <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setRecoveryEmail} placeholder="nome@sp.senai.br" placeholderTextColor="#9ca3af" style={styles.input} value={recoveryEmail} />
              </>
            ) : (
              <>
                <Text style={styles.label}>Token de recuperação</Text>
                <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={setRecoveryToken} placeholder="Cole o token recebido por e-mail" placeholderTextColor="#9ca3af" style={styles.input} value={recoveryToken} />
                <Text style={styles.label}>Nova senha</Text>
                <TextInput onChangeText={setRecoveryPassword} placeholder="Mínimo de 6 caracteres" placeholderTextColor="#9ca3af" secureTextEntry style={styles.input} value={recoveryPassword} />
                <Text style={styles.label}>Confirmar nova senha</Text>
                <TextInput onChangeText={setRecoveryConfirmation} placeholder="Repita a nova senha" placeholderTextColor="#9ca3af" secureTextEntry style={styles.input} value={recoveryConfirmation} />
              </>
            )}

            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {success ? <Text accessibilityRole="alert" style={styles.success}>{success}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={pendingSession ? submitNewPassword : recoveryMode === 'request' ? requestRecovery : recoveryMode === 'reset' ? resetRecoveredPassword : submitLogin}
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || loading) && styles.buttonPressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {pendingSession ? 'Salvar senha e acessar' : recoveryMode === 'request' ? 'Enviar instruções' : recoveryMode === 'reset' ? 'Redefinir senha' : 'Entrar na plataforma'}
                </Text>
              )}
            </Pressable>
            {recoveryMode !== 'login' && !pendingSession ? (
              <Pressable onPress={() => { setError(''); setSuccess(''); setRecoveryMode('login'); }} style={styles.linkButton}>
                <Text style={styles.linkText}>Voltar ao login</Text>
              </Pressable>
            ) : null}
            <Text style={styles.secureNote}>Acesso exclusivo da comunidade SENAI</Text>
          </View>

          <Text style={styles.footer}>Espaços que fluem. Ensino que transforma.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f5f7' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 22, paddingVertical: 24, justifyContent: 'center', alignItems: 'center' },
  brandHeader: { width: '100%', maxWidth: 520, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 42 },
  brandMark: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#e30613',
  },
  brandMarkText: { color: '#fff', fontSize: 28, fontStyle: 'italic', fontWeight: '800' },
  brandName: { color: '#111827', fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  brandFlow: { fontWeight: '500' },
  brandUnit: { marginTop: 3, color: '#6b7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  intro: { width: '100%', maxWidth: 520, marginBottom: 24 },
  eyebrow: { marginBottom: 8, color: '#e30613', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#111827', fontSize: 27, fontWeight: '800', lineHeight: 33 },
  subtitle: { marginTop: 7, color: '#6b7280', fontSize: 14, lineHeight: 21 },
  form: { width: '100%', maxWidth: 520, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, backgroundColor: '#fff' },
  label: { marginTop: 9, marginBottom: 7, color: '#374151', fontSize: 13, fontWeight: '700' },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    color: '#111827',
    fontSize: 15,
    backgroundColor: '#fff',
  },
  error: {
    marginTop: 14,
    padding: 12,
    borderRadius: 9,
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    fontSize: 13,
    lineHeight: 19,
  },
  success: { marginTop: 14, padding: 12, borderRadius: 9, color: '#236942', backgroundColor: '#f0fdf4', fontSize: 13, lineHeight: 19 },
  linkButton: { alignItems: 'center', paddingVertical: 12 },
  linkText: { color: '#bd0010', fontSize: 13, fontWeight: '700' },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: '#e30613',
  },
  buttonPressed: { opacity: 0.78 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secureNote: { marginTop: 18, color: '#6b7280', fontSize: 12, textAlign: 'center' },
  footer: { width: '100%', maxWidth: 520, marginTop: 30, color: '#9ca3af', fontSize: 12, textAlign: 'center' },
});
