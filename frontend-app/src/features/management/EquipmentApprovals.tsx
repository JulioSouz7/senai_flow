import { PageTitle } from "../../components/ui/PageTitle";
import { useState } from "react";


export function EquipmentApprovals({ notify }: { notify:(text:string)=>void }) {
  const [handled,setHandled]=useState<string[]>([]);
  const requests=[["#EQ-1098","Carla Mendes","Carrinho de notebooks","Sala D-04 • 20 un.","22 disponíveis"],["#EQ-1097","André Silva","Kit Arduino Uno","Lab. D-02 • 8 un.","12 disponíveis"],["#EQ-1095","Juliana Alves","Projetor móvel","Sala D-01 • 1 un.","2 disponíveis"]];
  return <><PageTitle eyebrow="ESTOQUE E RECURSOS" title="Solicitações de equipamentos" text="Aprove pedidos vinculados a reservas ativas conforme a disponibilidade do estoque."/><div className="approval-list">{requests.map((r)=><article className={`panel approval-card ${handled.includes(r[0])?"handled":""}`} key={r[0]}><div><span className="protocol">{r[0]}</span><span className="stock">{r[4]}</span></div><h2>{r[2]}</h2><p>{r[1]} • {r[3]}</p><div className="request-actions"><button className="secondary-btn" disabled={handled.includes(r[0])} onClick={()=>{setHandled([...handled,r[0]]);notify(`${r[0]} recusada`)}}>Recusar</button><button className="primary-btn" disabled={handled.includes(r[0])} onClick={()=>{setHandled([...handled,r[0]]);notify(`${r[0]} aprovada`)}}>Aprovar pedido</button></div></article>)}</div></>;
}