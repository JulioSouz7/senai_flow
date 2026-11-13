import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, getApiError } from '@/services/api';
import { useFeedback } from '@/components/FeedbackProvider';
import { RefreshButton } from '@/components/RefreshButton';

interface Sala {
  id_sala: number;
  nome: string;
}

interface ReservaHorario {
  dt_reserva?: string;
  hora_inicio?: string;
  hora_fim?: string;
}

interface Reserva {
  id_reserva: number;
  id_sala?: number;
  status: string;
  sala?: Sala | null;
  reserva_horario?: ReservaHorario | ReservaHorario[];
  reservaHorario?: ReservaHorario | ReservaHorario[];
}

interface SolicitacaoTroca {
  id_troca: number;
  id_reserva?: number;
  id_sala_destino?: number;
  id_sala_origem?: number;
  status: string;
  motivo?: string;
  dt_solicitacao?: string;
  reserva?: Reserva;
  docente_solicitante?: {
    nome?: string;
    usuario?: { nome: string };
  };
  reserva_origem?: Reserva;
  reserva_destino?: Reserva;
  sala_origem?: Sala;
  sala_destino?: Sala;
}

interface SwapScreenProps {
  onRefresh?: () => void;
}

export default function SwapScreen({ onRefresh }: SwapScreenProps) {
  const { notify } = useFeedback();
  const [minhasReservas, setMinhasReservas] = useState<Reserva[]>([]);
  const [outrasReservas, setOutrasReservas] = useState<Reserva[]>([]);
  const [solicitacoesRecebidas, setSolicitacoesRecebidas] = useState<SolicitacaoTroca[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados do formulário de Proposta
  const [reservaOrigem, setReservaOrigem] = useState<string>('');
  const [reservaDestino, setReservaDestino] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [answeringId, setAnsweringId] = useState<number | null>(null);

  const fetchSwapsData = async (): Promise<boolean> => {
    try {
      setLoading(true);

      const [resMinhas, resGeral, resTrocas] = await Promise.all([
        api.get('/reservas/minhas-reservas'),
        api.get('/reservas'),
        api.get('/trocas-sala'),
      ]);

      const safeMinhas: Reserva[] = Array.isArray(resMinhas.data) ? resMinhas.data : [];
      const safeGeral: Reserva[] = Array.isArray(resGeral.data) ? resGeral.data : [];
      const safeTrocas: SolicitacaoTroca[] = Array.isArray(resTrocas.data) ? resTrocas.data : [];

      const minhasAtivas = safeMinhas.filter((r) => {
        const st = r.status ? String(r.status).trim().toUpperCase() : '';
        return !['ENCERRADA', 'CANCELADA', 'RECUSADA'].includes(st);
      });

      const meusIds = safeMinhas.map((r) => r.id_reserva);

      const todasAtivas = safeGeral.filter((r) => {
        const st = r.status ? String(r.status).trim().toUpperCase() : '';
        const ativa = !['ENCERRADA', 'CANCELADA', 'RECUSADA'].includes(st);
        const naoEhMinha = !meusIds.includes(r.id_reserva);
        return ativa && naoEhMinha;
      });

      const minhasSalas = new Set(safeMinhas.map((reserva) => reserva.sala?.id_sala ?? reserva.id_sala).filter((id): id is number => typeof id === 'number'));
      const recebidas = safeTrocas.filter((t) => {
        const st = t.status ? String(t.status).trim().toUpperCase() : '';
        return (st === 'PENDENTE' || st === 'AGUARDANDO')
          && typeof t.id_sala_destino === 'number'
          && minhasSalas.has(t.id_sala_destino);
      });

      setMinhasReservas(minhasAtivas);
      setOutrasReservas(todasAtivas);
      setSolicitacoesRecebidas(recebidas);

      if (minhasAtivas.length > 0 && !reservaOrigem) {
        setReservaOrigem(String(minhasAtivas[0].id_reserva));
      }
      if (todasAtivas.length > 0 && !reservaDestino) {
        setReservaDestino(String(todasAtivas[0].id_reserva));
      }
      return true;
    } catch (error) {
      console.error('Erro ao carregar dados de trocas:', error);
      notify(getApiError(error, 'Falha ao carregar dados da Central de Trocas.'), 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshSwaps = async () => {
    if (refreshing) return;
    setRefreshing(true);
    if (await fetchSwapsData()) notify('Central de trocas atualizada.', 'success');
    setRefreshing(false);
  };

  useEffect(() => {
    void fetchSwapsData();
  }, []);

  const handleResponderTroca = async (id_troca: number, novoStatus: 'ACEITA' | 'RECUSADA') => {
    try {
      setAnsweringId(id_troca);
      await api.patch(`/trocas-sala/${id_troca}/responder`, { status: novoStatus });
      notify(`Solicitação de troca ${novoStatus === 'ACEITA' ? 'aceita' : 'recusada'} com sucesso!`, 'success');
      
      void fetchSwapsData();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      notify(getApiError(error, 'Erro ao responder solicitação de troca.'), 'error');
    } finally {
      setAnsweringId(null);
    }
  };

  const handleEnviarProposta = async () => {
    if (!reservaOrigem || !reservaDestino) {
      notify('Selecione ambas as reservas para propor a troca.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/trocas-sala', {
        id_reserva_origem: Number(reservaOrigem),
        id_reserva_destino: Number(reservaDestino),
        motivo: motivo.trim() || 'Necessidade de readequação de espaço de aula.',
      });

      notify('Solicitação de troca enviada com sucesso.', 'success');
      setMotivo('');
      void fetchSwapsData();
    } catch (error) {
      notify(getApiError(error, 'Erro ao enviar proposta de troca.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatOptionText = (r: Reserva) => {
    const salaNome = r.sala?.nome || 'Sala Indefinida';
    const rel = r.reserva_horario || r.reservaHorario;
    const h = Array.isArray(rel) ? rel[0] : rel;
    const dt = h?.dt_reserva ? h.dt_reserva.split('T')[0] : '';
    return `${salaNome} • ID: ${r.id_reserva} ${dt ? `(${dt})` : ''}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerTitleContainer}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>NEGOCIAÇÃO ENTRE DOCENTES</Text>
            <Text style={styles.title}>Central de trocas</Text>
          </View>
          <RefreshButton label="central de trocas" refreshing={refreshing} onPress={() => void refreshSwaps()} />
        </View>
        <Text style={styles.description}>
          Solicite uma troca de sala ou acompanhe as solicitações recebidas.
        </Text>
      </View>

      <View style={styles.swapsGrid}>
        {/* CARD DA ESQUERDA: SOLICITAÇÕES RECEBIDAS */}
        <View style={styles.panelCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitleRed}>SOLICITAÇÕES RECEBIDAS</Text>
            <Text style={styles.cardHeaderSubtitle}>Histórico pendente</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#e30613" size="small" style={{ marginVertical: 20 }} />
          ) : solicitacoesRecebidas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma solicitação de troca pendente no momento.</Text>
            </View>
          ) : (
            solicitacoesRecebidas.map((item) => {
              const nomeSolicitante =
                item.docente_solicitante?.nome ||
                item.docente_solicitante?.usuario?.nome ||
                'Docente Solicitante';

              const idOrigem = item.id_reserva;

              const objOrigem =
                item.reserva ||
                outrasReservas.find((r) => r.id_reserva === idOrigem) ||
                minhasReservas.find((r) => r.id_reserva === idOrigem);

              const nomeSalaOrigem =
                item.sala_origem?.nome ||
                objOrigem?.sala?.nome ||
                (idOrigem ? `Reserva #${idOrigem}` : 'Sala não informada');

              const nomeSalaDestino =
                item.sala_destino?.nome ||
                (item.id_sala_destino ? `Sala #${item.id_sala_destino}` : 'Sala não informada');

              return (
                <View key={item.id_troca} style={styles.swapItemCard}>
                  <View style={styles.userRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {nomeSolicitante.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.userName}>{nomeSolicitante}</Text>
                      <Text style={styles.userSubtext}>Solicitou uma troca de sala com você</Text>
                    </View>
                  </View>

                  <View style={styles.swapDetailsBox}>
                    <Text style={styles.detailText}>
                      <Text style={styles.boldText}>Oferece: </Text>
                      {nomeSalaOrigem}
                    </Text>
                    <Text style={styles.detailText}>
                      <Text style={styles.boldText}>Deseja receber: </Text>
                      {nomeSalaDestino}
                    </Text>
                    {item.motivo ? (
                      <Text style={styles.motivoText}>"{item.motivo}"</Text>
                    ) : null}
                  </View>

                  <View style={styles.actionsRow}>
                    <Pressable
                      disabled={answeringId === item.id_troca}
                      onPress={() => void handleResponderTroca(item.id_troca, 'RECUSADA')}
                      style={styles.btnSecondary}
                    >
                      <Text style={styles.btnSecondaryText}>Recusar</Text>
                    </Pressable>
                    <Pressable
                      disabled={answeringId === item.id_troca}
                      onPress={() => void handleResponderTroca(item.id_troca, 'ACEITA')}
                      style={styles.btnPrimary}
                    >
                      {answeringId === item.id_troca ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.btnPrimaryText}>Aceitar troca</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* FORMULÁRIO DE NOVA SOLICITAÇÃO */}
        <View style={styles.panelCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitleRed}>ENVIAR PROPOSTA</Text>
            <Text style={styles.cardHeaderSubtitle}>Troca Direta</Text>
          </View>

          <Text style={styles.formTitle}>Solicitar troca de sala</Text>

          {/* Seleção 1 */}
          <Text style={styles.fieldLabel}>1. SUA RESERVA QUE DESEJA OFERECER</Text>
          <View style={styles.selectorBox}>
            {minhasReservas.length === 0 ? (
              <Text style={styles.selectorTextPlaceholder}>Nenhuma reserva sua disponível</Text>
            ) : (
              minhasReservas.map((r) => (
                <Pressable
                  key={r.id_reserva}
                  onPress={() => setReservaOrigem(String(r.id_reserva))}
                  style={[
                    styles.optionChip,
                    reservaOrigem === String(r.id_reserva) && styles.optionChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      reservaOrigem === String(r.id_reserva) && styles.optionChipTextSelected,
                    ]}
                  >
                    {formatOptionText(r)}
                  </Text>
                </Pressable>
              ))
            )}
          </View>

          {/* Seleção 2 */}
          <Text style={styles.fieldLabel}>2. SALA / RESERVA QUE DESEJA RECEBER</Text>
          <View style={styles.selectorBox}>
            {outrasReservas.length === 0 ? (
              <Text style={styles.selectorTextPlaceholder}>Nenhuma reserva de outro docente</Text>
            ) : (
              outrasReservas.map((r) => (
                <Pressable
                  key={r.id_reserva}
                  onPress={() => setReservaDestino(String(r.id_reserva))}
                  style={[
                    styles.optionChip,
                    reservaDestino === String(r.id_reserva) && styles.optionChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      reservaDestino === String(r.id_reserva) && styles.optionChipTextSelected,
                    ]}
                  >
                    {formatOptionText(r)}
                  </Text>
                </Pressable>
              ))
            )}
          </View>

          {/* Motivo */}
          <Text style={styles.fieldLabel}>3. MOTIVO DA SOLICITAÇÃO (OPCIONAL)</Text>
          <TextInput
            onChangeText={setMotivo}
            placeholder="Ex: Necessidade de laboratório equipado"
            placeholderTextColor="#94a3b8"
            style={styles.inputMotivo}
            value={motivo}
          />

          <Pressable
            disabled={submitting || loading || minhasReservas.length === 0}
            onPress={handleEnviarProposta}
            style={[
              styles.btnSubmit,
              (submitting || minhasReservas.length === 0) && styles.btnSubmitDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnSubmitText}>Enviar proposta de troca</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  headerTitleContainer: { marginBottom: 16 },
  eyebrow: { color: '#e30613', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { marginTop: 4, color: '#111827', fontSize: 24, fontWeight: '800' },
  description: { marginTop: 4, color: '#64748b', fontSize: 13 },
  
  swapsGrid: { gap: 16, flexDirection: 'column-reverse' },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0 },
  panelCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitleRed: { color: '#e30613', fontSize: 11, fontWeight: '800' },
  cardHeaderSubtitle: { color: '#94a3b8', fontSize: 11 },
  
  emptyContainer: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  
  swapItemCard: { marginBottom: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#e30613', fontWeight: '800', fontSize: 13 },
  userName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  userSubtext: { fontSize: 11, color: '#64748b' },
  
  swapDetailsBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  detailText: { fontSize: 13, color: '#334155', marginBottom: 4 },
  boldText: { fontWeight: '700' },
  motivoText: { marginTop: 4, fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  
  actionsRow: { flexDirection: 'row', gap: 10 },
  btnSecondary: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  btnSecondaryText: { color: '#334155', fontWeight: '700', fontSize: 13 },
  btnPrimary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#e30613',
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  
  formTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#334155', marginBottom: 6 },
  
  selectorBox: { gap: 6, marginBottom: 14 },
  selectorTextPlaceholder: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic' },
  optionChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  optionChipSelected: { borderColor: '#e30613', backgroundColor: '#fff0f1' },
  optionChipText: { fontSize: 12, color: '#334155' },
  optionChipTextSelected: { color: '#e30613', fontWeight: '700' },
  
  inputMotivo: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  btnSubmit: {
    backgroundColor: '#e30613',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSubmitDisabled: { opacity: 0.6 },
  btnSubmitText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});