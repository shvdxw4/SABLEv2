import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./auth/AuthContext";
import { PlayerProvider } from "./player/PlayerContext.tsx";
import { LibraryProvider } from "./library/LibraryContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <LibraryProvider>
            <App />
          </LibraryProvider>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);