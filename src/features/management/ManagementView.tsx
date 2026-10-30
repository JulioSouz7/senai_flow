import { useState } from "react"; import type { Role } from "../../types"; 
import { AppShell } from "../../components/layout/AppShell"; 
import { Icon } from "../../components/icons/Icon"; 
import { ManagementHome } from "./ManagementHome";
import { Emergencies } from "./Emergencies"; 
import { EquipmentApprovals } from "./EquipmentApprovals"; 
import { Assets } from "./Assets"; 
import { Administration } from "./Administration"; 
import { Notices } from "./Notices"; 
import { SuggestionsDesk } from "./SuggestionsDesk"; 
import { AccessControl } from "./AccessControl"; 
import { RiskMap } from "../shared/RiskMap";


export function Management({ changeRole }: { changeRole: (role: Role) => void }) {
  const [active,setActive]=useState(0); const [toast,setToast]=useState("");
  const notify=(text:string)=>{setToast(text);window.setTimeout(()=>setToast(""),2400)};
  const pages=[<ManagementHome go={setActive}/>,<Emergencies notify={notify}/>,<EquipmentApprovals notify={notify}/>,<Assets/>,<Administration notify={notify}/>,<Notices notify={notify}/>,<SuggestionsDesk notify={notify}/>,<AccessControl notify={notify}/>,<RiskMap/>];
  return <AppShell role="management" roleChange={changeRole} active={active} setActive={setActive}>{pages[active]}{toast&&<div className="toast"><Icon name="check" size={17}/>{toast}</div>}</AppShell>;
}