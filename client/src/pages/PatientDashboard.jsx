import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { io } from "socket.io-client";
import api from "../services/api";
import StatCard from "../components/StatCard";
import ChatbotWidget from "../components/ChatbotWidget";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", { autoConnect: false });

export default function PatientDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState({ patient: null, prescriptions: [], upcomingEvents: [], history: [] });
  const [rfidCard, setRfidCard] = useState("CARD1234");
  const [rfidStatus, setRfidStatus] = useState("");

  const load = async () => {
    const [{ data: dashboard }, { data: directPrescriptions }] = await Promise.all([
      api.get("/patient/dashboard"),
      api.get("/prescriptions")
    ]);

    const mergedPrescriptions = (dashboard.prescriptions && dashboard.prescriptions.length)
      ? dashboard.prescriptions
      : (directPrescriptions || []);

    setData({
      ...dashboard,
      prescriptions: mergedPrescriptions
    });
  };

  useEffect(() => {
    load();
    socket.connect();
    socket.on("dose:scheduled", load);
    socket.on("dose:updated", load);
    socket.on("dose:missed", load);
    return () => {
      socket.off("dose:scheduled", load);
      socket.off("dose:updated", load);
      socket.off("dose:missed", load);
      socket.disconnect();
    };
  }, []);

  const stats = useMemo(() => {
    const total = data.history.length;
    const taken = data.history.filter((x) => x.status === "taken").length;
    const missed = data.history.filter((x) => x.status === "missed").length;
    const pending = data.history.filter((x) => x.status === "pending").length;
    return { total, taken, missed, pending, adherence: total ? Math.round((taken / total) * 100) : 100 };
  }, [data.history]);

  const pieData = [
    { name: "Taken", value: stats.taken, color: "#0d9488" },
    { name: "Missed", value: stats.missed, color: "#f43f5e" },
    { name: "Pending", value: stats.pending, color: "#f59e0b" }
  ];

  const markTaken = async (eventId) => {
    await api.post("/patient/dose/taken", { eventId, method: "manual" });
    load();
  };

  const verifyRfid = async () => {
    const { data: response } = await api.post("/iot/rfid-check", { cardId: rfidCard });
    setRfidStatus(response.valid ? "Verified" : "Failed");
  };

  const triggerVoice = async () => {
    await api.post("/patient/voice-reminder");
    alert(t("patient.voiceSimulated", { defaultValue: "Voice reminder simulated." }));
  };

  const riskPrediction = stats.adherence < 80 ? "High risk of missed dose" : stats.adherence < 92 ? "Moderate risk" : "Low risk";

  return (
    <section className="min-h-screen p-6 pb-20">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="heading-hero text-4xl md:text-5xl">{t("patientTitle")}</h1>
          <span className="text-3xl animate-pulse-glow">💊</span>
        </div>
        <p className="text-slate-400">{t("patientSubtitle")}</p>
      </div>

      {/* Patient ID Card - Enhanced */}
      {data.patient && (
        <div className="card-dark border-2 border-cyan-400/30 mb-8 overflow-hidden shadow-lg-glow">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10"></div>
            <div className="relative grid gap-6 md:grid-cols-3 p-6">
              
              {/* Patient Code */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">📋 Patient Code</p>
                <p className="text-3xl font-bold text-white">{data.patient.patientCode || "—"}</p>
                <p className="text-xs text-slate-400">Unique identifier for records</p>
              </div>

              {/* System ID */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-purple-400">🆔 System ID</p>
                <p className="text-xs font-mono text-cyan-300 break-all bg-slate-800/50 p-2 rounded">{data.patient._id}</p>
                <p className="text-xs text-slate-400">Database reference ID</p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-pink-400">📧 Email ID</p>
                <p className="text-sm text-white break-all">{data.patient.email}</p>
                <p className="text-xs text-slate-400">Login identifier</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid - Enhanced */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="card-dark border-l-4 border-cyan-400 hover:shadow-glow-cyan">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Prescriptions</p>
              <p className="text-3xl font-bold text-cyan-400">{data.prescriptions.length}</p>
            </div>
            <span className="text-4xl opacity-30">💊</span>
          </div>
        </div>

        <div className="card-dark border-l-4 border-green-400 hover:shadow-glow-cyan">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Doses Taken</p>
              <p className="text-3xl font-bold text-green-400">{stats.taken}</p>
            </div>
            <span className="text-4xl opacity-30">✅</span>
          </div>
        </div>

        <div className="card-dark border-l-4 border-red-400 hover:shadow-glow-cyan">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Doses Missed</p>
              <p className="text-3xl font-bold text-red-400">{stats.missed}</p>
            </div>
            <span className="text-4xl opacity-30">❌</span>
          </div>
        </div>

        <div className="card-dark border-l-4 border-yellow-400 hover:shadow-glow-cyan">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Adherence Rate</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{stats.adherence}%</p>
            </div>
            <span className="text-4xl opacity-30">📊</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        
        {/* Medicine Schedule - Enhanced */}
        <div className="lg:col-span-2 card-dark">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                💊 {t("medicineSchedule")}
              </h2>
              <p className="text-sm text-slate-400 mt-2">Your upcoming and past doses</p>
            </div>
          </div>

          {data.upcomingEvents.length === 0 ? (
            data.prescriptions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.prescriptions.map((prescription) => (
                  <article
                    key={prescription._id}
                    className="rounded-lg border border-cyan-500/20 bg-slate-800/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white text-lg">
                        {prescription.medicine?.name || "Medicine"}
                      </p>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300">
                        {prescription.frequencyPerDay || 1}x/day
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2">
                      Dosage: <span className="text-cyan-300">{prescription.dosage}</span>
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      Times: <span className="text-cyan-300">{(prescription.timings || []).join(", ") || "Not set"}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {prescription.startDate && prescription.endDate
                        ? `${dayjs(prescription.startDate).format("DD MMM YYYY")} - ${dayjs(prescription.endDate).format("DD MMM YYYY")}`
                        : "Duration not set"}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">✨</p>
                <p className="text-slate-400">No doses scheduled yet</p>
              </div>
            )
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.upcomingEvents.map((event) => {
                let statusColor = "text-slate-600";
                let statusBg = "bg-slate-500/20";
                let statusEmoji = "⭕";
                let borderColor = "border-slate-600";
                
                if (event.status === "taken") {
                  statusColor = "text-green-400";
                  statusBg = "bg-green-500/20";
                  statusEmoji = "✅";
                  borderColor = "border-green-500/30";
                } else if (event.status === "missed") {
                  statusColor = "text-red-400";
                  statusBg = "bg-red-500/20";
                  statusEmoji = "❌";
                  borderColor = "border-red-500/30";
                } else if (event.status === "pending") {
                  statusColor = "text-yellow-400";
                  statusBg = "bg-yellow-500/20";
                  statusEmoji = "⏳";
                  borderColor = "border-yellow-500/30";
                }
                
                return (
                  <article key={event._id} className={`rounded-lg border ${borderColor} bg-slate-800/40 p-4 hover:bg-slate-800/60 transition-all duration-200`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-white text-lg">{event.prescription?.medicine?.name || "Medicine"}</p>
                        <p className="text-xs text-slate-400 mt-1.5">
                          📅 {dayjs(event.scheduledFor).format("DD MMM YYYY")} • 🕐 {dayjs(event.scheduledFor).format("hh:mm A")}
                        </p>
                      </div>
                      <span className={`${statusBg} ${statusColor} px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ml-2`}>
                        {statusEmoji} {event.status.toUpperCase()}
                      </span>
                    </div>
                    {event.status === "pending" && (
                      <button
                        type="button"
                        className="w-full mt-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:shadow-glow-cyan transition-all"
                        onClick={() => markTaken(event._id)}
                      >
                        ✓ Mark as Taken
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Prescriptions */}
        <div className="card-dark">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            📋 {t("activePrescriptions")}
          </h2>
          <p className="text-sm text-slate-400 mb-4">Medicines assigned to your account</p>

          {data.prescriptions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-slate-400 text-sm">No active prescriptions assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.prescriptions.map((prescription) => (
                <article
                  key={prescription._id}
                  className="rounded-lg border border-cyan-500/20 bg-slate-800/40 p-4"
                >
                  <p className="font-semibold text-white text-base">
                    {prescription.medicine?.name || "Medicine"}
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Dosage: <span className="text-cyan-300">{prescription.dosage}</span>
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Frequency: <span className="text-cyan-300">{prescription.frequencyPerDay || 1}x/day</span>
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Times: <span className="text-cyan-300">{(prescription.timings || []).join(", ") || "Not set"}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {prescription.startDate && prescription.endDate
                      ? `${dayjs(prescription.startDate).format("DD MMM YYYY")} - ${dayjs(prescription.endDate).format("DD MMM YYYY")}`
                      : "Duration not set"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Doctor: {prescription.doctor?.name || "Assigned doctor"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Dose Overview */}
        <div className="card-dark lg:col-span-3">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            📊 {t("doseOverview")}
          </h2>
          <p className="text-sm text-slate-400 mb-4">Visual breakdown of your history</p>
          
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={60}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Prediction */}
          <div className={`rounded-lg p-4 border-l-4 ${
            stats.adherence < 80 ? 'border-red-400 bg-red-500/10' :
            stats.adherence < 92 ? 'border-yellow-400 bg-yellow-500/10' :
            'border-green-400 bg-green-500/10'
          }`}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">🤖 AI Risk Prediction</p>
            <p className={`font-semibold ${
              stats.adherence < 80 ? 'text-red-400' :
              stats.adherence < 92 ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {riskPrediction}
            </p>
          </div>
        </div>
      </div>

      {/* RFID & Voice */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* RFID Verification */}
        <div className="card-dark">
          <h3 className="text-xl font-bold text-white mb-2">🔐 {t("rfidVerification")}</h3>
          <p className="text-sm text-slate-400 mb-4">Verify your medicine using RFID technology</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">RFID Card ID</label>
              <input
                value={rfidCard}
                onChange={(e) => setRfidCard(e.target.value)}
                className="input-modern"
                placeholder="Enter your RFID card ID"
              />
              <p className="text-xs text-slate-400 mt-2">Your unique card identifier for secure authentication</p>
            </div>

            {rfidStatus && (
              <div className={`rounded-lg p-3 text-sm font-semibold border-l-4 ${
                rfidStatus === "Verified" 
                  ? "bg-green-500/10 border-green-400 text-green-400" 
                  : "bg-red-500/10 border-red-400 text-red-400"
              }`}>
                {rfidStatus === "Verified" ? "✅ Verification Successful" : "❌ Verification Failed"}
              </div>
            )}

            <button 
              type="button" 
              onClick={verifyRfid} 
              className="btn-primary w-full"
            >
              ✓ Verify RFID Card
            </button>

            <button 
              type="button" 
              onClick={triggerVoice} 
              className="btn-secondary w-full"
            >
              🔊 {t("voiceReminder")}
            </button>
            <p className="text-xs text-slate-400 text-center">Get an audio reminder for your next dose</p>
          </div>
        </div>

        {/* Chatbot Widget */}
        <ChatbotWidget />
      </div>
    </section>
  );
}
