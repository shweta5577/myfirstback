import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import StatCard from "../components/StatCard";

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [analytics, setAnalytics] = useState({ total: 0, taken: 0, missed: 0, adherencePercent: 100 });
  const [form, setForm] = useState({ patient: "", medicine: "", dosage: "1 tablet", frequencyPerDay: 2, timings: "09:00,21:00", startDate: "", endDate: "" });
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    const [{ data: pres }, { data: meds }, { data: patientList }] = await Promise.all([
      api.get("/prescriptions"),
      api.get("/medicines"),
      api.get("/auth/patients")
    ]);
    setPrescriptions(pres);
    setMedicines(meds);
    setPatients(patientList);

    if (pres[0]?.patient?._id) {
      const { data: analyticData } = await api.get(`/prescriptions/analytics/adherence?patientId=${pres[0].patient._id}`);
      setAnalytics(analyticData);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const calculateTreatmentDays = () => {
    if (!form.startDate || !form.endDate) return 0;

    // Parse as UTC midnight to avoid timezone drift for date-only inputs.
    const start = new Date(`${form.startDate}T00:00:00Z`);
    const end = new Date(`${form.endDate}T00:00:00Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return 0;
    }

    const diffTime = end.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleStartDateChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, startDate: value };
      if (next.endDate && value && next.endDate < value) {
        next.endDate = value;
      }
      return next;
    });
  };

  const handleEndDateChange = (value) => {
    setForm((prev) => {
      if (prev.startDate && value && value < prev.startDate) {
        return { ...prev, endDate: prev.startDate };
      }
      return { ...prev, endDate: value };
    });
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError(t("doctor.endDateBeforeStart", { defaultValue: "End date cannot be before start date." }));
      return;
    }

    try {
      await api.post("/prescriptions", {
        ...form,
        frequencyPerDay: Number(form.frequencyPerDay),
        timings: form.timings.split(",").map((x) => x.trim())
      });
      setForm({ patient: "", medicine: "", dosage: "1 tablet", frequencyPerDay: 2, timings: "09:00,21:00", startDate: "", endDate: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || t("doctor.saveFailed", { defaultValue: "Unable to save prescription" }));
    }
  };

  const chartData = useMemo(
    () => [
      { key: "Taken", value: analytics.taken },
      { key: "Missed", value: analytics.missed }
    ],
    [analytics]
  );

  return (
    <section className="min-h-screen p-6 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-hero text-4xl md:text-5xl mb-2">{t("doctorTitle")}</h1>
        <p className="text-slate-400">{t("doctorSubtitle")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <div className="card-dark border-l-4 border-blue-400">
          <p className="text-sm text-slate-400 mb-1">Total Dose Events</p>
          <p className="text-3xl font-bold text-blue-400">{analytics.total}</p>
        </div>
        <div className="card-dark border-l-4 border-green-400">
          <p className="text-sm text-slate-400 mb-1">Taken</p>
          <p className="text-3xl font-bold text-green-400">{analytics.taken}</p>
        </div>
        <div className="card-dark border-l-4 border-red-400">
          <p className="text-sm text-slate-400 mb-1">Missed</p>
          <p className="text-3xl font-bold text-red-400">{analytics.missed}</p>
        </div>
        <div className="card-dark border-l-4 border-cyan-400">
          <p className="text-sm text-slate-400 mb-1">Adherence Rate</p>
          <p className="text-3xl font-bold text-cyan-400">{analytics.adherencePercent}%</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        
        {/* Add Prescription Form */}
        <form onSubmit={onCreate} className="card-dark">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            ✍️ {t("createPrescription")}
          </h2>
          
          <div className="space-y-4">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">👤 Patient</label>
              <select 
                className="input-modern"
                value={form.patient} 
                onChange={(e) => setForm((p) => ({ ...p, patient: e.target.value }))} 
                required
              >
                <option value="">Select a patient...</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name} • {patient.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Choose which patient to prescribe for</p>
            </div>

            {/* Medicine Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">💊 Medicine</label>
              <select 
                className="input-modern"
                value={form.medicine} 
                onChange={(e) => setForm((p) => ({ ...p, medicine: e.target.value }))} 
                required
              >
                <option value="">Select a medicine...</option>
                {medicines.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Pick from available inventory</p>
            </div>

            {/* Dosage */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">📏 Dosage</label>
              <input 
                className="input-modern"
                placeholder="e.g., 1 tablet, 2 capsules, 5ml" 
                value={form.dosage} 
                onChange={(e) => setForm((p) => ({ ...p, dosage: e.target.value }))} 
                required 
              />
              <p className="text-xs text-slate-400 mt-1">Amount per dose</p>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">⏰ Times Per Day</label>
              <input 
                className="input-modern"
                type="number" 
                min="1" 
                max="6" 
                value={form.frequencyPerDay} 
                onChange={(e) => setForm((p) => ({ ...p, frequencyPerDay: e.target.value }))} 
                required 
              />
              <p className="text-xs text-slate-400 mt-1">How many times daily</p>
            </div>

            {/* Timings */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">🕐 Medicine Times</label>
              <input 
                className="input-modern"
                placeholder="09:00, 21:00" 
                value={form.timings} 
                onChange={(e) => setForm((p) => ({ ...p, timings: e.target.value }))} 
                required 
              />
              <p className="text-xs text-slate-400 mt-1">Comma-separated times (HH:MM format)</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">📅 Start</label>
                <input 
                  className="input-modern"
                  type="date" 
                  value={form.startDate} 
                  onChange={(e) => handleStartDateChange(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">📅 End</label>
                <input 
                  className="input-modern"
                  type="date" 
                  min={form.startDate || undefined}
                  value={form.endDate} 
                  onChange={(e) => handleEndDateChange(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {form.startDate && form.endDate && form.endDate < form.startDate && (
              <p className="text-xs text-red-300">End date must be on or after start date.</p>
            )}

            {/* Treatment Summary */}
            {form.startDate && form.endDate && (
              <div className="rounded-lg p-4 border-l-4 border-amber-400 bg-amber-500/10">
                <p className="text-sm font-semibold text-amber-300 mb-1">
                  ⏳ {t("treatmentDuration")}: {calculateTreatmentDays()} {t("doctor.days", { defaultValue: "days" })}
                </p>
                <p className="text-xs text-amber-200">
                  {form.dosage} {form.frequencyPerDay}x daily for {calculateTreatmentDays()} days
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-400/30">
                <p className="text-sm text-red-300 font-semibold">❌ {error}</p>
              </div>
            )}

            <button className="btn-primary w-full mt-4" type="submit">
              ✓ {t("savePrescription")}
            </button>
          </div>
        </form>

        {/* Analytics Chart */}
        <div className="card-dark">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            📊 Adherence Analytics
          </h2>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="key" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-sm text-slate-400">
            <p>Total dose events tracked across all patients</p>
          </div>
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="card-dark">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          📋 All Prescriptions
        </h2>
        
        {prescriptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-slate-400">No prescriptions created yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Per Day</th>
                  <th>Times</th>
                  <th>{t("totalDays")}</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p) => (
                  (() => {
                    const start = p.startDate ? new Date(`${new Date(p.startDate).toISOString().slice(0, 10)}T00:00:00Z`) : null;
                    const end = p.endDate ? new Date(`${new Date(p.endDate).toISOString().slice(0, 10)}T00:00:00Z`) : null;
                    const totalDays = start && end && end >= start
                      ? Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                      : 0;

                    return (
                  <tr key={p._id}>
                    <td className="font-semibold">{p.patient?.name || 'Unknown'}</td>
                    <td>{p.medicine?.name}</td>
                    <td>{p.dosage}</td>
                    <td className="font-semibold text-cyan-300">
                      {(p.frequencyPerDay || (p.timings || []).length || 0)}x/day
                    </td>
                    <td className="text-xs">{(p.timings || []).join(", ")}</td>
                    <td className="text-xs font-semibold text-amber-300">{totalDays} days</td>
                    <td className="text-xs text-slate-400">
                      {p.startDate && p.endDate ? `${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}` : '-'}
                    </td>
                  </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
