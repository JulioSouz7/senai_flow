import { useState } from 'react';
import { PageTitle } from "../../components/ui/PageTitle";
import { Icon } from "../../components/icons/Icon";

export function SuggestionsDesk({ notify }: { notify:(text:string)=>void }) {
  const [answered,setAnswered]=useState<string[]>([]);
  const reports=[["#RL-0412","Lucas Andrade • Aluno","Iluminação insuficiente no corredor D","4 dias restantes","Em análise"],["#RL-0409","André Silva • Docente","Sugestão de sinalização para o laboratório","2 dias restantes","Recebido"],["#RL-0402","Ana Beatriz • Aluna","Rampa de acesso obstruída","Prazo vence hoje","Prioritário"]];
  return <><PageTitle eyebrow="ATENDIMENTO INSTITUCIONAL" title="Relatos e sugestões" text="Responda em até 5 dias. Mensagens arquivadas permanecem no histórico institucional."/><div className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Protocolo</th><th>Remetente</th><th>Assunto</th><th>Prazo</th><th>Status</th><th>Ação</th></tr></thead><tbody>{reports.map((r)=><tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td><span className={r[3].includes("hoje")?"deadline":""}>{r[3]}</span></td><td><span className="status-badge">{answered.includes(r[0])?"Respondido":r[4]}</span></td><td><button className="row-btn" onClick={()=>{setAnswered([...answered,r[0]]);notify(`Resposta registrada em ${r[0]}`)}}>Responder <Icon name="arrow" size={13}/></button></td></tr>)}</tbody></table></div></div></>;
}


