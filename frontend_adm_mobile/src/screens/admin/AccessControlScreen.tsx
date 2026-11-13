import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../services/api';
import { RefreshButton } from '../../components/RefreshButton';

interface Props {
  notify?: (text: string) => void;
}

interface Turma {
  id_turma: number;
  nome: string;
  codigo?: string;
  docentes?: Array<{ id_docente: number }>;
  docente_turma?: Array<{ id_docente: number; id_turma: number }>;
  docenteTurma?: Array<{ id_docente: number; id_turma: number }>;
}

interface Usuario {
  id_usuario?: number;
  id?: number;
  id_docente?: number;
  nome: string;
  email: string;
  perfil?: string;
  tipo_usuario?: string;
  status?: string;
  situacao?: string;
  matricula?: string;
  nif?: string;
  aluno?: {
    id_aluno: number;
    id_turma: number;
    matricula?: string;
    situacao?: string;
  };
  docente?: {
    id_docente: number;
    turmas?: Turma[];
    docente_turma?: Array<{ id_turma: number; turma?: Turma }>;
    docenteTurma?: Array<{ id_turma: number; turma?: Turma }>;
  };
  administrador?: { id_adm: number };
  turmas?: Turma[];
}

type TipoNovo = 'ALUNO' | 'DOCENTE' | 'ADMIN' | 'ADMIN_PRINCIPAL';
type Filtro = 'TODOS' | 'ALUNO' | 'DOCENTE' | 'ADMIN';

function extrairUsuarios(data: any): Usuario[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.usuarios)) return data.usuarios;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function extrairTurmas(data: any): Turma[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.turmas)) return data.turmas;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function AccessControlScreen({ notify }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [busyId, setBusyId] = useState<number | null>(null);

  const [modalCadastro, setModalCadastro] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tipoNovo, setTipoNovo] = useState<TipoNovo>('ALUNO');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [idTurma, setIdTurma] = useState('');
  const [matricula, setMatricula] = useState('');
  const [nif, setNif] = useState('');

  const [docenteSelecionado, setDocenteSelecionado] = useState<Usuario | null>(null);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [loadingTurmas, setLoadingTurmas] = useState(false);

  const carregarDados = async (atualizar = false) => {
    if (atualizar) setRefreshing(true);
    else setLoading(true);
    let failedTurmas = false;

    try {
      let respostaUsuarios;

      try {
        respostaUsuarios = await api.get('/usuarios');
      } catch {
        respostaUsuarios = await api.get('/users');
      }

      setUsuarios(extrairUsuarios(respostaUsuarios.data));

      try {
        const respostaTurmas = await api.get('/turmas');
        setTurmas(extrairTurmas(respostaTurmas.data));
      } catch {
        failedTurmas = true;
        setTurmas([]);
      }
      if (atualizar) notify?.(failedTurmas ? 'Usuários atualizados, mas não foi possível carregar as turmas.' : 'Usuários e turmas atualizados.');
    } catch (error: any) {
      console.error('Erro ao carregar controle de acessos:', error?.response?.data);
      notify?.('Não foi possível carregar a lista de usuários.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void carregarDados();
    // Carrega os dados ao abrir a tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUserId = (usuario: Usuario) =>
    usuario.id_usuario ?? usuario.id ?? 0;

  const getDocenteId = (usuario: Usuario) =>
    usuario.docente?.id_docente ?? usuario.id_docente ?? getUserId(usuario);

  const getTurmasDocente = (usuario: Usuario): Turma[] => {
    const diretas = usuario.docente?.turmas || usuario.turmas || [];
    if (diretas.length > 0) return diretas;

    const relacionamentos =
      usuario.docente?.docente_turma || usuario.docente?.docenteTurma || [];

    if (relacionamentos.length > 0) {
      return relacionamentos
        .map(
          (relacao) =>
            relacao.turma ||
            turmas.find((turma) => turma.id_turma === relacao.id_turma),
        )
        .filter((turma): turma is Turma => Boolean(turma));
    }

    const docenteId = getDocenteId(usuario);
    return turmas.filter((turma) => {
      const vinculados =
        turma.docentes || turma.docente_turma || turma.docenteTurma || [];
      return vinculados.some((docente) => docente.id_docente === docenteId);
    });
  };

  const getTipoUsuario = (usuario: Usuario) => {
    const perfil = String(
      usuario.perfil || usuario.tipo_usuario || '',
    ).toUpperCase();

    if (perfil.includes('PRINCIPAL')) return 'Admin Principal';
    if (perfil.includes('ADMIN') || usuario.administrador) return 'Administrador';
    if (perfil.includes('DOCENTE') || perfil.includes('PROF') || usuario.docente) {
      return 'Docente';
    }
    return 'Aluno';
  };

  const getStatusUsuario = (usuario: Usuario) => {
    const status = String(
      usuario.status || usuario.situacao || usuario.aluno?.situacao || 'ATIVO',
    ).toUpperCase();

    if (status === 'TRANCADO') return 'Trancado';
    if (status === 'BLOQUEADO' || status === 'INATIVO') return 'Bloqueado';
    return 'Ativo';
  };

  const usuariosFiltrados = usuarios.filter((usuario) => {
    if (filtro === 'TODOS') return true;
    const tipo = getTipoUsuario(usuario).toUpperCase();
    return filtro === 'ADMIN' ? tipo.includes('ADMIN') : tipo === filtro;
  });

  const limparFormulario = () => {
    setNome('');
    setEmail('');
    setSenha('');
    setIdTurma('');
    setMatricula('');
    setNif('');
    setTipoNovo('ALUNO');
  };

  const cadastrarUsuario = async () => {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      notify?.('Preencha nome, e-mail e senha inicial.');
      return;
    }

    const exigeTurma = tipoNovo === 'ALUNO' || tipoNovo === 'DOCENTE';
    const turmaNumerica = Number(idTurma);

    if (exigeTurma && (!turmaNumerica || turmaNumerica <= 0)) {
      notify?.('Informe um ID de turma válido.');
      return;
    }

    const perfil =
      tipoNovo === 'ADMIN'
        ? 'ADMINISTRADOR'
        : tipoNovo;

    const payload: Record<string, string | number> = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha: senha.trim(),
      perfil,
    };

    if (exigeTurma) payload.id_turma = turmaNumerica;
    if (tipoNovo === 'ALUNO' && matricula.trim()) {
      payload.matricula = matricula.trim();
    }
    if (tipoNovo !== 'ALUNO' && nif.trim()) {
      payload.nif = nif.trim();
    }

    try {
      setSubmitting(true);
      await api.post('/usuarios', payload);
      notify?.(`Usuário ${nome.trim()} cadastrado com sucesso.`);
      setModalCadastro(false);
      limparFormulario();
      await carregarDados(true);
    } catch (error: any) {
      console.error('Erro ao cadastrar usuário:', error?.response?.data);
      notify?.(
        error?.response?.data?.message ||
          error?.response?.data?.mensagem ||
          'Não foi possível cadastrar o usuário.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const alternarBloqueio = async (usuario: Usuario) => {
    const userId = getUserId(usuario);
    if (!userId || busyId === userId) return;

    const statusAtual = getStatusUsuario(usuario);
    const bloqueado = statusAtual !== 'Ativo';
    const isAluno = getTipoUsuario(usuario) === 'Aluno';

    try {
      setBusyId(userId);
      await api.patch(`/usuarios/${userId}/status`, {
        status: bloqueado ? 'ATIVO' : isAluno ? 'TRANCADO' : 'BLOQUEADO',
      });
      notify?.(`Status de ${usuario.nome} atualizado.`);
      await carregarDados(true);
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error?.response?.data);
      notify?.('Não foi possível atualizar o status do usuário.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmarExclusao = (usuario: Usuario) => {
    const userId = getUserId(usuario);
    if (!userId) {
      notify?.('Não foi possível identificar este usuário.');
      return;
    }

    Alert.alert(
      'Excluir usuário',
      `Deseja excluir ${usuario.nome}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusyId(userId);
              await api.delete(`/usuarios/${userId}`);
              setUsuarios((lista) =>
                lista.filter((item) => getUserId(item) !== userId),
              );
              notify?.('Usuário excluído com sucesso.');
            } catch (error: any) {
              console.error('Erro ao excluir usuário:', error?.response?.data);
              notify?.('Não foi possível excluir o usuário.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  const adicionarTurmaDocente = async () => {
    if (!docenteSelecionado || !turmaSelecionada) return;

    const docenteId = getDocenteId(docenteSelecionado);

    try {
      setLoadingTurmas(true);
      await api.post(`/usuarios/docentes/${docenteId}/turmas`, {
        id_turma: Number(turmaSelecionada),
      });
      notify?.('Turma vinculada ao docente.');
      setTurmaSelecionada('');
      await carregarDados(true);
    } catch (error: any) {
      console.error('Erro ao vincular turma:', error?.response?.data);
      notify?.(
        error?.response?.data?.message || 'Não foi possível vincular a turma.',
      );
    } finally {
      setLoadingTurmas(false);
    }
  };

  const removerTurmaDocente = (turma: Turma) => {
    if (!docenteSelecionado) return;

    Alert.alert(
      'Desvincular turma',
      `Remover ${turma.codigo ? `${turma.codigo} - ` : ''}${turma.nome} deste docente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            const docenteId = getDocenteId(docenteSelecionado);

            try {
              setLoadingTurmas(true);
              await api.delete(
                `/usuarios/docentes/${docenteId}/turmas/${turma.id_turma}`,
              );
              notify?.('Turma desvinculada do docente.');
              await carregarDados(true);
            } catch (error: any) {
              console.error('Erro ao desvincular turma:', error?.response?.data);
              notify?.('Não foi possível desvincular a turma.');
            } finally {
              setLoadingTurmas(false);
            }
          },
        },
      ],
    );
  };

  const turmasDisponiveis = docenteSelecionado
    ? turmas.filter(
        (turma) =>
          !getTurmasDocente(docenteSelecionado).some(
            (vinculada) => vinculada.id_turma === turma.id_turma,
          ),
      )
    : [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void carregarDados(true)}
          tintColor="#dc2626"
        />
      }
    >
      <Text style={styles.eyebrow}>SEGURANÇA E IDENTIDADE</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={styles.title}>Controle de acessos</Text>
        <RefreshButton refreshing={refreshing} onPress={() => void carregarDados(true)} />
      </View>
      <Text style={styles.subtitle}>
        Cadastre usuários e gerencie seus acessos e turmas.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setModalCadastro(true)}
      >
        <Text style={styles.primaryButtonText}>+ Novo usuário</Text>
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
      >
        {(['TODOS', 'ALUNO', 'DOCENTE', 'ADMIN'] as Filtro[]).map((item) => {
          const ativo = filtro === item;
          const label =
            item === 'TODOS'
              ? 'Todos'
              : item === 'ADMIN'
                ? 'Administradores'
                : item === 'DOCENTE'
                  ? 'Docentes'
                  : 'Alunos';

          return (
            <TouchableOpacity
              key={item}
              style={[styles.filterButton, ativo && styles.filterButtonActive]}
              onPress={() => setFiltro(item)}
            >
              <Text style={[styles.filterText, ativo && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color="#dc2626" style={styles.loader} />
      ) : usuariosFiltrados.length === 0 ? (
        <Text style={styles.empty}>Nenhum usuário encontrado.</Text>
      ) : (
        usuariosFiltrados.map((usuario, index) => {
          const id = getUserId(usuario);
          const tipo = getTipoUsuario(usuario);
          const status = getStatusUsuario(usuario);
          const bloqueado = status !== 'Ativo';

          return (
            <View
              key={String(id || usuario.email || index)}
              style={styles.userCard}
            >
              <View style={styles.userHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(usuario.nome || 'US')
                      .split(' ')
                      .slice(0, 2)
                      .map((parte) => parte[0])
                      .join('')
                      .toUpperCase()}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{usuario.nome}</Text>
                  <Text style={styles.userEmail}>{usuario.email}</Text>
                  <Text style={styles.userType}>{tipo}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text
                  style={[
                    styles.status,
                    bloqueado ? styles.statusBlocked : styles.statusActive,
                  ]}
                >
                  {status}
                </Text>

                {tipo === 'Docente' && (
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => setDocenteSelecionado(usuario)}
                  >
                    <Text style={styles.smallButtonText}>Turmas</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.smallButton,
                    bloqueado ? styles.unblockButton : styles.blockButton,
                  ]}
                  onPress={() => void alternarBloqueio(usuario)}
                  disabled={busyId === id}
                >
                  <Text style={styles.smallButtonText}>
                    {busyId === id
                      ? 'Aguarde...'
                      : tipo === 'Aluno'
                        ? bloqueado
                          ? 'Destrancar'
                          : 'Trancar'
                        : bloqueado
                          ? 'Desbloquear'
                          : 'Bloquear'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallButton, styles.deleteButton]}
                  onPress={() => confirmarExclusao(usuario)}
                  disabled={busyId === id}
                >
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <Modal
        visible={modalCadastro}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCadastro(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cadastrar usuário</Text>
                <TouchableOpacity onPress={() => setModalCadastro(false)}>
                  <Text style={styles.closeText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Tipo de perfil</Text>
              <View style={styles.profileOptions}>
                {(
                  ['ALUNO', 'DOCENTE', 'ADMIN', 'ADMIN_PRINCIPAL'] as TipoNovo[]
                ).map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.profileOption,
                      tipoNovo === tipo && styles.profileOptionActive,
                    ]}
                    onPress={() => setTipoNovo(tipo)}
                  >
                    <Text
                      style={[
                        styles.profileOptionText,
                        tipoNovo === tipo && styles.profileOptionTextActive,
                      ]}
                    >
                      {tipo === 'ADMIN_PRINCIPAL'
                        ? 'Admin principal'
                        : tipo === 'ADMIN'
                          ? 'Administrador'
                          : tipo === 'DOCENTE'
                            ? 'Docente'
                            : 'Aluno'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Nome completo</Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Nome do usuário"
              />

              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="usuario@senai.br"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Senha inicial</Text>
              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                placeholder="Defina uma senha inicial"
                secureTextEntry
              />

              {(tipoNovo === 'ALUNO' || tipoNovo === 'DOCENTE') && (
                <>
                  <Text style={styles.label}>ID da turma</Text>
                  <TextInput
                    style={styles.input}
                    value={idTurma}
                    onChangeText={setIdTurma}
                    placeholder="ID da turma"
                    keyboardType="numeric"
                  />
                </>
              )}

              {tipoNovo === 'ALUNO' && (
                <>
                  <Text style={styles.label}>Matrícula (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    value={matricula}
                    onChangeText={setMatricula}
                    placeholder="Matrícula"
                  />
                </>
              )}

              {tipoNovo !== 'ALUNO' && (
                <>
                  <Text style={styles.label}>NIF / identificador (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    value={nif}
                    onChangeText={setNif}
                    placeholder="Identificador"
                  />
                </>
              )}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  submitting && styles.disabledButton,
                ]}
                onPress={() => void cadastrarUsuario()}
                disabled={submitting}
              >
                <Text style={styles.primaryButtonText}>
                  {submitting ? 'Cadastrando...' : 'Cadastrar usuário'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={docenteSelecionado !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDocenteSelecionado(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Turmas do docente</Text>
                  <Text style={styles.userEmail}>
                    {docenteSelecionado?.nome}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setDocenteSelecionado(null)}>
                  <Text style={styles.closeText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Turmas vinculadas</Text>
              {docenteSelecionado &&
              getTurmasDocente(docenteSelecionado).length > 0 ? (
                getTurmasDocente(docenteSelecionado).map((turma) => (
                  <View key={turma.id_turma} style={styles.turmaRow}>
                    <Text style={styles.turmaName}>
                      {turma.codigo ? `${turma.codigo} - ` : ''}
                      {turma.nome}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removerTurmaDocente(turma)}
                      disabled={loadingTurmas}
                    >
                      <Text style={styles.deleteButtonText}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyInline}>
                  Nenhuma turma vinculada.
                </Text>
              )}

              <Text style={styles.label}>Vincular turma</Text>
              {turmasDisponiveis.length === 0 ? (
                <Text style={styles.emptyInline}>
                  Não há outras turmas disponíveis.
                </Text>
              ) : (
                turmasDisponiveis.map((turma) => {
                  const selecionada =
                    turmaSelecionada === String(turma.id_turma);

                  return (
                    <TouchableOpacity
                      key={turma.id_turma}
                      style={[
                        styles.turmaChoice,
                        selecionada && styles.turmaChoiceActive,
                      ]}
                      onPress={() =>
                        setTurmaSelecionada(String(turma.id_turma))
                      }
                    >
                      <Text
                        style={[
                          styles.turmaName,
                          selecionada && styles.turmaChoiceTextActive,
                        ]}
                      >
                        {turma.codigo ? `${turma.codigo} - ` : ''}
                        {turma.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!turmaSelecionada || loadingTurmas) && styles.disabledButton,
                ]}
                onPress={() => void adicionarTurmaDocente()}
                disabled={!turmaSelecionada || loadingTurmas}
              >
                <Text style={styles.primaryButtonText}>
                  {loadingTurmas ? 'Salvando...' : 'Vincular turma selecionada'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 16, paddingBottom: 32 },
  eyebrow: { color: '#dc2626', fontSize: 10, fontWeight: '800' },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800', marginTop: 5 },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 5, marginBottom: 16 },
  primaryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  disabledButton: { opacity: 0.55 },
  filters: { marginVertical: 10, flexGrow: 0 },
  filterButton: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterButtonActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  filterText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  loader: { marginVertical: 24 },
  empty: { color: '#64748b', textAlign: 'center', padding: 24 },
  userCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
  },
  userHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#b91c1c', fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  userEmail: { color: '#64748b', fontSize: 12, marginTop: 3 },
  userType: { color: '#475569', fontSize: 12, marginTop: 3 },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  status: { fontSize: 11, fontWeight: '700', marginRight: 'auto' },
  statusActive: { color: '#047857' },
  statusBlocked: { color: '#b91c1c' },
  smallButton: {
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallButtonText: { color: '#334155', fontSize: 11, fontWeight: '700' },
  blockButton: { backgroundColor: '#fff' },
  unblockButton: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  deleteButton: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  deleteButtonText: { color: '#b91c1c', fontSize: 11, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    padding: 16,
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { color: '#0f172a', fontSize: 17, fontWeight: '800' },
  closeText: { color: '#dc2626', fontWeight: '700', paddingLeft: 10 },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
  },
  profileOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  profileOption: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  profileOptionActive: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  profileOptionText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  profileOptionTextActive: { color: '#dc2626' },
  turmaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  turmaName: { color: '#334155', fontSize: 13, flex: 1 },
  turmaChoice: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 7,
  },
  turmaChoiceActive: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  turmaChoiceTextActive: { color: '#b91c1c', fontWeight: '700' },
  emptyInline: { color: '#94a3b8', fontSize: 12, paddingVertical: 8 },
});