"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FormationSelector } from "@/components/squad/formation-selector";
import { PitchView } from "@/components/squad/pitch-view";
import { BenchList } from "@/components/squad/bench-list";
import { BudgetBar } from "@/components/squad/budget-bar";
import { AlertTriangle, Check, ArrowLeftRight, Lock } from "lucide-react";
import type { FormationCode, SquadValidation } from "@/types";
import { STARTING_BUDGET } from "@/lib/formations";

interface SquadPlayer {
  id: number;
  name: string;
  photo: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  teamName: string;
  teamLogo: string;
  rating: number | null;
  fantasyPrice: number;
  isStarter: boolean;
  isCaptain: boolean;
  isCaptainSub: boolean;
}

interface SquadData {
  id: number;
  formation: string;
  players: SquadPlayer[];
}

export default function SquadPage() {
  const [squad, setSquad] = useState<SquadData | null>(null);
  const [validation, setValidation] = useState<SquadValidation | null>(null);
  const [remainingBudget, setRemainingBudget] = useState(STARTING_BUDGET);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [matchdayStatus, setMatchdayStatus] = useState<string | null>(null);
  const [matchdayName, setMatchdayName] = useState<string | null>(null);

  const fetchSquad = useCallback(async () => {
    try {
      const res = await fetch("/api/squad");
      if (res.ok) {
        const data = await res.json();
        setSquad(data.squad);
        setValidation(data.validation);
        setLocked(data.locked ?? false);
        setMatchdayStatus(data.matchdayStatus ?? null);
        setMatchdayName(data.matchdayName ?? null);
        if (data.summary) {
          setRemainingBudget(data.summary.remainingBudget);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSquad();
  }, [fetchSquad]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleFormationChange = async (formation: FormationCode) => {
    setActionLoading(true);
    setError(null);
    try {
      if (!squad) {
        await fetch("/api/squad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formation }),
        });
      } else {
        const res = await fetch("/api/squad", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formation }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al cambiar formación");
          return;
        }
        const data = await res.json();
        const msgs: string[] = [];
        if (data.movedToBench?.length > 0) {
          msgs.push(`Al banco: ${data.movedToBench.join(", ")}`);
        }
        if (data.promotedToStarter?.length > 0) {
          msgs.push(`A titular: ${data.promotedToStarter.join(", ")}`);
        }
        if (msgs.length > 0) {
          setToast(msgs.join(" | "));
        }
      }
      await fetchSquad();
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlayerAction = async (
    playerId: number,
    action: "captain" | "captainSub" | "toggleStarter",
  ) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/squad/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error");
        return;
      }
      await fetchSquad();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwap = async (playerIdA: number, playerIdB: number) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/squad/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: playerIdA, playerIdB, action: "swap" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al intercambiar jugadores");
        return;
      }
      await fetchSquad();
    } finally {
      setActionLoading(false);
    }
  };

  const formation = (squad?.formation || "4-3-3") as FormationCode;
  const starters = squad?.players.filter((p) => p.isStarter) ?? [];
  const bench = squad?.players.filter((p) => !p.isStarter) ?? [];
  const totalSpent =
    squad?.players.reduce((s, p) => s + p.fantasyPrice, 0) ?? 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted animate-pulse border-2 border-border" />
        <div className="h-96 bg-muted animate-pulse border-2 border-border" />
      </div>
    );
  }

  const isLocked = locked || actionLoading;

  return (
    <div className="space-y-4">
      {/* Locked banner */}
      {locked && (
        <div className="border-2 border-amber-600 bg-amber-600/10 p-3 flex items-center gap-2 text-sm">
          <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="font-heading font-bold">
            La fecha &quot;{matchdayName}&quot; está{" "}
            {matchdayStatus === "LOCK" ? "bloqueada" : matchdayStatus === "LIVE" ? "en vivo" : "finalizada"}.
            No se pueden hacer cambios al equipo.
          </span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="border-2 border-destructive bg-destructive/10 p-3 flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs font-heading font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="border-2 border-accent bg-accent/10 p-3 flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-accent flex-shrink-0" />
          <span>{toast}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-xs font-heading font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Validation status */}
      {validation && (
        <div
          className={`border-2 p-2 flex items-center gap-2 text-xs ${
            validation.valid
              ? "border-green-700 bg-green-700/10 text-green-800"
              : "border-accent bg-accent/10 text-accent-foreground"
          }`}
        >
          {validation.valid ? (
            <>
              <Check className="w-4 h-4" />
              <span className="font-heading font-bold">
                Equipo válido — Listo para jugar
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>
                {validation.errors[0]}
                {validation.errors.length > 1 &&
                  ` (+${validation.errors.length - 1} más)`}
              </span>
            </>
          )}
        </div>
      )}

      {/* Budget bar + market link */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <BudgetBar
            totalBudget={STARTING_BUDGET}
            spent={totalSpent}
            playerCount={squad?.players.length ?? 0}
          />
        </div>
        {locked ? (
          <span className="btn-retro-accent flex items-center gap-1 text-xs whitespace-nowrap mt-1 opacity-50 cursor-not-allowed">
            <Lock className="w-3 h-3" />
            Mercado Cerrado
          </span>
        ) : (
          <Link
            href="/transfers"
            className="btn-retro-accent flex items-center gap-1 text-xs whitespace-nowrap mt-1"
          >
            <ArrowLeftRight className="w-3 h-3" />
            Mercado de Pases
          </Link>
        )}
      </div>

      {/* Formation selector */}
      <FormationSelector
        selected={formation}
        onChange={handleFormationChange}
        disabled={isLocked}
      />

      {/* 2-column layout: Bench (1/3) | Pitch (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Bench */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <BenchList
            players={bench.map((p) => ({
              id: p.id,
              name: p.name,
              photo: p.photo,
              position: p.position,
              teamName: p.teamName,
              rating: p.rating,
              fantasyPrice: p.fantasyPrice,
            }))}
            onMoveToStarter={locked ? undefined : (playerId) =>
              handlePlayerAction(playerId, "toggleStarter")
            }
            onSwap={locked ? undefined : handleSwap}
          />
        </div>

        {/* Right: Pitch */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <PitchView
            formation={formation}
            starters={starters.map((p) => ({
              id: p.id,
              name: p.name,
              position: p.position,
              photo: p.photo,
              rating: p.rating,
              isCaptain: p.isCaptain,
              isCaptainSub: p.isCaptainSub,
            }))}
            onSetCaptain={locked ? undefined : (playerId) =>
              handlePlayerAction(playerId, "captain")
            }
            onSetCaptainSub={locked ? undefined : (playerId) =>
              handlePlayerAction(playerId, "captainSub")
            }
            onSwap={locked ? undefined : handleSwap}
            onMoveToBench={locked ? undefined : (playerId) =>
              handlePlayerAction(playerId, "toggleStarter")
            }
          />
        </div>
      </div>
    </div>
  );
}
