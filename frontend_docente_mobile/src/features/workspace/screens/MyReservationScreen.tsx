import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { api, getApiError } from '@/services/api';
import { Feather } from '@expo/vector-icons';
import SwapScreen from './SwapScreen';
import Checklist from './ChecklistScreen'; 
import { useFeedback } from '@/components/FeedbackProvider';
import { RefreshButton } from '@/components/RefreshButton';

interface Sala {
  id_sala: number;
  nome: string;
}
interface Turma {
  id_turma: number;
  nome: string;
}
interface ReservaHorario {
  dt_reserva?: string;
  hora_inicio?: string;
  hora_fim?: string;
  sala_horario?: { horario?: { hora_inicio?: string; hora_fim?: string } };
}
interface Reserva {
  id_reserva: number;
  status: string;
  dt_solicitacao?: string;
  sala?: Sala | null;
  turma?: Turma | null;
  reserva_horario?: ReservaHorario | ReservaHorario[];
  reservaHorario?: ReservaHorario | ReservaHorario[];
}

function institutionalDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export default function MyReservationsScreen() {
  const { confirm, notify } = useFeedback();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [historico, setHistorico] = useState<Reserva[]>([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [checklist, setChecklist] = useState<boolean>(false);
  const [reservaAtiva, setReservaAtiva] = useState<Reserva | null>(null);

  useEffect(() => {
    void fetchReservas();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  async function fetchReservas(manual = false): Promise<boolean> {
    try {
      setLoading(true);
      const { data } = await api.get('/reservas/minhas-reservas');

      if (!Array.isArray(data)) {
        setReservas([]);
        if (manual) notify('Reservas atualizadas.', 'success');
        return true;
      }

      const dataNormalizada = data.map((item: any) => ({
        ...item,
        id_reserva: item.id_reserva || item.id,
      }));
      setHistorico(dataNormalizada.filter((r) => ['ENCERRADA', 'CANCELADA'].includes(String(r.status ?? '').toUpperCase())));

      const ativas = dataNormalizada.filter((r) => {
        const st = r.status ? String(r.status).trim().toUpperCase() : '';
        return st !== 'ENCERRADA' && st !== 'CANCELADA';
      });

      setReservas(ativas);
      if (manual) notify('Reservas atualizadas.', 'success');
      return true;
    } catch (error) {
      console.error('Erro no fetch de reservas:', error);
      notify(getApiError(error, 'Falha ao carregar suas reservas.'), 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }

  const handleCancelarReserva = async (id_reserva: number, salaNome: string) => {
    const confirmed = await confirm({
      title: 'Cancelar reserva',
      message: `Deseja realmente cancelar a reserva na ${salaNome}?`,
      confirmText: 'Sim, cancelar',
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await api.patch(`/reservas/${id_reserva}/cancelar`);
      notify(`Reserva na ${salaNome} cancelada com sucesso.`, 'success');
      setReservas((prev) => prev.filter((item) => item.id_reserva !== id_reserva));
    } catch (err) {
      notify(getApiError(err, 'Erro ao cancelar a reserva.'), 'error');
    }
  };

  const handleAbrirChecklist = (reserva: Reserva) => {
    setReservaAtiva(reserva);
    setChecklist(true);
  };

 const handleConfirmarChecklist = async (dadosEntrega: any) => {
    if (!reservaAtiva) return;

    const salaNome = reservaAtiva.sala?.nome || 'Sala';
    try {
      await api.patch(`/reservas/${reservaAtiva.id_reserva}/encerrar`, {
        sala_em_ordem: dadosEntrega.sala_em_ordem,
        houve_avaria: dadosEntrega.houve_avaria,
        obs_encerramento: dadosEntrega.observacoes,
      });

      notify(`Reserva na ${salaNome} encerrada com sucesso!`, 'success');
      setReservas((prev) => prev.filter((item) => item.id_reserva !== reservaAtiva.id_reserva));
      setChecklist(false);
      setReservaAtiva(null);
    } catch (err) {
      notify(getApiError(err, 'Erro ao encerrar a reserva.'), 'error');
    }
  };

  const isWithinUsageWindow = (reserva: Reserva): boolean => {
    const relation = reserva.reserva_horario || reserva.reservaHorario;
    const slots = Array.isArray(relation) ? relation : relation ? [relation] : [];
    const now = new Date(currentTime);
    return slots.some((slot) => {
      if (!slot.dt_reserva) return false;
      const start = slot.sala_horario?.horario?.hora_inicio || slot.hora_inicio;
      const end = slot.sala_horario?.horario?.hora_fim || slot.hora_fim;
      if (!start || !end) return false;
      const reservationDate = slot.dt_reserva.split('T')[0];
      const nowAtCampus = institutionalDateTime(now);
      const begins = `${reservationDate}T${start.slice(0, 5)}`;
      const finishes = `${reservationDate}T${end.slice(0, 5)}`;
      return nowAtCampus >= begins && nowAtCampus <= finishes;
    });
  };

  const reservasVisiveis = mostrarHistorico ? [...reservas, ...historico] : reservas;

  if (checklist && reservaAtiva) {
    return (
      <View style={styles.container}>
        {/* Botão de voltar mantido no topo */}
        <Pressable
          style={styles.backButton}
          onPress={() => {
            setChecklist(false);
            setReservaAtiva(null);
          }}
        >
          <Feather name="arrow-left" size={16} color="#e30613" />
          <Text style={styles.backButtonText}>Voltar às reservas</Text>
        </Pressable>

        {/* Novo componente de Checklist */}
        <Checklist 
          reserva={reservaAtiva} 
          onConfirm={handleConfirmarChecklist} 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.refreshRow}>
        <Pressable onPress={() => setMostrarHistorico((current) => !current)} style={styles.historyButton}>
          <Text style={styles.historyButtonText}>
            {mostrarHistorico ? 'Ocultar histórico' : `Ver histórico (${historico.length})`}
          </Text>
        </Pressable>
        <RefreshButton label="reservas" refreshing={refreshing} onPress={async () => {
          if (refreshing) return;
          setRefreshing(true);
          try {
            await fetchReservas(true);
          } finally {
            setRefreshing(false);
          }
        }} />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#e30613" style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.reservationList}>
          {reservasVisiveis.length === 0 ? (
            <Text style={styles.emptyText}>{mostrarHistorico ? 'Nenhuma reserva ativa ou histórica encontrada.' : 'Nenhuma reserva ativa encontrada.'}</Text>
          ) : (
            reservasVisiveis.map((r) => {
              const relacaoHorario = r.reserva_horario || r.reservaHorario;
              const horarioObj = Array.isArray(relacaoHorario) ? relacaoHorario[0] : relacaoHorario;
              const dataBruta = horarioObj?.dt_reserva || r.dt_solicitacao;
              
              let dataFormatada = 'SEM DATA';
              if (dataBruta) {
                const partes = dataBruta.split('T')[0].split('-');
                if (partes.length === 3) {
                  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                  const mes = meses[Number(partes[1]) - 1];
                  dataFormatada = `${partes[2]} DE ${mes}.`;
                }
              }

              const salaNome = r.sala?.nome || 'Sala Indefinida';
              const turmaNome = r.turma?.nome ? ` • ${r.turma.nome}` : '';
              const statusUpper = r.status?.toUpperCase();
              const isConfirmada = statusUpper === 'CONFIRMADA' || statusUpper === 'APROVADA';
              const isCancelable = statusUpper === 'PENDENTE' || statusUpper === 'CONFIRMADA';
              const canFinishNow = isConfirmada && isWithinUsageWindow(r);

              return (
                <View key={r.id_reserva} style={styles.panelCard}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateText}>{dataFormatada}</Text>
                  </View>

                  <View style={styles.infoBlock}>
                    <Text style={styles.salaNome}>{salaNome}</Text>
                    <Text style={styles.horarioTurma}>
                      {horarioObj?.sala_horario?.horario?.hora_inicio || horarioObj?.hora_inicio || 'Horário não informado'}
                      {horarioObj?.sala_horario?.horario?.hora_fim || horarioObj?.hora_fim
                        ? `–${horarioObj?.sala_horario?.horario?.hora_fim || horarioObj?.hora_fim}`
                        : ''}
                      {turmaNome}
                    </Text>
                  </View>

                  <View style={styles.actionBlock}>
                    <View style={[styles.badge, isConfirmada ? styles.badgeGreen : styles.badgeYellow]}>
                      <Text style={[styles.badgeText, isConfirmada ? styles.badgeTextGreen : styles.badgeTextYellow]}>
                        {r.status}
                      </Text>
                    </View>

                    {isCancelable ? (
                      <Pressable style={styles.secondaryButton} onPress={() => handleCancelarReserva(r.id_reserva, salaNome)}>
                        <Text style={styles.secondaryButtonText}>Cancelar reserva</Text>
                      </Pressable>
                    ) : null}
                    {canFinishNow ? (
                      <Pressable
                        style={styles.primaryButton}
                        onPress={() => handleAbrirChecklist(r)}
                      >
                        <Text style={styles.primaryButtonText}>Encerrar reserva</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* COMPONENTE DA CENTRAL DE TROCAS COM FUNCIONALIDADES REAIS */}
      <SwapScreen onRefresh={fetchReservas}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  refreshRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  historyButton: { paddingVertical: 8, paddingHorizontal: 10 },
  historyButtonText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  reservationList: { gap: 12, marginBottom: 16 },
  emptyText: { padding: 20, color: '#6b7280', fontSize: 14 },
  
  panelCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateBlock: { minWidth: 70, marginRight: 10 },
  dateText: { color: '#e30613', fontWeight: '800', fontSize: 11 },
  infoBlock: { flex: 1, minWidth: 150 },
  salaNome: { color: '#111827', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  horarioTurma: { color: '#6b7280', fontSize: 11 },
  actionBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },

  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeYellow: { backgroundColor: '#fef3c7' },
  badgeGreen: { backgroundColor: '#e6f4ea' },
  badgeText: { fontWeight: '700', fontSize: 10 },
  badgeTextYellow: { color: '#854d0e' },
  badgeTextGreen: { color: '#137333' },

  primaryButton: { backgroundColor: '#e30613', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  primaryButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 12, textAlign: 'center' },
  secondaryButton: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cccccc', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  secondaryButtonText: { color: '#555555', fontWeight: '600', fontSize: 12 },

  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backButtonText: { color: '#0052cc', fontWeight: '600', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 12, marginBottom: 16, backgroundColor: '#fff', minHeight: 80, textAlignVertical: 'top' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  description: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
});