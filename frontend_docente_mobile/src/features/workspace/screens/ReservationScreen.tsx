import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, getApiError } from '@/services/api';
import type { ApiRecord } from '@/types/mobile';
import { calculateWeeklyUsage, formatUsage, WEEKLY_LIMIT } from '../reservationUsage';
import { useFeedback } from '@/components/FeedbackProvider';
import { RefreshButton } from '@/components/RefreshButton';

interface ReservationScreenProps {
  onComplete: () => void;
}

type ReservationUsage = { status?: string; reserva_horario?: { dt_reserva?: string }[] };

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

function roomName(room: ApiRecord): string {
  return String(room.nome ?? room.nome_sala ?? 'Sala');
}

function roomBuilding(room: ApiRecord): string {
  return String(room.predio?.nome ?? room.nome_predio ?? '');
}

function roomSlots(room: ApiRecord): ApiRecord[] {
  return Array.isArray(room.horarios_disponiveis)
    ? room.horarios_disponiveis.filter((slot) => slot.ativo !== false)
    : [];
}

function equipmentNames(room: ApiRecord): string[] {
  const relations = room.sala_equipamento;
  if (Array.isArray(relations)) {
    const names = relations.flatMap((relation) => {
      if (!isApiRecord(relation)) return [];
      const equipment = relation.equipamento;
      if (!isApiRecord(equipment)) return [];
      const name = equipment.nome;
      return typeof name === 'string' && name.trim() ? [name.trim()] : [];
    });
    if (names.length) return names;
  }

  const equipment = room.equipamentos;
  return Array.isArray(equipment)
    ? equipment.flatMap((item) => {
      if (!isApiRecord(item)) return [];
      const name = item.nome;
      return typeof name === 'string' && name.trim() ? [name.trim()] : [];
    })
    : [];
}

function slotTime(slot: ApiRecord): string {
  const horario = slot.horario ?? slot;
  const start = horario.hora_inicio ?? slot.hora_inicio;
  const end = horario.hora_fim ?? slot.hora_fim;
  return typeof start === 'string' && typeof end === 'string'
    ? `${start}–${end}`
    : 'Horário não informado';
}

function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null;
}

export default function ReservationScreen({ onComplete }: ReservationScreenProps) {
  const { notify } = useFeedback();
  const [salasDb, setSalasDb] = useState<ApiRecord[]>([]);
  const [turmas, setTurmas] = useState<ApiRecord[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null);
  const [usageReservations, setUsageReservations] = useState<ReservationUsage[]>([]);
  const [activeSelection, setActiveSelection] = useState<{ sala: ApiRecord; slot: ApiRecord } | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ApiRecord | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dateObject, setDateObject] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchRoom, setSearchRoom] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [minimumCapacity, setMinimumCapacity] = useState('');
  const [filterDay, setFilterDay] = useState('');
  
  // Estados para emergência e conflito
  const [conflictWarning, setConflictWarning] = useState(false);
  const [justificativa, setJustificativa] = useState('');

  const changeCalendarMonth = (offset: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const selectCalendarDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setDateObject(date);
    setSelectedDate(`${year}-${month}-${day}`);
    setShowCalendar(false);
    setConflictWarning(false);
  };

  const fetchData = useCallback(async () => {
    const [roomResponse, turmaResponse, reservationResponse] = await Promise.all([
      api.get<ApiRecord[]>('/salas'),
      api.get<ApiRecord[]>('/turmas'),
      api.get<ReservationUsage[]>('/reservas/minhas-reservas'),
    ]);
    return {
      rooms: Array.isArray(roomResponse.data) ? roomResponse.data : [],
      classes: Array.isArray(turmaResponse.data) ? turmaResponse.data : [],
      reservations: Array.isArray(reservationResponse.data) ? reservationResponse.data : [],
    };
  }, []);

  const applyData = useCallback((data: Awaited<ReturnType<typeof fetchData>>) => {
    setSalasDb(data.rooms);
    setTurmas(data.classes);
    setUsageReservations(data.reservations);
    setSelectedTurmaId((current) =>
      current !== null && data.classes.some((item) => Number(item.id_turma) === current)
        ? current
        : data.classes[0]?.id_turma ? Number(data.classes[0].id_turma) : null,
    );
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      applyData(await fetchData());
      notify('Agenda e utilização semanal atualizadas.', 'success');
    } catch (requestError) {
      notify(getApiError(requestError, 'Não foi possível carregar salas, turmas e reservas.'), 'error');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchData()
      .then((data) => {
        if (active) applyData(data);
      })
      .catch((requestError: unknown) => {
        if (active) notify(getApiError(requestError, 'Não foi possível carregar salas, turmas e reservas.'), 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyData, fetchData, notify]);

  const weeklyUsage = calculateWeeklyUsage(usageReservations, selectedDate || dateObject);
  const calendarOffset = (calendarMonth.getDay() + 6) % 7;
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - calendarOffset + 1);
    return date.getMonth() === calendarMonth.getMonth() ? date : null;
  });
  const selectedSlotWeekDay = activeSelection ? Number(activeSelection.slot.dia_semana) : -1;

  const openModal = (sala: ApiRecord) => {
    setSelectedRoom(sala);
    setActiveSelection(null);
    setSelectedDate('');
    setShowCalendar(false);
    setConflictWarning(false);
    setJustificativa('');
  };

  const selectSlot = (slot: ApiRecord) => {
    if (!selectedRoom) return;
    setActiveSelection({ sala: selectedRoom, slot });
    setSelectedDate('');
    setShowCalendar(false);
    setConflictWarning(false);
    setJustificativa('');
  };

  const closeModal = () => {
    setSelectedRoom(null);
    setActiveSelection(null);
    setSelectedDate('');
    setConflictWarning(false);
    setJustificativa('');
    setShowCalendar(false);
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

  const buildings = [...new Set(salasDb.map(roomBuilding).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const filteredRooms = salasDb.filter((sala) => {
    const search = searchRoom.trim().toLocaleLowerCase('pt-BR');
    const matchesSearch = !search || roomName(sala).toLocaleLowerCase('pt-BR').includes(search);
    const matchesBuilding = !filterBuilding || roomBuilding(sala) === filterBuilding;
    const matchesCapacity = !minimumCapacity || Number(sala.capacidade ?? 0) >= Number(minimumCapacity);
    const matchesDay = !filterDay || roomSlots(sala).some((slot) => Number(slot.dia_semana) === Number(filterDay));
    return matchesSearch && matchesBuilding && matchesCapacity && matchesDay;
  });

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
          <View style={styles.headingActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={filtersOpen ? 'Ocultar filtros' : 'Filtrar salas'}
              accessibilityState={{ expanded: filtersOpen }}
              onPress={() => setFiltersOpen((open) => !open)}
              style={[styles.filterButton, filtersOpen && styles.filterButtonActive]}
            >
              <Ionicons name="options-outline" size={18} color={filtersOpen ? '#bd0010' : '#475569'} />
              <Text style={[styles.filterButtonText, filtersOpen && styles.filterButtonTextActive]}>Filtros</Text>
            </Pressable>
            <RefreshButton label="agenda" refreshing={refreshing} onPress={() => void refreshData()} />
          </View>
        </View>
        <Text style={styles.pageDescription}>
          Solicitações regulares exigem 48h de antecedência e respeitam o limite de 10h semanais.
        </Text>

        {filtersOpen ? (
          <View style={styles.filtersCard}>
            <Text style={styles.filterLabel}>Buscar sala</Text>
            <TextInput
              accessibilityLabel="Buscar sala pelo nome"
              value={searchRoom}
              onChangeText={setSearchRoom}
              placeholder="Nome da sala"
              style={styles.filterInput}
              returnKeyType="search"
            />
            <View style={styles.filterFields}>
              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>Bloco</Text>
                <TextInput
                  accessibilityLabel="Filtrar por bloco"
                  value={filterBuilding}
                  onChangeText={setFilterBuilding}
                  placeholder={buildings.length ? 'Todos os blocos' : 'Sem blocos cadastrados'}
                  style={styles.filterInput}
                />
                {buildings.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
                    <Pressable onPress={() => setFilterBuilding('')} style={[styles.filterOption, !filterBuilding && styles.filterOptionActive]}>
                      <Text style={[styles.filterOptionText, !filterBuilding && styles.filterOptionTextActive]}>Todos</Text>
                    </Pressable>
                    {buildings.map((building) => (
                      <Pressable key={building} onPress={() => setFilterBuilding(building)} style={[styles.filterOption, filterBuilding === building && styles.filterOptionActive]}>
                        <Text style={[styles.filterOptionText, filterBuilding === building && styles.filterOptionTextActive]}>{building}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}
              </View>
              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>Capacidade mínima</Text>
                <TextInput
                  accessibilityLabel="Capacidade mínima"
                  value={minimumCapacity}
                  onChangeText={(value) => setMinimumCapacity(value.replace(/[^\d]/g, ''))}
                  placeholder="Qualquer capacidade"
                  keyboardType="number-pad"
                  style={styles.filterInput}
                />
              </View>
            </View>
            <Text style={styles.filterLabel}>Dia disponível</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
              <Pressable onPress={() => setFilterDay('')} style={[styles.filterOption, !filterDay && styles.filterOptionActive]}>
                <Text style={[styles.filterOptionText, !filterDay && styles.filterOptionTextActive]}>Todos</Text>
              </Pressable>
              {Object.entries(DIAS_SEMANA_NOME).filter(([day]) => Number(day) >= 1 && Number(day) <= 6).map(([day, name]) => (
                <Pressable key={day} onPress={() => setFilterDay(day)} style={[styles.filterOption, filterDay === day && styles.filterOptionActive]}>
                  <Text style={[styles.filterOptionText, filterDay === day && styles.filterOptionTextActive]}>{name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSearchRoom('');
                setFilterBuilding('');
                setMinimumCapacity('');
                setFilterDay('');
              }}
              style={styles.clearFilters}
            >
              <Text style={styles.clearFiltersText}>Limpar filtros</Text>
            </Pressable>
          </View>
        ) : null}

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

        <View style={styles.feed}>
          {salasDb.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>Nenhuma sala disponível foi retornada pela API.</Text></View>
          ) : filteredRooms.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>Nenhuma sala corresponde aos filtros atuais.</Text></View>
          ) : filteredRooms.map((sala, index) => {
            const idSala = sala.id_sala ?? sala.id ?? index;
            const name = roomName(sala);
            const building = roomBuilding(sala);
            const capacity = Number(sala.capacidade ?? 0);

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Detalhes da sala ${name}, capacidade ${capacity} lugares, bloco ${building || 'não informado'}`}
                key={String(idSala)}
                onPress={() => openModal(sala)}
                style={({ pressed }) => [styles.roomCard, pressed && styles.roomCardPressed]}
              >
                {typeof sala.foto === 'string' && sala.foto.length > 0 ? (
                  <Image source={{ uri: sala.foto }} resizeMode="cover" style={styles.roomImage} />
                ) : (
                  <View style={[styles.roomImage, styles.roomImagePlaceholder]}>
                    <Ionicons name="business-outline" size={36} color="#94a3b8" />
                  </View>
                )}
                <View style={styles.roomInfo}>
                  <Text numberOfLines={2} style={styles.roomTitle}>{name}</Text>
                  <Text style={styles.roomMeta}><Ionicons name="people-outline" size={15} color="#64748b" /> {capacity} lugares</Text>
                  <Text numberOfLines={1} style={styles.roomMeta}><Ionicons name="business-outline" size={15} color="#64748b" /> {building || 'Bloco não informado'}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={!!selectedRoom} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedRoom ? roomName(selectedRoom) : ''}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Fechar detalhes da sala" onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name="close" size={23} color="#64748b" />
                </Pressable>
              </View>
              {selectedRoom ? (
                <>
                  {typeof selectedRoom.foto === 'string' && selectedRoom.foto.length > 0 ? (
                    <Image source={{ uri: selectedRoom.foto }} resizeMode="cover" style={styles.modalImage} />
                  ) : (
                    <View style={[styles.modalImage, styles.roomImagePlaceholder]}>
                      <Ionicons name="business-outline" size={42} color="#94a3b8" />
                    </View>
                  )}
                  <View style={styles.modalDetails}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>BLOCO</Text>
                      <Text style={styles.infoValue}>{roomBuilding(selectedRoom) || 'Não informado'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>CAPACIDADE</Text>
                      <Text style={styles.infoValue}>{Number(selectedRoom.capacidade ?? 0)} lugares</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>DIAS E HORÁRIOS DISPONÍVEIS</Text>
                      {roomSlots(selectedRoom).length ? roomSlots(selectedRoom).map((slot, index) => {
                        const slotId = String(slot.id_sala_horario ?? slot.id ?? index);
                        const selectedSlotId = activeSelection
                          ? String(activeSelection.slot.id_sala_horario ?? activeSelection.slot.id ?? '')
                          : '';
                        return (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ selected: selectedSlotId === slotId }}
                            key={slotId}
                            onPress={() => selectSlot(slot)}
                            style={[styles.slotButton, selectedSlotId === slotId && styles.slotButtonSelected]}
                          >
                            <Ionicons name="time-outline" size={17} color={selectedSlotId === slotId ? '#bd0010' : '#475569'} />
                            <Text style={[styles.slotText, selectedSlotId === slotId && styles.slotTextSelected]}>
                              <Text style={styles.slotDay}>{DIAS_SEMANA_NOME[Number(slot.dia_semana)] ?? 'Dia não informado'}: </Text>{slotTime(slot)}
                            </Text>
                          </Pressable>
                        );
                      }) : <Text style={styles.infoValue}>Não há horários disponíveis cadastrados.</Text>}
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>EQUIPAMENTOS</Text>
                      <Text style={styles.infoValue}>{equipmentNames(selectedRoom).length ? equipmentNames(selectedRoom).join(', ') : 'Informação de equipamentos não fornecida pela API.'}</Text>
                    </View>
                    {activeSelection ? (
                      <>
                        <View style={styles.dateContainer}>
                          <Text style={styles.infoLabel}>ESCOLHA A DATA DA RESERVA ({DIAS_SEMANA_NOME[Number(activeSelection.slot.dia_semana)] ?? 'dia selecionado'})</Text>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Escolher data da reserva"
                            accessibilityState={{ expanded: showCalendar }}
                            style={styles.datePickerButton}
                            onPress={() => {
                              setCalendarMonth(new Date(dateObject.getFullYear(), dateObject.getMonth(), 1));
                              setShowCalendar((visible) => !visible);
                            }}
                          >
                            <Text style={[styles.datePickerText, !selectedDate && styles.datePickerPlaceholder]}>
                              {selectedDate || 'AAAA-MM-DD'}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#64748B" />
                          </Pressable>
                          {showCalendar ? (
                            <View style={styles.calendar}>
                              <View style={styles.calendarHeader}>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Mês anterior"
                                  onPress={() => changeCalendarMonth(-1)}
                                  style={styles.calendarNavButton}
                                >
                                  <Ionicons name="chevron-back" size={18} color="#334155" />
                                </Pressable>
                                <Text style={styles.calendarMonth}>
                                  {calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                </Text>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Próximo mês"
                                  onPress={() => changeCalendarMonth(1)}
                                  style={styles.calendarNavButton}
                                >
                                  <Ionicons name="chevron-forward" size={18} color="#334155" />
                                </Pressable>
                              </View>
                              <View style={styles.calendarGrid}>
                                {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((day) => (
                                  <Text key={day} style={styles.calendarWeekday}>{day}</Text>
                                ))}
                                {calendarDays.map((date, index) => {
                                  if (!date) return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
                                  const dateValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                  const isMatchingWeekday = date.getDay() === selectedSlotWeekDay;
                                  const isSelected = dateValue === selectedDate;
                                  return (
                                    <Pressable
                                      accessibilityRole="button"
                                      accessibilityLabel={date.toLocaleDateString('pt-BR')}
                                      accessibilityState={{ disabled: !isMatchingWeekday, selected: isSelected }}
                                      disabled={!isMatchingWeekday}
                                      key={dateValue}
                                      onPress={() => selectCalendarDate(date)}
                                      style={[
                                        styles.calendarDayCell,
                                        isMatchingWeekday && styles.calendarDayAvailable,
                                        isSelected && styles.calendarDaySelected,
                                      ]}
                                    >
                                      <Text style={[
                                        styles.calendarDayText,
                                        isMatchingWeekday && styles.calendarDayTextAvailable,
                                        isSelected && styles.calendarDayTextSelected,
                                      ]}>
                                        {date.getDate()}
                                      </Text>
                                    </Pressable>
                                  );
                                })}
                              </View>
                              <Text style={styles.calendarHint}>
                                Selecione uma {DIAS_SEMANA_NOME[selectedSlotWeekDay]?.toLowerCase() ?? 'data disponível'}.
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {conflictWarning ? (
                          <View style={styles.conflictBox}>
                            <Text style={styles.conflictText}>Existe uma reserva confirmada para esta data e horário. Informe a justificativa para solicitar uma reserva de emergência.</Text>
                            <TextInput
                              accessibilityLabel="Justificativa da reserva de emergência"
                              style={styles.inputEmergency}
                              value={justificativa}
                              onChangeText={setJustificativa}
                              placeholder="Motivo da urgência (mínimo 10 caracteres)"
                              maxLength={255}
                            />
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <Text style={styles.selectHint}>Selecione um horário disponível para continuar.</Text>
                    )}
                  </View>
                </>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={closeModal} disabled={submitting}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              {activeSelection ? conflictWarning ? (
                <Pressable style={[styles.primaryBtn, styles.emergencyBtn]} onPress={handleEmergencyReservation} disabled={submitting || !selectedDate || justificativa.trim().length < 10}>
                  {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Enviar Emergência</Text>}
                </Pressable>
              ) : (
                <Pressable style={styles.primaryBtn} onPress={confirmReservation} disabled={submitting || !selectedDate}>
                  {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Solicitar reserva</Text>}
                </Pressable>
              ) : null}
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
  headingActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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

  filtersCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 18, gap: 8 },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, backgroundColor: '#FFFFFF' },
  filterButtonActive: { borderColor: '#E30613', backgroundColor: '#fff0f1' },
  filterButtonText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  filterButtonTextActive: { color: '#bd0010' },
  filterFields: { flexDirection: 'row', gap: 12 },
  filterField: { flex: 1, minWidth: 0 },
  filterLabel: { color: '#64748B', fontSize: 12, fontWeight: '700', marginBottom: 5 },
  filterInput: { minHeight: 42, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8, color: '#0F172A', fontSize: 13, backgroundColor: '#FFFFFF' },
  filterOptions: { flexDirection: 'row', gap: 7, paddingVertical: 3 },
  filterOption: { paddingVertical: 7, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, backgroundColor: '#FFFFFF' },
  filterOptionActive: { borderColor: '#E30613', backgroundColor: '#fff0f1' },
  filterOptionText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  filterOptionTextActive: { color: '#bd0010' },
  clearFilters: { alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 2 },
  clearFiltersText: { color: '#bd0010', fontSize: 12, fontWeight: '700' },
  feed: { gap: 14 },
  roomCard: { overflow: 'hidden', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  roomCardPressed: { opacity: 0.82 },
  roomImage: { width: '100%', height: 160, backgroundColor: '#F1F5F9' },
  roomImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  roomInfo: { padding: 14, gap: 7 },
  roomTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  roomMeta: { flexDirection: 'row', alignItems: 'center', color: '#64748B', fontSize: 13 },
  emptyCard: { padding: 18, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { color: '#64748B', fontSize: 13, lineHeight: 19, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.58)', justifyContent: 'center', alignItems: 'center', padding: 14 },
  modalContent: { width: '100%', maxWidth: 560, maxHeight: '94%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', flex: 1 },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#F1F5F9' },
  modalImage: { width: '100%', height: 180, borderRadius: 10, marginBottom: 15, backgroundColor: '#F1F5F9' },
  modalDetails: { gap: 2 },

  infoRow: { marginBottom: 12 },
  infoLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#0F172A', fontWeight: '500' },
  slotButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', paddingVertical: 10, paddingHorizontal: 11, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', marginTop: 6 },
  slotButtonSelected: { backgroundColor: '#fff0f1', borderColor: '#E30613' },
  slotText: { flex: 1, color: '#334155', fontSize: 12, lineHeight: 18 },
  slotTextSelected: { color: '#991b1b' },
  slotDay: { fontWeight: '700' },
  selectHint: { color: '#64748B', fontSize: 12, lineHeight: 18, marginBottom: 12 },

  dateContainer: { marginTop: 12, marginBottom: 20 },
  datePickerButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 12, marginTop: 6, backgroundColor: '#FFFFFF' },
  datePickerText: { color: '#0F172A', fontSize: 15 },
  datePickerPlaceholder: { color: '#64748B' },
  calendar: { marginTop: 8, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, backgroundColor: '#FFFFFF' },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calendarNavButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#F1F5F9' },
  calendarMonth: { color: '#0F172A', fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarWeekday: { width: '14.2857%', height: 30, textAlign: 'center', textAlignVertical: 'center', color: '#64748B', fontSize: 10, fontWeight: '700' },
  calendarDayCell: { width: '14.2857%', height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  calendarDayAvailable: { backgroundColor: '#FFF7F7' },
  calendarDaySelected: { backgroundColor: '#E30613' },
  calendarDayText: { color: '#CBD5E1', fontSize: 13 },
  calendarDayTextAvailable: { color: '#BD0010', fontWeight: '700' },
  calendarDayTextSelected: { color: '#FFFFFF' },
  calendarHint: { marginTop: 8, color: '#64748B', fontSize: 11, textAlign: 'center' },

  conflictBox: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 20 },
  conflictText: { fontSize: 13, color: '#991B1B', lineHeight: 18, marginBottom: 8 },
  inputEmergency: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 6, padding: 10, fontSize: 13 },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, justifyContent: 'center' },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  primaryBtn: { backgroundColor: '#E30613', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, justifyContent: 'center' },
  emergencyBtn: { backgroundColor: '#DC2626' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});