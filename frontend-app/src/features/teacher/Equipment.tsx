import { useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { PageTitle } from "../../components/ui/PageTitle";

function Equipment({ notify }: { notify: (x: string) => void }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({
    "Kit de robótica": 1,
    "Notebook Dell": 1,
    "Projetor multimídia": 1,
    "Extensão elétrica": 1,
  });
  return (
    <>
      <PageTitle
        eyebrow="RECURSOS DIDÁTICOS"
        title="Solicitar equipamentos"
        text="Todo pedido deve estar vinculado a uma reserva ativa."
      />

      <div className="equipment-grid">
        {[
          ["box", "Kit de robótica", "8 disponíveis"],
          ["grid", "Notebook Dell", "4 disponíveis"],
          ["building", "Projetor multimídia", "2 disponíveis"],
          ["box", "Extensão elétrica", "12 disponíveis"],
        ].map((x) => (
          <article className="panel equipment-card" key={x[1]}>
            <span>
              <Icon name={x[0]} />
            </span>

            <h2>{x[1]}</h2>
            <p>{x[2]}</p>

            <select aria-label={`Reserva para ${x[1]}`}>
              <option>Sala D-02 • Hoje, 08:00</option>
              <option>Sala D-04 • 21 mar, 14:00</option>
            </select>


    <div>
      <button
        type="button"
        onClick={() =>
          setQuantities((prev) => ({
            ...prev,
            [x[1]]: Math.min(10, prev[x[1]] + 1),
          }))
        }
      >
        +
      </button>

      <b>{quantities[x[1]]}</b>

      <button
        type="button"
        onClick={() =>
          setQuantities((prev) => ({
            ...prev,
            [x[1]]: Math.min(
              Number.parseInt(x[2]),
              prev[x[1]] + 1
            ),
          }))
        }
      >
        +
      </button>
    </div>

            <button
              className="primary-btn"
              onClick={() => notify(`${x[1]} solicitado`)}
            >
              Solicitar
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

export default Equipment;