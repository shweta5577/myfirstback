import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useTranslation } from "react-i18next";
import api from "../services/api";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", { autoConnect: false });

export default function MachineMonitoringPage() {
  const { t } = useTranslation();
  const [machine, setMachine] = useState(null);
  const [logs, setLogs] = useState([]);
  const [temperature, setTemperature] = useState(25);

  const load = async () => {
    const { data } = await api.get("/admin/machine");
    setMachine(data.machine);
    setLogs(data.logs || []);
  };

  useEffect(() => {
    load();
    socket.connect();
    socket.on("iot:temperature", (payload) => setMachine(payload));
    socket.on("machine:log", (log) => setLogs((prev) => [log, ...prev].slice(0, 50)));
    return () => {
      socket.off("iot:temperature");
      socket.off("machine:log");
      socket.disconnect();
    };
  }, []);

  const sendTemperature = async () => {
    await api.post("/iot/temperature", { machineId: "MACHINE-001", temperature: Number(temperature) });
  };

  const simulatePillDrop = async () => {
    await api.post("/iot/pill-drop", { detected: true });
  };

  return (
    <section className="min-h-screen p-6 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-hero text-4xl md:text-5xl mb-2">🤖 {t("machineTitle")}</h1>
        <p className="text-slate-400">{t("machineSubtitle")}</p>
      </div>

      {/* Machine Status Grid */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {/* Machine ID */}
        <div className="card-dark border-l-4 border-blue-400">
          <p className="text-sm text-slate-400 mb-1">Machine ID</p>
          <p className="text-3xl font-bold text-blue-400 font-mono">{machine?.machineId || "MACHINE-001"}</p>
          <p className="text-xs text-slate-500 mt-2">Unique dispenser identifier</p>
        </div>

        {/* Current Temperature */}
        <div className={`card-dark border-l-4 ${
          (machine?.temperature ?? 0) > 30 ? "border-red-400" :
          (machine?.temperature ?? 0) > 20 ? "border-yellow-400" :
          "border-green-400"
        }`}>
          <p className="text-sm text-slate-400 mb-1">Current Temperature</p>
          <p className={`text-3xl font-bold font-mono ${
            (machine?.temperature ?? 0) > 30 ? "text-red-400" :
            (machine?.temperature ?? 0) > 20 ? "text-yellow-400" :
            "text-green-400"
          }`}>
            {machine?.temperature ?? "-"}°C
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {(machine?.temperature ?? 0) > 30 ? "⚠️ High" :
             (machine?.temperature ?? 0) > 20 ? "⚡ Moderate" :
             "✅ Optimal"}
          </p>
        </div>

        {/* Lock State */}
        <div className={`card-dark border-l-4 ${machine?.isLocked ? "border-red-400" : "border-green-400"}`}>
          <p className="text-sm text-slate-400 mb-1">Machine Status</p>
          <p className={`text-3xl font-bold ${machine?.isLocked ? "text-red-400" : "text-green-400"}`}>
            {machine?.isLocked ? "🔒 LOCKED" : "🔓 UNLOCKED"}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {machine?.isLocked ? "Cannot dispense" : "Ready to dispense"}
          </p>
        </div>
      </div>

      {/* IoT Simulation Controls */}
      <div className="card-dark mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          ⚙️ {t("iotControls")}
        </h2>
        <p className="text-sm text-slate-400 mb-6">Send test signals to simulate real IoT device behavior</p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Temperature Simulation */}
          <div className="rounded-lg bg-slate-800/40 p-4 border border-slate-700">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              🌡️ Temperature Control
            </label>
            <div className="space-y-3">
              <input
                type="number"
                min="0"
                max="50"
                className="input-modern w-full"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="Enter temperature in °C"
              />
              <p className="text-xs text-slate-400">Safe range: 15-25°C</p>
              <button
                type="button"
                onClick={sendTemperature}
                className="btn-primary w-full text-sm"
              >
                📨 Send Temperature
              </button>
            </div>
          </div>

          {/* Pill Drop Simulation */}
          <div className="rounded-lg bg-slate-800/40 p-4 border border-slate-700">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              💊 Pill Drop Sensor
            </label>
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Simulate a medicine dispensing event</p>
              <button
                type="button"
                onClick={simulatePillDrop}
                className="btn-secondary w-full text-sm"
              >
                ✓ Simulate Pill Drop
              </button>
              <p className="text-xs text-slate-500 text-center">Triggers RFID verification</p>
            </div>
          </div>

          {/* Status Info */}
          <div className="rounded-lg bg-slate-800/40 p-4 border border-slate-700">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              📊 Machine Status
            </label>
            <div className="space-y-2 text-sm">
              <p className="text-slate-300">
                <span className="text-cyan-400 font-bold">Status:</span> {machine?.isLocked ? "🔴 LOCKED" : "🟢 Active"}
              </p>
              <p className="text-slate-300">
                <span className="text-cyan-400 font-bold">Temp:</span> {machine?.temperature ?? "-"}°C
              </p>
              <p className="text-slate-300">
                <span className="text-cyan-400 font-bold">Logs:</span> {logs.length} entries
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Machine Logs */}
      <div className="card-dark">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          📋 {t("machineLogs")}
        </h2>
        <p className="text-sm text-slate-400 mb-6">Real-time events and IoT sensor data (Last 50 entries)</p>

        {logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-400">No machine logs yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.map((log) => {
              let actionColor = "text-slate-300";
              let actionBg = "bg-slate-800/40";
              let icon = "📌";

              if (log.action.includes("Temperature")) {
                actionColor = "text-yellow-300";
                actionBg = "bg-yellow-500/10";
                icon = "🌡️";
              } else if (log.action.includes("Pill")) {
                actionColor = "text-green-300";
                actionBg = "bg-green-500/10";
                icon = "💊";
              } else if (log.action.includes("Lock") || log.action.includes("Unlock")) {
                actionColor = "text-orange-300";
                actionBg = "bg-orange-500/10";
                icon = "🔐";
              } else if (log.action.includes("Error")) {
                actionColor = "text-red-300";
                actionBg = "bg-red-500/10";
                icon = "❌";
              }

              return (
                <div
                  key={log._id}
                  className={`rounded-lg border border-slate-700 ${actionBg} p-4 hover:bg-slate-800/60 transition-all duration-200`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className={`font-semibold ${actionColor} text-sm mb-1`}>
                        {icon} {log.action}
                      </p>
                      <p className="text-xs text-slate-400">
                        🕐 {new Date(log.createdAt).toLocaleString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${actionBg} ${actionColor}`}>
                      {log.action.split(" ")[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
