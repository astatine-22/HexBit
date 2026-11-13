import { highlightCode, tokenClassName } from "@/lib/highlight";
import { getLanguage } from "@/lib/ui";

export default function CodePreview({
  code,
  language,
  filename,
  label = "read-only preview",
  className = "",
}) {
  const meta = getLanguage(language);
  const lines = highlightCode(code);

  return (
    <div
      className={`overflow-hidden rounded-[4px] border border-black/50 bg-[#101113] shadow-[0_30px_60px_-30px_rgba(20,21,15,0.6)] ${className}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-[#3a3d33]" />
            <span className="h-2 w-2 rounded-full bg-[#3a3d33]" />
            <span className="h-2 w-2 rounded-full bg-[#3a3d33]" />
          </span>
          <span className="truncate font-mono text-[11px] text-paper/60">
            {filename ?? `starter.${meta.ext}`}
          </span>
        </div>
        <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.2em] text-paper/35">
          {label}
        </span>
      </div>

      <div className="code-scroll max-h-[430px] overflow-auto">
        <div className="min-w-max py-4 font-mono text-[12px] leading-[1.75] sm:text-[13px]">
          {lines.map((tokens, index) => (
            <div key={index} className="flex">
              <span
                className="w-11 shrink-0 select-none pr-4 text-right text-paper/25"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <code className="whitespace-pre pr-8">
                {tokens.length > 0
                  ? tokens.map((token, tokenIndex) => (
                      <span
                        key={`${index}-${tokenIndex}`}
                        className={tokenClassName(token.type)}
                      >
                        {token.text}
                      </span>
                    ))
                  : "\u00A0"}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}