import type { Role } from "../../types";
import { useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { AppShell } from "../../components/layout/AppShell";
import Reservations from "./Reservations";
import MyReservations from "./MyReservations";
import Equipment from "./Equipment";
import TeacherDamage from "./TeacherDamage";
import Ranking from "../shared/Ranking";
import RiskMap from "../shared/RiskMap";
import HelpCenter from "./HelpCenter";

export function Teacher({ changeRole }: { changeRole:(r:Role)=>void }) {
  const [active,setActive]=useState(0); const [toast,setToast]=useState(""); const notify=(x:string)=>{setToast(x);window.setTimeout(()=>setToast(""),2400)};
  const pages=[<Reservations go={setActive} notify={notify}/>,<MyReservations notify={notify}/>,<Equipment notify={notify}/>,<TeacherDamage/>,<Ranking/>,<RiskMap/>,<HelpCenter notify={notify}/>];
  return <AppShell role="teacher" roleChange={changeRole} active={active} setActive={setActive}>{pages[active]}{toast&&<div className="toast"><Icon name="check" size={17}/>{toast}</div>}</AppShell>;
}
