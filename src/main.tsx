import { createRoot } from "react-dom/client";
import { IdentityProvider } from "./contexts/IdentityContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <IdentityProvider>
    <App />
  </IdentityProvider>
);
