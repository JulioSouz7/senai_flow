import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { Role, UsuarioLogado } from '../types';

interface LoginScreenProps {
  onEnter: (role: Role, usuario: UsuarioLogado) => void;
}

export function LoginScreen({ onEnter }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [firstAccess, setFirstAccess] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [pendingUser, setPendingUser] = useState<UsuarioLogado | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const mapPerfilToRole = (perfilBackend: string): Role => {
    const perfil = perfilBackend?.toUpperCase();
    switch (perfil) {
      case 'ADMINISTRADOR':
      case 'GESTAO':
        return 'management';
      case 'DOCENTE':
        return 'teacher';
      case 'ALUNO':
        return 'student';
      default:
        return 'student';
    }
  };

  const handleLogin = async () => {
    if (!/@(sp|aluno)\.senai\.br$/i.test(email.trim())) {
      setError('Use seu e-mail educacional @sp.senai.br ou @aluno.senai.br.');
      return;
    }

    if (!password) {
      setError('Informe sua senha.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/usuarios/login', {
        email: email.trim(),
        senha: password,
      });

      const { token, usuario, requer_troca_senha } = response.data;

      await AsyncStorage.setItem('senai_token', token);
      await AsyncStorage.setItem('senai_usuario', JSON.stringify(usuario));

      const roleTarget = mapPerfilToRole(usuario.perfil);

      if (requer_troca_senha || !usuario.senha_alterada) {
        setPendingRole(roleTarget);
        setPendingUser(usuario);
        setFirstAccess(true);
        return;
      }

      onEnter(roleTarget, usuario);
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;

      if (backendMessage === 'Senha inválida') {
        setError('Senha incorreta. Verifique os dados e tente novamente.');
      } else if (backendMessage === 'Usuário não encontrado') {
        setError('E-mail não cadastrado na plataforma.');
      } else {
        setError(backendMessage || 'Erro ao conectar com o servidor. Verifique o IP e o Wi-Fi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem. Tente novamente.');
      return;
    }

    setPasswordError('');
    setLoading(true);

    try {
      await api.post('/usuarios/alterar-senha', {
        senha_atual: password,
        nova_senha: newPassword,
      });

      Alert.alert('Sucesso', 'Senha alterada com sucesso!');

      if (pendingRole && pendingUser) {
        onEnter(pendingRole, pendingUser);
      } else {
        setFirstAccess(false);
        setPassword('');
      }
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      if (backendMessage === 'Senha atual incorreta') {
        setPasswordError('A senha provisória informada está incorreta.');
      } else {
        setPasswordError(backendMessage || 'Erro ao atualizar senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
          <Text style={styles.eyebrow}>{firstAccess ? 'PRIMEIRO ACESSO' : 'PORTAL INSTITUCIONAL'}</Text>
          <Text style={styles.title}>
            {firstAccess ? 'Crie uma nova senha' : 'Bem-vindo ao SENAI Flow'}
          </Text>
          <Text style={styles.subtitle}>
            {firstAccess
              ? 'A senha temporária precisa ser substituída antes de continuar.'
              : 'Acesse com suas credenciais educacionais.'}
          </Text>
        </View>

        <View style={styles.card}>
          {firstAccess ? (
            <>
              <Text style={styles.label}>Nova senha</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Mínimo de 8 caracteres"
                placeholderTextColor="#9ca3af"
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={styles.label}>Confirmar nova senha</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Repita a nova senha"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>E-mail institucional</Text>
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="email@sp.senai.br"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Sua senha"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
              />
            </>
          )}

          {(firstAccess ? passwordError : error) ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {firstAccess ? passwordError : error}
            </Text>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.78}
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={firstAccess ? handleChangePassword : handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {firstAccess ? 'Salvar senha e acessar' : 'Entrar na plataforma'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.secureNote}>Acesso exclusivo da comunidade SENAI</Text>
        </View>

        <Text style={styles.footer}>Espaços que fluem. Ensino que transforma.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
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
  card: { width: '100%', maxWidth: 520, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, backgroundColor: '#fff' },
  label: { marginTop: 12, marginBottom: 7, color: '#374151', fontSize: 13, fontWeight: '700' },
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
  errorText: {
    marginTop: 14,
    padding: 12,
    borderRadius: 9,
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    fontSize: 13,
    lineHeight: 19,
  },
  primaryBtn: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: '#e30613',
  },
  disabledBtn: { opacity: 0.78 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secureNote: { marginTop: 16, color: '#6b7280', fontSize: 12, textAlign: 'center' },
  footer: { width: '100%', maxWidth: 520, marginTop: 30, color: '#9ca3af', fontSize: 12, textAlign: 'center' },
});