import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems = [
  { to: "/patient", label: "patientDashboard", roles: ["patient"] },
  { to: "/doctor", label: "doctorDashboard", roles: ["doctor", "admin"] },
  { to: "/admin", label: "adminDashboard", roles: ["admin"] },
  { to: "/machine", label: "machineMonitoring", roles: ["admin", "doctor"] },
  { to: "/inventory", label: "inventory", roles: ["admin", "doctor"] }
];

export default function Layout({ children }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/10 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/10 rounded-full mix-blend-screen filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-gradient-to-l from-orange-500/10 to-pink-500/10 rounded-full mix-blend-screen filter blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Modern Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-cyan-500/10 bg-slate-950/40">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500">
                <span className="text-lg font-bold">💊</span>
              </div>
              <span className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent hidden sm:block">
                {t("appName")}
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              {user && (
                <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                  <span className="text-sm text-slate-300 font-medium hidden sm:block">
                    {user.name}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-red-500/30"
                  >
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Modern Navigation */}
        {user && (
          <nav className="sticky top-16 z-40 backdrop-blur-md border-b border-slate-800/50 bg-slate-950/30 px-4 py-3">
            <div className="mx-auto max-w-7xl flex flex-wrap gap-2">
              {navItems
                .filter((item) => item.roles.includes(user.role))
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      isActive
                        ? "rounded-lg px-4 py-2 text-sm font-bold bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30 transition-all duration-200"
                        : "rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
                    }
                  >
                    📌 {t(item.label)}
                  </NavLink>
                ))}
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
