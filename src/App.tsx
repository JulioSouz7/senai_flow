import { useState } from "react"; 
import type { Role } from "./types";

import { Login } from "./features/auth/Login";
import { Management } from "./features/management/ManagementView"; 
import { Teacher } from "./features/teacher/TeacherView"; 
import { Student } from "./features/student/StudentView";
 
 export default function App() {
   const [role,setRole]=useState<Role>("management");
   const [authenticated,setAuthenticated]=useState(false);
   if(!authenticated) return <Login enter={(selected)=>{setRole(selected);setAuthenticated(true)}}/>;
   if(role==="student") return <Student changeRole={setRole}/>;
   if(role==="teacher") return <Teacher changeRole={setRole}/>;
   return <Management changeRole={setRole}/>;
 }