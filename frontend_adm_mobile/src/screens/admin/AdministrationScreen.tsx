import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  go?: (tab: number | string) => void;
}

interface Turma {
  id_turma: number;
  nome: string;
  curso: string;
  carga_horaria_semanal?: number;
  qtd_alunos?: number;
  docentes?: any[];
  docente_turma?: any[];
}

interface HorarioGradeItem {
  dia_semana: number;
  id_horario: number;
}

interface Horario {
  id_horario: number;
  hora_inicio?: string;
  hora_fim?: string;
  turno?: string;
}

interface RankingItem {
  id_sala: number;
  nome_sala?: string;
  total_pontos?: number;
  pontos?: number;
  semestre_letivo?: string;
  posicao?: number;
}

interface VinculoSalaEquipamento {
  id_sala: number;
  quantidade: number;
}

type StatusEquipamento = 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO' | 'INATIVO';

type ModalType =
  | 'turmas'
  | 'formTurma'
  | 'vincular'
  | 'detalhesTurma'
  | 'salas'
  | 'formSala'
  | 'predios'
  | 'ranking'
  | 'equipamentos'
  | 'formEquipamento'
  | 'vinculosEquipamento'
  | null;

const DIAS_SEMANA = [
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
];

const STATUS_EQUIPAMENTO_OPCOES: {
  value: StatusEquipamento;
  label: string;
  bg: string;
  color: string;
}[] = [
  { value: 'DISPONIVEL', label: 'DISPONÍVEL', bg: '#d1fae5', color: '#065f46' },
  { value: 'EM_USO', label: 'EM USO', bg: '#fef3c7', color: '#92400e' },
  { value: 'MANUTENCAO', label: 'MANUTENÇÃO', bg: '#fee2e2', color: '#991b1b' },
  { value: 'INATIVO', label: 'INATIVO', bg: '#f1f5f9', color: '#475569' },
];

function extrairLista(data: any, chave: string): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[chave])) return data[chave];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function mensagemErro(error: any, fallback: string): string {
  return (
    error?.response?.data?.mensagem ||
    error?.response?.data?.message ||
    fallback
  );
}

function extrairVinculosEquipamento(eq: any): VinculoSalaEquipamento[] {
  if (!eq) return [];

  const rawLinks =
    eq.SALA_EQUIPAMENTO ||
    eq.sala_equipamento ||
    eq.SalaEquipamento ||
    eq.salas ||
    eq.Salas ||
    [];

  if (Array.isArray(rawLinks)) {
    return rawLinks
      .map((item: any) => {
        const id_sala =
          item.id_sala ||
          item.SALA_EQUIPAMENTO?.id_sala ||
          item.sala_equipamento?.id_sala ||
          item.SalaEquipamento?.id_sala;

        const quantidade =
          item.quantidade ??
          item.SALA_EQUIPAMENTO?.quantidade ??
          item.sala_equipamento?.quantidade ??
          item.SalaEquipamento?.quantidade ??
          1;

        return id_sala
          ? { id_sala: Number(id_sala), quantidade: Number(quantidade) }
          : null;
      })
      .filter(Boolean) as VinculoSalaEquipamento[];
  }

  if (eq.id_sala) {
    return [
      {
        id_sala: Number(eq.id_sala),
        quantidade: Number(eq.quantidade || 1),
      },
    ];
  }

  return [];
}

export function AdministrationScreen({ notify, go }: Props) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [predios, setPredios] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetando, setResetando] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);

  // Estados de Turmas
  const [searchTurma, setSearchTurma] = useState('');
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [editingTurmaId, setEditingTurmaId] = useState<number | null>(null);
  const [nomeTurma, setNomeTurma] = useState('');
  const [curso, setCurso] = useState('');
  const [cargaHoraria, setCargaHoraria] = useState('20');
  const [qtdAlunos, setQtdAlunos] = useState('20');
  const [docenteId, setDocenteId] = useState('');

  // Estados de Prédios e Salas
  const [nomePredio, setNomePredio] = useState('');
  const [editingSalaId, setEditingSalaId] = useState<number | null>(null);
  const [nomeSala, setNomeSala] = useState('');
  const [idPredioSala, setIdPredioSala] = useState('');
  const [capacidade, setCapacidade] = useState('40');
  const [qrCode, setQrCode] = useState('');
  const [horariosSelecionados, setHorariosSelecionados] = useState<
    HorarioGradeItem[]
  >([]);

  // Estados de Equipamentos
  const [searchEquipText, setSearchEquipText] = useState('');
  const [searchEquipId, setSearchEquipId] = useState('');
  const [nomeEquip, setNomeEquip] = useState('');
  const [nifEquip, setNifEquip] = useState('');
  const [descricaoEquip, setDescricaoEquip] = useState('');
  const [selectedEquip, setSelectedEquip] = useState<any | null>(null);
  const [vinculoSalaId, setVinculoSalaId] = useState<number | null>(null);
  const [vinculoQtd, setVinculoQtd] = useState('1');
  const [submittingLink, setSubmittingLink] = useState(false);

  const carregarDados = useCallback(async (atualizar = false) => {
    if (atualizar) setRefreshing(true);
    else setLoading(true);
    let falhas = 0;

    const buscar = async (rota: string, chave: string) => {
      try {
        const resposta = await api.get(rota);
        return extrairLista(resposta.data, chave);
      } catch (error: any) {
        falhas += 1;
        console.error(`Falha ao buscar ${rota}:`, {
          status: error?.response?.status,
          url: error?.config?.url,
          baseURL: error?.config?.baseURL,
          resposta: error?.response?.data,
          erro: error?.message,
        });
        return [];
      }
    };

    try {
      const [
        listaTurmas,
        listaSalas,
        listaPredios,
        listaHorarios,
        listaEquipamentos,
      ] = await Promise.all([
        buscar('/turmas', 'turmas'),
        buscar('/salas', 'salas'),
        buscar('/predios', 'predios'),
        buscar('/horarios', 'horarios'),
        buscar('/equipamentos', 'equipamentos'),
      ]);

      setTurmas(listaTurmas as Turma[]);
      setSalas(listaSalas);
      setPredios(listaPredios);
      setEquipamentos(listaEquipamentos);
      setHorarios(
        listaHorarios.map((item: any) => ({
          ...item,
          id_horario: Number(item.id_horario ?? item.id),
        })),
      );
      if (atualizar) notify?.(falhas ? 'Administração atualizada parcialmente; algumas informações não foram carregadas.' : 'Dados da administração atualizados.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notify]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  // Mantém o equipamento selecionado sincronizado quando a lista recarrega
  useEffect(() => {
    if (!selectedEquip) return;
    const targetId = selectedEquip.id_equipamento ?? selectedEquip.id;
    const atualizado = equipamentos.find(
      (item) => (item.id_equipamento ?? item.id) === targetId,
    );
    if (atualizado) {
      setSelectedEquip(atualizado);
    }
  }, [equipamentos]);

  // ==================== TURMAS ====================

  const abrirCadastroTurma = (turma?: Turma) => {
    setEditingTurmaId(turma?.id_turma ?? null);
    setNomeTurma(turma?.nome ?? '');
    setCurso(turma?.curso ?? '');
    setCargaHoraria(String(turma?.carga_horaria_semanal ?? 20));
    setQtdAlunos(String(turma?.qtd_alunos ?? 20));
    setModal('formTurma');
  };

  const salvarTurma = async () => {
    const carga = Number(cargaHoraria);
    const quantidade = Number(qtdAlunos);

    if (!nomeTurma.trim() || !curso.trim() || !cargaHoraria.trim()) {
      notify?.('Preencha nome, curso e carga horária.');
      return;
    }

    if (!Number.isFinite(carga) || carga < 1) {
      notify?.('A carga horária deve ser um número maior que zero.');
      return;
    }

    if (!Number.isFinite(quantidade) || quantidade < 0) {
      notify?.('A quantidade de alunos deve ser um número válido.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        nome: nomeTurma.trim(),
        curso: curso.trim(),
        carga_horaria_semanal: carga,
        qtd_alunos: quantidade,
      };

      if (editingTurmaId !== null) {
        await api.put(`/turmas/${editingTurmaId}`, payload);
        notify?.('Turma atualizada com sucesso!');
      } else {
        await api.post('/turmas', payload);
        notify?.('Turma cadastrada com sucesso!');
      }

      setModal('turmas');
      await carregarDados();
    } catch (error: any) {
      notify?.(mensagemErro(error, 'Erro ao salvar turma.'));
    } finally {
      setSaving(false);
    }
  };

  const excluirTurma = (turma: Turma) => {
    Alert.alert('Excluir turma', `Deseja remover ${turma.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/turmas/${turma.id_turma}`);
            notify?.('Turma removida com sucesso!');
            await carregarDados();
          } catch (error: any) {
            notify?.(mensagemErro(error, 'Erro ao excluir turma.'));
          }
        },
      },
    ]);
  };

  const vincularDocente = async () => {
    if (!selectedTurma || !docenteId.trim()) {
      notify?.('Informe o ID do docente.');
      return;
    }

    const id = Number(docenteId);
    if (!Number.isInteger(id) || id < 1) {
      notify?.('Informe um ID de docente válido.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/turmas/vincular-docente', {
        id_turma: selectedTurma.id_turma,
        id_docente: id,
      });
      notify?.('Docente vinculado com sucesso!');
      setModal('turmas');
      await carregarDados();
    } catch (error: any) {
      notify?.(mensagemErro(error, 'Erro ao vincular docente.'));
    } finally {
      setSaving(false);
    }
  };

  // ==================== SALAS E PRÉDIOS ====================

  const abrirCadastroSala = (sala?: any) => {
    const id = sala?.id_sala ?? sala?.id ?? null;
    setEditingSalaId(id);
    setNomeSala(sala?.nome ?? '');
    setIdPredioSala(
      String(sala?.id_predio ?? sala?.predio?.id_predio ?? ''),
    );
    setCapacidade(String(sala?.capacidade ?? 40));
    setQrCode(sala?.qr_code ?? '');

    const gradeExistente: HorarioGradeItem[] = Array.isArray(
      sala?.horarios_disponiveis,
    )
      ? sala.horarios_disponiveis
          .filter((item: any) => item.ativo !== false)
          .map((item: any) => ({
            dia_semana: Number(item.dia_semana),
            id_horario: Number(
              item.id_horario ?? item.horario?.id_horario,
            ),
          }))
          .filter(
            (item: HorarioGradeItem) =>
              item.dia_semana > 0 && item.id_horario > 0,
          )
      : [];

    setHorariosSelecionados(gradeExistente);
    setModal('formSala');
  };

  const alternarHorario = (dia: number, idHorario: number) => {
    setHorariosSelecionados((atuais) => {
      const existe = atuais.some(
        (item) =>
          item.dia_semana === dia && item.id_horario === idHorario,
      );

      return existe
        ? atuais.filter(
            (item) =>
              !(item.dia_semana === dia && item.id_horario === idHorario),
          )
        : [...atuais, { dia_semana: dia, id_horario: idHorario }];
    });
  };

  const salvarSala = async () => {
    const capacidadeNumero = Number(capacidade);
    const idPredioNumero = Number(idPredioSala);

    if (!nomeSala.trim() || !qrCode.trim()) {
      notify?.('Informe o nome da sala e o QR Code.');
      return;
    }

    if (!Number.isInteger(idPredioNumero) || idPredioNumero < 1) {
      notify?.('Informe um ID de prédio válido.');
      return;
    }

    if (!Number.isFinite(capacidadeNumero) || capacidadeNumero < 1) {
      notify?.('Informe uma capacidade válida.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        id_predio: idPredioNumero,
        nome: nomeSala.trim(),
        capacidade: capacidadeNumero,
        qr_code: qrCode.trim(),
        horarios: horariosSelecionados,
      };

      if (editingSalaId !== null) {
        await api.put(`/salas/${editingSalaId}`, payload);
        notify?.('Sala atualizada com sucesso!');
      } else {
        await api.post('/salas', payload);
        notify?.('Sala cadastrada com sucesso!');
      }

      setModal('salas');
      await carregarDados();
    } catch (error: any) {
      notify?.(mensagemErro(error, 'Erro ao salvar sala.'));
    } finally {
      setSaving(false);
    }
  };

  const alterarStatusSala = async (sala: any) => {
    const id = Number(sala.id_sala ?? sala.id);
    if (!id) {
      notify?.('Não foi possível identificar a sala.');
      return;
    }

    const ativa =
      sala.ativo !== false &&
      sala.status !== 'INATIVO' &&
      sala.status !== 'DESATIVADO';
    const acao = ativa ? 'desativar' : 'reativar';

    const tentativas = ativa
      ? [
          () => api.patch(`/salas/${id}/desativar`),
          () => api.patch(`/salas/${id}`, { status: 'INATIVO', ativo: false }),
          () =>
            api.put(`/salas/${id}`, {
              ...sala,
              status: 'INATIVO',
              ativo: false,
            }),
        ]
      : [
          () => api.patch(`/salas/${id}/reativar`),
          () => api.patch(`/salas/${id}/ativar`),
          () => api.patch(`/salas/${id}`, { status: 'ATIVO', ativo: true }),
          () =>
            api.put(`/salas/${id}`, {
              ...sala,
              status: 'ATIVO',
              ativo: true,
            }),
        ];

    for (const tentativa of tentativas) {
      try {
        await tentativa();
        notify?.(`Sala ${ativa ? 'desativada' : 'reativada'} com sucesso!`);
        await carregarDados();
        return;
      } catch {
        // Tenta a próxima forma de atualização compatível com a API.
      }
    }

    notify?.(`Não foi possível ${acao} a sala. Verifique a rota da API.`);
  };

  const cadastrarPredio = async () => {
    if (!nomePredio.trim()) {
      notify?.('Informe o nome do prédio ou bloco.');
      return;
    }

    try {
      setSaving(true);
      try {
        await api.post('/predios', { nome: nomePredio.trim() });
      } catch (error: any) {
        if (error?.response?.status !== 404) throw error;
        await api.post('/predio', { nome: nomePredio.trim() });
      }

      setNomePredio('');
      notify?.('Prédio cadastrado com sucesso!');
      await carregarDados();
    } catch (error: any) {
      notify?.(mensagemErro(error, 'Erro ao cadastrar prédio.'));
    } finally {
      setSaving(false);
    }
  };

  // ==================== EQUIPAMENTOS ====================

  const abrirCadastroEquipamento = () => {
    setNomeEquip('');
    setNifEquip('');
    setDescricaoEquip('');
    setModal('formEquipamento');
  };

  const salvarEquipamento = async () => {
    if (!nomeEquip.trim() || !nifEquip.trim()) {
      notify?.('Nome e NIF do equipamento são obrigatórios.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/equipamentos', {
        nome: nomeEquip.trim(),
        nif: nifEquip.trim(),
        descricao: descricaoEquip.trim() || 'Sem descrição',
        status: 'DISPONIVEL',
      });

      notify?.(`Equipamento '${nomeEquip.trim()}' cadastrado com sucesso!`);
      setNomeEquip('');
      setNifEquip('');
      setDescricaoEquip('');
      setModal('equipamentos');
      await carregarDados();
    } catch (error: any) {
      notify?.(mensagemErro(error, 'Erro ao cadastrar equipamento.'));
    } finally {
      setSaving(false);
    }
  };

  const alterarStatusEquipamento = async (
    equipamento: any,
    novoStatus: StatusEquipamento,
  ) => {
    const id = Number(equipamento.id_equipamento ?? equipamento.id);
    if (!id) {
      notify?.('Não foi possível identificar o equipamento.');
      return;
    }

    if ((equipamento.status || 'DISPONIVEL') === novoStatus) return;

    try {
      try {
        await api.put(`/equipamentos/${id}/status`, { status: novoStatus });
      } catch {
        await api.put(`/equipamentos/${id}`, { status: novoStatus });
      }

      notify?.('Status do equipamento atualizado com sucesso!');
      await carregarDados();
    } catch (error: any) {
      notify?.(
        mensagemErro(error, 'Erro ao atualizar status do equipamento.'),
      );
    }
  };

  const abrirVinculosEquipamento = (equipamento: any) => {
    setSelectedEquip(equipamento);
    setVinculoSalaId(null);
    setVinculoQtd('1');
    setModal('vinculosEquipamento');
  };

  const salvarVinculoEquipamento = async () => {
    if (!selectedEquip || !vinculoSalaId) {
      notify?.('Selecione uma sala para vincular.');
      return;
    }

    const quantidadeNum = Number(vinculoQtd);
    if (!Number.isInteger(quantidadeNum) || quantidadeNum < 1) {
      notify?.('Informe uma quantidade válida (mínimo 1).');
      return;
    }

    const idEquip = Number(
      selectedEquip.id_equipamento ?? selectedEquip.id,
    );
    const payload = {
      id_sala: Number(vinculoSalaId),
      id_equipamento: idEquip,
      quantidade: quantidadeNum,
    };

    try {
      setSubmittingLink(true);
      try {
        await api.post('/equipamentos/vincular-sala', payload);
      } catch {
        try {
          await api.post('/sala-equipamento', payload);
        } catch {
          await api.post(`/equipamentos/${idEquip}/vincular-sala`, payload);
        }
      }

      notify?.('Vínculo atualizado com sucesso!');
      setVinculoSalaId(null);
      setVinculoQtd('1');
      await carregarDados();
    } catch (error: any) {
      notify?.(
        mensagemErro(error, 'Erro ao vincular equipamento à sala.'),
      );
    } finally {
      setSubmittingLink(false);
    }
  };

  const removerVinculoEquipamento = (idSala: number) => {
    if (!selectedEquip || !idSala) return;
    const idEquip = Number(
      selectedEquip.id_equipamento ?? selectedEquip.id,
    );

    Alert.alert(
      'Remover vínculo',
      'Deseja desvincular este equipamento da sala?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmittingLink(true);
              await api.delete(
                `/equipamentos/${idEquip}/salas/${Number(idSala)}`,
              );

              setSelectedEquip((prev: any) => {
                if (!prev) return null;
                return {
                  ...prev,
                  sala_equipamento: Array.isArray(prev.sala_equipamento)
                    ? prev.sala_equipamento.filter(
                        (v: any) => Number(v.id_sala) !== Number(idSala),
                      )
                    : [],
                };
              });

              notify?.('Vínculo com a sala removido com sucesso!');
              await carregarDados();
            } catch (error: any) {
              notify?.(
                mensagemErro(error, 'Erro ao excluir vínculo no servidor.'),
              );
            } finally {
              setSubmittingLink(false);
            }
          },
        },
      ],
    );
  };

  // ==================== RANKING E RESET ====================

  const carregarRanking = async () => {
    const rotas = [
      '/pontuacoes/ranking?semestre_letivo=2026/2',
      '/pontuacao/ranking?semestre_letivo=2026/2',
      '/pontuacoes/ranking',
      '/pontuacao/ranking',
    ];

    for (const rota of rotas) {
      try {
        const resposta = await api.get(rota);
        setRanking(extrairLista(resposta.data, 'ranking') as RankingItem[]);
        return;
      } catch {
        // Tenta as variações de rota usadas pelo frontend desktop.
      }
    }

    setRanking([]);
    notify?.('Não foi possível carregar o ranking. Verifique a rota da API.');
  };

  const abrirRanking = async () => {
    setModal('ranking');
    await carregarRanking();
  };

  const confirmarReset = () => {
    Alert.alert(
      'Confirmar reset semestral',
      'Essa ação pode zerar as pontuações do ciclo atual. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              setResetando(true);
              await api.post('/pontuacao/reset', {
                semestre_letivo: '2026/2',
              });
              notify?.('Reset semestral realizado com sucesso!');
              await carregarRanking();
            } catch (error: any) {
              notify?.(mensagemErro(error, 'Erro ao realizar o reset.'));
            } finally {
              setResetando(false);
            }
          },
        },
      ],
    );
  };

  // ==================== FILTROS E HELPERS ====================

  const turmasFiltradas = turmas.filter((turma) =>
    `${turma.nome ?? ''} ${turma.curso ?? ''} ${turma.id_turma}`
      .toLowerCase()
      .includes(searchTurma.toLowerCase()),
  );

  const equipamentosOrdenados = [...equipamentos].sort((a, b) => {
    if (a.id_equipamento && b.id_equipamento) {
      return Number(a.id_equipamento) - Number(b.id_equipamento);
    }
    return String(a.nif ?? '').localeCompare(String(b.nif ?? ''), undefined, {
      numeric: true,
    });
  });

  const equipamentosFiltrados = equipamentosOrdenados.filter((eq) => {
    const idStr = String(eq.id_equipamento ?? eq.id ?? '');
    const bateId = !searchEquipId.trim() || idStr === searchEquipId.trim();
    const termo = searchEquipText.trim().toLowerCase();
    const bateTexto =
      !termo ||
      String(eq.nome ?? '').toLowerCase().includes(termo) ||
      String(eq.nif ?? '').toLowerCase().includes(termo);
    return bateId && bateTexto;
  });

  const salasOrdenadas = [...salas].sort((a, b) => {
    const idA = Number(a.id_sala ?? a.id ?? 0);
    const idB = Number(b.id_sala ?? b.id ?? 0);
    if (idA && idB) return idA - idB;
    return String(a.nome ?? '').localeCompare(String(b.nome ?? ''), undefined, {
      numeric: true,
    });
  });

  const contarSalasDoPredio = (predio: any) => {
    const id = predio.id_predio ?? predio.id;
    return salas.filter(
      (sala) =>
        String(
          sala.id_predio ??
            sala.predio?.id_predio ??
            sala.predio?.id ??
            '',
        ) === String(id),
    ).length;
  };

  const nomeDoPredio = (sala: any) => {
    const id =
      sala.id_predio ??
      sala.predio?.id_predio ??
      sala.predio?.id;

    const predio = predios.find(
      (item) =>
        String(item.id_predio ?? item.id) === String(id),
    );

    return predio?.nome ?? sala.predio?.nome ?? 'Prédio não identificado';
  };

  const descricaoSalaPorId = (idSala: number) => {
    const encontrada = salas.find(
      (s) => Number(s.id_sala ?? s.id) === Number(idSala),
    );
    return encontrada
      ? `${encontrada.nome} (${nomeDoPredio(encontrada)})`
      : `Sala #${idSala}`;
  };

  const renderBotoesAcao = (
    acoes: { texto: string; onPress: () => void; excluir?: boolean }[],
  ) => (
    <View style={styles.actions}>
      {acoes.map((acao) => (
        <TouchableOpacity key={acao.texto} onPress={acao.onPress}>
          <Text style={acao.excluir ? styles.deleteAction : styles.action}>
            {acao.texto}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const obterTituloModal = () => {
    switch (modal) {
      case 'formTurma':
        return editingTurmaId !== null ? 'Editar turma' : 'Cadastrar turma';
      case 'formSala':
        return editingSalaId !== null ? 'Editar sala' : 'Cadastrar sala';
      case 'vincular':
        return 'Vincular docente';
      case 'detalhesTurma':
        return 'Detalhes da turma';
      case 'salas':
        return 'Salas e ambientes';
      case 'predios':
        return 'Prédios e blocos';
      case 'ranking':
        return 'Ranking de pontuação';
      case 'equipamentos':
        return 'Inventário de equipamentos';
      case 'formEquipamento':
        return 'Cadastrar equipamento';
      case 'vinculosEquipamento':
        return 'Vínculos do equipamento';
      default:
        return 'Turmas e Docentes';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>CONFIGURAÇÃO DO CAMPUS</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={styles.title}>Administração</Text>
        <RefreshButton refreshing={refreshing} onPress={() => void carregarDados(true)} />
      </View>
      <Text style={styles.subtitle}>
        Gerencie turmas, salas, equipamentos, prédios e pontuações.
      </Text>

      <TouchableOpacity style={styles.card} onPress={() => setModal('turmas')}>
        <Text style={styles.cardTitle}>Turmas e Docentes</Text>
        <Text style={styles.cardDescription}>
          {loading ? 'Carregando...' : `${turmas.length} turmas cadastradas`}
        </Text>
        <Text style={styles.cardAction}>Gerenciar turmas</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => setModal('salas')}>
        <Text style={styles.cardTitle}>Salas e ambientes</Text>
        <Text style={styles.cardDescription}>
          {loading ? 'Carregando...' : `${salas.length} salas cadastradas`}
        </Text>
        <Text style={styles.cardAction}>Gerenciar salas</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => setModal('equipamentos')}
      >
        <Text style={styles.cardTitle}>Equipamentos</Text>
        <Text style={styles.cardDescription}>
          {loading
            ? 'Carregando...'
            : `${equipamentos.length} ativos cadastrados`}
        </Text>
        <Text style={styles.cardAction}>Abrir inventário</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => setModal('predios')}>
        <Text style={styles.cardTitle}>Prédios e blocos</Text>
        <Text style={styles.cardDescription}>
          {loading ? 'Carregando...' : `${predios.length} prédios cadastrados`}
        </Text>
        <Text style={styles.cardAction}>Gerenciar prédios</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => void abrirRanking()}>
        <Text style={styles.cardTitle}>Ciclo de pontuação</Text>
        <Text style={styles.cardDescription}>Semestre 2026/2</Text>
        <Text style={styles.cardAction}>Ver ranking e resetar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          go
            ? go(7)
            : notify?.('Aba de usuários e acessos não configurada.')
        }
      >
        <Text style={styles.cardTitle}>Usuários e acessos</Text>
        <Text style={styles.cardDescription}>
          Gerencie os acessos do sistema.
        </Text>
        <Text style={styles.cardAction}>Abrir acessos</Text>
      </TouchableOpacity>

      <Modal
        visible={modal !== null}
        animationType="slide"
        onRequestClose={() => setModal(null)}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>{obterTituloModal()}</Text>
            <TouchableOpacity onPress={() => setModal(null)}>
              <Text style={styles.close}>Fechar</Text>
            </TouchableOpacity>
          </View>

          {/* ==================== MODAL: TURMAS ==================== */}
          {modal === 'turmas' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Buscar por nome, ID ou curso"
                value={searchTurma}
                onChangeText={setSearchTurma}
              />
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => abrirCadastroTurma()}
              >
                <Text style={styles.primaryButtonText}>+ Cadastrar turma</Text>
              </TouchableOpacity>

              {loading ? (
                <ActivityIndicator color="#dc2626" style={styles.loader} />
              ) : (
                <ScrollView>
                  {turmasFiltradas.map((turma) => (
                    <View key={turma.id_turma} style={styles.itemCard}>
                      <Text style={styles.cardTitle}>{turma.nome}</Text>
                      <Text style={styles.cardDescription}>
                        {turma.curso} · {turma.carga_horaria_semanal ?? 0}
                        h/semana · {turma.qtd_alunos ?? 0} alunos
                      </Text>
                      {renderBotoesAcao([
                        {
                          texto: 'Detalhes',
                          onPress: () => {
                            setSelectedTurma(turma);
                            setModal('detalhesTurma');
                          },
                        },
                        {
                          texto: 'Vincular docente',
                          onPress: () => {
                            setSelectedTurma(turma);
                            setDocenteId('');
                            setModal('vincular');
                          },
                        },
                        {
                          texto: 'Editar',
                          onPress: () => abrirCadastroTurma(turma),
                        },
                        {
                          texto: 'Excluir',
                          excluir: true,
                          onPress: () => excluirTurma(turma),
                        },
                      ])}
                    </View>
                  ))}
                  {turmasFiltradas.length === 0 && (
                    <Text style={styles.empty}>Nenhuma turma encontrada.</Text>
                  )}
                </ScrollView>
              )}
            </>
          )}

          {modal === 'formTurma' && (
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                placeholder="Nome da turma"
                value={nomeTurma}
                onChangeText={setNomeTurma}
              />
              <TextInput
                style={styles.input}
                placeholder="Curso"
                value={curso}
                onChangeText={setCurso}
              />
              <TextInput
                style={styles.input}
                placeholder="Carga horária semanal"
                keyboardType="numeric"
                value={cargaHoraria}
                onChangeText={setCargaHoraria}
              />
              <TextInput
                style={styles.input}
                placeholder="Quantidade de alunos"
                keyboardType="numeric"
                value={qtdAlunos}
                onChangeText={setQtdAlunos}
              />
              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabledButton]}
                onPress={() => void salvarTurma()}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Salvando...' : 'Salvar turma'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {modal === 'vincular' && (
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.cardDescription}>
                Turma: {selectedTurma?.nome}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="ID do docente"
                keyboardType="numeric"
                value={docenteId}
                onChangeText={setDocenteId}
              />
              <Text style={styles.helper}>
                A seleção por lista depende de uma rota da API para listar
                docentes.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabledButton]}
                onPress={() => void vincularDocente()}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Vinculando...' : 'Vincular docente'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {modal === 'detalhesTurma' && selectedTurma && (
            <View>
              <Text style={styles.detail}>Turma: {selectedTurma.nome}</Text>
              <Text style={styles.detail}>Curso: {selectedTurma.curso}</Text>
              <Text style={styles.detail}>
                Carga horária: {selectedTurma.carga_horaria_semanal ?? 0}
                h/semana
              </Text>
              <Text style={styles.detail}>
                Alunos: {selectedTurma.qtd_alunos ?? 0}
              </Text>
              <Text style={styles.sectionTitle}>Docentes vinculados</Text>
              {(
                selectedTurma.docentes ??
                selectedTurma.docente_turma?.map(
                  (item: any) => item.docente ?? item,
                ) ??
                []
              ).map((docente: any, index: number) => (
                <Text
                  key={String(docente.id_docente ?? docente.id ?? index)}
                  style={styles.detail}
                >
                  {docente.usuario?.nome ??
                    docente.nome ??
                    docente.nome_docente ??
                    'Docente'}
                </Text>
              ))}
              {!(
                selectedTurma.docentes?.length ||
                selectedTurma.docente_turma?.length
              ) && (
                <Text style={styles.empty}>Nenhum docente vinculado.</Text>
              )}
            </View>
          )}

          {/* ==================== MODAL: SALAS ==================== */}
          {modal === 'salas' && (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => abrirCadastroSala()}
              >
                <Text style={styles.primaryButtonText}>+ Cadastrar sala</Text>
              </TouchableOpacity>
              {loading ? (
                <ActivityIndicator color="#dc2626" style={styles.loader} />
              ) : (
                <ScrollView>
                  {salas.map((sala, index) => {
                    const id = sala.id_sala ?? sala.id ?? index;
                    const ativa =
                      sala.ativo !== false &&
                      sala.status !== 'INATIVO' &&
                      sala.status !== 'DESATIVADO';

                    return (
                      <View key={String(id)} style={styles.itemCard}>
                        <Text style={styles.cardTitle}>
                          {sala.nome ?? `Sala ${id}`}
                        </Text>
                        <Text style={styles.cardDescription}>
                          {nomeDoPredio(sala)} · Capacidade:{' '}
                          {sala.capacidade ?? '—'} ·{' '}
                          {ativa ? 'Ativa' : 'Inativa'}
                        </Text>
                        <Text style={styles.cardDescription}>
                          QR Code: {sala.qr_code ?? '—'}
                        </Text>
                        {renderBotoesAcao([
                          {
                            texto: 'Editar',
                            onPress: () => abrirCadastroSala(sala),
                          },
                          {
                            texto: ativa ? 'Desativar' : 'Reativar',
                            onPress: () => void alterarStatusSala(sala),
                          },
                        ])}
                      </View>
                    );
                  })}
                  {salas.length === 0 && (
                    <Text style={styles.empty}>Nenhuma sala cadastrada.</Text>
                  )}
                </ScrollView>
              )}
            </>
          )}

          {modal === 'formSala' && (
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                placeholder="Nome da sala"
                value={nomeSala}
                onChangeText={setNomeSala}
              />
              <TextInput
                style={styles.input}
                placeholder="ID do prédio"
                keyboardType="numeric"
                value={idPredioSala}
                onChangeText={setIdPredioSala}
              />
              <TextInput
                style={styles.input}
                placeholder="Capacidade"
                keyboardType="numeric"
                value={capacidade}
                onChangeText={setCapacidade}
              />
              <TextInput
                style={styles.input}
                placeholder="QR Code"
                value={qrCode}
                onChangeText={setQrCode}
                autoCapitalize="characters"
              />

              <Text style={styles.sectionTitle}>Horários de funcionamento</Text>
              {horarios.length === 0 ? (
                <Text style={styles.helper}>
                  Não há horários disponíveis. A grade poderá ser configurada
                  quando a API retornar horários em GET /horarios.
                </Text>
              ) : (
                horarios.map((horario) => (
                  <View key={horario.id_horario} style={styles.scheduleCard}>
                    <Text style={styles.cardDescription}>
                      {horario.hora_inicio && horario.hora_fim
                        ? `${horario.hora_inicio} - ${horario.hora_fim}`
                        : (horario.turno ?? `Horário ${horario.id_horario}`)}
                    </Text>
                    <View style={styles.dayRow}>
                      {DIAS_SEMANA.map((dia) => {
                        const marcado = horariosSelecionados.some(
                          (item) =>
                            item.dia_semana === dia.id &&
                            item.id_horario === horario.id_horario,
                        );

                        return (
                          <TouchableOpacity
                            key={dia.id}
                            style={[
                              styles.dayButton,
                              marcado && styles.dayButtonSelected,
                            ]}
                            onPress={() =>
                              alternarHorario(dia.id, horario.id_horario)
                            }
                          >
                            <Text
                              style={[
                                styles.dayButtonText,
                                marcado && styles.dayButtonTextSelected,
                              ]}
                            >
                              {dia.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))
              )}

              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabledButton]}
                onPress={() => void salvarSala()}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Salvando...' : 'Salvar sala'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ==================== MODAL: EQUIPAMENTOS ==================== */}
          {modal === 'equipamentos' && (
            <>
              <View style={styles.filterRow}>
                <TextInput
                  style={[styles.input, styles.filterInputGrow]}
                  placeholder="Buscar por Nome ou NIF"
                  value={searchEquipText}
                  onChangeText={setSearchEquipText}
                />
                <TextInput
                  style={[styles.input, styles.filterInputId]}
                  placeholder="ID"
                  keyboardType="numeric"
                  value={searchEquipId}
                  onChangeText={setSearchEquipId}
                />
              </View>

              {(searchEquipText || searchEquipId) && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setSearchEquipText('');
                    setSearchEquipId('');
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Limpar filtros</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={abrirCadastroEquipamento}
              >
                <Text style={styles.primaryButtonText}>
                  + Cadastrar equipamento
                </Text>
              </TouchableOpacity>

              <Text style={styles.helper}>
                Ativos registrados ({equipamentosFiltrados.length})
              </Text>

              {loading ? (
                <ActivityIndicator color="#dc2626" style={styles.loader} />
              ) : (
                <ScrollView>
                  {equipamentosFiltrados.map((eq, index) => {
                    const idEq = eq.id_equipamento ?? eq.id ?? index;
                    const statusAtual: StatusEquipamento =
                      eq.status || 'DISPONIVEL';
                    const vinculos = extrairVinculosEquipamento(eq);

                    return (
                      <View
                        key={String(idEq || eq.nif)}
                        style={styles.itemCard}
                      >
                        <View style={styles.equipHeaderRow}>
                          <Text style={styles.cardTitle}>
                            #{idEq} · {eq.nome}
                          </Text>
                          <Text style={styles.nifBadge}>NIF: {eq.nif}</Text>
                        </View>

                        {!!eq.descricao && eq.descricao !== 'Sem descrição' && (
                          <Text style={styles.cardDescription}>
                            {eq.descricao}
                          </Text>
                        )}

                        <Text style={styles.cardDescription}>
                          Salas vinculadas:{' '}
                          {vinculos.length > 0
                            ? `${vinculos.length} sala(s)`
                            : 'Nenhuma sala vinculada'}
                        </Text>

                        {/* Seletor rápido de Status */}
                        <View style={styles.statusRow}>
                          {STATUS_EQUIPAMENTO_OPCOES.map((opt) => {
                            const selecionado = statusAtual === opt.value;
                            return (
                              <TouchableOpacity
                                key={opt.value}
                                onPress={() =>
                                  void alterarStatusEquipamento(eq, opt.value)
                                }
                                style={[
                                  styles.statusPill,
                                  selecionado
                                    ? {
                                        backgroundColor: opt.bg,
                                        borderColor: opt.color,
                                      }
                                    : styles.statusPillInactive,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusPillText,
                                    {
                                      color: selecionado
                                        ? opt.color
                                        : '#64748b',
                                    },
                                  ]}
                                >
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {renderBotoesAcao([
                          {
                            texto: `Gerenciar vínculos (${vinculos.length})`,
                            onPress: () => abrirVinculosEquipamento(eq),
                          },
                        ])}
                      </View>
                    );
                  })}
                  {equipamentosFiltrados.length === 0 && (
                    <Text style={styles.empty}>
                      Nenhum equipamento encontrado.
                    </Text>
                  )}
                </ScrollView>
              )}
            </>
          )}

          {modal === 'formEquipamento' && (
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                placeholder="Nome do equipamento (ex: Projetor Epson)"
                value={nomeEquip}
                onChangeText={setNomeEquip}
              />
              <TextInput
                style={styles.input}
                placeholder="NIF / Patrimônio (ex: EQ-0005)"
                value={nifEquip}
                onChangeText={setNifEquip}
                autoCapitalize="characters"
              />
              <TextInput
                style={styles.input}
                placeholder="Descrição (opcional)"
                value={descricaoEquip}
                onChangeText={setDescricaoEquip}
              />

              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabledButton]}
                onPress={() => void salvarEquipamento()}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Salvando...' : 'Adicionar equipamento'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setModal('equipamentos')}
                disabled={saving}
              >
                <Text style={styles.secondaryButtonText}>
                  Voltar ao inventário
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {modal === 'vinculosEquipamento' && selectedEquip && (
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.cardTitle}>{selectedEquip.nome}</Text>
              <Text style={styles.helper}>
                NIF: {selectedEquip.nif} · ID #
                {selectedEquip.id_equipamento ?? selectedEquip.id}
              </Text>

              <Text style={styles.sectionTitle}>Salas ocupadas atualmente</Text>
              {extrairVinculosEquipamento(selectedEquip).length > 0 ? (
                extrairVinculosEquipamento(selectedEquip).map((link) => (
                  <View key={link.id_sala} style={styles.itemCard}>
                    <Text style={styles.cardTitle}>
                      {descricaoSalaPorId(link.id_sala)}
                    </Text>
                    <Text style={styles.cardDescription}>
                      Quantidade vinculada: {link.quantidade} un.
                    </Text>
                    {renderBotoesAcao([
                      {
                        texto: 'Excluir vínculo',
                        excluir: true,
                        onPress: () => removerVinculoEquipamento(link.id_sala),
                      },
                    ])}
                  </View>
                ))
              ) : (
                <Text style={styles.empty}>
                  Este equipamento não está vinculado a nenhuma sala.
                </Text>
              )}

              <Text style={styles.sectionTitle}>
                + Adicionar ou atualizar vínculo de sala
              </Text>
              <Text style={styles.helper}>Toque na sala desejada:</Text>

              <View style={styles.salasChipGrid}>
                {salasOrdenadas.map((sala) => {
                  const idS = Number(sala.id_sala ?? sala.id);
                  const selecionada = vinculoSalaId === idS;
                  return (
                    <TouchableOpacity
                      key={String(idS)}
                      onPress={() => setVinculoSalaId(idS)}
                      style={[
                        styles.salaChip,
                        selecionada && styles.salaChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.salaChipText,
                          selecionada && styles.salaChipTextSelected,
                        ]}
                      >
                        {sala.nome} ({nomeDoPredio(sala)})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Quantidade (ex: 1)"
                keyboardType="numeric"
                value={vinculoQtd}
                onChangeText={setVinculoQtd}
              />

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  submittingLink && styles.disabledButton,
                ]}
                onPress={() => void salvarVinculoEquipamento()}
                disabled={submittingLink}
              >
                <Text style={styles.primaryButtonText}>
                  {submittingLink ? 'Salvando...' : 'Salvar vínculo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setModal('equipamentos')}
                disabled={submittingLink}
              >
                <Text style={styles.secondaryButtonText}>
                  Voltar ao inventário
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ==================== MODAL: PRÉDIOS ==================== */}
          {modal === 'predios' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nome do prédio ou bloco"
                value={nomePredio}
                onChangeText={setNomePredio}
              />
              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabledButton]}
                onPress={() => void cadastrarPredio()}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Salvando...' : 'Cadastrar prédio'}
                </Text>
              </TouchableOpacity>

              {loading ? (
                <ActivityIndicator color="#dc2626" style={styles.loader} />
              ) : (
                <ScrollView>
                  {predios.map((predio, index) => {
                    const id = predio.id_predio ?? predio.id ?? index;
                    return (
                      <View key={String(id)} style={styles.itemCard}>
                        <Text style={styles.cardTitle}>
                          {predio.nome ?? `Prédio ${id}`}
                        </Text>
                        <Text style={styles.cardDescription}>
                          ID: {id} · {contarSalasDoPredio(predio)} salas
                        </Text>
                      </View>
                    );
                  })}
                  {predios.length === 0 && (
                    <Text style={styles.empty}>Nenhum prédio cadastrado.</Text>
                  )}
                </ScrollView>
              )}
            </>
          )}

          {/* ==================== MODAL: RANKING ==================== */}
          {modal === 'ranking' && (
            <>
              <Text style={styles.helper}>Pontuação do semestre 2026/2</Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => void carregarRanking()}
              >
                <Text style={styles.secondaryButtonText}>Atualizar ranking</Text>
              </TouchableOpacity>

              <ScrollView>
                {ranking.map((item, index) => (
                  <View
                    key={String(item.id_sala ?? index)}
                    style={styles.itemCard}
                  >
                    <Text style={styles.cardTitle}>
                      #{item.posicao ?? index + 1} ·{' '}
                      {item.nome_sala ?? `Sala ${item.id_sala}`}
                    </Text>
                    <Text style={styles.cardDescription}>
                      {Number(item.total_pontos ?? item.pontos ?? 0)} pontos
                    </Text>
                  </View>
                ))}
                {ranking.length === 0 && (
                  <Text style={styles.empty}>
                    Nenhum dado de ranking retornado pela API.
                  </Text>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.dangerButton,
                  resetando && styles.disabledButton,
                ]}
                onPress={confirmarReset}
                disabled={resetando}
              >
                <Text style={styles.primaryButtonText}>
                  {resetando ? 'Resetando...' : 'Resetar pontuação'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  eyebrow: { color: '#dc2626', fontSize: 10, fontWeight: '800' },
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { color: '#0f172a', fontSize: 15, fontWeight: '800' },
  cardDescription: { color: '#64748b', fontSize: 12, marginTop: 5 },
  cardAction: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
  },
  modal: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  close: { color: '#dc2626', fontWeight: '700', padding: 8 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#0f172a',
  },
  primaryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: {
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: { color: '#334155', fontWeight: '700' },
  dangerButton: {
    backgroundColor: '#991b1b',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: { opacity: 0.6 },
  loader: { marginTop: 24 },
  itemCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
  },
  action: { color: '#2563eb', fontSize: 12, fontWeight: '700' },
  deleteAction: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  empty: { color: '#64748b', textAlign: 'center', padding: 24 },
  helper: { color: '#64748b', fontSize: 12, marginBottom: 12 },
  detail: { color: '#334155', fontSize: 14, marginBottom: 10 },
  sectionTitle: {
    color: '#0f172a',
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  dayButton: {
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  dayButtonSelected: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  dayButtonText: { color: '#475569', fontSize: 11, fontWeight: '700' },
  dayButtonTextSelected: { color: '#fff' },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterInputGrow: {
    flex: 1,
  },
  filterInputId: {
    width: 78,
  },
  equipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  nifBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusPillInactive: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  salasChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  salaChip: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  salaChipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  salaChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  salaChipTextSelected: {
    color: '#2563eb',
    fontWeight: '700',
  },
});