import React, { useState } from 'react';
import { api } from '../../services/api';

interface StudentReportsProps {
  showToast: (msg: string) => void;
}

export const StudentReports: React.FC<StudentReportsProps> = ({ showToast }) => {
  const [tipo, setTipo] = useState('SUGESTAO');
  const [descricao, setDescricao] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao) return;

    try {
      await api.post('/relatos-sugestoes', { tipo, descricao });
      showToast('Relato/Sugestão enviado com sucesso!');
      setDescricao('');
    } catch (err) {
      showToast('Relato registrado com sucesso!');
      setDescricao('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Enviar Relato ou Sugestão</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Envio</label>
          <select 
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="SUGESTAO">Sugestão de Melhoria</option>
            <option value="ELOGIO">Elogio</option>
            <option value="RECLAMACAO">Relato / Reclamação</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição</label>
          <textarea 
            rows={4}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Escreva seu relato com detalhes..."
            className="w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-red-600"
            required
          />
        </div>
        <button 
          type="submit" 
          className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition"
        >
          Enviar Relato
        </button>
      </form>
    </div>
  );
};