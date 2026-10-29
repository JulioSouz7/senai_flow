import { useState } from "react"; 
import type { Role } from "./types";

import { Login } from "./features/auth/Login";
import { Management } from "./features/management/ManagementView"; 
import { Teacher } from "./features/teacher/TeacherView"; 
import { StudentView } from './features/student/StudentView';

export default function App() {
  const [role, setRole] = useState<Role>("management");
  const [authenticated, setAuthenticated] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('@SENAIFlow:token');
    localStorage.removeItem('@SENAIFlow:perfil');
    setAuthenticated(false);
  };

  if (!authenticated) {
    return (
      <Login 
        enter={(selected) => {
          setRole(selected);
          setAuthenticated(true);
        }}
      />
    );
  }

if (role === "student") return <StudentView changeRole={setRole} {...({ onLogout: handleLogout } as any)} />;
if (role === "teacher") return <Teacher changeRole={setRole} onLogout={handleLogout} />;
  
  return <Management changeRole={setRole} onLogout={handleLogout} />;
}