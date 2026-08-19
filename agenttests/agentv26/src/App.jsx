import { useState } from "react";
import Home from "./screens/home.jsx";
import Detail from "./screens/detail.jsx";

export default function App() {
  const [active, setActive] = useState("home");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 lg:hidden">
        <button key="home" type="button" onClick={() => setActive("home")} className={active === "home" ? "rounded-[var(--radius-md)] bg-muted/50 px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring" : "rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"}>Home</button>
        <button key="detail" type="button" onClick={() => setActive("detail")} className={active === "detail" ? "rounded-[var(--radius-md)] bg-muted/50 px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring" : "rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"}>Detail</button>
      </div>
      {active === "home" ? <Home /> : null}
      {active === "detail" ? <Detail /> : null}
    </div>
  );
}
