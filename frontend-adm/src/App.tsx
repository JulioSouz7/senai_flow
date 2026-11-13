import { useState } from "react";
import { Login } from "./features/auth/Login";
import { Management } from "./features/management/ManagementView";

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <Login enter={() => setAuthenticated(true)} />;
  }

  return <Management changeRole={(role) => console.log(role)} />
}