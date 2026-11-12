import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { api, getApiError, usesLocalApiFallback } from '@/services/api';
import type { ApiRecord, AppRole, MobileSession, WorkspaceItem } from '@/types/mobile';
import { useFeedback } from '@/components/FeedbackProvider';
import EquipmentScreen from './screens/EquipmentScreen';
import ReservationScreen from './screens/ReservationScreen';
import RiskMapScreen from './screens/RiskMapScreen';
import MyReservationScreen from './screens/MyReservationScreen';
import NotificationScreen from './screens/NotificationScreen';
import RankingScreen from './screens/RankingScreen';
import SupportScreen from './screens/SupportScreen';
import MyClassScreen from './screens/MyClassScreen';

interface WorkspaceScreenProps {
  session: MobileSession;
  onLogout: () => void;
}

interface ClassRecord extends ApiRecord {
  id_turma: number;
  nome: string;
  curso?: string;
  docente_turma?: Array<{
    docente?: { usuario?: { nome?: string; email?: string } };
  }>;
}

const menus: Record<AppRole, WorkspaceItem[]> = {
  teacher: [
    { id: 'my-class', label: 'Minha Turma', title: 'Minha Turma', description: 'Consulte suas turmas e os professores relacionados.', endpoint: '/turmas' },
    { id: 'notices', label: 'Comunicados', title: 'Comunicados', description: 'Comunicados gerais destinados à comunidade docente e à instituição.', endpoint: '/comunicados' },
    { id: 'booking', label: 'Agenda de Salas', title: 'Agenda de salas', description: 'Consulte salas e horários e solicite uma reserva.' },
    { id: 'my-bookings', label: 'Minhas Reservas', title: 'Minhas reservas', description: 'Acompanhe e encerre suas reservas.', endpoint: '/reservas/minhas-reservas' },
    { id: 'equipment', label: 'Solicitação de Equipamentos', title: 'Solicitar equipamentos', description: 'Vincule um pedido a uma reserva ativa.' },
    { id: 'ranking', label: 'Ranking de Salas', title: 'Ranking de salas', description: 'Consulte a pontuação retornada pela API.', endpoint: '/pontuacoes/ranking' },
    { id: 'risk', label: 'Mapa de Riscos', title: 'Mapa de riscos', description: 'Consulte as áreas de risco cadastradas.', endpoint: '/areas-risco' },
    { id: 'support', label: 'Suporte', title: 'Suporte', description: 'Consulte FAQs, abra chamados e acompanhe o atendimento.', endpoint: ['/faqs', '/chamados'] },
  ],
};

function roleName(role: AppRole): string {
  return role === 'teacher' ? 'Docente' : 'Usuário';
}

function getMenuIcon(id: string): keyof typeof Feather.glyphMap {
  switch (id) {
    case 'booking': return 'calendar';
    case 'my-bookings': return 'layout';
    case 'equipment': return 'layers';
    case 'ranking': return 'award';
    case 'risk': return 'map';
    case 'support': return 'message-square';
    case 'notices': return 'bell';
    case 'my-class': return 'users';
    default: return 'circle';
  }
}

export default function WorkspaceScreen({ session, onLogout }: WorkspaceScreenProps) {
  const [activeId, setActiveId] = useState(menus[session.role][0].id);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classesLoading, setClassesLoading] = useState(session.role === 'teacher');
  const [classesError, setClassesError] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const drawerX = useRef(new Animated.Value(-340)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const { confirm, notify } = useFeedback();
  const items = menus[session.role];
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  const loadClasses = async (): Promise<boolean> => {
    if (session.role !== 'teacher') return true;
    try {
      setClassesLoading(true);
      setClassesError('');
      const { data } = await api.get<ClassRecord[]>('/turmas');
      const rows = Array.isArray(data) ? data : [];
      setClasses(rows);
      setSelectedClassId((current) => rows.some((item) => item.id_turma === current) ? current : rows[0]?.id_turma ?? null);
      return true;
    } catch (error: unknown) {
      setClassesError(getApiError(error, 'Não foi possível carregar suas turmas.'));
      return false;
    } finally {
      setClassesLoading(false);
    }
  };

  useEffect(() => {
    void loadClasses();
  }, [session.role]);

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(drawerX, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerX, { toValue: -340, duration: 180, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setDrawerVisible(false);
    });
  };

  const confirmLogout = async () => {
    if (await confirm({ title: 'Sair da conta', message: 'Deseja encerrar sua sessão?', confirmText: 'Sair', destructive: true })) {
      onLogout();
    }
  };
  const initials = session.user.nome?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'DO';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menu de navegação"
          onPress={openDrawer}
          style={styles.menuButton}
        >
          <Feather name="menu" size={23} color="#111827" />
        </Pressable>
        <View style={styles.brandLine}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
          <View>
            <Text style={styles.brand}>SENAI <Text style={styles.brandFlow}>Flow</Text></Text>
            <Text style={styles.roleLabel}>{roleName(session.role)} · Almirante Tamandaré</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" onPress={() => setActiveId('notices')} style={styles.notificationBtn}>
            <Feather name="bell" size={21} color={activeId === 'notices' ? '#bd0010' : '#6b7280'} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Encerrar sessão" onPress={confirmLogout} style={styles.headerIconButton}>
            <Feather name="log-out" size={19} color="#6b7280" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil docente" onPress={() => setProfileVisible(true)} style={styles.avatarButton}>
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>
      </View>

      {usesLocalApiFallback ? (
        <View style={styles.apiWarning}>
          <Text style={styles.apiWarningText}>
            Para usar em um celular físico, defina EXPO_PUBLIC_API_URL com o IP local do computador e a porta 3001.
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeId !== 'support' ? (
          <>
            <Text style={styles.eyebrow}>SENAI ALMIRANTE TAMANDARÉ</Text>
            <Text style={styles.title}>{activeItem.title}</Text>
            <Text style={styles.description}>{activeItem.description}</Text>
          </>
        ) : null}
        {activeId === 'booking' ? (
          <ReservationScreen onComplete={() => setActiveId('my-bookings')} />
        ) : activeId === 'my-bookings' ? (
          <MyReservationScreen />
        ) : activeId === 'equipment' ? (
          <EquipmentScreen />
        ) : activeId === 'my-class' ? (
          <MyClassScreen
            classes={classes}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            loading={classesLoading}
            error={classesError}
            onRefresh={loadClasses}
          />
        ) : activeId === 'ranking' ? (
          <RankingScreen />
        ) : activeId === 'risk' ? (
          <RiskMapScreen />
        ) : activeId === 'support' ? (
          <SupportScreen />
        ) : activeId === 'notices' ? (
          <NotificationScreen />
        ) : null}
      </ScrollView>

      {drawerVisible ? (
        <View style={styles.drawerLayer}>
          <Animated.View style={[styles.drawerBackdrop, { opacity: backdropOpacity }]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar menu"
            style={StyleSheet.absoluteFill}
            onPress={closeDrawer}
          />
          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>
            <View style={styles.drawerHeader}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
              <View style={styles.drawerBrandText}>
                <Text style={styles.brand}>SENAI <Text style={styles.brandFlow}>Flow</Text></Text>
                <Text style={styles.roleLabel}>NAVEGAÇÃO DOCENTE</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar menu" onPress={closeDrawer} style={styles.drawerClose}>
                <Feather name="x" size={21} color="#6b7280" />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.drawerItems}>
              {items.map((item) => {
                const active = activeId === item.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={item.id}
                    onPress={() => {
                      setActiveId(item.id);
                      closeDrawer();
                    }}
                    style={[styles.drawerItem, active && styles.drawerItemActive]}
                  >
                    <Feather name={getMenuIcon(item.id)} size={19} color={active ? '#bd0010' : '#6b7280'} />
                    <Text style={[styles.drawerItemText, active && styles.drawerItemTextActive]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      ) : null}
      <Modal visible={profileVisible} transparent animationType="fade" onRequestClose={() => setProfileVisible(false)}>
        <Pressable style={styles.profileBackdrop} onPress={() => setProfileVisible(false)}>
          <Pressable style={styles.profileCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.profileCardHeader}>
              <View style={styles.avatarLarge}><Text style={styles.avatarText}>{initials}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar perfil" onPress={() => setProfileVisible(false)} style={styles.drawerClose}>
                <Feather name="x" size={20} color="#6b7280" />
              </Pressable>
            </View>
            <Text style={styles.profileName}>{session.user.nome || 'Docente'}</Text>
            <Text style={styles.profileDetail}>{session.user.email || 'E-mail não informado'}</Text>
            <Text style={styles.profileDetail}>Perfil: {session.user.perfil || 'DOCENTE'}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f5f7' },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  menuButton: { width: 38, height: 42, alignItems: 'center', justifyContent: 'center' },
  brandLine: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#e30613' },
  brandMarkText: { color: '#fff', fontSize: 20, fontStyle: 'italic', fontWeight: '800' },
  brand: { color: '#111827', fontSize: 16, fontWeight: '800' },
  brandFlow: { fontWeight: '500' },
  roleLabel: { marginTop: 2, color: '#6b7280', fontSize: 9 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notificationBtn: { padding: 5 },
  headerIconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#f3f4f6' },
  avatarButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffd1d4', borderRadius: 18, backgroundColor: '#fff0f1' },
  avatarLarge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffd1d4', borderRadius: 23, backgroundColor: '#fff0f1' },
  avatarText: { color: '#bd0010', fontSize: 12, fontWeight: '800' },
  logout: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#f3f4f6' },
  logoutText: { color: '#374151', fontSize: 11, fontWeight: '700' },
  apiWarning: { paddingHorizontal: 16, paddingVertical: 9, backgroundColor: '#fffbeb' },
  apiWarningText: { color: '#92400e', fontSize: 11, lineHeight: 16 },
  content: { padding: 18, paddingBottom: 36 },
  eyebrow: { color: '#e30613', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { marginTop: 7, color: '#111827', fontSize: 25, fontWeight: '800', lineHeight: 31 },
  description: { marginTop: 7, marginBottom: 18, color: '#6b7280', fontSize: 14, lineHeight: 21 },
  drawerLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 20 },
  drawerBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(17,24,39,0.44)' },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '84%',
    maxWidth: 340,
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  drawerBrandText: { flex: 1 },
  drawerClose: { padding: 7 },
  drawerItems: { paddingTop: 12, paddingBottom: 24, gap: 4 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 8, paddingVertical: 13, paddingHorizontal: 12 },
  drawerItemActive: { backgroundColor: '#fff0f1' },
  drawerItemText: { flex: 1, color: '#4b5563', fontSize: 13, fontWeight: '600' },
  drawerItemTextActive: { color: '#bd0010', fontWeight: '800' },
  profileBackdrop: { flex: 1, justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 72, paddingHorizontal: 14, backgroundColor: 'rgba(17,24,39,0.35)' },
  profileCard: { width: '100%', maxWidth: 340, borderRadius: 14, backgroundColor: '#fff', padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 10 },
  profileCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileName: { marginTop: 12, color: '#111827', fontSize: 17, fontWeight: '800' },
  profileDetail: { marginTop: 6, color: '#6b7280', fontSize: 13 },
});
