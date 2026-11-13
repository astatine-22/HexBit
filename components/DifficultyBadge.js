import { getDifficulty } from "@/lib/ui";

export default function DifficultyBadge({
  difficulty,
  tone = "light",
  variant = "chip",
  className = "",
}) {
  const meta = getDifficulty(difficulty);

  if (variant === "bare") {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: meta.hex }}
        />
        {meta.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.16em] ring-1 ring-inset ${
        tone === "dark" ? meta.badgeDark : meta.badge
      } ${className}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: tone === "dark" ? meta.hexBright : meta.hex }}
      />
      {meta.label}
    </span>
  );
}