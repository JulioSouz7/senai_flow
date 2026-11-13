import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import { AdminShell } from './src/components/AdminShell';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/admin/DashboardScreen';
import { EmergenciesScreen } from './src/screens/admin/EmergenciesScreen';
import { EquipmentApprovalsScreen } from './src/screens/admin/EquipmentApprovalsScreen';
import { AssetsScreen } from './src/screens/admin/AssetsScreen';
import { AdministrationScreen } from './src/screens/admin/AdministrationScreen';
import { NoticesScreen } from './src/screens/admin/NoticesScreen';
import { SuggestionsScreen } from './src/screens/admin/SuggestionsDeskScreen';
import { AccessControlScreen } from './src/screens/admin/AccessControlScreen';
import { RiskMapScreen } from './src/screens/admin/RiskMapScreen';
import { FaqScreen } from './src/screens/admin/FaqScreen';
import type { UsuarioLogado } from './src/types';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'SENAI Flow | Administrador';
    }
  }, []);

  const notify = useCallback((mensagem: string) => {
    setToast(mensagem);

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastTimer.current = setTimeout(() => {
      setToast('');
      toastTimer.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    const restaurarSessao = async () => {
      try {
        const [token, usuarioSalvo] = await Promise.all([
          AsyncStorage.getItem('senai_token'),
          AsyncStorage.getItem('senai_usuario'),
        ]);

        if (token && usuarioSalvo) {
          setUsuario(JSON.parse(usuarioSalvo) as UsuarioLogado);
        }
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
      } finally {
        setBooting(false);
      }
    };

    void restaurarSessao();

    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['senai_token', 'senai_usuario']);
      setUsuario(null);
      setActiveTab(0);
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      notify('Não foi possível encerrar a sessão.');
    }
  };

  const renderAdminScreen = () => {
    switch (activeTab) {
      case 0:
        return <DashboardScreen go={setActiveTab} notify={notify} />;

      case 1:
        return <EmergenciesScreen notify={notify} />;

      case 2:
        return <EquipmentApprovalsScreen notify={notify} />;

      case 3:
        return <AssetsScreen notify={notify} />;

      case 4:
        return (
          <AdministrationScreen
            notify={notify}
            go={(tab) => {
              if (typeof tab === 'number') {
                setActiveTab(tab);
              }
            }}
          />
        );

      case 5:
        return <NoticesScreen notify={notify} />;

      case 6:
        return <SuggestionsScreen notify={notify} />;

      case 7:
        return <AccessControlScreen notify={notify} />;

      case 8:
        return <RiskMapScreen notify={notify} />;

      case 9:
        return <FaqScreen notify={notify} />;

      default:
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>Página não encontrada</Text>
            <Text style={styles.placeholderText}>
              Selecione uma opção válida no menu.
            </Text>
          </View>
        );
    }
  };

  if (booting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (!usuario) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <LoginScreen onEnter={(_, usuarioLogado) => setUsuario(usuarioLogado)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <AdminShell
        usuario={usuario}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        toast={toast}
      >
        {renderAdminScreen()}
      </AdminShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  placeholderText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
});