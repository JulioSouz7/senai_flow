import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, ScrollView, Modal, Platform, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api, getApiError } from '@/services/api';
import type { ApiRecord } from '@/types/mobile';
import { calculateWeeklyUsage, formatUsage, WEEKLY_LIMIT } from '../reservationUsage';
import { useFeedback } from '@/components/FeedbackProvider';
import { RefreshButton } from '@/components/RefreshButton';

interface ReservationScreenProps {
  onComplete: () => void;
}

const DIAS_SEMANA_NOME: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
  7: "Domingo",
};

export default function ReservationScreen({ onComplete }: ReservationScreenProps) {
  const { notify } = useFeedback();
  const [salasDb, setSalasDb] = useState<ApiRecord[]>([]);
  const [turmas, setTurmas] = useState<ApiRecord[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null);
  const [usageReservations, setUsageReservations] = useState<Array<{ status?: string; reserva_horario?: Array<{ dt_reserva?: string }> }>>([]);
  const [activeSelection, setActiveSelection] = useState<{ sala: ApiRecord; slot: ApiRecord } | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dateObject, setDateObject] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para emergência e conflito
  const [conflictWarning, setConflictWarning] = useState(false);
  const [justificativa, setJustificativa] = useState('');

  const onDateChange = (event: any, selected: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selected) {
      setDateObject(selected);
      const ano = selected.getFullYear();
      const mes = String(selected.getMonth() + 1).padStart(2, '0');
      const dia = String(selected.getDate()).padStart(2, '0');
      
      setSelectedDate(`${ano}-${mes}-${dia}`);
      setConflictWarning(false);
    }
  };

  const loadData = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    try {
      const [roomResponse, turmaResponse, reservationResponse] = await Promise.all([
        api.get('/salas'),
        api.get('/turmas'),
        api.get('/reservas/minhas-reservas'),
      ]);
      const rooms = Array.isArray(roomResponse.data) ? roomResponse.data : [];
      const classes = Array.isArray(turmaResponse.data) ? turmaResponse.data : [];
      const reservations = Array.isArray(reservationResponse.data) ? reservationResponse.data : [];
      setSalasDb(rooms);
      setTurmas(classes);
      setUsageReservations(reservations);
      setSelectedTurmaId((current) =>
        current !== null && classes.some((item: ApiRecord) => Number(item.id_turma) === current)
          ? current
          : classes[0]?.id_turma ? Number(classes[0].id_turma) : null,
      );
      if (manual) notify('Agenda e utilização semanal atualizadas.', 'success');
    } catch (requestError) {
      notify(getApiError(requestError, 'Não foi possível carregar salas, turmas e reservas.'), 'error');
    } finally {
      if (manual) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const weeklyUsage = calculateWeeklyUsage(usageReservations, selectedDate || dateObject);

  const openModal = (sala: ApiRecord, slot: ApiRecord) => {
    setActiveSelection({ sala, slot });
    setSelectedDate('');
    setConflictWarning(false);
    setJustificativa('');
  };

  const closeModal = () => {
    setActiveSelection(null);
    setSelectedDate('');
    setConflictWarning(false);
    setJustificativa('');
    setShowPicker(false);
  };

  const handleEmergencyReservation = async () => {
    if (!activeSelection || !selectedDate.trim()) {
      notify('Selecione uma data para a reserva de emergência.', 'warning');
      return;
    }
    if (selectedTurmaId === null) {
      notify('Seu perfil não possui uma turma vinculada para solicitar a reserva.', 'warning');
      return;
    }
    if (justificativa.trim().length < 10) {
      notify('Informe uma justificativa de urgência com pelo menos 10 caracteres.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id_sala: Number(activeSelection.sala.id_sala || activeSelection.sala.id),
        id_turma: selectedTurmaId,
        justificativa_urgencia: justificativa.trim(),
        horarios: [
          {
            id_sala_horario: Number(activeSelection.slot.id_sala_horario || activeSelection.slot.id),
            dt_reserva: selectedDate.trim(),
          },
        ],
      };

      await api.post('/reservas/urgencia', payload);
      notify('Solicitação de reserva de emergência enviada com sucesso! Aguardando aprovação.', 'success');
      closeModal();
      onComplete();
    } catch (requestError) {
      notify(getApiError(requestError, 'Falha na requisição.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmReservation = async () => {
    if (!activeSelection || !selectedDate.trim()) {
      notify('Selecione uma data para realizar a reserva.', 'warning');
      return;
    }
    if (selectedTurmaId === null) {
      notify('Seu perfil não possui uma turma vinculada para solicitar a reserva.', 'warning');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate.trim())) {
      notify('A data selecionada é inválida.', 'warning');
      return;
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    const pickedDate = new Date(year, month - 1, day);
    const slotWeekDay = Number(activeSelection.slot.dia_semana);
    const pickedWeekDay = pickedDate.getDay();

    if (pickedWeekDay !== slotWeekDay) {
      notify(`A data selecionada não é uma ${DIAS_SEMANA_NOME[slotWeekDay]}. Escolha uma data correspondente.`, 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id_sala: Number(activeSelection.sala.id_sala || activeSelection.sala.id),
        id_turma: selectedTurmaId,
        horarios: [
          {
            id_sala_horario: Number(activeSelection.slot.id_sala_horario || activeSelection.slot.id),
            dt_reserva: selectedDate.trim(),
          },
        ],
      };

      await api.post('/reservas', payload);
      notify('Solicitação de reserva enviada com sucesso!', 'success');
      closeModal();
      onComplete();
    } catch (requestError) {
      const message = getApiError(requestError, 'Não foi possível solicitar a reserva.');
      const status = (requestError as { response?: { status?: number } }).response?.status;
      if (status === 409 && message.toLowerCase().includes('reserva confirmada')) {
        setConflictWarning(true);
      } else {
        notify(message, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E30613" />
        <Text style={styles.loadingText}>Carregando salas e turmas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Cabeçalho / Títulos */}
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>AGENDA DE ESPAÇOS</Text>
            <Text style={styles.pageTitle}>Reserva de salas</Text>
          </View>
          <RefreshButton label="agenda" refreshing={refreshing} onPress={() => void loadData(true)} />
        </View>
        <Text style={styles.pageDescription}>
          Solicitações regulares exigem 48h de antecedência e respeitam o limite de 10h semanais.
        </Text>

        {turmas.length > 1 ? (
          <View style={styles.classPicker}>
            <Text style={styles.quotaTitle}>Turma da reserva</Text>
            <View style={styles.classChoices}>
              {turmas.map((turma, index) => {
                const idTurma = Number(turma.id_turma);
                const active = selectedTurmaId === idTurma;
                return (
                  <Pressable
                    key={idTurma || index}
                    onPress={() => setSelectedTurmaId(idTurma)}
                    style={[styles.classChoice, active && styles.classChoiceActive]}
                  >
                    <Text style={[styles.classChoiceText, active && styles.classChoiceTextActive]}>
                      {String(turma.nome ?? 'Turma')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Quota Section */}
        <View style={styles.quotaCard}>
          <View style={styles.quotaHeader}>
            <Text style={styles.quotaTitle}>Uso semanal</Text>
            <Text style={styles.quotaValue}>{formatUsage(weeklyUsage)} de {formatUsage(WEEKLY_LIMIT)}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(weeklyUsage / WEEKLY_LIMIT * 100, 100)}%` }]} />
          </View>
          <Text style={styles.quotaDesc}>
            Restam {formatUsage(Math.max(0, WEEKLY_LIMIT - weeklyUsage))} na semana selecionada.
          </Text>
        </View>

        {/* Lista de Salas */}
        <View style={styles.feed}>
          {salasDb.map((sala, index) => {
            const idSala = sala.id_sala || sala.id || index;
            const predioNome = sala.predio?.nome || sala.nome_predio || '';
            const capacidade = sala.capacidade || 0;
            const slots = Array.isArray(sala.horarios_disponiveis) ? sala.horarios_disponiveis : [];

            return (
              <View key={idSala} style={styles.roomCard}>
                <Image 
                source={{ uri: sala.foto || 'https://via.placeholder.com/150' }} 
                style={{ width: '100%', height: 120, borderRadius: 6, marginBottom: 12 }} 
                />
                <Text style={styles.roomTitle}>{sala.nome || sala.nome_sala}</Text>
                <Text style={styles.roomSubtitle}>
                  {predioNome ? `${predioNome} • ` : ''}{capacidade} lugares
                </Text>

                <View style={styles.slotsContainer}>
                  {slots.filter((s: any) => s.ativo !== false).map((slot: any, sIdx: number) => {
                    const horario = slot.horario || slot;
                    const inicio = horario.hora_inicio || slot.hora_inicio;
                    const fim = horario.hora_fim || slot.hora_fim;
                    const diaSemana = Number(slot.dia_semana);

                    return (
                      <Pressable 
                        key={slot.id_sala_horario || slot.id || sIdx} 
                        style={styles.slotButton}
                        onPress={() => openModal(sala, slot)}
                      >
                        <Text style={styles.slotIcon}>📄</Text>
                        <Text style={styles.slotText}>
                          <Text style={styles.slotTextBold}>{DIAS_SEMANA_NOME[diaSemana]}: </Text>
                          {inicio}–{fim}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* MODAL DE RESERVA */}
      <Modal visible={!!activeSelection} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeSelection?.sala.nome}</Text>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PRÉDIO</Text>
              <Text style={styles.infoValue}>{activeSelection?.sala.predio?.nome || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CAPACIDADE</Text>
              <Text style={styles.infoValue}>{activeSelection?.sala.capacidade} lugares</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>HORÁRIO</Text>
              <Text style={styles.infoValue}>
                {activeSelection?.slot.horario?.hora_inicio} às {activeSelection?.slot.horario?.hora_fim}
              </Text>
            </View>

          <View style={styles.dateContainer}>
              <Text style={styles.infoLabel}>ESCOLHA A DATA DA RESERVA</Text>
              
              <Pressable 
                style={styles.inputDate} 
                onPress={() => setShowPicker(true)}
              >
                <Text style={{ color: selectedDate ? '#0F172A' : '#94A3B8', fontSize: 15 }}>
                  {selectedDate ? selectedDate : "Toque para escolher uma data"}
                </Text>
              </Pressable>

              {showPicker && (
                <DateTimePicker
                  value={dateObject}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>

            {conflictWarning && (
              <View style={styles.conflictBox}>
                <Text style={styles.conflictText}>
                  Existe uma reserva confirmada para esta data e horário. Deseja solicitar uma{' '}
                  <Text style={styles.conflictLink} onPress={handleEmergencyReservation}>
                    Reserva de Emergência
                  </Text>
                  ?
                </Text>
                <TextInput
                  style={styles.inputEmergency}
                  value={justificativa}
                  onChangeText={setJustificativa}
                  placeholder="Motivo da urgência"
                  maxLength={255}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={closeModal} disabled={submitting}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>

              {conflictWarning ? (
                <Pressable 
                  style={[styles.primaryBtn, { backgroundColor: '#DC2626' }]} 
                  onPress={handleEmergencyReservation} 
                  disabled={submitting || !selectedDate || justificativa.trim().length < 10}
                >
                  {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Enviar Emergência</Text>}
                </Pressable>
              ) : (
                <Pressable 
                  style={styles.primaryBtn} 
                  onPress={confirmReservation} 
                  disabled={submitting || !selectedDate}
                >
                  {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Solicitar reserva</Text>}
                </Pressable>
              )}
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748B' },
  scrollContent: { padding: 20 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#DC2626', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  pageDescription: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 24 },

  classPicker: { marginBottom: 16 },
  classChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  classChoice: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 16, paddingVertical: 7, paddingHorizontal: 12 },
  classChoiceActive: { backgroundColor: '#fff0f1', borderColor: '#E30613' },
  classChoiceText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  classChoiceTextActive: { color: '#BD0010' },

  quotaCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  quotaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  quotaTitle: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  quotaValue: { fontSize: 13, color: '#0F172A', fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#E30613', borderRadius: 3 },
  quotaDesc: { fontSize: 11, color: '#64748B' },

  feed: { gap: 16 },
  roomCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  roomTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  roomSubtitle: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1', alignSelf: 'flex-start' },
  slotIcon: { marginRight: 6, fontSize: 14 },
  slotText: { fontSize: 13, color: '#0F172A' },
  slotTextBold: { fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', flex: 1 },
  closeButton: { padding: 4 },
  closeButtonText: { fontSize: 20, color: '#64748B', fontWeight: 'bold' },

  infoRow: { marginBottom: 12 },
  infoLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#0F172A', fontWeight: '500' },

  dateContainer: { marginTop: 12, marginBottom: 20 },
  inputDate: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, padding: 12, fontSize: 15, color: '#0F172A', marginTop: 6 },

  conflictBox: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 20 },
  conflictText: { fontSize: 13, color: '#991B1B', lineHeight: 18, marginBottom: 8 },
  conflictLink: { color: '#DC2626', fontWeight: 'bold', textDecorationLine: 'underline' },
  inputEmergency: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 6, padding: 10, fontSize: 13 },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, justifyContent: 'center' },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  primaryBtn: { backgroundColor: '#E30613', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});