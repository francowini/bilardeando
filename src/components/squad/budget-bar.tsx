"use client";

import { DollarSign } from "lucide-react";

interface BudgetBarProps {
  totalBudget: number;
  spent: number;
  playerCount: number;
}

export function BudgetBar({ totalBudget, spent, playerCount }: BudgetBarProps) {
  const remaining = totalBudget - spent;
  const percentUsed = Math.min((spent / totalBudget) * 100, 100);
  const isLow = remaining < 20;
  const isDanger = remaining < 5;

  return (
    <div className="card-retro">
      <div className="header-bar-accent flex items-center justify-between">
        <span className="flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          Presupuesto
        </span>
        <span className="text-xs font-normal">
          {playerCount}/18 jugadores
        </span>
      </div>
      <div className="card-retro-body space-y-2">
        {/* Budget numbers */}
        <div className="flex justify-between items-baseline">
          <div>
            <span className="font-heading font-bold text-2xl">
              ${remaining.toFixed(1)}M
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              disponible
            </span>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Gastado: ${spent.toFixed(1)}M / ${totalBudget}M
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-4 bg-muted border-2 border-border">
          <div
            className={`h-full transition-all duration-300 ${
              isDanger
                ? "bg-destructive"
                : isLow
                  ? "bg-amber-600"
                  : "bg-primary"
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>

        {/* Budget breakdown hint */}
        <div className="text-[10px] text-muted-foreground">
          Promedio por jugador restante:{" "}
          {playerCount < 18
            ? `$${(remaining / (18 - playerCount)).toFixed(1)}M`
            : "—"}
        </div>
      </div>
    </div>
  );
}
