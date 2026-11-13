import { useState } from "react"; 
import type { Role } from "../../types"; 
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
import { Faq } from "./Faq"; 

export function Management({ changeRole }: { changeRole: (role: Role) => void }) {
  const [active, setActive] = useState(0); 
  const [toast, setToast] = useState("");

  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2400);
  };

  const pages = [
      <ManagementHome go={setActive} notify={notify} />, // 0: Dashboard
      <Emergencies notify={notify} />,          // 1: Emergências
      <EquipmentApprovals notify={notify} />,   // 2: Equipamentos
      <Assets notify={notify} />,               // 3: Avarias e ativos
      <Administration notify={notify} go={setActive} />, // 4: Administração
      <Notices notify={notify} />,              // 5: Comunicados
      <SuggestionsDesk notify={notify} />,      // 6: Relatos e sugestões
      <AccessControl notify={notify} />,        // 7: Controle de acessos
      <RiskMap notify={notify} />,              // 8: Mapa de riscos
      <Faq notify={notify} role="management" /> // 9: FAQ & Suporte (NOVO)
    ];

  return (
    <AppShell role="management" roleChange={changeRole} active={active} setActive={setActive}>
      {pages[active]}
      {toast && (
        <div className="toast">
          <Icon name="check" size={17} />
          {toast}
        </div>
      )}
    </AppShell>
  );
}