import { PageTitle } from "../../components/ui/PageTitle";
import { Stat } from "../../components/ui/Stat";
import { Icon } from "../../components/icons/Icon";

export function ManagementHome({ go }: { go: (n: number) => void }) {
  const rooms = [["D-01","Livre","Até 10:00","free"],["D-02","Ocupada","DS2 • Prof. André","busy"],["Lab. D-03","Manutenção","Projetor • #AV-2848","maintenance"],["D-04","Livre","Todo o período","free"],["Maker D","Reservada","Mecatrônica • 10:15","reserved"],["Auditório","Ocupada","Evento institucional","busy"]];
  return <>
    <PageTitle eyebrow="OPERAÇÃO EM TEMPO REAL • BLOCO D" title="Visão geral do campus" text="Ocupação, manutenção e solicitações que precisam da sua atenção." action={<button className="primary-btn" onClick={() => go(5)}><Icon name="plus" size={17}/> Novo comunicado</button>}/>
    <section className="stats"><Stat icon="building" label="OCUPAÇÃO AGORA" value="68%" note="17 de 25 salas"/><Stat icon="check" label="SALAS LIVRES" value="08" note="3 laboratórios" tone="green"/><Stat icon="tool" label="CHAMADOS ABERTOS" value="12" note="4 de alta prioridade" tone="amber"/><Stat icon="clock" label="TEMPO MÉDIO" value="14min" note="-18% nesta semana" tone="blue"/></section>
    <div className="management-grid">
      <article className="panel occupancy"><div className="panel-head"><div><h2>Ocupação do Bloco D</h2><p>Atualizado agora</p></div><div className="legend"><span><i className="free"/>Livre</span><span><i className="busy"/>Ocupada</span><span><i className="maintenance"/>Manutenção</span></div></div>
        <div className="room-grid">{rooms.map((room) => <button key={room[0]}><span className={`room-status ${room[3]}`}/><div><b>{room[0]}</b><small>{room[1]}</small></div><p>{room[2]}</p><Icon name="arrow" size={15}/></button>)}</div>
      </article>
      <article className="panel emergency-card"><div className="panel-head"><div><h2>Emergências</h2><p>Decisão em até 10 minutos</p></div><span className="count">3</span></div>
        <div className="emergency-item"><div className="timer"><Icon name="clock" size={15}/><b>07:42</b></div><span className="urgent">URGENTE</span><h3>Laboratório para aula prática</h3><p>Prof. Carla Mendes • Mecatrônica M3</p><div className="request-route"><b>25 alunos</b><span>Hoje • 10:15–12:00</span></div><div className="action-row"><button className="secondary-btn" onClick={() => go(1)}>Analisar</button><button className="primary-btn" onClick={() => go(1)}>Decidir agora</button></div></div>
        <button className="panel-link" onClick={() => go(1)}>Ver fila completa <Icon name="arrow" size={14}/></button>
      </article>
    </div>
    <article className="panel activity"><div className="panel-head"><div><h2>Atividade recente</h2><p>Movimentações do campus</p></div><button>Ver histórico</button></div>{[["check","Reserva aprovada","Sala D-04 • Prof. Ricardo Nunes","Há 4 min","green"],["tool","Novo chamado de avaria","Projetor • Lab. D-03 • Alta prioridade","Há 12 min","red"],["swap","Troca de sala concluída","Prof. André ↔ Prof. Juliana","Há 23 min","blue"]].map((item) => <div className="activity-row" key={item[1]}><span className={item[4]}><Icon name={item[0]} size={17}/></span><div><b>{item[1]}</b><p>{item[2]}</p></div><small>{item[3]}</small></div>)}</article>
  </>;
}