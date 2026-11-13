import DifficultyBadge from "@/components/DifficultyBadge";

export default function DifficultyLegend({ className = "" }) {
  return (
    <div
      className={`flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-2 ${className}`}
    >
      {["easy", "medium", "hard"].map((difficulty) => (
        <DifficultyBadge
          key={difficulty}
          difficulty={difficulty}
          variant="bare"
        />
      ))}
    </div>
  );
}