import { PageTitle } from "../../components/ui/PageTitle";
import { Icon } from "../../components/icons/Icon";
import { useState } from "react";

export function AccessControl({ notify }: { notify:(text:string)=>void }) {
  const [blocked,setBlocked]=useState<string[]>([]);
  const users=[["Mariana Lopes","mariana@aluno.senai.br","Aluno • DS2","Ativo"],["Paulo Henrique","paulo.henrique@sp.senai.br","Docente","Primeiro acesso"],["Rafael Costa","rafael@aluno.senai.br","Aluno • MEC3","Ativo"]];
  return <><PageTitle eyebrow="SEGURANÇA E IDENTIDADE" title="Controle de acessos" text="Cadastre usuários, emita senhas provisórias e bloqueie desligados imediatamente." action={<button className="primary-btn"><Icon name="plus" size={16}/> Novo usuário</button>}/><article className="panel access-list">{users.map((u)=><div key={u[1]}><span className="avatar">{u[0].split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><b>{u[0]}</b><p>{u[1]} • {u[2]}</p></div><span className={`access-status ${blocked.includes(u[1])?"blocked":""}`}>{blocked.includes(u[1])?"Bloqueado":u[3]}</span><button className="secondary-btn" onClick={()=>notify("Nova senha provisória emitida")}>Senha provisória</button><button className="block-btn" onClick={()=>{setBlocked([...blocked,u[1]]);notify("Acesso bloqueado imediatamente")}}>Bloquear</button></div>)}</article></>;
}