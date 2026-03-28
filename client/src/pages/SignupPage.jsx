import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "patient" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      const user = JSON.parse(localStorage.getItem("user"));
      if (user.role === "patient") navigate("/patient");
      else if (user.role === "doctor") navigate("/doctor");
      else navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: "patient", label: `👤 ${t("rolePatient")}`, description: t("rolePatientDesc") },
    { value: "doctor", label: `👨‍⚕️ ${t("roleDoctor")}`, description: t("roleDoctorDesc") },
    { value: "admin", label: `⚙️ ${t("roleAdmin")}`, description: t("roleAdminDesc") },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-br from-pink-500/20 to-orange-500/20 blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="glass-dark p-8 md:p-10 shadow-lg-glow border-2 border-purple-400/20">
          
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h1 className="heading-hero text-3xl mb-2">{t("signupTitle")}</h1>
            <p className="text-slate-400">{t("signupSubtitle")}</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            
            {/* Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">{t("fullName")}</label>
              <input
                className="input-modern"
                placeholder="John Doe"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            {/* Email Field */}
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

            {/* Password Field */}
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

            {/* Role Selection */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-semibold text-slate-200">{t("iAmA")}</label>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((role) => (
                  <label key={role.value} className="cursor-pointer">
                    <input
                      type="radio"
                      value={role.value}
                      checked={form.role === role.value}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      form.role === role.value
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-slate-600 bg-transparent hover:border-cyan-400/50"
                    }`}>
                      <p className="font-semibold text-white">{role.label}</p>
                      <p className="text-xs text-slate-400">{role.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/20 border border-red-400/30 mt-4">
                <p className="text-sm text-red-300 font-semibold">❌ {error}</p>
              </div>
            )}

            <button 
              className="btn-secondary w-full mt-6"
              type="submit"
              disabled={loading}
            >
              {loading ? `⏳ ${t("creatingAccount")}` : `✨ ${t("createAccount")}`}
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

          {/* Login Link */}
          <p className="text-center text-slate-400">
            {t("alreadyHaveAccount")}{" "}
            <Link to="/login" className="font-semibold text-purple-400 hover:text-purple-300 transition">
              {t("signInLink")}
            </Link>
          </p>
        </div>

        {/* Security Note */}
        <div className="mt-6 p-4 rounded-lg glass text-center text-xs text-slate-400">
          <p>🔒 {t("passwordHint")}</p>
        </div>
      </div>
    </div>
  );
}
