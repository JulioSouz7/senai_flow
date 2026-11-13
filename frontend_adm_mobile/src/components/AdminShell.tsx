import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import {
  Menu,
  X,
  LayoutDashboard,
  AlertTriangle,
  PackageCheck,
  Wrench,
  Building2,
  CircleAlert,
  MessageSquare,
  Users,
  Map,
  HelpCircle,
  LogOut,
  CheckCircle2,
} from 'lucide-react-native';
import { UsuarioLogado } from '../types';

export const ADMIN_MENU_ITEMS = [
  { id: 0, label: 'Dashboard', icon: LayoutDashboard },
  { id: 1, label: 'Aprovações e emergências', icon: AlertTriangle },
  { id: 2, label: 'Solicitações de equipamentos', icon: PackageCheck },
  { id: 3, label: 'Gestão de avarias e ativos', icon: Wrench },
  { id: 4, label: 'Administração de salas', icon: Building2 },
  { id: 5, label: 'Comunicados', icon: CircleAlert },
  { id: 6, label: 'Relatos e sugestões', icon: MessageSquare },
  { id: 7, label: 'Controle de acessos', icon: Users },
  { id: 8, label: 'Mapa de riscos', icon: Map },
  { id: 9, label: 'FAQ & Suporte', icon: HelpCircle },
];

interface AdminShellProps {
  usuario: UsuarioLogado;
  activeTab: number;
  setActiveTab: (index: number) => void;
  onLogout: () => void;
  toast: string;
  children: React.ReactNode;
}

export function AdminShell({
  usuario,
  activeTab,
  setActiveTab,
  onLogout,
  toast,
  children,
}: AdminShellProps) {
  const [menuAberto, setMenuAberto] = useState(false);

  const itemAtual = ADMIN_MENU_ITEMS[activeTab] || ADMIN_MENU_ITEMS[0];
  const perfilExibicao = String(usuario.perfil || 'USUÁRIO')
    .replace(/_/g, ' ')
    .toUpperCase();

  const selecionarAba = (index: number) => {
    setActiveTab(index);
    setMenuAberto(false);
  };

  return (
    <View style={styles.container}>
      {/* Barra Superior */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuAberto(true)}
          activeOpacity={0.7}
        >
          <Menu size={22} color="#0f172a" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>SENAI FLOW • ADMIN</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {itemAtual.label}
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>
              {usuario.nome?.slice(0, 2).toUpperCase() || 'US'}
            </Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName} numberOfLines={1}>
              {usuario.nome || 'Usuário'}
            </Text>
            <Text style={styles.profileRole} numberOfLines={1}>
              {perfilExibicao}
            </Text>
          </View>
        </View>
      </View>

      {/* Conteúdo da Tela Ativa */}
      <View style={styles.content}>{children}</View>

      {/* Toast Global */}
      {!!toast && (
        <View style={styles.toast}>
          <CheckCircle2 size={16} color="#4ade80" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Menu Lateral */}
      <Modal
        visible={menuAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuAberto(false)}
      >
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerPanel}>
            <View style={styles.drawerHeader}>
              <View style={styles.brandRow}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoText}>S</Text>
                </View>
                <View>
                  <Text style={styles.brandName}>SENAI Flow</Text>
                  <Text style={styles.brandUnit}>Almirante Tamandaré</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setMenuAberto(false)}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.userBox}>
              <Text style={styles.userName}>{usuario.nome || 'Usuário'}</Text>
              <Text style={styles.userRole}>{perfilExibicao}</Text>
            </View>

            <ScrollView
              style={styles.menuList}
              showsVerticalScrollIndicator={false}
            >
              {ADMIN_MENU_ITEMS.map((item) => {
                const IconComponent = item.icon;
                const ativo = activeTab === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuItem, ativo && styles.menuItemActive]}
                    onPress={() => selecionarAba(item.id)}
                  >
                    <IconComponent
                      size={18}
                      color={ativo ? '#dc2626' : '#475569'}
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        ativo && styles.menuItemTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <LogOut size={18} color="#dc2626" />
              <Text style={styles.logoutText}>Sair da conta</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setMenuAberto(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === 'android'
        ? (StatusBar.currentHeight ?? 0) + 12
        : 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
    letterSpacing: 0.6,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 145,
  },
  profileText: { flex: 1 },
  profileName: { color: '#0f172a', fontSize: 11, fontWeight: '700' },
  profileRole: { color: '#64748b', fontSize: 9, marginTop: 2 },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '800', color: '#dc2626' },
  content: { flex: 1 },
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    elevation: 6,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  drawerOverlay: { flex: 1, flexDirection: 'row' },
  drawerPanel: {
    width: '80%',
    maxWidth: 310,
    backgroundColor: '#ffffff',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  brandName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  brandUnit: { fontSize: 11, color: '#64748b' },
  userBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  userName: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  userRole: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 2,
  },
  menuList: { flex: 1 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  menuItemActive: { backgroundColor: '#fef2f2' },
  menuItemText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  menuItemTextActive: { color: '#dc2626' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 8,
  },
  logoutText: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
});