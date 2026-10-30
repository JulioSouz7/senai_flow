import { useEffect, useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { PageTitle } from "../../components/ui/PageTitle";

interface Sala {
  id_sala: number;
  nome: string;
}

interface ReservaHorario {
  id_reserva_horario?: number;
  id_reserva?: number;
  id_sala_horario?: number;
  dt_reserva?: string;
}

interface Reserva {
  id_reserva: number;
  status?: string; // Add para permitir a leitura do status
  dt_solicitacao: string;
  sala?: Sala | null;
  reserva_horario?: ReservaHorario | ReservaHorario[];
}

interface SalaEquipamento {
  id_sala: number;
  quantidade: number;
}

interface Equipamento {
  id_equipamento: number;
  nome: string;
  descricao?: string;
  status?: string;
  sala_equipamento?: SalaEquipamento[];
}

function Equipment({ notify }: { notify: (x: string) => void }) {
  const [equipments, setEquipments] = useState<Equipamento[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [selectedReservas, setSelectedReservas] = useState<Record<number, number>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
       const token = localStorage.getItem("senai_token");
        const headers = { Authorization: `Bearer ${token}` };

        const [resEquip, resReservas] = await Promise.all([
          fetch("http://localhost:3001/equipamentos", { headers }),
          fetch("http://localhost:3001/reservas", { headers }),
        ]);

        if (!resEquip.ok || !resReservas.ok) {
          throw new Error("Erro na resposta da API");
        }

    const dataEquip: Equipamento[] = await resEquip.json();
const dataReservas: Reserva[] = await resReservas.json();

const safeEquip = Array.isArray(dataEquip) ? dataEquip : [];
const safeReservasRaw = Array.isArray(dataReservas) ? dataReservas : [];

// Filtra e remove reservas encerradas ou canceladas do menu suspenso
const safeReservas = safeReservasRaw.filter((r) => {
  const st = r.status ? String(r.status).trim().toUpperCase() : "";
  return st !== "ENCERRADA" && st !== "CANCELADA";
});

setEquipments(safeEquip);
setReservas(safeReservas);

        const initialQuantities: Record<number, number> = {};
        const initialSelectedReservas: Record<number, number> = {};

        safeEquip.forEach((item) => {
          initialQuantities[item.id_equipamento] = 1;
          if (safeReservas.length > 0) {
            initialSelectedReservas[item.id_equipamento] = safeReservas[0].id_reserva;
          }
        });

        setQuantities(initialQuantities);
        setSelectedReservas(initialSelectedReservas);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        notify("Erro ao carregar os dados da API.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getDisponivel = (eq: Equipamento) => {
    if (!eq.sala_equipamento || !Array.isArray(eq.sala_equipamento) || eq.sala_equipamento.length === 0) {
      return 0;
    }
    return eq.sala_equipamento.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);
  };

  const handleQuantityChange = (id_equipamento: number, delta: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[id_equipamento] || 1;
      const limit = max > 0 ? max : 1;
      const next = Math.max(1, Math.min(limit, current + delta));
      return { ...prev, [id_equipamento]: next };
    });
  };

  const handleReservaChange = (id_equipamento: number, id_reserva: number) => {
    setSelectedReservas((prev) => ({
      ...prev,
      [id_equipamento]: id_reserva,
    }));
  };

  const handleSolicitar = async (id_equipamento: number, nome: string) => {
    const id_reserva = selectedReservas[id_equipamento];
    const quantidade = quantities[id_equipamento] || 1;

    if (!id_reserva) {
      notify("Selecione uma reserva válida para solicitar.");
      return;
    }

    try {
      const token = localStorage.getItem("senai_token");
      const response = await fetch("http://localhost:3001/solicitacoes-equipamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_reserva,
          itens: [
            {
              id_equipamento,
              quantidade,
            },
          ],
        }),
      });

      if (response.ok) {
        notify(`${nome} solicitado com sucesso!`);
      } else {
        notify(`Falha ao solicitar ${nome}.`);
      }
    } catch (error) {
      console.error("Erro ao solicitar equipamento:", error);
      notify("Erro de conexão ao enviar solicitação.");
    }
  };

  if (loading) {
    return <p style={{ padding: "20px" }}>A carregar equipamentos...</p>;
  }

  return (
    <>
      <PageTitle
        eyebrow="RECURSOS DIDÁTICOS"
        title="Solicitar equipamentos"
        text="Todo pedido deve estar vinculado a uma reserva ativa."
      />

      <div className="equipment-grid">
        {equipments.length === 0 ? (
          <p>Nenhum equipamento encontrado.</p>
        ) : (
          equipments.map((eq) => {
            const disponivel = getDisponivel(eq);
            const currentQty = quantities[eq.id_equipamento] || 1;

            return (
              <article className="panel equipment-card" key={eq.id_equipamento}>
                <span>
                  <Icon name="box" />
                </span>

                <h2>{eq.nome}</h2>
                <p>{disponivel} disponíveis</p>

<select
  aria-label={`Reserva para ${eq.nome}`}
  value={selectedReservas[eq.id_equipamento] || ""}
  onChange={(e) =>
    handleReservaChange(eq.id_equipamento, Number(e.target.value))
  }
>
  {reservas.length === 0 ? (
    <option value="">Sem reservas disponíveis</option>
  ) : (
    reservas.map((res) => {
      const salaNome = res.sala?.nome || "Sala Indefinida";

      // 1. Tenta capturar a relação tanto em snake_case quanto em camelCase
      const relacaoHorario = res.reserva_horario || res.reserva_horario;

      // 2. Extrai o item (seja ele um objeto direto ou o 1º elemento de um Array)
      const horarioObj = Array.isArray(relacaoHorario)
        ? relacaoHorario[0]
        : relacaoHorario;

      // 3. Captura o campo dt_reserva
      const dtReservaBruta = horarioObj?.dt_reserva;

      let dataFormatada = "Sem data";

      if (dtReservaBruta) {
        // Trata string no formato "YYYY-MM-DD" sem sofrer alteração por fuso horário
        const partes = dtReservaBruta.split("T")[0].split("-");
        if (partes.length === 3) {
          const ano = Number(partes[0]);
          const mes = Number(partes[1]) - 1; // Meses em JS variam de 0 a 11
          const dia = Number(partes[2]);

          const dataObj = new Date(ano, mes, dia);
          dataFormatada = dataObj.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          });
        } else {
          dataFormatada = new Date(dtReservaBruta).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          });
        }
      }

      return (
        <option key={res.id_reserva} value={res.id_reserva}>
          {salaNome} • {dataFormatada}
        </option>
      );
    })
  )}
</select>

                <div>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(eq.id_equipamento, -1, disponivel)}
                  >
                    -
                  </button>

                  <b>{currentQty}</b>

                  <button
                    type="button"
                    onClick={() => handleQuantityChange(eq.id_equipamento, 1, disponivel)}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => handleSolicitar(eq.id_equipamento, eq.nome)}
                >
                  Solicitar
                </button>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}

export default Equipment;