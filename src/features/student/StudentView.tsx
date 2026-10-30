import { useState } from "react";
import { Icon }from "../../components/icons/Icon";
import { StudentHeader } from "../../components/layout/StudentHeader";
import Feed from "../student/Feed";
import RiskMap from "../shared/RiskMap";
import StudentSupport from "../student/StudentSupport";
import StudentReports from "../student/StudentReports";
import type { Role } from "../../types";


export function Student({ changeRole }: { changeRole:(r:Role)=>void }) {
   const [active,setActive]=useState(0); const pages=[<Feed go={setActive}/>,<RiskMap/>,<StudentSupport/>,<StudentReports/>]; const nav=[["grid","Início"],["map","Mapa"],["message","Suporte"],["message","Relatos"]];
   return <div className="student-shell"><div className="student-app"><StudentHeader changeRole={changeRole}/><main className="student-content">{pages[active]}</main><nav className="student-nav">{nav.map(([icon,label],i)=><button className={active===i?"active":""} onClick={()=>setActive(i)} key={label}><Icon name={icon}/><span>{label}</span></button>)}</nav></div></div>;
 }