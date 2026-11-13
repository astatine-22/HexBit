import { getLanguage } from "@/lib/ui";

export default function LanguageMark({
  language,
  tone = "light",
  showLabel = false,
  className = "",
}) {
  const meta = getLanguage(language);

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-[4px] border font-mono text-[10px] font-semibold leading-none ${
          tone === "dark"
            ? "border-paper/25 bg-paper/5 text-paper/90"
            : "border-line bg-white/50 text-ink/80"
        }`}
        title={meta.label}
      >
        {meta.glyph}
      </span>
      {showLabel ? (
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
            tone === "dark" ? "text-paper/60" : "text-muted"
          }`}
        >
          {meta.label}
        </span>
      ) : null}
    </span>
  );
}