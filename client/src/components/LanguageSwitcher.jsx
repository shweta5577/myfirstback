import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      value={i18n.language?.slice(0, 2) || "en"}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="hi">Hindi</option>
      <option value="mr">Marathi</option>
    </select>
  );
}
