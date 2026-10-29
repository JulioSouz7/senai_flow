import { Icon } from "../../components/icons/Icon";

export function RiskMap() {
  return (
    <>
      <div className="module-heading">
        <span>SEGURANÇA E ACESSIBILIDADE</span>
        <h1>Mapa de risco</h1>
        <p>Bloco D • Pavimento térreo</p>
      </div>

      <div className="map-filters">
        {["Todos", "Riscos", "Rotas", "Acessível"].map((x, i) => (
          <button className={i === 0 ? "active" : ""} key={x}>
            {x}
          </button>
        ))}
      </div>

      <div className="floor-map">
        <div className="map-room lab">
          LAB. D-03
          <small>Risco elétrico</small>
        </div>

        <div className="map-room room-a">D-01</div>
        <div className="map-room room-b">D-02</div>
        <div className="map-room maker">MAKER D</div>

        <div className="corridor">
          ROTA DE FUGA <span>→ → →</span>
        </div>

        <span className="risk-pin">
          <Icon name="fire" size={16} />
        </span>

        <span className="access-pin">♿</span>
        <span className="exit-pin">SAÍDA</span>
      </div>

      <div className="map-legend">
        <span><i className="red" />Risco alto</span>
        <span><i className="green" />Rota de fuga</span>
        <span><i className="blue" />Acessibilidade</span>
      </div>
    </>
  );
}

export default RiskMap;
