    import { Icon } from "../../components/icons/Icon";

   export function Ranking() {
    return (
    <>
        <div className="module-heading">
            <span>CONSERVAÇÃO</span>
            <h1>Placar da turma</h1>
            <p>Pontos acumulados no semestre 2026.1.</p>
        </div>
        <article className="score-card">
            <Icon name="trophy" size={33}/>
        <div>
            <span>SALDO DA DS2</span>
            <strong>2.480</strong>
            <small>pontos disponíveis</small>
            </div>
            <b>2º lugar</b>
            </article>
                <div className="history">
                    <h2>Histórico recente</h2>
                    {[["+100","Checklist • Sala D-02","Hoje, 10:04"],["+50","Relato correto de avaria","15 mar, 14:20"],
                    ["+100","Checklist • Sala D-04","14 mar, 16:02"]].map(x=><div key={x[1]}><span>{x[0]}
                    </span>
                <div>
                    <b>{x[1]}</b>
                    <small>{x[2]}</small>
                </div>
                </div>
                )}
                </div>
                <div className="mobile-title">
                    <div>
                        <h2>Ranking de conservação</h2>
                        <p>Bloco D • Março</p>
                        </div>
                </div>
                    <div className="ranking">
                    {[["1","Mecatrônica M3","2.720"],
                    ["2","DS2 • Sua turma","2.480"],
                    ["3","Eletroeletrônica E2","2.310"],
                    ["4","Logística L1","2.060"]].map(x=><div className={x[0]==="2"?"you":""} 
                        key={x[0]}>
                            <span>
                                {x[0]}
                            </span>
                            <b>{x[1]}</b>
                            <p>{x[2]} pts</p>
                    </div>
                        )}
                    </div>
                <button className="rewards">
                    <Icon name="gift"/>
                    <div>
                        <b>Catálogo AAPM</b>
                        <span>Troque pontos por brindes, descontos e EPIs</span>
                    </div>
                    <Icon name="arrow"/>
                </button></>
    );  
}

export default Ranking;