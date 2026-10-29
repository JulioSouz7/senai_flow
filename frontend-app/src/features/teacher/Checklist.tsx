import { useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { PageTitle } from "../../components/ui/PageTitle";

function Checklist({ notify }: { notify: (x: string) => void }) {
  const [checked, setChecked] = useState<string[]>([]);

  const items = [
    "Mesas e cadeiras estão organizadas",
    "Equipamentos foram desligados",
    "Sala está limpa",
    "Ar-condicionado e luzes desligados",
  ];

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
            <b>Sala D-02 • Bloco D</b>
            <p>DS2 • Programação Web • 08:00–10:00</p>
          </div>

          <span className="live">EM ANDAMENTO</span>
        </div>

        <div className="points-callout">
          <Icon name="trophy" />

          <div>
            <b>+100 pontos para a turma</b>
            <p>O relato correto de avarias preserva integralmente a pontuação.</p>
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

        <button className="damage-link">
          <Icon name="alert" size={17} />
          Encontrei uma avaria nesta sala
        </button>

        <button
          className="primary-btn finish"
          disabled={checked.length < 4}
          onClick={() => notify("+100 pontos liberados para a turma")}
        >
          Confirmar entrega e encerrar aula
        </button>
      </article>
    </>
  );
}

export default Checklist;