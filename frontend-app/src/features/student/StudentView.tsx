import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  Headphones, 
  Trophy, 
  User, 
  Eye, 
  EyeOff, 
  Megaphone,
  CheckCircle,
  X,
  MessageSquare
} from 'lucide-react';
import { api } from '../../services/api';

import { Feed } from './Feed';
import { StudentSupport } from './StudentSupport';
import { StudentReports } from './StudentReports';

export interface StudentViewProps {
  changeRole?: (role: any) => void;
  onLogout?: () => void;
}

export const StudentView: React.FC<StudentViewProps> = ({ onLogout }) => {
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'minha_turma' | 'comunicados' | 'ranking' | 'relatos'>('minha_turma');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [temNovoComunicado, setTemNovoComunicado] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    carregarUsuario();
  }, []);

  const carregarUsuario = async () => {
    try {
      setLoading(true);
      // Pega os dados salvos pelo Login.tsx no localStorage
      const usuarioSalvo = localStorage.getItem('senai_usuario');
      let dados = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

      // Tenta atualizar perfil dinamicamente caso a API esteja respondendo no endpoint do perfil
      try {
        const res = await api.get('/usuarios/');
        if (res.data) dados = res.data;
      } catch {
        // Ignora silenciosamente se o endpoint /usuarios/me não existir no backend
      }

      setUsuario(dados);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem('senai_token');
    localStorage.removeItem('senai_usuario');
    showToast('Logout realizado com sucesso!');
    
    setTimeout(() => {
      if (onLogout) {
        onLogout();
      }
    }, 1000);
  };

  // Cálculo das Iniciais Reais: 1ª letra do Nome + 1ª letra do Último Sobrenome (ex: Bruno Martins -> BM)
  const obterIniciais = (nomeCompleto?: string) => {
    if (!nomeCompleto) return '..';
    const partes = nomeCompleto.trim().split(' ').filter(Boolean);
    if (partes.length === 1) return partes[0][0].toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const iniciaisNome = obterIniciais(usuario?.nome);

  // Extração hierárquica do nome da Turma vindo da API / Banco de Dados
  const nomeTurma = usuario?.aluno?.turma?.nome || 
                    usuario?.turma?.nome || 
                    usuario?.turma || 
                    usuario?.aluno?.turma_nome || 
                    'Turma não atribuída';

  // Extração hierárquica do nome da Sala vindo da API / Banco de Dados
  const nomeSala = usuario?.aluno?.turma?.sala?.nome || 
                   usuario?.aluno?.sala?.nome || 
                   usuario?.sala?.nome || 
                   usuario?.sala || 
                   'A definir';

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center pb-28 font-sans text-gray-800">

      {/* TOAST TEMPORÁRIO */}
      {toastMessage && (
        <div className="fixed top-5 z-50 bg-[#0F172A] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER FIXO */}
      <header className="w-full max-w-2xl bg-white px-6 py-4 flex justify-between items-center border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 text-white font-extrabold text-xl rounded-xl flex items-center justify-center shadow-md">
            S
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">SENAI Flow</h1>
            <p className="text-xs text-gray-400 font-medium">Almirante Tamandaré</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleLogout}
            className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 transition"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>

          <button 
            onClick={() => {
              setActiveTab('comunicados');
              setTemNovoComunicado(false);
            }}
            className="p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl border border-gray-200 relative transition"
            title="Comunicados"
          >
            <Bell className="w-5 h-5" />
            {temNovoComunicado && (
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full absolute top-2 right-2 border-2 border-white"></span>
            )}
          </button>

          <button 
            onClick={() => setShowAccountModal(true)}
            className="w-10 h-10 bg-red-100 text-red-700 font-bold text-sm rounded-full flex items-center justify-center ml-1 border border-red-200 hover:bg-red-200 transition shadow-sm"
          >
            {loading ? '..' : iniciaisNome}
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="w-full max-w-2xl px-4 mt-6 space-y-6">

        {activeTab === 'minha_turma' && (
          <Feed 
            usuario={usuario} 
            loading={loading}
            nomeTurma={nomeTurma}
            nomeSala={nomeSala}
            onOpenMap={() => setShowMapModal(true)} 
            onOpenRelato={() => setActiveTab('relatos')} 
          />
        )}
        
        {activeTab === 'comunicados' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Comunicados Gerais</h2>
            <p className="text-sm text-gray-500">Mural de avisos institucionais do SENAI.</p>
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Ranking de Salas</h2>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="font-bold text-amber-900">
                  1º - {nomeSala} ({nomeTurma})
                </span>
                <span className="text-sm font-extrabold text-amber-800">2.480 pts</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'relatos' && <StudentReports showToast={showToast} />}

      </main>

      {/* MODAL MAPA DE RISCO */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-bold text-gray-900">Mapa de Risco</h3>
              <button onClick={() => setShowMapModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center gap-4 min-h-[200px]">
              <p className="text-xs text-slate-500 font-semibold">2º Andar - Bloco A</p>
              <div className="grid grid-cols-2 gap-4 w-full text-center">
                <div className="bg-white p-4 border rounded-xl shadow-sm">
                  <span className="text-xs font-bold block">Sala de Aula 201</span>
                  <span className="w-4 h-4 bg-yellow-400 rounded-full inline-block mt-2"></span>
                </div>
                <div className="bg-white p-4 border rounded-xl shadow-sm">
                  <span className="text-xs font-bold block">Sala de Aula 203</span>
                  <span className="w-4 h-4 bg-red-600 rounded-full inline-block mt-2"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MINHA CONTA */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <button onClick={() => setShowAccountModal(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex items-center gap-3 border-b pb-4">
              <div className="w-12 h-12 bg-red-100 text-red-700 font-bold text-lg rounded-full flex items-center justify-center">
                {iniciaisNome}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{usuario?.nome || 'Aluno'}</h3>
                <span className="text-xs bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded uppercase">
                  {usuario?.perfil || 'ALUNO'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-gray-400 block font-medium">E-mail institucional</label>
                <span className="font-semibold text-gray-800">{usuario?.email || '-'}</span>
              </div>

              <div>
                <label className="text-xs text-gray-400 block font-medium">Senha</label>
                <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <span className="font-mono text-xs font-semibold text-gray-800 truncate max-w-[220px]">
                    {showPassword ? (usuario?.senha || 'Protected Hash') : '••••••••••••'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)} 
                    className="text-gray-500 hover:text-red-600 p-1 transition"
                    title={showPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-xs text-gray-400 block font-medium">Turma</label>
                  <span className="font-semibold text-gray-800">{nomeTurma}</span>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block font-medium">Matrícula</label>
                  <span className="font-semibold text-gray-800">
                    {usuario?.aluno?.matricula || usuario?.matricula || '2026101'}
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                setShowAccountModal(false);
                setShowSupportModal(true);
              }}
              className="w-full bg-[#0F172A] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition"
            >
              <Headphones className="w-4 h-4" /> Central de Suporte / FAQ
            </button>
          </div>
        </div>
      )}

      {/* MODAL CENTRAL DE SUPORTE */}
      {showSupportModal && (
        <StudentSupport onClose={() => setShowSupportModal(false)} showToast={showToast} />
      )}

      {/* NAV BAR FLUTUANTE NA MESMA COR DO CONTAINER (BG-[#0F172A]) */}
      <nav className="fixed bottom-4 inset-x-4 max-w-lg mx-auto bg-[#0F172A] text-white rounded-3xl py-3 px-6 flex justify-between items-center shadow-2xl z-40 border border-slate-800">
        <button 
          onClick={() => setActiveTab('minha_turma')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'minha_turma' ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Minha Turma</span>
        </button>

        <button 
          onClick={() => setActiveTab('comunicados')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'comunicados' ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-5 h-5" />
          <span className="text-[10px]">Comunicados</span>
        </button>

        <button 
          onClick={() => setActiveTab('ranking')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'ranking' ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px]">Ranking</span>
        </button>

        <button 
          onClick={() => setActiveTab('relatos')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'relatos' ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Relatos</span>
        </button>
      </nav>

    </div>
  );
};

export default StudentView;