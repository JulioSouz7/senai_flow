import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  notify: (mensagem: string) => void;
}

interface FAQ {
  id_faq: number;
  pergunta: string;
  resposta: string;
  categoria: string | null;
}

interface ChamadoItem {
  id_chamado: number;
  id_usuario: number;
  id_admin_resp?: number | null;
  assunto: string;
  descricao: string;
  status: string;
  resposta?: string | null;
  created_at?: string;
  usuario?: {
    nome?: string;
    email?: string;
  };
}

type Aba = 'faq' | 'chamados';

const CATEGORIAS = ['Todas', 'Reservas', 'Equipamentos', 'Acesso', 'Geral'];
const STATUS_CHAMADO = ['TODOS', 'ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO'];

function extrairLista<T>(data: any, chave: string): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[chave])) return data[chave];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function mensagemErro(error: any, padrao: string) {
  return (
    error?.response?.data?.mensagem ||
    error?.response?.data?.message ||
    error?.response?.data?.erro ||
    padrao
  );
}

export function FaqScreen({ notify }: Props) {
  const [aba, setAba] = useState<Aba>('faq');
  const [refreshing, setRefreshing] = useState(false);

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [faqAbertaId, setFaqAbertaId] = useState<number | null>(null);

  const [modalFaqVisivel, setModalFaqVisivel] = useState(false);
  const [faqEditando, setFaqEditando] = useState<FAQ | null>(null);
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState('');
  const [categoria, setCategoria] = useState('Geral');
  const [salvandoFaq, setSalvandoFaq] = useState(false);

  const [chamados, setChamados] = useState<ChamadoItem[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  const [chamadoDetalhado, setChamadoDetalhado] =
    useState<ChamadoItem | null>(null);
  const [chamadoSelecionado, setChamadoSelecionado] =
    useState<ChamadoItem | null>(null);
  const [respostaChamado, setRespostaChamado] = useState('');
  const [novoStatus, setNovoStatus] = useState('RESOLVIDO');
  const [enviandoResposta, setEnviandoResposta] = useState(false);

  const carregarFaqs = async (manual = false) => {
    try {
      setLoadingFaqs(true);

      const response = await api.get('/faqs', {
        params: {
          busca: busca.trim() || undefined,
          categoria: categoriaSelecionada || undefined,
        },
      });

      setFaqs(extrairLista<FAQ>(response.data, 'faqs'));
      if (manual) notify('Perguntas frequentes atualizadas.');
    } catch (error) {
      console.error('Erro ao carregar FAQs:', error);
      notify(manual ? 'Erro ao atualizar as perguntas frequentes.' : 'Erro ao carregar as perguntas frequentes.');
    } finally {
      setLoadingFaqs(false);
    }
  };

  const carregarChamados = async (manual = false) => {
    setLoadingChamados(true);

    const rotas = ['/chamados-suporte', '/chamados', '/suporte'];

    try {
      let respostaApi: any = null;

      for (const rota of rotas) {
        try {
          respostaApi = await api.get(rota);
          break;
        } catch {
          // Tenta a próxima rota disponível.
        }
      }

      if (respostaApi) {
        setChamados(extrairLista<ChamadoItem>(respostaApi.data, 'chamados'));
        if (manual) notify('Chamados de suporte atualizados.');
      } else {
        setChamados([]);
        notify(manual ? 'Não foi possível atualizar os chamados de suporte.' : 'Não foi possível carregar os chamados de suporte.');
      }
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
      notify(manual ? 'Erro ao atualizar os chamados de suporte.' : 'Erro ao carregar os chamados de suporte.');
    } finally {
      setLoadingChamados(false);
    }
  };

  const atualizarDados = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (aba === 'faq') await carregarFaqs(true);
      else await carregarChamados(true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void carregarFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, categoriaSelecionada]);

  useEffect(() => {
    void carregarChamados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirNovaFaq = () => {
    setFaqEditando(null);
    setPergunta('');
    setResposta('');
    setCategoria('Geral');
    setModalFaqVisivel(true);
  };

  const abrirEdicaoFaq = (faq: FAQ) => {
    setFaqEditando(faq);
    setPergunta(faq.pergunta);
    setResposta(faq.resposta);
    setCategoria(faq.categoria || 'Geral');
    setModalFaqVisivel(true);
  };

  const salvarFaq = async () => {
    if (!pergunta.trim() || !resposta.trim()) {
      notify('Preencha a pergunta e a resposta.');
      return;
    }

    try {
      setSalvandoFaq(true);

      const payload = {
        pergunta: pergunta.trim(),
        resposta: resposta.trim(),
        categoria: categoria.trim() || undefined,
      };

      if (faqEditando) {
        await api.put(`/faqs/${faqEditando.id_faq}`, payload);
        notify('FAQ atualizada com sucesso!');
      } else {
        await api.post('/faqs', payload);
        notify('FAQ criada com sucesso!');
      }

      setModalFaqVisivel(false);
      await carregarFaqs();
    } catch (error: any) {
      console.error('Erro ao salvar FAQ:', error);
      notify(mensagemErro(error, 'Erro ao salvar FAQ.'));
    } finally {
      setSalvandoFaq(false);
    }
  };

  const excluirFaq = (faq: FAQ) => {
    Alert.alert(
      'Excluir pergunta',
      `Tem certeza que deseja excluir "${faq.pergunta}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/faqs/${faq.id_faq}`);
              setFaqs((lista) =>
                lista.filter((item) => item.id_faq !== faq.id_faq),
              );
              notify('Pergunta removida com sucesso!');
            } catch (error: any) {
              console.error('Erro ao excluir FAQ:', error);
              notify(mensagemErro(error, 'Erro ao excluir FAQ.'));
            }
          },
        },
      ],
    );
  };

  const abrirRespostaChamado = (item: ChamadoItem) => {
    setChamadoSelecionado(item);
    setRespostaChamado(item.resposta || '');
    setNovoStatus(
      item.status === 'ABERTO'
        ? 'EM_ANDAMENTO'
        : item.status === 'CONCLUIDO'
          ? 'RESOLVIDO'
          : item.status,
    );
  };

  const enviarRespostaChamado = async () => {
    if (!chamadoSelecionado) return;

    const idChamado = chamadoSelecionado.id_chamado;
    const rotas = [
      `/chamados-suporte/${idChamado}/status`,
      `/chamados/${idChamado}/status`,
      `/suporte/${idChamado}/status`,
    ];

    setEnviandoResposta(true);

    try {
      let atualizado = false;
      let ultimoErro: any = null;

      for (const rota of rotas) {
        try {
          await api.patch(rota, { status: novoStatus });
          atualizado = true;
          break;
        } catch (error) {
          ultimoErro = error;
        }
      }

      if (!atualizado) {
        throw ultimoErro || new Error('Não foi possível atualizar o chamado.');
      }

      setChamados((lista) =>
        lista.map((item) =>
          item.id_chamado === idChamado
            ? {
                ...item,
                status: novoStatus,
                resposta: respostaChamado.trim(),
              }
            : item,
        ),
      );

      setChamadoSelecionado(null);
      notify(`Chamado #${idChamado} atualizado com sucesso!`);
      void carregarChamados();
    } catch (error: any) {
      console.error('Erro ao atualizar chamado:', error);
      notify(mensagemErro(error, 'Erro ao atualizar o chamado.'));
    } finally {
      setEnviandoResposta(false);
    }
  };

  const chamadosPendentes = chamados.filter(
    (item) => item.status !== 'RESOLVIDO' && item.status !== 'CONCLUIDO',
  ).length;

  const chamadosFiltrados = chamados.filter((item) => {
    if (filtroStatus === 'TODOS') return true;

    if (filtroStatus === 'RESOLVIDO') {
      return item.status === 'RESOLVIDO' || item.status === 'CONCLUIDO';
    }

    return item.status === filtroStatus;
  });

  const renderFaq = (faq: FAQ) => {
    const aberta = faqAbertaId === faq.id_faq;

    return (
      <View key={faq.id_faq} style={styles.faqCard}>
        <TouchableOpacity
          style={styles.faqHeader}
          onPress={() =>
            setFaqAbertaId(aberta ? null : faq.id_faq)
          }
          activeOpacity={0.75}
        >
          <View style={styles.faqTitleContainer}>
            <Text style={styles.faqArrow}>{aberta ? '▼' : '▶'}</Text>
            <View style={styles.faqTitleContent}>
              <Text style={styles.faqQuestion}>{faq.pergunta}</Text>
              {!!faq.categoria && (
                <Text style={styles.categoryBadge}>{faq.categoria}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {aberta && (
          <View style={styles.faqAnswerContainer}>
            <Text style={styles.faqAnswer}>{faq.resposta}</Text>

            <View style={styles.faqActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => abrirEdicaoFaq(faq)}
              >
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => excluirFaq(faq)}
              >
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderChamado = (item: ChamadoItem) => {
    const resolvido =
      item.status === 'RESOLVIDO' || item.status === 'CONCLUIDO';

    return (
      <View key={item.id_chamado} style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketId}>Chamado #{item.id_chamado}</Text>
          <Text
            style={[
              styles.statusBadge,
              resolvido
                ? styles.statusResolved
                : item.status === 'EM_ANDAMENTO'
                  ? styles.statusInProgress
                  : styles.statusOpen,
            ]}
          >
            {item.status}
          </Text>
        </View>

        <Text style={styles.ticketUser}>
          {item.usuario?.nome || `Usuário #${item.id_usuario}`}
        </Text>
        {!!item.usuario?.email && (
          <Text style={styles.ticketEmail}>{item.usuario.email}</Text>
        )}

        <Text style={styles.ticketSubject}>{item.assunto}</Text>
        <Text style={styles.ticketDescription} numberOfLines={3}>
          {item.descricao}
        </Text>

        <View style={styles.ticketActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setChamadoDetalhado(item)}
          >
            <Text style={styles.secondaryButtonText}>Detalhes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primarySmallButton}
            onPress={() => abrirRespostaChamado(item)}
          >
            <Text style={styles.primarySmallButtonText}>Responder</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>CENTRAL DE AJUDA</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text style={styles.title}>FAQ &amp; Suporte</Text>
          <RefreshButton refreshing={refreshing} onPress={() => void atualizarDados()} />
        </View>
        <Text style={styles.subtitle}>
          Tire dúvidas e acompanhe os chamados de suporte.
        </Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, aba === 'faq' && styles.activeTab]}
            onPress={() => setAba('faq')}
          >
            <Text style={[styles.tabText, aba === 'faq' && styles.activeTabText]}>
              FAQ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, aba === 'chamados' && styles.activeTab]}
            onPress={() => setAba('chamados')}
          >
            <Text
              style={[
                styles.tabText,
                aba === 'chamados' && styles.activeTabText,
              ]}
            >
              Chamados{chamadosPendentes > 0 ? ` (${chamadosPendentes})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {aba === 'faq' ? (
          <View>
            <TextInput
              style={styles.searchInput}
              value={busca}
              onChangeText={setBusca}
              placeholder="Pesquisar pergunta ou resposta..."
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.sectionLabel}>Categoria</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipList}
            >
              {CATEGORIAS.map((item) => {
                const valor = item === 'Todas' ? '' : item;
                const selecionada = categoriaSelecionada === valor;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, selecionada && styles.activeChip]}
                    onPress={() => setCategoriaSelecionada(valor)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selecionada && styles.activeChipText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={abrirNovaFaq}
            >
              <Text style={styles.primaryButtonText}>+ Nova pergunta</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Perguntas frequentes</Text>

            {loadingFaqs ? (
              <ActivityIndicator
                color="#dc2626"
                size="large"
                style={styles.loader}
              />
            ) : faqs.length > 0 ? (
              faqs.map(renderFaq)
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Nenhuma pergunta encontrada.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionLabel}>Filtrar por status</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipList}
            >
              {STATUS_CHAMADO.map((status) => {
                const selecionado = filtroStatus === status;

                return (
                  <TouchableOpacity
                    key={status}
                    style={[styles.chip, selecionado && styles.activeChip]}
                    onPress={() => setFiltroStatus(status)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selecionado && styles.activeChipText,
                      ]}
                    >
                      {status.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionTitle}>Chamados de suporte</Text>

            {loadingChamados ? (
              <ActivityIndicator
                color="#dc2626"
                size="large"
                style={styles.loader}
              />
            ) : chamadosFiltrados.length > 0 ? (
              chamadosFiltrados.map(renderChamado)
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Nenhum chamado encontrado para este filtro.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalFaqVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalFaqVisivel(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {faqEditando ? 'Editar pergunta' : 'Nova pergunta'}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalFaqVisivel(false)}
                  disabled={salvandoFaq}
                >
                  <Text style={styles.closeText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Categoria</Text>
              <View style={styles.categoryOptions}>
                {CATEGORIAS.filter((item) => item !== 'Todas').map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      categoria === item && styles.activeChip,
                    ]}
                    onPress={() => setCategoria(item)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        categoria === item && styles.activeChipText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Pergunta</Text>
              <TextInput
                style={styles.formInput}
                value={pergunta}
                onChangeText={setPergunta}
                placeholder="Digite a pergunta"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Resposta</Text>
              <TextInput
                style={[styles.formInput, styles.multilineInput]}
                value={resposta}
                onChangeText={setResposta}
                placeholder="Digite a resposta"
                placeholderTextColor="#94a3b8"
                multiline
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setModalFaqVisivel(false)}
                  disabled={salvandoFaq}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    salvandoFaq && styles.disabledButton,
                  ]}
                  onPress={() => void salvarFaq()}
                  disabled={salvandoFaq}
                >
                  <Text style={styles.primaryButtonText}>
                    {salvandoFaq ? 'Salvando...' : 'Salvar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={!!chamadoDetalhado}
        transparent
        animationType="fade"
        onRequestClose={() => setChamadoDetalhado(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Chamado #{chamadoDetalhado?.id_chamado}
                </Text>
                <TouchableOpacity onPress={() => setChamadoDetalhado(null)}>
                  <Text style={styles.closeText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Solicitante</Text>
              <Text style={styles.detailText}>
                {chamadoDetalhado?.usuario?.nome ||
                  `Usuário #${chamadoDetalhado?.id_usuario}`}
              </Text>

              <Text style={styles.inputLabel}>Status</Text>
              <Text style={styles.detailText}>{chamadoDetalhado?.status}</Text>

              <Text style={styles.inputLabel}>Assunto</Text>
              <Text style={styles.detailText}>
                {chamadoDetalhado?.assunto}
              </Text>

              <Text style={styles.inputLabel}>Descrição</Text>
              <Text style={styles.detailText}>
                {chamadoDetalhado?.descricao}
              </Text>

              {!!chamadoDetalhado?.resposta && (
                <>
                  <Text style={styles.inputLabel}>Resposta registrada</Text>
                  <Text style={styles.detailText}>
                    {chamadoDetalhado.resposta}
                  </Text>
                </>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  if (chamadoDetalhado) {
                    const item = chamadoDetalhado;
                    setChamadoDetalhado(null);
                    abrirRespostaChamado(item);
                  }
                }}
              >
                <Text style={styles.primaryButtonText}>
                  Responder / alterar status
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!chamadoSelecionado}
        transparent
        animationType="slide"
        onRequestClose={() => setChamadoSelecionado(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Responder chamado #{chamadoSelecionado?.id_chamado}
                </Text>
                <TouchableOpacity
                  onPress={() => setChamadoSelecionado(null)}
                  disabled={enviandoResposta}
                >
                  <Text style={styles.closeText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Assunto</Text>
              <Text style={styles.detailText}>
                {chamadoSelecionado?.assunto}
              </Text>

              <Text style={styles.inputLabel}>Descrição</Text>
              <Text style={styles.detailText}>
                {chamadoSelecionado?.descricao}
              </Text>

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.categoryOptions}>
                {['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.chip,
                      novoStatus === status && styles.activeChip,
                    ]}
                    onPress={() => setNovoStatus(status)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        novoStatus === status && styles.activeChipText,
                      ]}
                    >
                      {status.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Resposta / orientação</Text>
              <TextInput
                style={[styles.formInput, styles.multilineInput]}
                value={respostaChamado}
                onChangeText={setRespostaChamado}
                placeholder="Digite a resposta ao usuário"
                placeholderTextColor="#94a3b8"
                multiline
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setChamadoSelecionado(null)}
                  disabled={enviandoResposta}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    enviandoResposta && styles.disabledButton,
                  ]}
                  onPress={() => void enviarRespostaChamado()}
                  disabled={enviandoResposta}
                >
                  <Text style={styles.primaryButtonText}>
                    {enviandoResposta ? 'Enviando...' : 'Enviar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  eyebrow: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 5,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 5,
  },
  tabs: {
    flexDirection: 'row',
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#dc2626',
  },
  tabText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#dc2626',
  },
  searchInput: {
    height: 44,
    marginTop: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    color: '#0f172a',
    fontSize: 13,
  },
  sectionLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },
  chipList: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  activeChip: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  chipText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#dc2626',
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  loader: {
    marginVertical: 28,
  },
  faqCard: {
    marginBottom: 9,
    padding: 13,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 9,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  faqArrow: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 3,
    marginRight: 9,
  },
  faqTitleContent: {
    flex: 1,
  },
  faqQuestion: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: 10,
  },
  faqAnswerContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 7,
    backgroundColor: '#f8fafc',
  },
  faqAnswer: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
  },
  faqActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#f0fdf4',
  },
  editButtonText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 22,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  ticketCard: {
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  ticketId: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: '700',
  },
  statusResolved: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusInProgress: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusOpen: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  ticketUser: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  ticketEmail: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  ticketSubject: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 9,
  },
  ticketDescription: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  ticketActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  primarySmallButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  primarySmallButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  modalCard: {
    maxHeight: '90%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalTitle: {
    flex: 1,
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  closeText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  formInput: {
    minHeight: 42,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    color: '#0f172a',
    fontSize: 13,
  },
  multilineInput: {
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 9,
    marginTop: 16,
    marginBottom: 5,
  },
  disabledButton: {
    opacity: 0.55,
  },
  detailText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
  },
});