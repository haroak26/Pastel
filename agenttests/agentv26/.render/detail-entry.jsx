import React from "react";
import { createRoot } from "react-dom/client";
import Detail from "./detail.jsx";

const el = document.getElementById("root");
createRoot(el).render(<Detail />);
window.__maxiMounted = true;
