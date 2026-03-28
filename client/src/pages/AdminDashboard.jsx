import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import StatCard from "../components/StatCard";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", { autoConnect: false });

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [machine, setMachine] = useState(null);
  const [logs, setLogs] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({ name: "", stockCount: 0, expiryDate: "", price: 1 });
  const [payment, setPayment] = useState({ patient: "", medicine: "", amount: 0, method: "upi" });

  const load = async () => {
    const [{ data: adminData }, { data: meds }] = await Promise.all([api.get("/admin/machine"), api.get("/medicines")]);
    setMachine(adminData.machine);
    setLogs(adminData.logs || []);
    setMedicines(meds || []);
  };

  useEffect(() => {
    load();
    socket.connect();
    socket.on("machine:log", load);
    socket.on("inventory:updated", load);
    socket.on("iot:temperature", load);
    return () => {
      socket.off("machine:log", load);
      socket.off("inventory:updated", load);
      socket.off("iot:temperature", load);
      socket.disconnect();
    };
  }, []);

  const toggleLock = async (lock) => {
    await api.post("/admin/machine/lock", { lock });
    load();
  };

  const addMedicine = async (e) => {
    e.preventDefault();
    await api.post("/medicines", form);
    setForm({ name: "", stockCount: 0, expiryDate: "", price: 1 });
    load();
  };

  const triggerDispense = async (medicineId) => {
    await api.post("/iot/dispense", { medicineId, quantity: 1 });
  };

  const doMockPayment = async (e) => {
    e.preventDefault();
    await api.post("/admin/payment/mock", { ...payment, amount: Number(payment.amount) });
    alert(t("admin.paymentDone", { defaultValue: "Payment simulated and logged." }));
  };

  return (
    <section className="min-h-screen p-6 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-hero text-4xl md:text-5xl mb-2">{t("adminTitle")}</h1>
        <p className="text-slate-400">{t("adminSubtitle")}</p>
      </div>

      {/* Machine Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="card-dark border-l-4 border-cyan-400">
          <p className="text-sm text-slate-400 mb-1">Machine Temperature</p>
          <p className="text-3xl font-bold text-cyan-400">{machine?.temperature ?? "-"}°C</p>
        </div>
        <div className={`card-dark border-l-4 ${machine?.isLocked ? `border-red-400` : `border-green-400`}`}>
          <p className="text-sm text-slate-400 mb-1">Machine Status</p>
          <p className={`text-3xl font-bold ${machine?.isLocked ? `text-red-400` : `text-green-400`}`}>
            {machine?.isLocked ? "🔒 Locked" : "🔓 Unlocked"}
          </p>
        </div>
        <div className="card-dark border-l-4 border-purple-400">
          <p className="text-sm text-slate-400 mb-1">Total Medicines</p>
          <p className="text-3xl font-bold text-purple-400">{medicines.length}</p>
        </div>
        <div className="card-dark border-l-4 border-orange-400">
          <p className="text-sm text-slate-400 mb-1">Activity Logs</p>
          <p className="text-3xl font-bold text-orange-400">{logs.length}</p>
        </div>
      </div>

      {/* Machine Control */}
      <div className="flex gap-3 mb-8">
        <button
          type="button"
          onClick={() => toggleLock(true)}
          className="btn-accent flex-1"
        >
          🔒 Lock Machine
        </button>
        <button
          type="button"
          onClick={() => toggleLock(false)}
          className="btn-secondary flex-1"
        >
          🔓 Unlock Machine
        </button>
      </div>

      {/* Forms Grid */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        
        {/* Add Medicine Form */}
        <form onSubmit={addMedicine} className="card-dark">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            ➕ {t("addMedicine")}
          </h2>
          
          <div className="space-y-4">
            {/* Medicine Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">💊 Medicine Name</label>
              <input
                className="input-modern"
                placeholder="e.g., Paracetamol"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <p className="text-xs text-slate-400 mt-1">Generic or brand name</p>
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">📦 Stock Quantity</label>
              <input
                className="input-modern"
                type="number"
                placeholder="0"
                min="0"
                value={form.stockCount}
                onChange={(e) => setForm((p) => ({ ...p, stockCount: Number(e.target.value) }))}
                required
              />
              <p className="text-xs text-slate-400 mt-1">Number of units available</p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">💰 Price Per Unit</label>
              <input
                className="input-modern"
                type="number"
                placeholder="1.00"
                min="1"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                required
              />
              <p className="text-xs text-slate-400 mt-1">Cost per unit (₹)</p>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">📅 Expiry Date</label>
              <input
                className="input-modern"
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                required
              />
              <p className="text-xs text-slate-400 mt-1">Medicine cannot dispense after this date</p>
            </div>
          </div>

          <button className="btn-primary w-full mt-6" type="submit">
            ✓ Add to Inventory
          </button>
        </form>

        {/* Mock Payment Form */}
        <form onSubmit={doMockPayment} className="card-dark">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            💳 {t("mockPayment")}
          </h2>
          <p className="text-sm text-slate-400 mb-4">Simulate payment processing (Phase 2)</p>
          
          <div className="space-y-4">
            {/* Patient ID */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">👤 Patient ID</label>
              <input
                className="input-modern"
                placeholder="Patient unique ID"
                value={payment.patient}
                onChange={(e) => setPayment((p) => ({ ...p, patient: e.target.value }))}
                required
              />
              <p className="text-xs text-slate-400 mt-1">Who is making the payment</p>
            </div>

            {/* Medicine Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">💊 Medicine</label>
              <select
                className="input-modern"
                value={payment.medicine}
                onChange={(e) => setPayment((p) => ({ ...p, medicine: e.target.value }))}
                required
              >
                <option value="">Select medicine...</option>
                {medicines.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} (₹{m.price})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Item being purchased</p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">💵 Amount</label>
              <input
                className="input-modern"
                type="number"
                placeholder="100"
                min="0"
                step="1"
                value={payment.amount}
                onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))}
                required
              />
              <p className="text-xs text-slate-400 mt-1">Payment amount (₹)</p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">🏦 Method</label>
              <select
                className="input-modern"
                value={payment.method}
                onChange={(e) => setPayment((p) => ({ ...p, method: e.target.value }))}
              >
                <option value="upi">📱 UPI (Google Pay, PhonePe)</option>
                <option value="card">💳 Debit/Credit Card</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">Payment gateway</p>
            </div>
          </div>

          <button className="btn-secondary w-full mt-6" type="submit">
            ✓ Process Payment
          </button>
        </form>
      </div>

      {/* Medicine Dispense Control */}
      <div className="card-dark">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          🤖 {t("dispenseControl")}
        </h2>

        {medicines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-slate-400">No medicines in inventory yet</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {medicines.map((m) => (
              <div
                key={m._id}
                className="rounded-lg border border-slate-700 bg-slate-800/40 hover:bg-slate-800/60 p-4 transition-all duration-200"
              >
                <h3 className="font-semibold text-white text-lg mb-2">{m.name}</h3>
                <p className="text-sm text-slate-400 mb-1">📦 Stock: <span className="text-cyan-400 font-bold">{m.stockCount}</span></p>
                <p className="text-sm text-slate-400 mb-1">💰 Price: <span className="text-green-400 font-bold">₹{m.price}</span></p>
                <p className="text-xs text-slate-500 mb-4">📅 Exp: {new Date(m.expiryDate).toLocaleDateString()}</p>
                <button
                  type="button"
                  onClick={() => triggerDispense(m._id)}
                  className="btn-primary w-full text-sm"
                >
                  ✓ Dispense 1 Unit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
