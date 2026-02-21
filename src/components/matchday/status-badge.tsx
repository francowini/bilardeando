"use client";

interface StatusBadgeProps {
  status: "OPEN" | "LOCK" | "LIVE" | "RESULTS";
}

const config: Record<
  string,
  { label: string; bg: string; text: string; animate?: boolean }
> = {
  OPEN: {
    label: "Abierto",
    bg: "bg-green-800",
    text: "text-white",
  },
  LOCK: {
    label: "Bloqueado",
    bg: "bg-amber-700",
    text: "text-white",
  },
  LIVE: {
    label: "En Vivo",
    bg: "bg-red-700",
    text: "text-white",
    animate: true,
  },
  RESULTS: {
    label: "Resultados",
    bg: "bg-primary",
    text: "text-primary-foreground",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status] || config.OPEN;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 font-heading font-bold text-xs uppercase border-2 border-border ${c.bg} ${c.text} ${c.animate ? "animate-pulse" : ""}`}
    >
      {c.animate && <span className="w-2 h-2 bg-white rounded-full" />}
      {c.label}
    </span>
  );
}
