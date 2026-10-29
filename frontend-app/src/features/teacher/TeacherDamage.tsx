import { PageTitle } from "../../components/ui/PageTitle";
import Scanner from "../../features/shared/Scanner";

function TeacherDamage() {
  return (
    <>
      <PageTitle
        eyebrow="QR CODE E MANUTENÇÃO"
        title="Relatórios de avaria"
        text="Escaneie a etiqueta da sala ou acompanhe chamados já registrados."
      />

      <div className="damage-layout">
        <div className="mobile-module">
          <Scanner />
        </div>

        <article className="panel table-panel">
          <div className="panel-head">
            <div>
              <h2>Meus chamados</h2>
              <p>Atualizações em tempo real</p>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Ativo</th>
                  <th>Sala</th>
                  <th>Abertura</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {[
                  [
                    "#AV-2848",
                    "Projetor • NIF 238.441",
                    "Lab. D-03",
                    "Hoje, 08:14",
                    "Em manutenção",
                  ],
                  [
                    "#AV-2819",
                    "Cabo HDMI",
                    "Sala D-02",
                    "12 mar",
                    "Concluído",
                  ],
                ].map((x) => (
                  <tr key={x[0]}>
                    <td>
                      <b>{x[0]}</b>
                    </td>
                    <td>{x[1]}</td>
                    <td>{x[2]}</td>
                    <td>{x[3]}</td>
                    <td>
                      <span className="status-badge">{x[4]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </>
  );
}

export default TeacherDamage;