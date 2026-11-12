import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  TextInput 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, getApiError } from '@/services/api';
import { useFeedback } from '@/components/FeedbackProvider';
import { RefreshButton } from '@/components/RefreshButton';

interface FAQItem {
  id_faq?: number;
  pergunta: string;
  resposta: string;
  categoria?: string;
}

interface Chamado {
  id_chamado: number;
  assunto: string;
  descricao: string;
  status: string;
  dt_abertura: string;
  admin_resp?: { usuario?: { nome?: string } } | null;
  resposta?: string | null;
}

export default function SupportScreen() {
  const { notify } = useFeedback();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openIndex, setOpenIndex] = useState<number>(-1);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(true);
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadChamados = async (): Promise<boolean> => {
    try {
      setLoadingChamados(true);
      const response = await api.get('/chamados');
      setChamados(Array.isArray(response.data) ? response.data : []);
      return true;
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
      notify(getApiError(error, 'Não foi possível carregar o histórico de chamados.'), 'error');
      return false;
    } finally {
      setLoadingChamados(false);
    }
  };

  const loadFaqs = async (): Promise<boolean> => {
    try {
      setLoadingFaqs(true);
      const response = await api.get('/faqs');
      const data = response.data;
      setFaqs(Array.isArray(data) ? data : []);
      return true;
    } catch (error) {
      console.error("Erro no fetch de FAQs:", error);
      notify(getApiError(error, 'Não foi possível carregar as FAQs.'), 'error');
      return false;
    } finally {
      setLoadingFaqs(false);
    }
  };

  const refreshSupport = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const [faqsLoaded, ticketsLoaded] = await Promise.all([loadFaqs(), loadChamados()]);
      if (faqsLoaded && ticketsLoaded) notify('FAQs e histórico de chamados atualizados.', 'success');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadFaqs();
    void loadChamados();
  }, []);

  const handleSubmitChamado = async () => {
    if (!assunto.trim() || !descricao.trim()) {
      notify("Preencha o assunto e a descrição do chamado.", 'warning');
      return;
    }

    if (descricao.trim().length < 30) {
      notify("A descrição deve conter pelo menos 30 caracteres.", 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/chamados', {
        assunto: assunto.trim(),
        descricao: descricao.trim(),
      });
      notify("Chamado de suporte aberto com sucesso!", 'success');
      setAssunto('');
      setDescricao("");
      await loadChamados();
    } catch (error) {
      console.error("Erro ao abrir chamado:", error);
      notify(getApiError(error, "Não foi possível abrir o chamado."), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <View style={styles.container}>
      <View style={styles.moduleHeading}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>SUPORTE OPERACIONAL</Text>
            <Text style={styles.pageTitle}>Suporte</Text>
          </View>
          <RefreshButton label="suporte" refreshing={refreshing} onPress={() => void refreshSupport()} />
        </View>
        <Text style={styles.pageSubtitle}>Consulte respostas frequentes, abra chamados e acompanhe o atendimento.</Text>
      </View>

      {/* Painel de FAQs[cite: 8] */}
      <View style={styles.panel}>
        {loadingFaqs ? (
          <View style={styles.centerPad}>
            <ActivityIndicator size="small" color="#e30613" />
            <Text style={styles.loadingText}>Carregando perguntas frequentes...</Text>
          </View>
        ) : faqs.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma pergunta frequente cadastrada.</Text>
        ) : (
          faqs.map((q, i) => {
            const isOpen = openIndex === i;
            return (
              <View key={q.id_faq || i} style={styles.faqItem}>
                <TouchableOpacity 
                  style={styles.faqHeader} 
                  onPress={() => toggleFaq(i)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestion}>{q.pergunta}</Text>
                  <Feather 
                    name={isOpen ? "minus" : "plus"} 
                    size={20} 
                    color="#e30613" 
                  />
                </TouchableOpacity>
                {isOpen && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{q.resposta}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Formulário de chamado */}
      <View style={[styles.panel, styles.formPanel]}>
        <Text style={styles.formTitle}>Abrir chamado de suporte</Text>
        <Text style={styles.formSubtitle}>Descreva o problema para a equipe de atendimento.</Text>
        <Text style={styles.inputLabel}>Assunto</Text>
        <TextInput
          style={styles.subjectInput}
          placeholder="Ex.: Projetor da sala não liga"
          placeholderTextColor="#9ca3af"
          value={assunto}
          onChangeText={setAssunto}
          maxLength={100}
        />
        <Text style={styles.inputLabel}>Descrição</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Descreva o problema (mínimo 30 caracteres)..."
          placeholderTextColor="#9ca3af"
          value={descricao}
          onChangeText={setDescricao}
          multiline={true}
          numberOfLines={5}
          maxLength={255}
          textAlignVertical="top" // Força o texto para o topo no Android
        />

        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
          onPress={handleSubmitChamado}
          disabled={submitting || !assunto.trim() || descricao.trim().length < 30}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Abrir chamado</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.formTitle}>Histórico de chamados</Text>
        {loadingChamados ? (
          <ActivityIndicator size="small" color="#e30613" style={{ marginTop: 16 }} />
        ) : chamados.length === 0 ? (
          <Text style={styles.emptyText}>Você ainda não possui chamados de suporte.</Text>
        ) : chamados.map((chamado) => (
          <View key={chamado.id_chamado} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketSubject}>{chamado.assunto}</Text>
              <Text style={styles.ticketStatus}>{chamado.status.replace(/_/g, ' ')}</Text>
            </View>
            <Text style={styles.ticketDescription}>{chamado.descricao}</Text>
            <Text style={styles.ticketMeta}>
              Aberto em {new Date(chamado.dt_abertura).toLocaleString('pt-BR')}
            </Text>
            <Text style={styles.ticketMeta}>
              Responsável: {chamado.admin_resp?.usuario?.nome || 'Ainda não atribuído'}
            </Text>
            {chamado.resposta ? (
              <Text style={styles.ticketResponse}>Resposta da gestão: {chamado.resposta}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  moduleHeading: {
    marginBottom: 20,
  },
  eyebrow: {
    color: '#e30613',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  pageTitle: {
    marginTop: 4,
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0 },
  pageSubtitle: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 18,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
    overflow: 'hidden',
  },
  centerPad: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  emptyText: {
    padding: 16,
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    paddingRight: 16,
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  formPanel: {
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  subjectInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
    marginBottom: 18,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  typeButtonActive: {
    borderColor: '#e30613',
    backgroundColor: '#fff0f1',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#e30613',
    fontWeight: '700',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
    minHeight: 120,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#e30613',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#fca5a5',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  historySection: {
    marginBottom: 20,
  },
  ticketCard: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  ticketSubject: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  ticketStatus: {
    color: '#9a3412',
    backgroundColor: '#fff7ed',
    overflow: 'hidden',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '700',
  },
  ticketDescription: {
    color: '#374151',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  ticketMeta: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 8,
  },
  ticketResponse: {
    color: '#1f2937',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
});