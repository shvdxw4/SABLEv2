import { useMemo, useState } from 'react'
import { NavLink, Route, Routes } from "react-router-dom"
import { API_BASE_URL } from './config'
import Landing from "./pages/landing"
import Upload from "./pages/upload"
import Library from "./pages/library" 
import Login from "./pages/login"
import Signup from "./pages/signup"
import ProtectedRoute from "./auth/ProtectedRoute";

function App() {
  const [dark, setDark] = useState(true);
  const rootClass = useMemo(() => (dark ? "dark" : ""), [dark]);

  const linkBase = "rounded-full px-3 py-1.5 text-sm transition border"
  const linkInactive =
    "border-black/10 text-black/70 hover:border-black/25 hover:text-black dark:border-sable-border dark:text-sable-muted dark:hover:border-sable-muted dark:hover:text-sable-text"
  const linkActive =
    "border-black/30 text-back dark:border-sable-muted dark:text-sable-text"

  return (
    <div className={rootClass}>
      <div className="min-h-screen bg-white text-black dark:bg-sable-bg dark:text-sable-text">
        <header className="sticky top-0 z-10 border-b border-black/10 bg-white/80 backdrop-blur dark:border-sable-border dark:bg-sable-bg/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-semibold tracking-wide">SABLE</span>
              
              <nav className="hidden items-center gap-2 sm:flex">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                >
                  Home
                </NavLink>

                <NavLink
                  to="/app"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                >
                  App
                </NavLink>

                <NavLink
                  to="/creator"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                >
                  Creator
                </NavLink>

                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                >
                  Login
                </NavLink>
              </nav>
            </div>
          
            <button
              onClick={() => setDark((v) => !v)}
              className="rounded-full border border-black/15 px-3 py-1.5 text-sm transition hover:border-black/30 dark:border-sable-border dark:hover:border-sable-muted"
            >
              {dark ? "Dark" : "Light"}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-10">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Library />
                </ProtectedRoute>
              }
            />
            <Route
              path="/creator"
              element={
                <ProtectedRoute requireCreator>
                  <Upload />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        <footer className="border-t border-black/10 py-8 dark:border-sable-border">
          <div className="mx-auto max-5xl px-4 text-sm text-black/60 dark:text-sable-muted">
            SABLE - MVP demo build. Monochromatic Heat.
          </div>
        </footer>  
      </div>
    </div>
  );
}

export default App;
