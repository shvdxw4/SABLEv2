import { useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import Landing from "./pages/landing";
import Home from "./pages/home";
import Upload from "./pages/upload";
import Library from "./pages/library";
import Login from "./pages/login";
import Signup from "./pages/signup";
import CreatorLogin from "./pages/creator-login";
import CreatorSignup from "./pages/creator-signup";
import PlayerLayout from "./layouts/PlayerLayout";
import ProtectedRoute from "./auth/ProtectedRoute";
import { useAuth } from "./auth/AuthContext";

function StandardShell({
  children,
  dark,
  setDark,
}: {
  children: React.ReactNode;
  dark: boolean;
  setDark: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { user, logout } = useAuth();

  const linkBase = "rounded-full px-3 py-1.5 text-sm transition border";
  const linkInactive =
    "border-black/10 text-black/70 hover:border-black/25 hover:text-black dark:border-sable-border dark:text-sable-muted dark:hover:border-sable-muted dark:hover:text-sable-text";
  const linkActive =
    "border-black/30 text-black dark:border-sable-muted dark:text-sable-text";

  return (
    <>
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

              {user && user.role !== "creator" && (
                <NavLink
                  to="/library"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                >
                  Library
                </NavLink>
              )}

              {!user && (
                <>
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      `${linkBase} ${isActive ? linkActive : linkInactive}`
                    }
                  >
                    Login
                  </NavLink>

                  <NavLink
                    to="/signup"
                    className={({ isActive }) =>
                      `${linkBase} ${isActive ? linkActive : linkInactive}`
                    }
                  >
                    Sign Up
                  </NavLink>
                </>
              )}

              {user && (
                <button
                  type="button"
                  onClick={logout}
                  className={`${linkBase} ${linkInactive}`}
                >
                  Logout
                </button>
              )}
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

      <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>

      <footer className="border-t border-black/10 py-8 dark:border-sable-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 text-sm text-black/60 dark:text-sable-muted">
          <span>SABLE - MVP demo build. Monochromatic Heat.</span>

          <Link
            to="/creator-login"
            className="underline-offset-4 hover:underline"
          >
            For Artists
          </Link>
        </div>
      </footer>
    </>
  );
}

function AppShell() {
  const [dark, setDark] = useState(true);
  const rootClass = useMemo(() => (dark ? "dark" : ""), [dark]);
  const location = useLocation();

  const pathname = location.pathname;
  const isLanding = pathname === "/";
  const isPlayerApp = pathname === "/home" || pathname === "/library";

  return (
    <div className={rootClass}>
      <div className="min-h-screen bg-white text-black dark:bg-sable-bg dark:text-sable-text">
        {isLanding ? (
          <Routes>
            <Route path="/" element={<Landing />} />
          </Routes>
        ) : isPlayerApp ? (
          <Routes>
            <Route
              element={
                <ProtectedRoute>
                  <PlayerLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/home" element={<Home />} />
              <Route path="/library" element={<Library />} />
            </Route>
          </Routes>
        ) : (
          <StandardShell dark={dark} setDark={setDark}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/creator-login" element={<CreatorLogin />} />
              <Route path="/creator-signup" element={<CreatorSignup />} />
              <Route
                path="/creator"
                element={
                  <ProtectedRoute requireCreator>
                    <Upload />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </StandardShell>
        )}
      </div>
    </div>
  );
}

export default AppShell;