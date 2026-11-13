import { useState } from "react"; 
import type { Role } from "./types";

import { Login } from "./features/auth/Login";
import { Teacher } from "./features/teacher/TeacherView";
 
 export default function App() {
   const [role,setRole]=useState<Role>("management");
   const [authenticated,setAuthenticated]=useState(false);
   if(!authenticated) return <Login enter={(selected)=>{setRole(selected);setAuthenticated(true)}}/>;
   if(role==="teacher") return <Teacher/>;
   return;
 }