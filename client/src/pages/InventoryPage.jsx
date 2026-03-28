import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";

export default function InventoryPage() {
  const { t } = useTranslation();
  const [medicines, setMedicines] = useState([]);
  const [alerts, setAlerts] = useState({ lowStock: [], expiringSoon: [] });
  const [stockDrafts, setStockDrafts] = useState({});

  const load = async () => {
    const [{ data: meds }, { data: alertData }] = await Promise.all([
      api.get("/medicines"),
      api.get("/medicines/alerts/inventory")
    ]);
    setMedicines(meds);
    setAlerts(alertData);
    setStockDrafts(
      Object.fromEntries((meds || []).map((medicine) => [medicine._id, medicine.stockCount]))
    );
  };

  useEffect(() => {
    load();
  }, []);

  const updateStock = async (medicineId) => {
    await api.post("/iot/stock", { medicineId, stockCount: Number(stockDrafts[medicineId]) });
    load();
  };

  return (
    <section className="min-h-screen p-6 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-hero text-4xl md:text-5xl mb-2">{t("inventoryTitle")}</h1>
        <p className="text-slate-400">{t("inventorySubtitle")}</p>
      </div>
      
      {/* Alert Cards */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        
        {/* Low Stock Alerts */}
        <div className="card-dark border-l-4 border-yellow-400 border-l-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-3">
            ⚠️ {t("lowStockAlerts")}
          </h2>
          <p className="text-sm text-slate-400 mb-4">Medicines below 10 units cannot be dispensed</p>
          
          {alerts.lowStock.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">✓</p>
              <p className="text-slate-300 font-semibold">All medicines have sufficient stock</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {alerts.lowStock.map((m) => (
                <li
                  key={m._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-400/30"
                >
                  <span className="font-semibold text-white">{m.name}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-300">
                    📦 {m.stockCount} units
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Expiry Alerts */}
        <div className="card-dark border-l-4 border-red-400">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-3">
            📅 {t("expiryAlerts")}
          </h2>
          <p className="text-sm text-slate-400 mb-4">Medicines expiring within 30 days cannot be dispensed</p>
          
          {alerts.expiringSoon.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">✓</p>
              <p className="text-slate-300 font-semibold">No medicines expiring soon</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {alerts.expiringSoon.map((m) => (
                <li
                  key={m._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-400/30"
                >
                  <span className="font-semibold text-white">{m.name}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-400/20 text-red-300">
                    📅 {new Date(m.expiryDate).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Stock Management Table */}
      <div className="card-dark">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          📦 {t("stockManagement")}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Color coding: 🟢 Green (20+) | 🟡 Amber (10-20) | 🔴 Red (&lt;10)
        </p>

        {medicines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-400">No medicines in inventory yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern w-full">
              <thead>
                <tr>
                  <th>💊 Medicine</th>
                  <th>📦 Current Stock</th>
                  <th>📅 Expiry Date</th>
                  <th>⚙️ Update Stock</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m) => {
                  let statusColor = "text-green-400";
                  let statusBg = "bg-green-500/10";
                  let statusIcon = "🟢";
                  
                  if (m.stockCount < 10) {
                    statusColor = "text-red-400";
                    statusBg = "bg-red-500/10";
                    statusIcon = "🔴";
                  } else if (m.stockCount < 20) {
                    statusColor = "text-yellow-400";
                    statusBg = "bg-yellow-500/10";
                    statusIcon = "🟡";
                  }
                  
                  return (
                    <tr key={m._id} className="hover:bg-slate-700/70 transition-colors duration-200 cursor-pointer">
                      <td className="font-semibold text-white">{m.name}</td>
                      <td>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusBg} ${statusColor}`}>
                          {statusIcon} {m.stockCount} {m.stockCount === 1 ? "unit" : "units"}
                        </span>
                      </td>
                      <td className="text-slate-300">
                        {new Date(m.expiryDate).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={stockDrafts[m._id] ?? m.stockCount}
                            onChange={(e) =>
                              setStockDrafts((prev) => ({
                                ...prev,
                                [m._id]: e.target.value
                              }))
                            }
                            className="input-modern w-20 text-center"
                            placeholder="Qty"
                          />
                          <button
                            type="button"
                            onClick={() => updateStock(m._id)}
                            className="btn-primary text-sm px-4 py-2"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
