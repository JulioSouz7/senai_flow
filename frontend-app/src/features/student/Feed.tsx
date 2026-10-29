import React, { useState, useEffect } from 'react';
import { Building2, Map, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';

interface FeedProps {
  usuario: any;
  loading: boolean;
  nomeTurma: string;
  nomeSala: string;
  onOpenMap: () => void;
  onOpenRelato: () => void;
}

export const Feed: React.FC<FeedProps> = ({ 
  usuario, 
  loading, 
  nomeTurma, 
  nomeSala, 
  onOpenMap, 
  onOpenRelato 
}) => {
  const [reservaProxima, setReservaProxima] = useState<any>(null);
  const [comunicados, setComunicados] = useState<any[]>([]);

  useEffect(() => {
    carregarDadosAPI();
  }, [usuario]);

  const carregarDadosAPI = async () => {
    // 1. Busca Reservas Reais no endpoint exato do backend (GET /reservas)
    try {
      const res = await api.get('/reservas');
      const listaReservas = Array.isArray(res.data) ? res.data : [];
      if (listaReservas.length > 0) {
        // Pega a primeira reserva vinculada
        setReservaProxima(listaReservas[0]);
      } else {
        setReservaProxima(null);
      }
    } catch {
      // Ignora silenciosamente sem emitir console.error vermelho
      setReservaProxima(null);
    }

    // 2. Busca Comunicados no endpoint exato do backend (GET /comunicados/minha-turma ou GET /comunicados)
    try {
      const resTurma = await api.get('/comunicados/minha-turma');
      setComunicados(Array.isArray(resTurma.data) ? resTurma.data : []);
    } catch {
      try {
        const resGeral = await api.get('/comunicados');
        setComunicados(Array.isArray(resGeral.data) ? resGeral.data : []);
      } catch {
        setComunicados([]);
      }
    }
  };

  const dataAtualFormatada = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  }).toUpperCase();

  const primeiroNome = usuario?.nome ? usuario.nome.split(' ')[0] : 'Aluno';

  return (
    <div className="space-y-6">
      {/* SAUDAÇÃO E TURMA DO ALUNO */}
      <div>
        <span className="text-xs font-bold tracking-wider text-red-600 uppercase">
          {dataAtualFormatada}
        </span>
        <h2 className="text-3xl font-extrabold text-gray-900 mt-1">
          {loading ? 'Carregando...' : `Olá, ${primeiroNome}`}
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-0.5">
          {nomeTurma} • Sala: {nomeSala}
        </p>
      </div>

      {/* CARD DA PRÓXIMA AULA (ALIMENTADO PELO BANCO DE DADOS) */}
      <div className="bg-[#0F172A] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <span className="text-xs font-bold text-red-400 tracking-wider uppercase">
          SUA PRÓXIMA AULA • {reservaProxima?.horario || reservaProxima?.hora_inicio || '10:15'}
        </span>
        <h3 className="text-2xl font-bold mt-2">
          {reservaProxima?.materia || reservaProxima?.sala?.nome || 'Desenvolvimento Web'}
        </h3>
        <p className="text-sm text-slate-400 mt-0.5">
          {reservaProxima?.docente?.usuario?.nome 
            ? `Prof. ${reservaProxima.docente.usuario.nome}` 
            : 'Prof. Carla Mendes'}
        </p>

        <hr className="border-slate-800 my-4" />

        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800/80 rounded-lg">
              <Building2 className="w-5 h-5 text-slate-300" />
            </div>
            <span className="font-semibold text-slate-200">
              {reservaProxima?.sala?.predio?.nome || 'Bloco D'} • {reservaProxima?.sala?.nome || nomeSala}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {reservaProxima?.sala?.andar ? `${reservaProxima.sala.andar}º pavimento` : '2º pavimento'}
          </span>
        </div>
      </div>

      {/* BOTÕES: MAPA DE RISCOS E ENVIAR RELATO */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onOpenMap}
          className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:border-red-300 transition text-left group"
        >
          <div className="p-2.5 bg-red-50 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition">
          </div>
          <span className="font-bold text-gray-800 text-sm">Mapa de riscos</span>
        </button>

        <button 
          onClick={onOpenRelato}
          className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:border-red-300 transition text-left group"
        >
          <div className="p-2.5 bg-red-50 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-800 text-sm">Enviar relato</span>
        </button>
      </div>

      {/* MURAL OFICIAL DE COMUNICADOS */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Mural oficial</h3>
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
            {comunicados.length} novos
          </span>
        </div>

        <div className="space-y-3">
          {comunicados.length > 0 ? (
            comunicados.map((item) => (
              <div key={item.id_comunicado || item.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                <span className="text-[10px] font-extrabold tracking-wider text-red-600 uppercase block">
                  {item.tipo || 'GERAL'}
                </span>
                <h4 className="font-bold text-gray-900 text-base">{item.titulo}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{item.conteudo || item.descricao}</p>
                <span className="text-[11px] text-gray-400 block pt-1">
                  {item.dt_criacao || 'Recente'}
                </span>
              </div>
            ))
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 text-center text-sm text-gray-500 py-6">
              Nenhum comunicado no momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};