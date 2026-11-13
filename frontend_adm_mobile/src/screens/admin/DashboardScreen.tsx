import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  MessageSquare,
  Package,
  Wrench,
} from 'lucide-react-native';
import { api } from '../../services/api';
import { RefreshButton } from '../../components/RefreshButton';

interface DashboardScreenProps {
  go: (tab: number) => void;
  notify: (text: string) => void;
}

const salasPadrao = [
  'D101',
  'D102',
  'D103',
  'Laboratório 2000',
  'D104',
  'D105',
];

export function DashboardScreen({ go, notify }: DashboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [salas, setSalas] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [avarias, setAvarias] = useState<any[]>([]);
  const [solicitacoesEquip, setSolicitacoesEquip] = useState<any[]>([]);

  const carregarDados = useCallback(async (atualizar = false) => {
    if (atualizar) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    let failedRequests = 0;
    const fetchWithFallback = async (request: () => Promise<any>, fallback?: () => Promise<any>) => {
      try {
        return await request();
      } catch {
        if (fallback) {
          try {
            return await fallback();
          } catch {
            failedRequests += 1;
            return { data: [] };
          }
        }
        failedRequests += 1;
        return { data: [] };
      }
    };

    try {
      const [
        resDashboard,
        resSalas,
        resReservas,
        resAvarias,
        resSolicitacoes,
      ] = await Promise.all([
        fetchWithFallback(() => api.get('/dashboard')),
        fetchWithFallback(() => api.get('/salas')),
        fetchWithFallback(() => api.get('/reservas')),
        fetchWithFallback(() => api.get('/avarias'), () => api.get('/chamados')),
        fetchWithFallback(() => api.get('/solicitacoes'), () => api.get('/solicitacoes-equipamentos')),
      ]);

      setDashboardData(resDashboard.data);

      const salasData = Array.isArray(resSalas.data)
        ? resSalas.data
        : resSalas.data?.salas;
      setSalas(Array.isArray(salasData) ? salasData : []);

      setReservas(Array.isArray(resReservas.data) ? resReservas.data : []);

      const avariasData = Array.isArray(resAvarias.data)
        ? resAvarias.data
        : resAvarias.data?.avarias;
      setAvarias(Array.isArray(avariasData) ? avariasData : []);

      const solicitacoesData = Array.isArray(resSolicitacoes.data)
        ? resSolicitacoes.data
        : resSolicitacoes.data?.solicitacoes;
      setSolicitacoesEquip(
        Array.isArray(solicitacoesData) ? solicitacoesData : [],
      );
      if (atualizar) notify(failedRequests ? 'Painel atualizado parcialmente; algumas consultas falharam.' : 'Painel atualizado.');
    } catch (error) {
      console.error('Erro ao carregar dados do painel:', error);
      if (atualizar) notify('Não foi possível atualizar o painel.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notify]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const stats = dashboardData?.estatisticas;

  const reservasAtivas =
    stats?.reservas?.ativas ??
    reservas.filter((reserva) => {
      const status = String(reserva.status || '').toUpperCase().trim();
      return (status === 'ATIVA' || status === 'APROVADA' || status === 'CONFIRMADA')
      ;
    }).length;

  const reservasTotais = stats?.reservas?.total ?? reservas.length;

  const avariasEmAnalise = avarias.filter((avaria) => {
    const status = String(avaria.status || avaria.situacao || '')
      .toUpperCase()
      .trim();

    return [
      'EM_ANALISE',
      'EM ANALISE',
      'EM ANÁLISE',
      'ANALISE',
      'ANÁLISE',
      'ABERTO',
    ].includes(status);
  });

  const avariasTotal = avarias.length || stats?.avarias?.total || 0;
  const avariasPendentes =
    avariasEmAnalise.length || stats?.avarias?.em_analise || 0;

  const solicitacoesPendentes = solicitacoesEquip.filter((solicitacao) => {
    const status = String(
      solicitacao.status || solicitacao.situacao || '',
    )
      .toUpperCase()
      .trim();

    return status === 'PENDENTE' || status === 'AGUARDANDO';
  });

  const solicitacoesTotal =
    solicitacoesPendentes.length ||
    stats?.solicitacoes_equipamentos?.pendentes ||
    0;

  const comunicadosTotal = stats?.comunicados?.total ?? 0;

  const emergenciasPendentes = reservas.filter((reserva) => {
    const tipo = String(reserva.tipo || '').toUpperCase().trim();
    const status = String(
      reserva.status || reserva.status_reserva || '',
    )
      .toUpperCase()
      .trim();

    return tipo === 'URGENCIA' && (status === 'PENDENTE' || status === 'AGUARDANDO');
  });

  const primeiraEmergencia = emergenciasPendentes[0];
  const salasExibidas = salas.slice(0, 6);

  const formatarData = (valor?: string) => {
    if (!valor) return 'Data não informada';

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return 'Data não informada';

    return data.toLocaleDateString('pt-BR');
  };

  const formatarNumero = (valor: number) => String(valor).padStart(2, '0');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => carregarDados(true)}
          colors={['#dc2626']}
        />
      }
    >
      <View style={styles.pageHeading}>
        <Text style={styles.eyebrow}>OPERAÇÃO EM TEMPO REAL • BLOCO D</Text>
        <Text style={styles.pageTitle}>Visão geral do campus</Text>
        <Text style={styles.pageDescription}>
          Ocupação, manutenção e solicitações que precisam da sua atenção.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <RefreshButton refreshing={refreshing} onPress={() => void carregarDados(true)} />
          <TouchableOpacity
            style={styles.newNoticeButton}
            onPress={() => go(5)}
            activeOpacity={0.8}
          >
            <Text style={styles.newNoticeText}>＋ Novo comunicado</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon={<Building2 size={19} color="#2563eb" />}
          label="RESERVAS ATIVAS"
          value={formatarNumero(reservasAtivas)}
          note={`${reservasTotais} solicitações registradas`}
          color="#eff6ff"
        />

        <StatCard
          icon={<Wrench size={19} color="#b45309" />}
          label="AVARIAS EM ANÁLISE"
          value={formatarNumero(avariasPendentes)}
          note={`${avariasTotal} avarias no total`}
          color="#fffbeb"
        />

        <StatCard
          icon={<Package size={19} color="#2563eb" />}
          label="SOLICITAÇÕES DE EQUIP."
          value={formatarNumero(solicitacoesTotal)}
          note="Aguardando aprovação"
          color="#eff6ff"
        />

        <StatCard
          icon={<MessageSquare size={19} color="#15803d" />}
          label="COMUNICADOS"
          value={formatarNumero(comunicadosTotal)}
          note="Publicados no mural"
          color="#f0fdf4"
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelHeaderText}>
            <Text style={styles.panelTitle}>Ocupação do Bloco D</Text>
            <Text style={styles.panelSubtitle}>Salas cadastradas</Text>
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => go(4)}
          >
            <Text style={styles.secondaryButtonText}>Gerenciar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="small"
            color="#dc2626"
            style={styles.loader}
          />
        ) : (
          (salasExibidas.length > 0
            ? salasExibidas
            : salasPadrao.map((nome) => ({ nome }))
          ).map((sala: any, index: number) => (
            <TouchableOpacity
              key={sala.id_sala || sala.id || sala.nome || index}
              style={styles.roomRow}
              onPress={() => go(4)}
              activeOpacity={0.75}
            >
              <View style={styles.roomDot} />
              <View style={styles.roomInfo}>
                <Text style={styles.roomName}>
                  {sala.nome || `Sala ${sala.id_sala || sala.id}`}
                </Text>
                <Text style={styles.roomDescription} numberOfLines={1}>
                  {sala.descricao || 'Sem observações'}
                </Text>
              </View>
              <ArrowRight size={16} color="#64748b" />
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelHeaderText}>
            <Text style={styles.panelTitle}>Reservas de emergência</Text>
            <Text style={styles.panelSubtitle}>
              Decisão em até 10 minutos
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {emergenciasPendentes.length}
            </Text>
          </View>
        </View>

        {primeiraEmergencia ? (
          <View style={styles.emergencyContent}>
            <View style={styles.urgentBadge}>
              <AlertTriangle size={13} color="#b91c1c" />
              <Text style={styles.urgentText}>
                {primeiraEmergencia.tipo || 'URGENTE'}
              </Text>
            </View>

            <Text style={styles.emergencyTitle}>
              Solicitação de Reserva #
              {primeiraEmergencia.id_reserva || primeiraEmergencia.id}
            </Text>

            <Text style={styles.emergencyDescription}>
              Turma ID: {primeiraEmergencia.id_turma || 'N/A'} • Sala ID:{' '}
              {primeiraEmergencia.id_sala || 'N/A'}
            </Text>

            <View style={styles.emergencyMeta}>
              <Text style={styles.emergencyStatus}>
                Status: {primeiraEmergencia.status || 'PENDENTE'}
              </Text>
              <Text style={styles.emergencyDate}>
                {formatarData(primeiraEmergencia.dt_solicitacao)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => go(1)}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                Analisar solicitação
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.noEmergency}>
            Nenhuma emergência pendente no momento.
          </Text>
        )}

        <TouchableOpacity
          style={styles.panelLink}
          onPress={() => go(1)}
          activeOpacity={0.7}
        >
          <Text style={styles.panelLinkText}>Ver fila completa</Text>
          <ArrowRight size={15} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statNote}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  pageHeading: { marginBottom: 16 },
  eyebrow: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  pageTitle: {
    color: '#0f172a',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 5,
  },
  pageDescription: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  newNoticeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#dc2626',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginTop: 13,
  },
  newNoticeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statCard: {
    width: '48.5%',
    minHeight: 145,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: { color: '#64748b', fontSize: 9, fontWeight: '800' },
  statValue: {
    color: '#0f172a',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 3,
  },
  statNote: { color: '#64748b', fontSize: 10, marginTop: 3 },
  panel: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  panelHeaderText: { flex: 1, paddingRight: 8 },
  panelTitle: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  panelSubtitle: { color: '#64748b', fontSize: 11, marginTop: 3 },
  secondaryButton: {
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  secondaryButtonText: { color: '#334155', fontSize: 11, fontWeight: '700' },
  loader: { marginVertical: 18 },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopColor: '#f1f5f9',
    borderTopWidth: 1,
  },
  roomDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    marginRight: 10,
  },
  roomInfo: { flex: 1 },
  roomName: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
  roomDescription: { color: '#64748b', fontSize: 11, marginTop: 2 },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  countText: { color: '#b91c1c', fontSize: 12, fontWeight: '800' },
  emergencyContent: {
    backgroundColor: '#fff7f7',
    borderColor: '#fee2e2',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  urgentText: { color: '#b91c1c', fontSize: 10, fontWeight: '800' },
  emergencyTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 9,
  },
  emergencyDescription: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 5,
  },
  emergencyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  emergencyStatus: { color: '#334155', fontSize: 11, fontWeight: '700' },
  emergencyDate: { color: '#64748b', fontSize: 11 },
  primaryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 11,
    marginTop: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  noEmergency: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 18,
  },
  panelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginTop: 12,
  },
  panelLinkText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
});