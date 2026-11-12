import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { AppShell } from "../../components/layout/AppShell";
import { api } from "../../services/api";
import Reservations from "./Reservations";
import MyReservations from "./MyReservations";
import Equipment from "./Equipment";
import Ranking from "../shared/Ranking";
import RiskMap from "../shared/RiskMap";
import HelpCenter from "./HelpCenter";
// ATENÇÃO: Ajuste o caminho abaixo para onde o arquivo Notifications.tsx realmente está.
// Se estiver na mesma pasta que o HelpCenter, use: import Notifications from "./Notifications";
import Notifications from "./Notifications"; 
import MyClass from "./MyClass";

interface ClassRecord {
  id_turma: number;
  nome: string;
  curso: string;
  docente_turma?: Array<{
    docente?: { usuario?: { nome?: string; email?: string } };
  }>;
}

export function Teacher() {
  const [active, setActive] = useState(0); 
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState("");
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" | "warning" | "info" } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const notify = useCallback((message: string, kind: "success" | "error" | "warning" | "info" = "info") => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    setToast({ message, kind });
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);
  useEffect(() => () => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
  }, []);

  const loadClasses = async (): Promise<boolean> => {
    try {
      setClassesLoading(true);
      setClassesError("");
      const { data } = await api.get<ClassRecord[]>("/turmas");
      const rows = Array.isArray(data) ? data : [];
      setClasses(rows);
      setSelectedClassId((current) => rows.some((item) => item.id_turma === current) ? current : rows[0]?.id_turma ?? null);
      return true;
    } catch (requestError: unknown) {
      setClassesError(requestError instanceof Error ? requestError.message : "Não foi possível carregar suas turmas.");
      return false;
    } finally {
      setClassesLoading(false);
    }
  };

  useEffect(() => {
    void loadClasses();
  }, []);
  
  const pages = [
    <Reservations key="agenda" go={setActive} notify={notify}/>,
    <MyReservations key="reservations" notify={notify}/>,
    <Equipment key="equipment" notify={notify}/>,
    <MyClass
      key="class"
      classes={classes}
      selectedClassId={selectedClassId}
      onSelectClass={setSelectedClassId}
      loading={classesLoading}
      error={classesError}
      onRefresh={loadClasses}
      notify={notify}
    />,
    <Ranking key="ranking"/>,
    <RiskMap key="risk"/>,
    <HelpCenter key="support" notify={notify}/>,
    <Notifications key="notices" notify={notify} />
  ];

  return (
    <AppShell role="teacher" active={active} setActive={setActive}>
      {pages[active]}
      {toast && (
        <div className={`toast toast-${toast.kind}`} role="status">
          <Icon name={toast.kind === "error" ? "alert" : toast.kind === "success" ? "check" : "bell"} size={17} />
          <span>{toast.message}</span>
        </div>
      )}
    </AppShell>
  );
}