"use client";

import type { FormationCode } from "@/types";
import { FORMATIONS, FORMATION_CODES } from "@/lib/formations";

interface FormationSelectorProps {
  selected: FormationCode;
  onChange: (formation: FormationCode) => void;
  disabled?: boolean;
}

/** Visual mini-preview of formation dots on a pitch outline */
function FormationPreview({ code }: { code: FormationCode }) {
  const formation = FORMATIONS[code];
  const rows = code.split("-").map(Number); // e.g. [4,3,3]

  return (
    <div className="w-16 h-20 bg-green-900/20 border border-border relative flex flex-col justify-between py-1">
      {/* GK dot */}
      <div className="flex justify-center">
        <div className="w-2 h-2 bg-amber-700 border border-border" />
      </div>
      {/* Field rows */}
      {rows.map((count, rowIdx) => (
        <div key={rowIdx} className="flex justify-center gap-1">
          {Array.from({ length: count }).map((_, dotIdx) => {
            const colors = ["bg-blue-800", "bg-green-800", "bg-red-700"];
            return (
              <div
                key={dotIdx}
                className={`w-2 h-2 ${colors[rowIdx] || "bg-gray-600"} border border-border`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function FormationSelector({
  selected,
  onChange,
  disabled,
}: FormationSelectorProps) {
  return (
    <div className="card-retro">
      <div className="card-retro-header">Formación</div>
      <div className="card-retro-body">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {FORMATION_CODES.map((code) => {
            const isActive = code === selected;
            return (
              <button
                key={code}
                onClick={() => onChange(code)}
                disabled={disabled}
                className={`flex flex-col items-center gap-1 p-2 border-2 transition-colors ${
                  isActive
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-muted"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <FormationPreview code={code} />
                <span className="font-heading font-bold text-xs">{code}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Formación actual:{" "}
          <span className="font-heading font-bold text-foreground">
            {selected}
          </span>{" "}
          — 1 GK + {FORMATIONS[selected].slots.DEF} DEF +{" "}
          {FORMATIONS[selected].slots.MID} MID +{" "}
          {FORMATIONS[selected].slots.FWD} FWD
        </div>
      </div>
    </div>
  );
}
