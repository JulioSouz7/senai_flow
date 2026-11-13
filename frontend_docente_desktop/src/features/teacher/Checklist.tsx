import { useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { PageTitle } from "../../components/ui/PageTitle";

// Trazemos as interfaces necessárias para tipar a prop "reserva"
interface ReservaHorario {
  dt_reserva?: string;
  hora_inicio?: string;
  hora_fim?: string;
}

interface Reserva {
  sala?: { nome: string } | null;
  turma?: { nome: string } | null;
  reserva_horario?: ReservaHorario | ReservaHorario[];
  reservaHorario?: ReservaHorario | ReservaHorario[];
}

interface ChecklistProps {
  notify: (x: string) => void;
  onConfirm: (dados: any) => void;
  reserva: Reserva;
}

function Checklist({ onConfirm, reserva }: ChecklistProps) {
  const [checked, setChecked] = useState<string[]>([]);

  const items = [
    "Mesas e cadeiras estão organizadas",
    "Equipamentos foram desligados",
    "Sala está limpa",
    "Ar-condicionado e luzes desligados",
  ];

  // Extração segura dos dados da reserva
  const salaNome = reserva.sala?.nome || "Sala Indefinida";
  const turmaNome = reserva.turma?.nome || "Turma Indefinida";
  
  const relacaoHorario = reserva.reserva_horario || reserva.reservaHorario;
  const horarioObj = Array.isArray(relacaoHorario) ? relacaoHorario[0] : relacaoHorario;
  const horaInicio = horarioObj?.hora_inicio || "00:00";
  const horaFim = horarioObj?.hora_fim || "00:00";

  const handleConfirmar = () => {
    const sala_em_ordem = checked.length === items.length;
    
    let observacoes = "Encerrado via painel docente. ";
    if (checked.length > 0) {
      observacoes += `Itens confirmados: ${checked.length}/${items.length}.`;
    } else {
      observacoes += "Nenhum item do checklist foi marcado.";
    }

    // Chama a função passada pelo pai que fará o fechamento e retorno à tela principal
    onConfirm({
      sala_em_ordem,
      houve_avaria: false, // Como a avaria foi para o Google Forms, definimos como false aqui ou ajustamos conforme sua regra de negócio
      observacoes
    });
  };

  return (
    <>
      <PageTitle
        eyebrow="CONSERVAÇÃO E PONTUAÇÃO"
        title="Encerrar uso da sala"
        text="Confirme as condições do ambiente para liberar a pontuação da turma."
      />

      <article className="panel checklist">
        <div className="class-summary">
          <span>
            <Icon name="building" />
          </span>

          <div>
            <b>{salaNome}</b>
            <p>{turmaNome} • {horaInicio}–{horaFim}</p>
          </div>

          <span className="live">EM ANDAMENTO</span>
        </div>

        <div className="points-callout">
          <Icon name="trophy" />

          <div>
            <p>O bom estado da sala oferece à turma 20 pontos no ranking semestral.</p>
          </div>
        </div>

        {items.map((item) => (
          <label
            className={checked.includes(item) ? "checked" : ""}
            key={item}
          >
            <input
              type="checkbox"
              checked={checked.includes(item)}
              onChange={() =>
                setChecked(
                  checked.includes(item)
                    ? checked.filter((x) => x !== item)
                    : [...checked, item]
                )
              }
            />

            <span>
              <Icon name="check" size={16} />
            </span>

            {item}
          </label>
        ))}

        <button 
          type="button"
          className="damage-link" 
          // ADICIONADO: Abre o link do Google Forms em uma nova aba
          onClick={() => window.open("https://forms.gle/Cy99kENVLJ4Ht7Mk8", "_blank")}
        >
          <Icon name="alert" size={17} />
          Encontrei uma avaria nesta sala
        </button>
                
        <button
          className="primary-btn finish"
          onClick={handleConfirmar}
          style={{ marginTop: "20px" }}
        >
          Confirmar entrega e encerrar aula
        </button>
      </article>
    </>
  );
}

export default Checklist;