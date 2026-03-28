import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", role: "patient" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);

      if (user.role !== form.role) {
        logout();
        setError(t("roleMismatch", { role: user.role }));
        return;
      }

      if (user.role === "patient") navigate("/patient");
      else if (user.role === "doctor") navigate("/doctor");
      else navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-pink-500/20 to-orange-500/20 blur-3xl animate-float" style={{ animationDelay: "1.5s" }}></div>
      </div>

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="glass-dark p-8 md:p-10 shadow-lg-glow border-2 border-cyan-400/20">
          
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="heading-hero text-3xl mb-2">{t("loginTitle")}</h1>
            <p className="text-slate-400">{t("loginSubtitle")}</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">{t("loginAs")}</label>
              <select
                className="input-modern"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                required
              >
                <option value="patient">👤 {t("rolePatient")}</option>
                <option value="doctor">👨‍⚕️ {t("roleDoctor")}</option>
                <option value="admin">🛠️ {t("roleAdmin")}</option>
              </select>
              <p className="text-xs text-slate-400">{t("loginSelectRoleHint")}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">{t("email")}</label>
              <input
                className="input-modern"
                placeholder="you@example.com"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">{t("password")}</label>
              <input
                className="input-modern"
                placeholder="••••••••"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/20 border border-red-400/30">
                <p className="text-sm text-red-300 font-semibold">❌ {error}</p>
              </div>
            )}

            <button 
              className="btn-primary w-full mt-6"
              type="submit"
              disabled={loading}
            >
              {loading ? `🔄 ${t("signingIn")}` : `🚀 ${t("signIn")}`}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-400">{t("or")}</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-slate-400">
            {t("loginNewHere")}{" "}
            <Link to="/signup" className="font-semibold text-cyan-400 hover:text-cyan-300 transition">
              {t("createAccount")}
            </Link>
          </p>
        </div>

        {/* Demo Credentials Hint */}
        <div className="mt-6 p-4 rounded-lg glass text-center text-xs text-slate-400">
          <p>💡 {t("loginHint")}</p>
        </div>
      </div>
    </div>
  );
}
