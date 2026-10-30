import { useEffect, useState } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import Checklist from "./Checklist";
import Swaps from "./Swaps";

interface Sala {
  id_sala: number;
  nome: string;
}

interface Turma {
  id_turma: number;
  nome: string;
}

interface ReservaHorario {
  dt_reserva?: string;
  hora_inicio?: string;
  hora_fim?: string;
}

interface Reserva {
  id_reserva: number;
  status: string;
  dt_solicitacao?: string;
  sala?: Sala | null;
  turma?: Turma | null;
  reserva_horario?: ReservaHorario | ReservaHorario[];
  reservaHorario?: ReservaHorario | ReservaHorario[];
}

const GOOGLE_FORMS_URL = "https://docs.google.com/forms/d/e/1FAIpQLSedoPfhWdCaKBO6p09e_39z4mxhPLzIPNQlBst-84_FSB0pxw/viewform";

function MyReservations({ notify }: { notify: (x: string) => void }) {
  const [checklist, setChecklist] = useState(false);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

useEffect(() => {
  async function fetchReservas() {
    try {
      setLoading(true);
      const token = localStorage.getItem("senai_token") || "";
      const usuarioStorage = localStorage.getItem("senai_usuario");
      const usuarioLogado = usuarioStorage ? JSON.parse(usuarioStorage) : null;

      if (!token) {
        notify("Sessão não encontrada. Faça login novamente.");
        setLoading(false);
        return;
      }

      // Tenta pegar o ID do docente logado (id_docente ou id_usuario/id)
      const idDocenteLogado =
        usuarioLogado?.id_docente || usuarioLogado?.id_usuario || usuarioLogado?.id;

      // Monta a URL: se tiver o ID, envia via Query Parameter
      const url = idDocenteLogado
        ? `http://localhost:3001/reservas?id_docente=${idDocenteLogado}`
        : "http://localhost:3001/reservas";

      console.log("🔍 Buscando reservas na URL:", url);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar as reservas.");
      }

      const data = await response.json();
      console.log("📦 Resposta Bruta da API:", data);

      if (!Array.isArray(data)) {
        setReservas([]);
        return;
      }

      // Normaliza os IDs para garantir que o React não perca as chaves (id ou id_reserva)
      const dataNormalizada = data.map((item: any) => ({
        ...item,
        id_reserva: item.id_reserva || item.id,
      }));

      // Oculta reservas encerradas e canceladas
      const ativas = dataNormalizada.filter((r) => {
        const st = r.status ? String(r.status).trim().toUpperCase() : "";
        return st !== "ENCERRADA" && st !== "CANCELADA";
      });

      setReservas(ativas);
    } catch (error) {
      console.error("Erro no fetch de reservas:", error);
      notify("Falha ao carregar suas reservas.");
    } finally {
      setLoading(false);
    }
  }

  fetchReservas();
}, []);

  // 1. Ação para CANCELAR reserva pendente
  const handleCancelarReserva = async (id_reserva: number, salaNome: string) => {
    try {
      const token = localStorage.getItem("senai_token") || "";

      // Rota vista no Insomnia: PATCH /reservas/:id/cancelar
      const response = await fetch(`http://localhost:3001/reservas/${id_reserva}/cancelar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        notify(`Reserva na ${salaNome} cancelada com sucesso.`);
        setReservas((prev) => prev.filter((item) => item.id_reserva !== id_reserva));
      } else {
        const errorData = await response.json();
        notify(`Erro ao cancelar: ${errorData.message || "Falha na API"}`);
      }
    } catch (err) {
      console.error("Erro ao cancelar reserva:", err);
      notify("Erro de conexão ao cancelar a reserva.");
    }
  };

  // 2. Ação para FINALIZAR reserva confirmada
  const handleFinalizarReserva = async (id_reserva: number, salaNome: string) => {
    window.open(GOOGLE_FORMS_URL, "_blank");
    notify(`Formulário aberto. Finalizando reserva na ${salaNome}...`);

    try {
      const token = localStorage.getItem("senai_token") || "";

      // Rota vista no Insomnia: PATCH /reservas/:id/encerrar
      const response = await fetch(`http://localhost:3001/reservas/${id_reserva}/encerrar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sala_em_ordem: true,
          houve_avaria: false,
          obs_encerramento: "Encerrado via painel docente.",
        }),
      });

      if (response.ok) {
        notify(`Reserva na ${salaNome} encerrada com sucesso!`);
        setReservas((prev) => prev.filter((item) => item.id_reserva !== id_reserva));
      } else {
        const errorData = await response.json();
        notify(`Erro ao encerrar: ${errorData.message || "Falha na API"}`);
      }
    } catch (err) {
      console.error("Erro ao encerrar reserva:", err);
      notify("Erro de conexão ao encerrar a reserva.");
    }
  };

  if (checklist)
    return (
      <>
        <button
          className="text-link back-link"
          onClick={() => setChecklist(false)}
        >
          ← Voltar às reservas
        </button>

        <Checklist notify={notify} />
      </>
    );

  return (
    <>
      <PageTitle
        eyebrow="AGENDA DOCENTE"
        title="Minhas reservas"
        text="Acompanhe validações, horários e solicitações de troca."
      />

      {loading ? (
        <p style={{ padding: "20px" }}>A carregar reservas...</p>
      ) : (
        <div className="reservation-list">
          {reservas.length === 0 ? (
            <p style={{ padding: "20px" }}>Nenhuma reserva ativa encontrada.</p>
          ) : (
            reservas.map((r) => {
              const relacaoHorario = r.reserva_horario || r.reservaHorario;
              const horarioObj = Array.isArray(relacaoHorario)
                ? relacaoHorario[0]
                : relacaoHorario;

              const dataBruta = horarioObj?.dt_reserva || r.dt_solicitacao;

              let dataFormatada = "SEM DATA";
              if (dataBruta) {
                const partes = dataBruta.split("T")[0].split("-");
                if (partes.length === 3) {
                  const dataObj = new Date(
                    Number(partes[0]),
                    Number(partes[1]) - 1,
                    Number(partes[2])
                  );
                  dataFormatada = dataObj
                    .toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })
                    .toUpperCase();
                } else {
                  dataFormatada = new Date(dataBruta)
                    .toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })
                    .toUpperCase();
                }
              }

              const salaNome = r.sala?.nome || "Sala Indefinida";
              const turmaNome = r.turma?.nome ? ` • ${r.turma.nome}` : "";
              
              const statusUpper = r.status?.toUpperCase();
              const isConfirmada = statusUpper === "CONFIRMADA" || statusUpper === "APROVADA";

              return (
                <article className="panel" key={r.id_reserva}>
                  <span>{dataFormatada}</span>

                  <div>
                    <b>{salaNome}</b>
                    <p>
                      {horarioObj?.hora_inicio || "14:00"}–
                      {horarioObj?.hora_fim || "16:00"}
                      {turmaNome}
                    </p>
                  </div>

                  {/* Badge de status com fundo verde para Confirmada/Aprovada */}
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: isConfirmada ? "#e6f4ea" : "#fef3c7",
                      color: isConfirmada ? "#137333" : "#854d0e",
                    }}
                  >
                    {r.status}
                  </span>

                  {/* Botões Retangulares Estilizados */}
                  {isConfirmada ? (
                    <button
                      type="button"
                      style={{
                        padding: "8px 14px",
                        borderRadius: "6px",
                        backgroundColor: "#e30613",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onClick={() => handleFinalizarReserva(r.id_reserva, salaNome)}
                    >
                      Finalizar reserva
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={{
                        padding: "8px 14px",
                        borderRadius: "6px",
                        backgroundColor: "#ffffff",
                        color: "#555555",
                        border: "1px solid #cccccc",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onClick={() => handleCancelarReserva(r.id_reserva, salaNome)}
                    >
                      Cancelar reserva
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      <Swaps notify={notify} />
    </>
  );
}

export default MyReservations;