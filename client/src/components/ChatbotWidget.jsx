import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ChatbotWidget() {
  const { t } = useTranslation();
  const qa = [
    { q: t("chatbotQ1"), a: t("chatbotA1") },
    { q: t("chatbotQ2"), a: t("chatbotA2") },
    { q: t("chatbotQ3"), a: t("chatbotA3") }
  ];
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState(t("chatbotDefault"));

  const onAsk = () => {
    const found = qa.find((item) => query.toLowerCase().includes(item.q));
    setAnswer(found ? found.a : t("chatbotNoMatch"));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="font-display text-lg font-semibold">{t("chatbotTitle")}</h3>
      <p className="mt-2 text-sm text-slate-500">{answer}</p>
      <div className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("chatbotPlaceholder")}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="button" onClick={onAsk} className="rounded-xl bg-brand-ink px-4 py-2 text-sm font-semibold text-white">
          {t("chatbotAsk")}
        </button>
      </div>
    </section>
  );
}
