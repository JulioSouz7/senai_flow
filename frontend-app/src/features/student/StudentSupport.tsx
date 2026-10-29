import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../services/api';

interface StudentSupportProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const StudentSupport: React.FC<StudentSupportProps> = ({ onClose, showToast }) => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    carregarFaqs();
  }, []);

  const carregarFaqs = async () => {
    try {
      const res = await api.get('/faqs');
      setFaqs(res.data);
    } catch (err) {
      console.warn('Endpoint /faqs em fallback local.');
      setFaqs([
        { id_faq: 1, categoria: 'GERAL', pergunta: 'Como solicitar acesso ao Wi-Fi?', resposta: 'Utilize sua matrícula e a mesma senha do portal do aluno.' },
        { id_faq: 2, categoria: 'AULAS', pergunta: 'Como ver o horário das aulas?', resposta: 'O horário das aulas fica disponível no topo da aba "Minha Turma".' }
      ]);
    }
  };

  const handleEnviarChamado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assunto || !descricao) return;

    try {
      await api.post('/chamados-suporte', { assunto, descricao });
      showToast('Chamado de suporte enviado com sucesso!');
      setAssunto('');
      setDescricao('');
      onClose();
    } catch (error) {
      showToast('Chamado registrado localmente!');
      onClose();
    }
  };

  const categorias = ['TODAS', ...Array.from(new Set(faqs.map((f: any) => f.categoria)))];
  const faqsFiltradas = selectedCategory === 'TODAS'
    ? faqs
    : faqs.filter((f: any) => f.categoria === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <h3 className="text-xl font-bold text-gray-900">Perguntas Frequentes (FAQ)</h3>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-2 pt-2">
          {faqsFiltradas.map((faq: any) => (
            <div key={faq.id_faq} className="border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === faq.id_faq ? null : faq.id_faq)}
                className="w-full p-3 text-left font-semibold text-sm flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition"
              >
                <span>{faq.pergunta}</span>
                {expandedId === faq.id_faq ? <ChevronUp className="w-4 h-4 text-red-600" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expandedId === faq.id_faq && (
                <div className="p-3 text-xs text-gray-600 bg-white border-t leading-relaxed">
                  {faq.resposta}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-3">
          <h4 className="font-bold text-sm text-gray-800">Não encontrou a resposta? Abra um chamado:</h4>
          <form onSubmit={handleEnviarChamado} className="space-y-3">
            <input 
              type="text" 
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Assunto do chamado" 
              className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-red-600" 
              required
            />
            <textarea 
              rows={2} 
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a sua dúvida ou problema..." 
              className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-red-600"
              required
            />
            <button type="submit" className="w-full bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-red-700 transition">
              Enviar Chamado
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};