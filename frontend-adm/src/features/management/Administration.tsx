import { useState, useEffect } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { Icon } from "../../components/icons/Icon";
import { RefreshButton } from "../../components/ui/RefreshButton";
import { api } from "../../services/api";
import { TurmasModal } from "./TurmasModal";

interface AdministrationProps {
  notify: (text: string) => void;
  onNavigate?: (tabKey: number | string) => void;
  go?: (n: number | string) => void;
  setActiveTab?: (n: number | string) => void;
  setTab?: (n: number | string) => void;
  changeTab?: (n: number | string) => void;
}

interface RankingItem {
  posicao?: number;
  id_sala: number;
  nome_sala: string;
  predio?: string;
  total_pontos: number;
  total_avaliacoes?: number;
  semestre_letivo: string;
}

interface HorarioGradeItem {
  dia_semana: number;
  id_horario: number;
}

const DIAS_SEMANA = [
  { id: 1, label: "Seg" },
  { id: 2, label: "Ter" },
  { id: 3, label: "Qua" },
  { id: 4, label: "Qui" },
  { id: 5, label: "Sex" },
  { id: 6, label: "Sáb" },
];

export function Administration({ notify, go, onNavigate, setActiveTab, setTab, changeTab }: AdministrationProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState({ salas: 0, equipamentos: 0, usuarios: 0, turmas: 0 });

  // Listas de dados do backend
  const [salas, setSalas] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [predios, setPredios] = useState<any[]>([]);
  const [horariosSistema, setHorariosSistema] = useState<any[]>([]);
  const [rankingList, setRankingList] = useState<RankingItem[]>([]);

  // Aba ativa dentro do Modal de Salas ('salas' | 'predios')
  const [activeSalasTab, setActiveSalasTab] = useState<"salas" | "predios">("salas");
  const [newPredioNome, setNewPredioNome] = useState("");
  const [submittingPredio, setSubmittingPredio] = useState(false);

  // Controle de Modais ('salas' | 'equipamentos' | 'reset' | 'ranking' | 'turmas' | null)
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Modal de Detalhes da Sala Selecionada
  const [selectedSalaDetails, setSelectedSalaDetails] = useState<any | null>(null);

  // Modal Expandido para Gerenciar Múltiplos Vínculos do Equipamento
  const [selectedEquipForModal, setSelectedEquipForModal] = useState<any | null>(null);
  const [newLinkSalaId, setNewLinkSalaId] = useState<string>("");
  const [newLinkQtd, setNewLinkQtd] = useState<string>("1");
  const [submittingLink, setSubmittingLink] = useState(false);
  const [resettingCycle, setResettingCycle] = useState(false);

  // Form State da Sala (Cadastrar e Editar - POST/PUT /salas)
  const [editingSalaId, setEditingSalaId] = useState<number | null>(null);
  const [newSala, setNewSala] = useState({
    id_predio: "1",
    nome: "",
    capacidade: "40",
    qr_code: "",
  });
  const [fotoSala, setFotoSala] = useState<File | null>(null);
  const [selectedHorariosSala, setSelectedHorariosSala] = useState<HorarioGradeItem[]>([]);
  const [showGradeEditor, setShowGradeEditor] = useState(false);

  // Filtros de Salas (Busca por Nome/QR, Bloco/Prédio e ID)
  const [filterSalaText, setFilterSalaText] = useState("");
  const [filterSalaPredio, setFilterSalaPredio] = useState("");
  const [filterSalaId, setFilterSalaId] = useState("");

  // Filtros de Equipamentos (Busca por ID e Nome/NIF)
  const [filterEquipText, setFilterEquipText] = useState("");
  const [filterEquipId, setFilterEquipId] = useState("");

  // Form State para Equipamentos
  const [newEquip, setNewEquip] = useState({ nome: "", nif: "", descricao: "" });

  // Gera a grade completa padrão (Seg a Sáb x todos os horários válidos do sistema)
  const gerarGradeCompleta = (listaHorarios: any[]): HorarioGradeItem[] => {
    const grade: HorarioGradeItem[] = [];
    for (const dia of DIAS_SEMANA) {
      for (const h of listaHorarios) {
        const idH = Number(h.id_horario || h.id);
        if (idH) {
          grade.push({ dia_semana: dia.id, id_horario: idH });
        }
      }
    }
    return grade;
  };

  // Helper para extrair os vínculos da tabela SALA_EQUIPAMENTO
  const getEquipLinks = (eq: any) => {
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

          return id_sala ? { id_sala: Number(id_sala), quantidade: Number(quantidade) } : null;
        })
        .filter(Boolean);
    }

    if (eq.id_sala) {
      return [{ id_sala: Number(eq.id_sala), quantidade: Number(eq.quantidade || 1) }];
    }

    return [];
  };

  // Helper para nome do prédio
  const getPredioNome = (idPredio: any) => {
    if (!idPredio) return "N/A";
    const found = (predios || []).find((p: any) => String(p.id_predio || p.id) === String(idPredio));
    return found?.nome ? found.nome : `Bloco ${idPredio}`;
  };

  // Carrega dados do painel principal garantindo a fusão com salas inativas locais
  const fetchAdminData = async (manual = false): Promise<boolean> => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    try {
      let salasRes;
      try {
        salasRes = await api.get("/salas?status=TODOS");
      } catch {
        try {
          salasRes = await api.get("/salas?incluirInativos=true");
        } catch {
          salasRes = await api.get("/salas");
        }
      }

      const [equipRes, userRes, turmasRes, prediosRes, horariosRes] = await Promise.allSettled([
        api.get("/equipamentos"),
        api.get("/usuarios"),
        api.get("/turmas"),
        api.get("/predios").catch(() => api.get("/predio")),
        api.get("/horarios").catch(() => api.get("/horario")),
      ]);
      const partialFailure = [equipRes, userRes, turmasRes, prediosRes, horariosRes]
        .some((result) => result.status === "rejected");

      const fetchedSalasData = Array.isArray(salasRes.data) ? salasRes.data : [];
      const equipData = equipRes.status === "fulfilled" && Array.isArray(equipRes.value.data) ? equipRes.value.data : [];
      const userData = userRes.status === "fulfilled" && Array.isArray(userRes.value.data) ? userRes.value.data : [];

      let turmasData: any[] = [];
      if (turmasRes.status === "fulfilled") {
        if (Array.isArray(turmasRes.value.data)) {
          turmasData = turmasRes.value.data;
        } else if (Array.isArray(turmasRes.value.data?.turmas)) {
          turmasData = turmasRes.value.data.turmas;
        }
      }

      if (prediosRes.status === "fulfilled" && Array.isArray(prediosRes.value.data)) {
        setPredios(prediosRes.value.data);
      }

      // Consolida os horários existentes no banco (via endpoint /horarios e/ou horarios_disponiveis das salas)
      const mapaHorarios = new Map<number, any>();
      if (horariosRes.status === "fulfilled") {
        const rawH = Array.isArray(horariosRes.value.data)
          ? horariosRes.value.data
          : Array.isArray(horariosRes.value.data?.horarios)
          ? horariosRes.value.data.horarios
          : [];
        rawH.forEach((h: any) => {
          const idH = Number(h.id_horario || h.id);
          if (idH) mapaHorarios.set(idH, { ...h, id_horario: idH });
        });
      }

      fetchedSalasData.forEach((s: any) => {
        if (Array.isArray(s.horarios_disponiveis)) {
          s.horarios_disponiveis.forEach((sh: any) => {
            const hObj = sh.horario || sh;
            const idH = Number(sh.id_horario || hObj?.id_horario);
            if (idH && !mapaHorarios.has(idH)) {
              mapaHorarios.set(idH, {
                id_horario: idH,
                hora_inicio: hObj?.hora_inicio || hObj?.horario_inicio || "",
                hora_fim: hObj?.hora_fim || hObj?.horario_fim || "",
                turno: hObj?.turno || "",
              });
            }
          });
        }
      });

      const listaHorarios =
        mapaHorarios.size > 0
          ? Array.from(mapaHorarios.values()).sort((a, b) => a.id_horario - b.id_horario)
          : [{ id_horario: 1, hora_inicio: "07:30", hora_fim: "09:10", turno: "Manhã" }];

      setHorariosSistema(listaHorarios);

      if (!editingSalaId) {
        setSelectedHorariosSala(gerarGradeCompleta(listaHorarios));
      }

      setSalas((prevSalas) => {
        const mergedSalas = [...fetchedSalasData];

        prevSalas.forEach((prevItem) => {
          const prevId = prevItem.id_sala || prevItem.id;
          const isInactive = prevItem.ativo === false || prevItem.status === "INATIVO" || prevItem.status === "DESATIVADO";

          if (isInactive) {
            const index = mergedSalas.findIndex((m) => (m.id_sala || m.id) === prevId);
            if (index === -1) {
              mergedSalas.push(prevItem);
            } else {
              mergedSalas[index] = {
                ...mergedSalas[index],
                ativo: false,
                status: "INATIVO",
              };
            }
          }
        });

        return mergedSalas;
      });

      setEquipamentos(equipData);

      if (selectedEquipForModal) {
        const targetId = selectedEquipForModal.id_equipamento || selectedEquipForModal.id;
        const updatedEq = equipData.find((item: any) => (item.id_equipamento || item.id) === targetId);
        if (updatedEq) setSelectedEquipForModal(updatedEq);
      }

      setCounts({
        salas: fetchedSalasData.length,
        equipamentos: equipData.length,
        usuarios: userData.length,
        turmas: turmasData.length,
      });
      return !partialFailure;
    } catch (error) {
      console.error("Erro ao carregar dados da administração:", error);
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Busca o ranking de pontuação no backend
  const fetchRankingData = async (): Promise<boolean> => {
    try {
      const res = await api.get("/pontuacoes/ranking?semestre_letivo=2026/2")
        .catch(() => api.get("/pontuacao/ranking?semestre_letivo=2026/2"))
        .catch(() => api.get("/pontuacoes/ranking"))
        .catch(() => api.get("/pontuacao/ranking"))
        .catch(() => api.get("/pontuacoes"))
        .catch(() => api.get("/pontuacao"));

      let fetchedPoints: any[] = [];
      if (res && Array.isArray(res.data)) {
        fetchedPoints = res.data;
      }

      setRankingList(fetchedPoints);
      return true;
    } catch (error) {
      console.error("Erro ao buscar ranking de pontuação:", error);
      setRankingList([]);
      return false;
    }
  };

  const refreshAdminData = async () => {
    if (refreshing) return;
    const results = [await fetchAdminData(true)];
    if (activeModal === "ranking") results.push(await fetchRankingData());
    notify(results.every(Boolean) ? "Dados da administração atualizados." : "Algumas informações não puderam ser atualizadas.");
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Alterna um slot individual (dia_semana + id_horario) na grade da sala
  const toggleHorarioSala = (diaSemana: number, idHorario: number) => {
    setSelectedHorariosSala((prev) => {
      const exists = prev.some(
        (item) => item.dia_semana === diaSemana && item.id_horario === idHorario
      );
      if (exists) {
        return prev.filter(
          (item) => !(item.dia_semana === diaSemana && item.id_horario === idHorario)
        );
      }
      return [...prev, { dia_semana: diaSemana, id_horario: idHorario }];
    });
  };

  // Marca ou desmarca uma coluna inteira (dia da semana)
  const toggleDiaInteiro = (diaSemana: number) => {
    const todosDoDia = horariosSistema.map((h: any) => ({
      dia_semana: diaSemana,
      id_horario: Number(h.id_horario || h.id),
    }));
    const diaCompleto = todosDoDia.every((item) =>
      selectedHorariosSala.some(
        (sel) => sel.dia_semana === item.dia_semana && sel.id_horario === item.id_horario
      )
    );

    if (diaCompleto) {
      setSelectedHorariosSala((prev) => prev.filter((item) => item.dia_semana !== diaSemana));
    } else {
      setSelectedHorariosSala((prev) => [
        ...prev.filter((item) => item.dia_semana !== diaSemana),
        ...todosDoDia,
      ]);
    }
  };

  // Marca ou desmarca uma linha inteira (faixa de horário)
  const toggleHorarioInteiro = (idHorario: number) => {
    const todosDoHorario = DIAS_SEMANA.map((d) => ({
      dia_semana: d.id,
      id_horario: idHorario,
    }));
    const linhaCompleta = todosDoHorario.every((item) =>
      selectedHorariosSala.some(
        (sel) => sel.dia_semana === item.dia_semana && sel.id_horario === item.id_horario
      )
    );

    if (linhaCompleta) {
      setSelectedHorariosSala((prev) => prev.filter((item) => item.id_horario !== idHorario));
    } else {
      setSelectedHorariosSala((prev) => [
        ...prev.filter((item) => item.id_horario !== idHorario),
        ...todosDoHorario,
      ]);
    }
  };

  // Ordenação e Filtragem de Salas
  const sortedSalas = [...(salas || [])].sort((a, b) => {
    const idA = a.id_sala || a.id;
    const idB = b.id_sala || b.id;
    if (idA && idB) return idA - idB;
    return (a.nome || "").localeCompare(b.nome || "", undefined, { numeric: true });
  });

  const filteredSalasDisplay = sortedSalas.filter((sala) => {
    const idSalaStr = String(sala.id_sala || sala.id || "");
    const matchesId = !filterSalaId.trim() || idSalaStr === filterSalaId.trim();

    const idPredioSala =
      sala.id_predio ??
      sala.idPredio ??
      sala.predio_id ??
      sala.predioId ??
      sala.predio?.id_predio ??
      sala.predio?.id ??
      sala.Predio?.id_predio ??
      sala.Predio?.id;

    const matchesPredio = !filterSalaPredio || String(idPredioSala) === String(filterSalaPredio);

    const matchesText =
      !filterSalaText.trim() ||
      (sala.nome || "").toLowerCase().includes(filterSalaText.trim().toLowerCase()) ||
      (sala.qr_code || "").toLowerCase().includes(filterSalaText.trim().toLowerCase()) ||
      (idPredioSala && String(idPredioSala).includes(filterSalaText.trim())) ||
      getPredioNome(idPredioSala).toLowerCase().includes(filterSalaText.trim().toLowerCase());

    return matchesId && matchesPredio && matchesText;
  });

  // Ordenação e Filtragem de Equipamentos
  const sortedEquipamentos = [...(equipamentos || [])].sort((a, b) => {
    if (a.id_equipamento && b.id_equipamento) {
      return a.id_equipamento - b.id_equipamento;
    }
    return (a.nif || "").localeCompare(b.nif || "", undefined, { numeric: true });
  });

  const filteredEquipamentosDisplay = sortedEquipamentos.filter((eq) => {
    const idEqStr = String(eq.id_equipamento || eq.id || "");
    const matchesId = !filterEquipId.trim() || idEqStr === filterEquipId.trim();
    const matchesText =
      !filterEquipText.trim() ||
      (eq.nome || "").toLowerCase().includes(filterEquipText.trim().toLowerCase()) ||
      (eq.nif || "").toLowerCase().includes(filterEquipText.trim().toLowerCase());

    return matchesId && matchesText;
  });

  // Lista Completa do Ranking
  const fullRankingDisplay = sortedSalas
    .map((sala) => {
      const matchPoint = (rankingList || []).find(
        (r) => Number(r.id_sala) === Number(sala.id_sala || sala.id)
      );

      const totalPontos = matchPoint
        ? Number(matchPoint.total_pontos ?? (matchPoint as any).pontos ?? 0)
        : 0;

      return {
        id_sala: sala.id_sala || sala.id,
        nome_sala: sala.nome,
        predio: getPredioNome(sala.id_predio),
        total_pontos: totalPontos,
        semestre_letivo: matchPoint?.semestre_letivo || "2026/2",
      };
    })
    .sort((a, b) => b.total_pontos - a.total_pontos)
    .map((item, index) => ({
      ...item,
      posicao: index + 1,
    }));

  // RESET SEMESTRAL
  const handleConfirmReset = async () => {
    try {
      setResettingCycle(true);
      let success = false;
      let lastErrorMsg = "";

      const payload = { semestre_letivo: "2026/2" };

      const attempts = [
        () => api.post("/pontuacao/reset", payload),
        () => api.post("/pontuacoes/reset", payload),
        () => api.post("/ciclo/reset", payload),
        () => api.post("/ciclos/reset", payload),
        () => api.post("/pontuacao/reset"),
        () => api.post("/pontuacoes/reset"),
        () => api.post("/ciclo/reset"),
        () => api.post("/pontuacao/zerar"),
        () => api.post("/pontuacoes/zerar"),
        () => api.delete("/pontuacao", { data: payload }),
        () => api.delete("/pontuacoes", { data: payload }),
        () => api.delete("/pontuacao"),
        () => api.delete("/pontuacoes"),
        () => api.put("/pontuacao/reset", payload),
        () => api.put("/pontuacoes/reset", payload),
      ];

      for (const attempt of attempts) {
        try {
          await attempt();
          success = true;
          break;
        } catch (err: any) {
          if (err?.response?.data?.mensagem || err?.response?.data?.message) {
            lastErrorMsg = err.response.data.mensagem || err.response.data.message;
          }
        }
      }

      if (success) {
        notify("Reset efetuado com sucesso! Os pontos de todas as salas foram zerados.");
        setActiveModal(null);
        setRankingList([]);
        await fetchRankingData();
        await fetchAdminData();
      } else {
        notify(lastErrorMsg || "Erro ao comunicar com o servidor para realizar o reset.");
      }
    } catch (error: any) {
      console.error("Erro ao executar reset semestral:", error);
      const msg = error?.response?.data?.mensagem || error?.response?.data?.message || "Falha ao executar o reset no banco de dados.";
      notify(msg);
    } finally {
      setResettingCycle(false);
    }
  };

  // CADASTRAR NOVO PRÉDIO
  const handleAddPredio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPredioNome.trim()) {
      return notify("Nome do prédio/bloco é obrigatório.");
    }

    try {
      setSubmittingPredio(true);
      await api.post("/predios", { nome: newPredioNome.trim() })
        .catch(() => api.post("/predio", { nome: newPredioNome.trim() }));

      notify(`Prédio '${newPredioNome}' cadastrado com sucesso!`);
      setNewPredioNome("");
      fetchAdminData();
    } catch (error: any) {
      console.error("Erro ao cadastrar prédio:", error);
      const msg = error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao cadastrar prédio.";
      notify(msg);
    } finally {
      setSubmittingPredio(false);
    }
  };

  // CADASTRAR OU EDITAR SALA (GRAVA A GRADE NA SALA_HORARIO AUTOMATICAMENTE)
  const handleSubmitSala = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSala.nome.trim() || !newSala.qr_code.trim()) {
      return notify("Nome da sala e Código QR são obrigatórios.");
    }

    if (selectedHorariosSala.length === 0) {
      return notify("Selecione pelo menos um dia e horário de funcionamento para a sala.");
    }

    try {
      const formData = new FormData();
      formData.append("id_predio", newSala.id_predio);
      formData.append("nome", newSala.nome.trim());
      formData.append("capacidade", newSala.capacidade);
      formData.append("qr_code", newSala.qr_code.trim());
      formData.append("horarios", JSON.stringify(selectedHorariosSala));

      if (fotoSala) {
        formData.append("foto", fotoSala);
      }

      if (editingSalaId) {
        try {
          await api.put(`/salas/${editingSalaId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch {
          await api.put(`/salas/${editingSalaId}`, {
            id_predio: Number(newSala.id_predio),
            nome: newSala.nome.trim(),
            capacidade: Number(newSala.capacidade),
            qr_code: newSala.qr_code.trim(),
            horarios: selectedHorariosSala,
          });
        }
        notify(`Sala '${newSala.nome}' atualizada com ${selectedHorariosSala.length} horário(s) ativo(s)!`);
      } else {
        await api.post("/salas", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        notify(`Sala '${newSala.nome}' cadastrada com ${selectedHorariosSala.length} horário(s) ativo(s)!`);
      }

      setEditingSalaId(null);
      setNewSala({ id_predio: predios.length > 0 ? String(predios[0].id_predio || predios[0].id) : "1", nome: "", capacidade: "40", qr_code: "" });
      setFotoSala(null);
      setSelectedHorariosSala(gerarGradeCompleta(horariosSistema));
      setShowGradeEditor(false);
      fetchAdminData();
    } catch (error: any) {
      console.error("Erro ao salvar sala:", error);
      const msg = error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao salvar sala.";
      notify(msg);
    }
  };

  const handleStartEditSala = (sala: any) => {
    const id = sala.id_sala || sala.id;
    setEditingSalaId(id);
    setNewSala({
      id_predio: String(sala.id_predio || "1"),
      nome: sala.nome || "",
      capacidade: String(sala.capacidade || "40"),
      qr_code: sala.qr_code || "",
    });

    const existentes: HorarioGradeItem[] = Array.isArray(sala.horarios_disponiveis)
      ? sala.horarios_disponiveis
          .filter((sh: any) => sh.ativo !== false)
          .map((sh: any) => ({
            dia_semana: Number(sh.dia_semana),
            id_horario: Number(sh.id_horario || sh.horario?.id_horario),
          }))
          .filter((item: HorarioGradeItem) => item.dia_semana && item.id_horario)
      : [];

    setSelectedHorariosSala(
      existentes.length > 0 ? existentes : gerarGradeCompleta(horariosSistema)
    );
    setShowGradeEditor(false);
    setSelectedSalaDetails(null);
    setActiveSalasTab("salas");
  };

  const handleCancelEditSala = () => {
    setEditingSalaId(null);
    setNewSala({ id_predio: predios.length > 0 ? String(predios[0].id_predio || predios[0].id) : "1", nome: "", capacidade: "40", qr_code: "" });
    setFotoSala(null);
    setSelectedHorariosSala(gerarGradeCompleta(horariosSistema));
    setShowGradeEditor(false);
  };

  // DESATIVAR E REATIVAR SALA
  const handleToggleSalaStatus = async (sala: any) => {
    const isCurrentlyActive = sala.ativo !== false && sala.status !== "INATIVO" && sala.status !== "DESATIVADO";
    const id = sala.id_sala || sala.id;
    const actionName = isCurrentlyActive ? "desativar" : "reativar";

    const updatedStatus = !isCurrentlyActive;
    setSalas((prevSalas) =>
      (prevSalas || []).map((s) => {
        const sId = s.id_sala || s.id;
        if (sId === id) {
          return {
            ...s,
            ativo: updatedStatus,
            status: updatedStatus ? "ATIVO" : "INATIVO",
          };
        }
        return s;
      })
    );

    if (selectedSalaDetails && (selectedSalaDetails.id_sala || selectedSalaDetails.id) === id) {
      setSelectedSalaDetails((prev: any) => ({
        ...prev,
        ativo: updatedStatus,
        status: updatedStatus ? "ATIVO" : "INATIVO",
      }));
    }

    try {
      let success = false;

      if (isCurrentlyActive) {
        const attempts = [
          () => api.patch(`/salas/${id}/desativar`),
          () => api.patch(`/salas/desativar/${id}`),
          () => api.patch(`/salas/${id}`, { status: "INATIVO", ativo: false }),
          () => api.put(`/salas/${id}`, { ...sala, status: "INATIVO", ativo: false }),
        ];

        for (const attempt of attempts) {
          try {
            await attempt();
            success = true;
            break;
          } catch {}
        }
      } else {
        const attempts = [
          () => api.patch(`/salas/${id}/reativar`),
          () => api.patch(`/salas/${id}/ativar`),
          () => api.patch(`/salas/reativar/${id}`),
          () => api.patch(`/salas/ativar/${id}`),
          () => api.patch(`/salas/${id}`, { status: "ATIVO", ativo: true }),
          () => api.put(`/salas/${id}`, { ...sala, status: "ATIVO", ativo: true }),
        ];

        for (const attempt of attempts) {
          try {
            await attempt();
            success = true;
            break;
          } catch {}
        }
      }

      if (success) {
        notify(`Sala '${sala.nome}' ${isCurrentlyActive ? "desativada" : "reativada"} com sucesso!`);
      } else {
        notify(`Alteração visual aplicada. (A API não retornou confirmação para ${actionName}).`);
      }
    } catch (error: any) {
      console.error(`Erro ao ${actionName} sala:`, error);
      notify(`Erro ao ${actionName} sala no servidor.`);
    }
  };

  // SUBMISSÃO DE EQUIPAMENTO
  const handleAddEquipamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquip.nome.trim() || !newEquip.nif.trim()) {
      return notify("Nome e NIF do equipamento são obrigatórios.");
    }

    try {
      await api.post("/equipamentos", {
        nome: newEquip.nome.trim(),
        nif: newEquip.nif.trim(),
        descricao: newEquip.descricao.trim() || "Sem descrição",
        status: "DISPONIVEL",
      });

      notify(`Equipamento '${newEquip.nome}' cadastrado com sucesso!`);
      setNewEquip({ nome: "", nif: "", descricao: "" });
      fetchAdminData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Erro ao cadastrar equipamento.";
      notify(msg);
    }
  };

  // STATUS DE EQUIPAMENTO
  const handleUpdateEquipStatus = async (id: number, newStatus: string) => {
    try {
      try {
        await api.put(`/equipamentos/${id}/status`, { status: newStatus });
      } catch {
        await api.put(`/equipamentos/${id}`, { status: newStatus });
      }

      notify("Status do equipamento atualizado com sucesso!");
      fetchAdminData();
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      const msg = error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao atualizar status do equipamento.";
      notify(msg);
    }
  };

  // VINCULAR SALA AO EQUIPAMENTO
  const handleAddOrUpdateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipForModal || !newLinkSalaId) {
      return notify("Selecione uma sala.");
    }

    const idEquip = Number(selectedEquipForModal.id_equipamento || selectedEquipForModal.id);
    const payload = {
      id_sala: Number(newLinkSalaId),
      id_equipamento: idEquip,
      quantidade: Number(newLinkQtd) || 1,
    };

    try {
      setSubmittingLink(true);

      try {
        await api.post("/equipamentos/vincular-sala", payload);
      } catch {
        try {
          await api.post("/sala-equipamento", payload);
        } catch {
          await api.post(`/equipamentos/${idEquip}/vincular-sala`, payload);
        }
      }

      notify("Vínculo atualizado com sucesso!");
      setNewLinkSalaId("");
      setNewLinkQtd("1");
      fetchAdminData();
    } catch (error: any) {
      console.error("Erro ao vincular equipamento:", error);
      const msg = error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao vincular equipamento à sala.";
      notify(msg);
    } finally {
      setSubmittingLink(false);
    }
  };

  // DESVINCULAR EQUIPAMENTO DE SALA
  const handleRemoveLink = async (idSala: number) => {
    if (!selectedEquipForModal || !idSala) return;

    const idEquip = Number(selectedEquipForModal.id_equipamento || selectedEquipForModal.id);

    try {
      setSubmittingLink(true);
      await api.delete(`/equipamentos/${idEquip}/salas/${Number(idSala)}`);

      setSelectedEquipForModal((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          sala_equipamento: Array.isArray(prev.sala_equipamento)
            ? prev.sala_equipamento.filter((v: any) => Number(v.id_sala) !== Number(idSala))
            : [],
        };
      });

      notify("Vínculo com a sala removido com sucesso!");
      await fetchAdminData();
    } catch (error: any) {
      console.error("Erro ao remover vínculo:", error);
      const msg = error?.response?.data?.message || "Erro ao excluir vínculo no servidor.";
      notify(msg);
    } finally {
      setSubmittingLink(false);
    }
  };

  // Handlers dos Cards Principais
  const handleCardButtonClick = (key: string) => {
    if (key === "Editar estrutura") {
      setActiveModal("salas");
      setActiveSalasTab("salas");
    } else if (key === "Abrir inventário") {
      setActiveModal("equipamentos");
    } else if (key === "Gerenciar turmas") {
      setActiveModal("turmas");
    } else if (key === "Gerenciar acessos") {
      const navFunction = go || onNavigate || setActiveTab || setTab || changeTab;
      if (navFunction) {
        navFunction(7);
      } else {
        notify("Redirecionando para Controle de Acessos...");
      }
    } else if (key === "Ver ranking") {
      fetchRankingData();
      setActiveModal("ranking");
    }
  };

  const cards = [
    ["building", "Blocos e salas", loading ? "Carregando..." : `${counts.salas} salas cadastradas`, "Editar estrutura"],
    ["box", "Equipamentos", loading ? "Carregando..." : `${counts.equipamentos} ativos vinculados`, "Abrir inventário"],
    ["users", "Turmas e Docentes", loading ? "Carregando..." : `${counts.turmas} turmas cadastradas`, "Gerenciar turmas"],
    ["users", "Usuários e acessos", loading ? "Carregando..." : `${counts.usuarios.toLocaleString("pt-BR")} acessos ativos`, "Gerenciar acessos"],
    ["trophy", "Ciclo de pontuação", "Semestre 2026/2", "Ver ranking"],
  ];

  return (
    <>
      <PageTitle
        eyebrow="CONFIGURAÇÃO DO CAMPUS"
        title="Administração"
        text="Gerencie estruturas, acessos e ciclos letivos."
        action={<RefreshButton refreshing={refreshing} onRefresh={() => void refreshAdminData()} />}
      />

      {/* Grid com os 5 cards */}
      <div
        className="admin-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {cards.map((x) => (
          <article className="panel admin-card" key={x[1]} style={{ margin: 0, height: "100%" }}>
            <span>
              <Icon name={x[0]} />
            </span>
            <h2>{x[1]}</h2>
            <p>{x[2]}</p>
            <button className="secondary-btn" onClick={() => handleCardButtonClick(x[3])}>
              {x[3]}
            </button>
          </article>
        ))}
      </div>

      {/* SEÇÃO DE ENCERRAMENTO E RESET DE PONTUAÇÃO */}
      <article className="danger-zone">
        <div>
          <b>Encerramento semestral</b>
          <p>O reset arquiva o ranking atual e zera o saldo de pontuação de todas as turmas e salas.</p>
        </div>
        <button onClick={() => setActiveModal("reset")}>Programar reset semestral</button>
      </article>

      {/* MODAL: GESTÃO DE TURMAS E DOCENTES */}
      <TurmasModal
        isOpen={activeModal === "turmas"}
        onClose={() => {
          setActiveModal(null);
          fetchAdminData();
        }}
        notify={notify}
      />

      {/* MODAL: RANKING DE PONTUAÇÃO POR SALA */}
      {activeModal === "ranking" && (
        <div style={modalOverlayStyle}>
          <div className="panel" style={{ ...modalContentStyle, maxWidth: "620px", width: "95%", padding: "20px 24px", boxSizing: "border-box" }}>
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={{ margin: 0, fontSize: "16px", color: "#0f172a", fontWeight: 700 }}>
                  Ranking de Pontuação por Sala
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "12px" }}>
                  Pontuação acumulada no ciclo letivo
                </p>
              </div>
              <button style={closeBtnStyle} onClick={() => setActiveModal(null)}>
                ✕
              </button>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", marginTop: "14px", overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "50px 1fr 90px 90px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  color: "#64748b",
                  padding: "10px 14px",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                <div>POS.</div>
                <div>SALA / AMBIENTE</div>
                <div>SEMESTRE</div>
                <div style={{ textAlign: "right" }}>PONTOS</div>
              </div>

              <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                {fullRankingDisplay.length > 0 ? (
                  fullRankingDisplay.map((item) => (
                    <div
                      key={item.id_sala}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "50px 1fr 90px 90px",
                        padding: "12px 14px",
                        borderBottom: "1px solid #f1f5f9",
                        alignItems: "center",
                        fontSize: "13px",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: item.posicao === 1 ? "#d97706" : "#64748b" }}>
                        #{item.posicao}
                      </div>
                      <div style={{ fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.nome_sala}
                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 400, marginLeft: "4px" }}>
                          ({item.predio})
                        </span>
                      </div>
                      <div style={{ color: "#64748b" }}>
                        {item.semestre_letivo}
                      </div>
                      <div style={{ textAlign: "right", fontWeight: 700, color: item.total_pontos > 0 ? "#16a34a" : "#94a3b8" }}>
                        {item.total_pontos} pts
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ padding: "20px", textAlign: "center", color: "#94a3b8", margin: 0 }}>
                    Nenhuma sala cadastrada.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRINCIPAL: GESTÃO DE SALAS E PRÉDIOS */}
      {activeModal === "salas" && (
        <div style={modalOverlayStyle}>
          <div className="panel" style={{ ...modalContentStyle, maxWidth: "660px" }}>
            <div style={modalHeaderStyle}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>Gestão de Salas e Ambientes</h2>
              <button style={closeBtnStyle} onClick={() => { setActiveModal(null); handleCancelEditSala(); }}>
                ✕
              </button>
            </div>

            {/* TABS DE NAVEGAÇÃO: SALAS E AMBIENTES / PRÉDIOS E BLOCOS */}
            <div style={{ display: "flex", gap: "12px", borderBottom: "2px solid #e2e8f0", marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => setActiveSalasTab("salas")}
                style={{
                  padding: "8px 12px",
                  border: "none",
                  background: "none",
                  borderBottom: activeSalasTab === "salas" ? "2px solid #dc2626" : "2px solid transparent",
                  color: activeSalasTab === "salas" ? "#dc2626" : "#64748b",
                  fontWeight: activeSalasTab === "salas" ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                  marginBottom: "-2px"
                }}
              >
                Salas e Ambientes
              </button>
              <button
                type="button"
                onClick={() => setActiveSalasTab("predios")}
                style={{
                  padding: "8px 12px",
                  border: "none",
                  background: "none",
                  borderBottom: activeSalasTab === "predios" ? "2px solid #dc2626" : "2px solid transparent",
                  color: activeSalasTab === "predios" ? "#dc2626" : "#64748b",
                  fontWeight: activeSalasTab === "predios" ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                  marginBottom: "-2px"
                }}
              >
                Prédios e Blocos ({(predios || []).length})
              </button>
            </div>

            {/* ABA 1: GERENCIAMENTO DE SALAS */}
            {activeSalasTab === "salas" && (
              <>
                {/* FORMULÁRIO ORGANIZADO DE SALAS */}
                <form onSubmit={handleSubmitSala} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px", background: editingSalaId ? "#f8fafc" : "transparent", padding: editingSalaId ? "12px" : "0", borderRadius: "8px", border: editingSalaId ? "1px solid #cbd5e1" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ fontSize: "13px", color: editingSalaId ? "#2563eb" : "#1e293b" }}>
                      {editingSalaId ? `Editar Sala (ID #${editingSalaId}):` : "Cadastrar Nova Sala:"}
                    </b>
                    {editingSalaId && (
                      <button
                        type="button"
                        onClick={handleCancelEditSala}
                        style={{ background: "none", border: "none", color: "#e11d48", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                      >
                        Cancelar Edição
                      </button>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>Nome da Sala / Laboratório</label>
                    <input
                      placeholder="Ex: Laboratório de BioProcessos"
                      value={newSala.nome}
                      onChange={(e) => setNewSala({ ...newSala, nome: e.target.value })}
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>Prédio / Bloco</label>
                      {(predios || []).length > 0 ? (
                        <select
                          value={newSala.id_predio}
                          onChange={(e) => setNewSala({ ...newSala, id_predio: e.target.value })}
                          style={inputStyle}
                          required
                        >
                          {(predios || []).map((p: any) => {
                            const idP = p.id_predio || p.id;
                            return (
                              <option key={idP} value={idP}>
                                {p.nome || `Prédio #${idP}`}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <input
                          type="number"
                          value={newSala.id_predio}
                          onChange={(e) => setNewSala({ ...newSala, id_predio: e.target.value })}
                          style={inputStyle}
                          required
                        />
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Capacidade</label>
                      <input
                        type="number"
                        value={newSala.capacidade}
                        onChange={(e) => setNewSala({ ...newSala, capacidade: e.target.value })}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Código QR Code</label>
                      <input
                        placeholder="Ex: QR_LAB_01"
                        value={newSala.qr_code}
                        onChange={(e) => setNewSala({ ...newSala, qr_code: e.target.value })}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  {/* GRADE DE FUNCIONAMENTO DA SALA (CSS GRID BLINDADO CONTRA CSS GLOBAL DE TABLE) */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      width: "100%",
                      boxSizing: "border-box",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                      <div style={{ fontSize: "12px", color: "#334155" }}>
                        <b>Funcionamento:</b>{" "}
                        <span style={{ color: selectedHorariosSala.length > 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                          {selectedHorariosSala.length === horariosSistema.length * DIAS_SEMANA.length
                            ? `Grade completa (${selectedHorariosSala.length} horários)`
                            : `${selectedHorariosSala.length} de ${horariosSistema.length * DIAS_SEMANA.length} horários ativos`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowGradeEditor((prev) => !prev)}
                        style={{
                          background: "#fff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          color: "#2563eb",
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "4px 10px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {showGradeEditor ? "Ocultar grade" : "Personalizar horários"}
                      </button>
                    </div>

                    {showGradeEditor && (
                      <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "8px" }}>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            Clique no dia ou horário para marcar/desmarcar a linha inteira
                          </span>
                          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => setSelectedHorariosSala(gerarGradeCompleta(horariosSistema))}
                              style={{ background: "none", border: "none", color: "#2563eb", fontSize: "11px", fontWeight: 600, cursor: "pointer", padding: 0 }}
                            >
                              Marcar todos
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedHorariosSala([])}
                              style={{ background: "none", border: "none", color: "#64748b", fontSize: "11px", fontWeight: 600, cursor: "pointer", padding: 0 }}
                            >
                              Limpar
                            </button>
                          </div>
                        </div>

                        {/* Cabeçalho */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "92px repeat(6, minmax(0, 1fr))",
                            alignItems: "center",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#475569",
                            borderBottom: "1px solid #e2e8f0",
                            paddingBottom: "6px",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ textAlign: "left" }}>HORÁRIO</div>
                          {DIAS_SEMANA.map((dia) => (
                            <div
                              key={dia.id}
                              onClick={() => toggleDiaInteiro(dia.id)}
                              title={`Marcar/desmarcar ${dia.label}`}
                              style={{ cursor: "pointer", userSelect: "none" }}
                            >
                              {dia.label.toUpperCase()}
                            </div>
                          ))}
                        </div>

                        {/* Linhas */}
                        <div>
                          {horariosSistema.map((h: any) => {
                            const idH = Number(h.id_horario || h.id);
                            const inicio = (h.hora_inicio || h.horario_inicio || "").slice(0, 5);
                            const fim = (h.hora_fim || h.horario_fim || "").slice(0, 5);
                            const labelHorario = inicio && fim ? `${inicio} - ${fim}` : `Turno #${idH}`;

                            return (
                              <div
                                key={idH}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "92px repeat(6, minmax(0, 1fr))",
                                  alignItems: "center",
                                  borderBottom: "1px solid #f1f5f9",
                                  padding: "7px 0",
                                  fontSize: "11px",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  onClick={() => toggleHorarioInteiro(idH)}
                                  title="Marcar/desmarcar este horário"
                                  style={{
                                    textAlign: "left",
                                    color: "#334155",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    userSelect: "none",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {labelHorario}
                                </div>

                                {DIAS_SEMANA.map((dia) => {
                                  const checked = selectedHorariosSala.some(
                                    (item) => item.dia_semana === dia.id && item.id_horario === idH
                                  );
                                  return (
                                    <div key={dia.id} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleHorarioSala(dia.id, idH)}
                                        style={{
                                          width: "15px",
                                          height: "15px",
                                          minWidth: "15px",
                                          padding: 0,
                                          margin: 0,
                                          cursor: "pointer",
                                          accentColor: "#dc2626",
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label style={labelStyle}>Foto da Sala (Anexo)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFotoSala(e.target.files ? e.target.files[0] : null)}
                        style={{ ...inputStyle, padding: "4px" }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="primary-btn"
                      style={{ height: "36px", padding: "0 16px", whiteSpace: "nowrap", backgroundColor: editingSalaId ? "#2563eb" : undefined, borderColor: editingSalaId ? "#2563eb" : undefined }}
                    >
                      {editingSalaId ? "Atualizar" : "Cadastrar Sala"}
                    </button>
                  </div>
                </form>

                {/* BARRA DE FILTROS SALAS (COM FILTRO POR BLOCO/PRÉDIO) */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "14px", background: "#f8fafc", padding: "10px", borderRadius: "8px", alignItems: "center", border: "1px solid #e2e8f0" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={labelStyle}>Filtrar por Nome / QR</label>
                    <input
                      placeholder="Pesquisar sala..."
                      value={filterSalaText}
                      onChange={(e) => setFilterSalaText(e.target.value)}
                      style={{ ...inputStyle, backgroundColor: "#fff" }}
                    />
                  </div>

                  <div style={{ width: "165px" }}>
                    <label style={labelStyle}>Prédio / Bloco</label>
                    <select
                      value={filterSalaPredio}
                      onChange={(e) => setFilterSalaPredio(e.target.value)}
                      style={{ ...inputStyle, backgroundColor: "#fff", cursor: "pointer" }}
                    >
                      <option value="">Todos os blocos</option>
                      {(predios || []).map((p: any) => {
                        const idP = p.id_predio || p.id;
                        return (
                          <option key={idP} value={idP}>
                            {p.nome || `Prédio #${idP}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div style={{ width: "85px" }}>
                    <label style={labelStyle}>ID</label>
                    <input
                      type="number"
                      placeholder="Ex: 1"
                      value={filterSalaId}
                      onChange={(e) => setFilterSalaId(e.target.value)}
                      style={{ ...inputStyle, backgroundColor: "#fff" }}
                    />
                  </div>

                  {(filterSalaText || filterSalaId || filterSalaPredio) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterSalaText("");
                        setFilterSalaId("");
                        setFilterSalaPredio("");
                      }}
                      style={{ marginTop: "18px", padding: "8px 12px", background: "#cbd5e1", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* CABEÇALHO */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <b style={{ fontSize: "13px", color: "#1e293b" }}>
                    Salas Cadastradas ({filteredSalasDisplay.length}):
                  </b>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    💡 Clique em uma linha para ver detalhes e ações
                  </span>
                </div>

                {/* LISTA DE SALAS (CSS GRID SEM ESTOURO HORIZONTAL) */}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "55px 1fr 110px 80px",
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      color: "#64748b",
                      padding: "8px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    <div>ID</div>
                    <div>AMBIENTE</div>
                    <div>PRÉDIO</div>
                    <div style={{ textAlign: "center" }}>STATUS</div>
                  </div>

                  <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                    {filteredSalasDisplay.length > 0 ? (
                      filteredSalasDisplay.map((s) => {
                        const idSala = s.id_sala || s.id;
                        const isActive = s.ativo !== false && s.status !== "INATIVO" && s.status !== "DESATIVADO";

                        return (
                          <div
                            key={idSala}
                            onClick={() => setSelectedSalaDetails(s)}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "55px 1fr 110px 80px",
                              alignItems: "center",
                              padding: "10px 12px",
                              borderBottom: "1px solid #f1f5f9",
                              fontSize: "13px",
                              opacity: isActive ? 1 : 0.65,
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ fontWeight: "bold", color: "#334155" }}>#{idSala}</div>
                            <div style={{ fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px" }}>
                              {s.nome}
                            </div>
                            <div style={{ color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {getPredioNome(s.id_predio)}
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  backgroundColor: isActive ? "#d1fae5" : "#fee2e2",
                                  color: isActive ? "#065f46" : "#991b1b",
                                }}
                              >
                                {isActive ? "Ativa" : "Inativa"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                        Nenhuma sala encontrada.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ABA 2: GERENCIAMENTO DE PRÉDIOS E BLOCOS */}
            {activeSalasTab === "predios" && (
              <div>
                <form onSubmit={handleAddPredio} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                  <b style={{ fontSize: "13px", color: "#1e293b" }}>Cadastrar Novo Prédio / Bloco:</b>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      placeholder="Ex: Bloco D, Prédio 1"
                      value={newPredioNome}
                      onChange={(e) => setNewPredioNome(e.target.value)}
                      style={inputStyle}
                      required
                    />
                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={submittingPredio}
                      style={{ height: "36px", padding: "0 16px", whiteSpace: "nowrap" }}
                    >
                      {submittingPredio ? "Salvando..." : "Cadastrar Prédio"}
                    </button>
                  </div>
                </form>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <b style={{ fontSize: "13px", color: "#1e293b" }}>
                    Prédios Cadastrados ({(predios || []).length}):
                  </b>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", background: "#fff" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      padding: "10px 14px",
                      color: "#64748b",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
                      <span style={{ width: "40px" }}>ID</span>
                      <span>NOME / BLOCO</span>
                    </div>
                    <span>SALAS VINCULADAS</span>
                  </div>

                  <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                    {(predios || []).length > 0 ? (
                      (predios || []).map((p: any) => {
                        if (!p) return null;
                        const idP = p.id_predio || p.id;

                        const qtdSalas = (salas || []).filter((s: any) => {
                          if (!s) return false;
                          const idPredioSala =
                            s.id_predio ??
                            s.idPredio ??
                            s.predio_id ??
                            s.predioId ??
                            s.predio?.id_predio ??
                            s.predio?.id ??
                            s.Predio?.id_predio ??
                            s.Predio?.id;

                          return String(idPredioSala) === String(idP);
                        }).length;

                        return (
                          <div
                            key={idP || Math.random()}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "12px 14px",
                              borderBottom: "1px solid #f1f5f9",
                              fontSize: "13px",
                            }}
                          >
                            <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
                              <span style={{ width: "40px", fontWeight: 700, color: "#64748b" }}>#{idP || "-"}</span>
                              <span style={{ fontWeight: 600, color: "#0f172a" }}>{p.nome || `Prédio ${idP || "-"}`}</span>
                            </div>
                            <div>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "3px 10px",
                                  borderRadius: "12px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  backgroundColor: "#eff6ff",
                                  color: "#2563eb",
                                  border: "1px solid #bfdbfe",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {qtdSalas} {qtdSalas === 1 ? "sala" : "salas"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                        Nenhum prédio cadastrado.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES E AÇÕES DA SALA */}
      {selectedSalaDetails && (
        <div style={{ ...modalOverlayStyle, zIndex: 1150 }}>
          <div className="panel" style={{ ...modalContentStyle, maxWidth: "440px", padding: "20px 24px" }}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                  {selectedSalaDetails.nome}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                  ID: #{selectedSalaDetails.id_sala || selectedSalaDetails.id} | Prédio: {getPredioNome(selectedSalaDetails.id_predio)}
                </p>
              </div>
              <button style={closeBtnStyle} onClick={() => setSelectedSalaDetails(null)}>
                ✕
              </button>
            </div>

            {/* BADGE DE STATUS DA SALA */}
            <div style={{ marginBottom: "14px" }}>
              {selectedSalaDetails.ativo !== false && selectedSalaDetails.status !== "INATIVO" && selectedSalaDetails.status !== "DESATIVADO" ? (
                <span style={{ backgroundColor: "#d1fae5", color: "#065f46", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>
                  ● Sala Ativa
                </span>
              ) : (
                <span style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>
                  ● Sala Inativa
                </span>
              )}
            </div>

            {/* FOTO OU PLACEHOLDER */}
            <div style={{ width: "100%", height: "150px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
              {selectedSalaDetails.foto_url || selectedSalaDetails.foto ? (
                <img
                  src={selectedSalaDetails.foto_url || selectedSalaDetails.foto}
                  alt={selectedSalaDetails.nome}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ textAlign: "center", color: "#94a3b8" }}>
                  <Icon name="building" />
                  <p style={{ margin: "4px 0 0", fontSize: "12px" }}>Sem foto cadastrada</p>
                </div>
              )}
            </div>

            {/* INFORMAÇÕES DETALHADAS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>CAPACIDADE</span>
                <b style={{ fontSize: "13px", color: "#0f172a" }}>{selectedSalaDetails.capacidade || 40} alunos</b>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>QR CODE</span>
                <b style={{ fontSize: "12px", color: "#2563eb", fontFamily: "monospace" }}>
                  {selectedSalaDetails.qr_code || "N/A"}
                </b>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>GRADE ATIVA</span>
                <b style={{ fontSize: "13px", color: "#0f172a" }}>
                  {Array.isArray(selectedSalaDetails.horarios_disponiveis)
                    ? `${selectedSalaDetails.horarios_disponiveis.filter((h: any) => h.ativo !== false).length} slot(s)`
                    : "0 slot(s)"}
                </b>
              </div>
            </div>

            {/* BOTÕES DE EDITAR E DESATIVAR / REATIVAR */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleStartEditSala(selectedSalaDetails)}
                  style={{
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#2563eb",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Editar Sala
                </button>

                {selectedSalaDetails.ativo !== false && selectedSalaDetails.status !== "INATIVO" && selectedSalaDetails.status !== "DESATIVADO" ? (
                  <button
                    type="button"
                    onClick={() => handleToggleSalaStatus(selectedSalaDetails)}
                    style={{
                      backgroundColor: "#fff1f2",
                      border: "1px solid #fecdd3",
                      color: "#e11d48",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Desativar Sala
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleSalaStatus(selectedSalaDetails)}
                    style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#16a34a",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Reativar Sala
                  </button>
                )}
              </div>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => setSelectedSalaDetails(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INVENTÁRIO DE EQUIPAMENTOS */}
      {activeModal === "equipamentos" && (
        <div style={modalOverlayStyle}>
          <div className="panel" style={{ ...modalContentStyle, maxWidth: "780px" }}>
            <div style={modalHeaderStyle}>
              <h2>Inventário de Equipamentos</h2>
              <button style={closeBtnStyle} onClick={() => setActiveModal(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEquipamento} style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
              <b style={{ fontSize: "13px" }}>Cadastrar Novo Equipamento:</b>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px" }}>
                <input
                  placeholder="Nome (ex: Projetor Epson)"
                  value={newEquip.nome}
                  onChange={(e) => setNewEquip({ ...newEquip, nome: e.target.value })}
                  style={inputStyle}
                />
                <input
                  placeholder="NIF (ex: EQ-0005)"
                  value={newEquip.nif}
                  onChange={(e) => setNewEquip({ ...newEquip, nif: e.target.value })}
                  style={inputStyle}
                />
                <button type="submit" className="primary-btn">
                  Adicionar
                </button>
              </div>
            </form>

            {/* BARRA DE FILTROS PARA EQUIPAMENTOS */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px", background: "#f8fafc", padding: "10px", borderRadius: "8px", alignItems: "center", border: "1px solid #e2e8f0" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label style={labelStyle}>Buscar por Nome / NIF</label>
                <input
                  placeholder="Pesquisar..."
                  value={filterEquipText}
                  onChange={(e) => setFilterEquipText(e.target.value)}
                  style={{ ...inputStyle, backgroundColor: "#fff" }}
                />
              </div>

              <div style={{ width: "110px" }}>
                <label style={labelStyle}>Buscar por ID</label>
                <input
                  type="number"
                  placeholder="Ex: 1"
                  value={filterEquipId}
                  onChange={(e) => setFilterEquipId(e.target.value)}
                  style={{ ...inputStyle, backgroundColor: "#fff" }}
                />
              </div>

              {(filterEquipText || filterEquipId) && (
                <button
                  type="button"
                  onClick={() => { setFilterEquipText(""); setFilterEquipId(""); }}
                  style={{ marginTop: "18px", padding: "8px 12px", background: "#cbd5e1", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                >
                  Limpar
                </button>
              )}
            </div>

            <b style={{ fontSize: "13px" }}>Ativos Registrados ({filteredEquipamentosDisplay.length}):</b>
            <div style={{ maxHeight: "280px", overflowY: "auto", marginTop: "10px", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "8px 12px", width: "8%" }}>ID</th>
                    <th style={{ padding: "8px 12px", width: "15%" }}>Patrimônio</th>
                    <th style={{ padding: "8px 12px", width: "28%" }}>Equipamento</th>
                    <th style={{ padding: "8px 12px", width: "29%" }}>Salas Ocupadas</th>
                    <th style={{ padding: "8px 12px", width: "20%", textAlign: "right" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipamentosDisplay.length > 0 ? (
                    filteredEquipamentosDisplay.map((eq) => {
                      const idEq = eq.id_equipamento || eq.id;
                      const currentStatus = eq.status || "DISPONIVEL";
                      const links = getEquipLinks(eq);

                      let bg = "#d1fae5";
                      let color = "#065f46";

                      if (currentStatus === "MANUTENCAO") {
                        bg = "#fee2e2";
                        color = "#991b1b";
                      } else if (currentStatus === "EM_USO") {
                        bg = "#fef3c7";
                        color = "#92400e";
                      } else if (currentStatus === "INATIVO") {
                        bg = "#f1f5f9";
                        color = "#475569";
                      }

                      return (
                        <tr key={idEq || eq.nif} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px", fontWeight: "bold", color: "#64748b" }}>#{idEq}</td>
                          <td style={{ padding: "8px 12px", fontWeight: "bold" }}>{eq.nif}</td>
                          <td style={{ padding: "8px 12px" }}>{eq.nome}</td>

                          <td style={{ padding: "8px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
                              <span style={{ fontSize: "12px", color: links.length > 0 ? "#0f172a" : "#94a3b8", fontWeight: links.length > 0 ? 600 : 400 }}>
                                {links.length > 0 ? `${links.length} sala(s)` : "Sem sala"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedEquipForModal(eq)}
                                style={{
                                  backgroundColor: "#eff6ff",
                                  border: "1px solid #bfdbfe",
                                  color: "#2563eb",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Vínculos
                              </button>
                            </div>
                          </td>

                          <td style={{ padding: "8px 12px", textAlign: "right" }}>
                            <select
                              value={currentStatus}
                              onChange={(e) => handleUpdateEquipStatus(idEq, e.target.value)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                border: "1px solid #cbd5e1",
                                cursor: "pointer",
                                backgroundColor: bg,
                                color: color,
                                outline: "none",
                              }}
                            >
                              <option value="DISPONIVEL" style={{ background: "#fff", color: "#000" }}>DISPONÍVEL</option>
                              <option value="EM_USO" style={{ background: "#fff", color: "#000" }}>EM USO</option>
                              <option value="MANUTENCAO" style={{ background: "#fff", color: "#000" }}>MANUTENÇÃO</option>
                              <option value="INATIVO" style={{ background: "#fff", color: "#000" }}>INATIVO</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: "16px", textAlign: "center", color: "#94a3b8" }}>
                        Nenhum equipamento encontrado com este filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MINI MODAL: GERENCIAR VÍNCULOS DE EQUIPAMENTOS */}
      {selectedEquipForModal && (
        <div style={{ ...modalOverlayStyle, zIndex: 1100 }}>
          <div
            className="panel"
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "20px 24px",
              background: "#fff",
              borderRadius: "12px",
              boxSizing: "border-box",
            }}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Gerenciar Vínculos do Equipamento
                </h3>
                <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "12px" }}>
                  {selectedEquipForModal.nome} (NIF: <b>{selectedEquipForModal.nif}</b>)
                </p>
              </div>
              <button
                type="button"
                style={closeBtnStyle}
                onClick={() => setSelectedEquipForModal(null)}
              >
                ✕
              </button>
            </div>

            <b style={{ fontSize: "13px", color: "#334155", display: "block", marginBottom: "8px" }}>
              Salas Ocupadas Atualmente:
            </b>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "16px", overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 115px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  color: "#64748b",
                  padding: "8px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                <div>SALA</div>
                <div style={{ textAlign: "center" }}>QUANTIDADE</div>
                <div style={{ textAlign: "right" }}>AÇÃO</div>
              </div>

              <div style={{ maxHeight: "170px", overflowY: "auto" }}>
                {getEquipLinks(selectedEquipForModal).length > 0 ? (
                  getEquipLinks(selectedEquipForModal).map((link: any) => {
                    const salaFound = sortedSalas.find((s) => Number(s.id_sala || s.id) === Number(link.id_sala));
                    const nomeSala = salaFound
                      ? `${salaFound.nome} (${getPredioNome(salaFound.id_predio)})`
                      : `Sala #${link.id_sala}`;
                    const quantidade = link.quantidade || 1;

                    return (
                      <div
                        key={link.id_sala}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 90px 115px",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderBottom: "1px solid #f1f5f9",
                          fontSize: "12px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {nomeSala}
                        </div>
                        <div style={{ textAlign: "center", color: "#475569" }}>{quantidade} un.</div>
                        <div style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(link.id_sala)}
                            disabled={submittingLink}
                            style={{
                              backgroundColor: "#fff1f2",
                              border: "1px solid #fecdd3",
                              color: "#e11d48",
                              padding: "4px 8px",
                              borderRadius: "5px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Excluir Vínculo
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: "14px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                    Este equipamento não está vinculado a nenhuma sala.
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleAddOrUpdateLink} style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
              <b style={{ fontSize: "13px", color: "#334155", display: "block", marginBottom: "8px" }}>
                + Adicionar ou Atualizar Vínculo de Sala:
              </b>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={labelStyle}>Selecione a Sala</label>
                  <select
                    required
                    value={newLinkSalaId}
                    onChange={(e) => setNewLinkSalaId(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Selecione uma sala...</option>
                    {sortedSalas.map((s) => (
                      <option key={s.id_sala || s.id} value={s.id_sala || s.id}>
                        {s.nome} ({getPredioNome(s.id_predio)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Quantidade</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newLinkQtd}
                    onChange={(e) => setNewLinkQtd(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setSelectedEquipForModal(null)}
                  disabled={submittingLink}
                >
                  Fechar
                </button>
                <button type="submit" className="primary-btn" disabled={submittingLink}>
                  {submittingLink ? "Salvando..." : "Salvar Vínculo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DO RESET SEMESTRAL */}
      {activeModal === "reset" && (
        <div style={modalOverlayStyle}>
          <div className="panel" style={{ ...modalContentStyle, maxWidth: "460px" }}>
            <div style={modalHeaderStyle}>
              <h2 style={{ color: "#dc2626" }}>Confirmar Reset Semestral</h2>
              <button style={closeBtnStyle} onClick={() => setActiveModal(null)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: "14px", color: "#475569", marginBottom: "20px" }}>
              Esta ação irá arquivar a pontuação do semestre atual e reiniciar o saldo de todas as salas e turmas para 0 pts.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                className="secondary-btn"
                onClick={() => setActiveModal(null)}
                disabled={resettingCycle}
              >
                Cancelar
              </button>
              <button
                className="primary-btn"
                style={{ backgroundColor: "#dc2626", borderColor: "#dc2626" }}
                onClick={handleConfirmReset}
                disabled={resettingCycle}
              >
                {resettingCycle ? "Resetando..." : "Confirmar Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px",
  overflowY: "auto",
};

const modalContentStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#fff",
  padding: "20px 24px",
  borderRadius: "12px",
  boxSizing: "border-box",
  maxHeight: "90vh",
  overflowY: "auto",
  overflowX: "hidden",
};

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  marginBottom: "16px",
};

const closeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "18px",
  marginLeft: "auto",
  padding: "4px 8px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#64748b",
  marginBottom: "4px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  fontSize: "13px",
  boxSizing: "border-box",
};