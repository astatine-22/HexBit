"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function LoadingCard({ label }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-16">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border border-line border-t-ink" />
        {label}
      </div>
    </div>
  );
}

/**
 * Gate for personalized App Router pages. Guests count as signed in; a missing
 * session is redirected to /login with a return path.
 */
export default function RequireAuth({ children, label = "Checking your session…" }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return <LoadingCard label={label} />;
  }

  if (!user) {
    return <LoadingCard label="Redirecting to log in…" />;
  }

  return children;
}
