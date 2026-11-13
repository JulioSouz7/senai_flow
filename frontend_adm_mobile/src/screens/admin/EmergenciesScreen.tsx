import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { AlertTriangle, ArrowRight } from 'lucide-react-native';
import { api } from '../../services/api';
import { RefreshButton } from '../../components/RefreshButton';

function normalizarLista(data: any, chave: string): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[chave])) return data[chave];
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.[chave])) return data.data[chave];
  return [];
}

function obterStatusTroca(troca: any): string {
  return String(troca?.status ?? troca?.status_troca ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function trocaEstaPendente(troca: any): boolean {
  const status = obterStatusTroca(troca);

  return (
    status === 'PENDENTE' ||
    status === 'PENDENTE_ENTRE_DOCENTES'
  );
}

export function EmergenciesScreen({
  notify,
}: {
  notify: (text: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [todasReservas, setTodasReservas] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [trocasSala, setTrocasSala] = useState<any[]>([]);
  const [salasDestino, setSalasDestino] = useState<Record<number, number>>({});
  const [processando, setProcessando] = useState<Record<number, boolean>>({});
  const processandoRef = useRef(new Set<number>());
  const [abaAtiva, setAbaAtiva] = useState<
    'PENDENTES' | 'TODAS' | 'TROCAS'
  >('PENDENTES');

  const buscarTrocas = async () => {
    const endpoints = ['/trocas-sala', '/troca-sala', '/troca-salas'];

    for (const endpoint of endpoints) {
      try {
        return await api.get(endpoint);
      } catch {
        // Tenta o próximo caminho.
      }
    }

    return null;
  };

  const fetchDados = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    let failedRequests = false;
    try {
      const [pendentesRes, todasRes, salasRes, trocasRes] = await Promise.all([
        api.get('/reservas/pendentes').catch(() => { failedRequests = true; return { data: null }; }),
        api.get('/reservas').catch(() => { failedRequests = true; return { data: [] }; }),
        api.get('/salas').catch(() => { failedRequests = true; return { data: [] }; }),
        buscarTrocas(),
      ]);
      if (!trocasRes) failedRequests = true;

      const listaTodas = normalizarLista(todasRes.data, 'reservas');
      setTodasReservas(listaTodas);

      const listaPendentes = normalizarLista(pendentesRes.data, 'reservas');

      if (pendentesRes.data !== null) {
        setRequests(listaPendentes);
      } else {
        setRequests(
          listaTodas.filter((reserva: any) => reserva.status === 'PENDENTE'),
        );
      }

      setSalas(normalizarLista(salasRes.data, 'salas'));
      setTrocasSala(normalizarLista(trocasRes?.data, 'trocas'));
      if (manual) notify(failedRequests ? 'Solicitações atualizadas parcialmente; algumas consultas falharam.' : 'Solicitações e trocas atualizadas.');
    } catch {
      notify(manual ? 'Não foi possível atualizar as solicitações.' : 'Erro ao carregar solicitações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const formatarDataUTC = (dataIso?: string) => {
    if (!dataIso) return '';

    const data = new Date(dataIso);
    if (isNaN(data.getTime())) return '';

    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const extrairDataHorario = (reservaObj: any) => {
    const listaHorarios = Array.isArray(reservaObj?.reserva_horario)
      ? reservaObj.reserva_horario
      : [];

    if (listaHorarios.length === 0) {
      return reservaObj?.dt_solicitacao
        ? new Date(reservaObj.dt_solicitacao).toLocaleDateString('pt-BR')
        : 'Hoje';
    }

    return listaHorarios
      .map((rh: any) => {
        const data = formatarDataUTC(rh.dt_reserva);
        const horario = rh.sala_horario?.horario;
        const inicio = horario?.hora_inicio || horario?.horario_inicio || '';
        const fim = horario?.hora_fim || horario?.horario_fim || '';
        const faixa = inicio && fim ? `${inicio} às ${fim}` : '';

        return [data, faixa].filter(Boolean).join(' ');
      })
      .join(', ');
  };

  const extrairDocenteNome = (reservaObj: any) =>
    reservaObj?.reserva_docente?.[0]?.docente?.usuario?.nome ||
    reservaObj?.docente?.usuario?.nome ||
    reservaObj?.docente?.nome ||
    reservaObj?.usuario?.nome ||
    'Docente';

  const extrairTurmaNome = (reservaObj: any) =>
    reservaObj?.turma?.nome ||
    reservaObj?.turma?.codigo ||
    (reservaObj?.id_turma ? `Turma ${reservaObj.id_turma}` : '');

  const obterNomeSala = (idSala?: number, salaObj?: any) => {
    if (salaObj?.nome) return salaObj.nome;

    const encontrada = salas.find(
      (sala: any) => Number(sala.id_sala || sala.id) === Number(idSala),
    );

    return encontrada?.nome || (idSala ? `Sala ${idSala}` : 'Não informada');
  };

  const salaOcupadaNosHorarios = (
    idSalaCandidata: number,
    reservaOriginal: any,
  ) => {
    const horariosExigidos = Array.isArray(reservaOriginal?.reserva_horario)
      ? reservaOriginal.reserva_horario
      : [];

    if (horariosExigidos.length === 0) return false;

    return todasReservas.some((reserva: any) => {
      if (Number(reserva.id_sala) !== Number(idSalaCandidata)) return false;
      if (!['PENDENTE', 'CONFIRMADA'].includes(reserva.status)) return false;

      const horariosExistentes = Array.isArray(reserva.reserva_horario)
        ? reserva.reserva_horario
        : [];

      return horariosExigidos.some((exigido: any) =>
        horariosExistentes.some((existente: any) => {
          const mesmaData =
            formatarDataUTC(exigido.dt_reserva) ===
            formatarDataUTC(existente.dt_reserva);

          const idHorarioExigido = exigido.sala_horario?.id_horario;
          const idHorarioExistente = existente.sala_horario?.id_horario;

          return (
            mesmaData &&
            idHorarioExigido != null &&
            idHorarioExigido === idHorarioExistente
          );
        }),
      );
    });
  };

  const decide = async (
    reserva: any,
    acao: 'APROVAR' | 'RECUSAR',
  ) => {
    const idReserva = Number(reserva.id_reserva);

    if (processandoRef.current.has(idReserva)) return;

    const protocolo = `#RE-${idReserva}`;
    const isUrgencia = reserva.tipo === 'URGENCIA';
    const idSalaDestino = salasDestino[idReserva];

    const reservaOriginal = isUrgencia
      ? todasReservas.find(
          (item: any) =>
            Number(item.id_reserva) === Number(reserva.id_reserva_urgencia),
        )
      : null;

    if (isUrgencia && acao === 'APROVAR' && !idSalaDestino) {
      notify(`${protocolo}: selecione a sala para realocar o docente atual.`);
      return;
    }

    if (
      isUrgencia &&
      acao === 'APROVAR' &&
      reservaOriginal &&
      salaOcupadaNosHorarios(idSalaDestino, reservaOriginal)
    ) {
      notify(`${protocolo}: a sala selecionada está ocupada nesse horário.`);
      return;
    }

    processandoRef.current.add(idReserva);
    setProcessando((atual) => ({ ...atual, [idReserva]: true }));

    const endpoint = isUrgencia
      ? `/reservas/${idReserva}/decidir-urgencia`
      : `/reservas/${idReserva}/decidir`;

    const payload: Record<string, any> = {
      aprovar: acao === 'APROVAR',
    };

    if (isUrgencia && acao === 'APROVAR') {
      payload.nova_sala_antiga = Number(idSalaDestino);
    }

    try {
      const response = await api.patch(endpoint, payload);

      notify(
        response?.data?.mensagem ||
          `${protocolo}: solicitação ${
            acao === 'APROVAR' ? 'aprovada' : 'recusada'
          }.`,
      );

      await fetchDados();
    } catch (error: any) {
      notify(
        `${protocolo}: ${
          error?.response?.data?.message ||
          error?.response?.data?.erro ||
          'Erro ao processar.'
        }`,
      );
    } finally {
      processandoRef.current.delete(idReserva);
      setProcessando((atual) => ({ ...atual, [idReserva]: false }));
    }
  };

  const listaBase = abaAtiva === 'PENDENTES' ? requests : todasReservas;

  const trocasPendentesCount = trocasSala.filter(trocaEstaPendente).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void fetchDados(true);
          }}
          colors={['#dc2626']}
        />
      }
    >
      <View style={{ alignItems: 'flex-end' }}>
        <RefreshButton refreshing={refreshing} onPress={() => void fetchDados(true)} />
      </View>
      <View style={styles.banner}>
        <AlertTriangle size={18} color="#b45309" />
        <Text style={styles.bannerText}>
          Priorize o plano de aula e uma sala equivalente. Trocas entre docentes
          são registradas abaixo para auditoria.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsRow}
      >
        <TouchableOpacity
          style={[styles.tabBtn, abaAtiva === 'PENDENTES' && styles.tabBtnActive]}
          onPress={() => setAbaAtiva('PENDENTES')}
        >
          <Text
            style={[
              styles.tabText,
              abaAtiva === 'PENDENTES' && styles.tabTextActive,
            ]}
          >
            Pendentes ({requests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, abaAtiva === 'TODAS' && styles.tabBtnActive]}
          onPress={() => setAbaAtiva('TODAS')}
        >
          <Text
            style={[
              styles.tabText,
              abaAtiva === 'TODAS' && styles.tabTextActive,
            ]}
          >
            Todas ({todasReservas.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, abaAtiva === 'TROCAS' && styles.tabBtnActive]}
          onPress={() => setAbaAtiva('TROCAS')}
        >
          <Text
            style={[
              styles.tabText,
              abaAtiva === 'TROCAS' && styles.tabTextActive,
            ]}
          >
            Trocas ({trocasSala.length})
            {trocasPendentesCount > 0
              ? ` • ${trocasPendentesCount} pend.`
              : ''}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#dc2626"
          style={{ marginTop: 32 }}
        />
      ) : abaAtiva === 'TROCAS' ? (
        trocasSala.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nenhuma troca de sala registrada.
            </Text>
          </View>
        ) : (
          trocasSala.map((troca: any) => {
            const statusNormalizado = obterStatusTroca(troca);
            const pendente = trocaEstaPendente(troca);
            const aceita = statusNormalizado === 'ACEITA';
            const statusExibido = pendente
              ? 'PENDENTE ENTRE DOCENTES'
              : troca?.status ?? troca?.status_troca ?? 'STATUS NÃO INFORMADO';

            const reservaVinculada =
              todasReservas.find(
                (reserva: any) =>
                  Number(reserva.id_reserva) === Number(troca.id_reserva),
              ) || troca.reserva;

            const solicitante =
              troca.docente_solicitante?.usuario?.nome ||
              extrairDocenteNome(reservaVinculada);

            const turma = extrairTurmaNome(reservaVinculada);
            const dataHorario = reservaVinculada
              ? extrairDataHorario(reservaVinculada)
              : formatarDataUTC(troca.dt_troca);

            return (
              <View style={styles.card} key={`troca-${troca.id_troca}`}>
                <View style={styles.cardTop}>
                  <Text style={styles.protocol}>#TR-{troca.id_troca}</Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: aceita
                          ? '#dcfce7'
                          : pendente
                            ? '#fef3c7'
                            : '#fee2e2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: aceita
                            ? '#15803d'
                            : pendente
                              ? '#b45309'
                              : '#b91c1c',
                        },
                      ]}
                    >
                      {statusExibido}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>
                  Permuta • Reserva #{troca.id_reserva}
                </Text>

                <Text style={styles.cardSub}>
                  {[solicitante, turma, dataHorario].filter(Boolean).join(' • ')}
                </Text>

                <View style={styles.allocationBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.allocLabel}>ORIGEM</Text>
                    <Text style={styles.allocValue}>
                      {obterNomeSala(troca.id_sala_origem, troca.sala_origem)}
                    </Text>
                  </View>

                  <ArrowRight size={16} color="#64748b" />

                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.allocLabel}>DESTINO</Text>
                    <Text style={styles.allocValue}>
                      {obterNomeSala(troca.id_sala_destino, troca.sala_destino)}
                    </Text>
                  </View>
                </View>

                {!!troca.motivo && (
                  <View style={styles.motivoBox}>
                    <Text style={styles.motivoText}>
                      <Text style={{ fontWeight: '700' }}>Motivo: </Text>
                      {troca.motivo}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )
      ) : listaBase.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Nenhuma solicitação encontrada.
          </Text>
        </View>
      ) : (
        listaBase.map((reserva: any) => {
          const idReserva = Number(reserva.id_reserva);
          const isPendente = reserva.status === 'PENDENTE';
          const isUrgencia = reserva.tipo === 'URGENCIA';

          const trocaPendente = trocasSala.find(
            (troca: any) =>
              Number(troca.id_reserva) === idReserva &&
              trocaEstaPendente(troca),
          );

          const statusExibido = trocaPendente
            ? 'PENDENTE ENTRE DOCENTES'
            : reserva.status;

          const reservaOriginal = isUrgencia
            ? todasReservas.find(
                (item: any) =>
                  Number(item.id_reserva) ===
                  Number(reserva.id_reserva_urgencia),
              )
            : null;

          const dataHorario = extrairDataHorario(
            isUrgencia && reservaOriginal ? reservaOriginal : reserva,
          );

          const salasCandidatas = salas.filter(
            (sala: any) =>
              sala.ativa !== false &&
              Number(sala.id_sala || sala.id) !== Number(reserva.id_sala),
          );

          const estaProcessando = !!processando[idReserva];

          return (
            <View style={styles.card} key={idReserva}>
              <View style={styles.cardTop}>
                <Text style={styles.protocol}>#RE-{idReserva}</Text>
                <Text style={styles.typeTag}>
                  {reserva.tipo || 'NORMAL'}
                </Text>
              </View>

              <Text style={styles.cardTitle}>
                Solicitação #{idReserva}
              </Text>

              <Text style={styles.cardSub}>
                {[
                  extrairDocenteNome(reserva),
                  extrairTurmaNome(reserva),
                  dataHorario,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>

              {trocaPendente && (
                <View style={styles.alertBox}>
                  <Text style={styles.alertBoxText}>
                    Troca entre docentes aguardando resposta de outro docente
                    {' '}
                    (#TR-{trocaPendente.id_troca}).
                  </Text>
                </View>
              )}

              <View style={styles.allocationBox}>
                <View>
                  <Text style={styles.allocLabel}>SALA SOLICITADA</Text>
                  <Text style={styles.allocValue}>
                    {reserva.sala?.nome || `Sala ${reserva.id_sala}`}
                  </Text>
                </View>

                <ArrowRight size={16} color="#64748b" />

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.allocLabel}>STATUS</Text>
                  <Text style={styles.allocValue}>{statusExibido}</Text>
                </View>
              </View>

              {isUrgencia && isPendente && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.allocLabel}>
                    REALOCAR DOCENTE ATUAL PARA:
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 6 }}
                  >
                    {salasCandidatas.map((sala: any) => {
                      const idSala = Number(sala.id_sala || sala.id);
                      const selecionada = salasDestino[idReserva] === idSala;
                      const ocupada = reservaOriginal
                        ? salaOcupadaNosHorarios(idSala, reservaOriginal)
                        : false;

                      return (
                        <TouchableOpacity
                          key={idSala}
                          disabled={ocupada || estaProcessando}
                          style={[
                            styles.roomChip,
                            selecionada && styles.roomChipActive,
                            ocupada && styles.roomChipDisabled,
                          ]}
                          onPress={() =>
                            setSalasDestino((atual) => ({
                              ...atual,
                              [idReserva]: idSala,
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.roomChipText,
                              selecionada && styles.roomChipTextActive,
                              ocupada && styles.roomChipTextDisabled,
                            ]}
                          >
                            {sala.nome}
                            {ocupada ? ' (Ocupada)' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {isPendente && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryBtn,
                      estaProcessando && styles.buttonDisabled,
                    ]}
                    disabled={estaProcessando}
                    onPress={() => decide(reserva, 'RECUSAR')}
                  >
                    <Text style={styles.secondaryBtnText}>
                      {estaProcessando ? 'Processando...' : 'Recusar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      estaProcessando && styles.buttonDisabled,
                    ]}
                    disabled={estaProcessando}
                    onPress={() => decide(reserva, 'APROVAR')}
                  >
                    <Text style={styles.primaryBtnText}>
                      {estaProcessando
                        ? 'Processando...'
                        : isUrgencia
                          ? 'Aprovar e realocar'
                          : 'Aprovar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  banner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
  tabsRow: { flexDirection: 'row', marginBottom: 14 },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  tabBtnActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabTextActive: { color: '#dc2626' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  protocol: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626',
  },
  typeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  alertBox: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  alertBoxText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  allocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
  },
  allocLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  allocValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  motivoBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  motivoText: { fontSize: 12, color: '#334155' },
  roomChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    marginRight: 8,
  },
  roomChipActive: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  roomChipDisabled: { opacity: 0.5 },
  roomChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  roomChipTextActive: { color: '#dc2626' },
  roomChipTextDisabled: { color: '#94a3b8' },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  primaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonDisabled: { opacity: 0.6 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: { fontSize: 13, color: '#64748b' },
});