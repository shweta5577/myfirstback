import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-pink-500/20 to-cyan-500/20 blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-6xl grid gap-8 md:grid-cols-2 items-center">
          
          {/* Left Section */}
          <div className="animate-slide-in-left">
            <div className="badge-cyan mb-6 inline-block">
              ✨ {t("landingBadge")}
            </div>
            
            <h1 className="heading-hero text-5xl lg:text-6xl mb-6 leading-tight">
              {t("welcomeTitle") || "Medicine Dispensing"}
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              {t("welcomeSubtitle") || "Automate, Track, and Optimize medication dispensing with AI-powered predictions and IoT integration."}
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500">
                  <span className="text-lg">🤖</span>
                </div>
                <span className="font-semibold text-slate-900">{t("landingFeature1")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-pink-500">
                  <span className="text-lg">📡</span>
                </div>
                <span className="font-semibold text-slate-900">{t("landingFeature2")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-500">
                  <span className="text-lg">🔐</span>
                </div>
                <span className="font-semibold text-slate-900">{t("landingFeature3")}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link to="/login" className="btn-primary">
                🚀 {t("landingLaunch")}
              </Link>
              <Link to="/signup" className="btn-outline">
                📝 {t("landingGetStarted")}
              </Link>
            </div>
          </div>

          {/* Right Section - Card Grid */}
          <div className="animate-slide-in-right">
            <div className="grid gap-6">
              {/* Card 1 */}
              <div className="card-dark group">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">Smart Dispensing</h3>
                  <span className="text-2xl">⚙️</span>
                </div>
                <p className="text-slate-400 text-sm">Automated schedule with temperature monitoring and dosage verification</p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <span className="badge-cyan text-xs">IoT Enabled</span>
                  <span className="badge-purple text-xs">Real-time</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="card-dark group">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">Adherence Tracking</h3>
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-slate-400 text-sm">Monitor patient compliance with AI-powered attendance prediction</p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <span className="badge-pink text-xs">AI Analytics</span>
                  <span className="badge-cyan text-xs">Predictive</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="card-dark group">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">Multi-Role System</h3>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-slate-400 text-sm">Seamless coordination between Patients, Doctors, and Administrators</p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <span className="badge-purple text-xs">RBAC</span>
                  <span className="badge-cyan text-xs">Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
