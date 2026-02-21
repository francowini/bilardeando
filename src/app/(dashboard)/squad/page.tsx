"use client";

import { useState, useEffect, useCallback } from "react";
import { PlayerCatalog } from "@/components/player/player-catalog";
import { FormationSelector } from "@/components/squad/formation-selector";
import { PitchView } from "@/components/squad/pitch-view";
import { BenchList } from "@/components/squad/bench-list";
import { BudgetBar } from "@/components/squad/budget-bar";
import { Shield, AlertTriangle, Check } from "lucide-react";
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
  const [showCatalog, setShowCatalog] = useState(false);

  const fetchSquad = useCallback(async () => {
    try {
      const res = await fetch("/api/squad");
      if (res.ok) {
        const data = await res.json();
        setSquad(data.squad);
        setValidation(data.validation);
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
      }
      await fetchSquad();
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPlayer = async (player: { id: number; position: string }) => {
    setActionLoading(true);
    setError(null);
    try {
      if (!squad) {
        await fetch("/api/squad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formation: "4-3-3" }),
        });
      }

      const starters = squad?.players.filter((p) => p.isStarter) ?? [];
      const isStarter = starters.length < 11;

      const res = await fetch("/api/squad/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id, isStarter }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al agregar jugador");
        return;
      }

      await fetchSquad();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId: number) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/squad/players", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al quitar jugador");
        return;
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

  const formation = (squad?.formation || "4-3-3") as FormationCode;
  const starters = squad?.players.filter((p) => p.isStarter) ?? [];
  const bench = squad?.players.filter((p) => !p.isStarter) ?? [];
  const selectedPlayerIds = new Set(squad?.players.map((p) => p.id) ?? []);
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

  return (
    <div className="space-y-4">
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

      {/* Budget bar */}
      <BudgetBar
        totalBudget={STARTING_BUDGET}
        spent={totalSpent}
        playerCount={squad?.players.length ?? 0}
      />

      {/* Formation selector */}
      <FormationSelector
        selected={formation}
        onChange={handleFormationChange}
        disabled={actionLoading}
      />

      {/* Toggle catalog button */}
      <button
        onClick={() => setShowCatalog((prev) => !prev)}
        className="btn-retro-accent w-full"
      >
        {showCatalog ? "Ocultar Catálogo" : "Abrir Catálogo de Jugadores"}
      </button>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Catalog (left column on desktop) */}
        {showCatalog && (
          <div className="lg:col-span-1 lg:order-1">
            <PlayerCatalog
              selectedPlayerIds={selectedPlayerIds}
              onSelectPlayer={handleAddPlayer}
              remainingBudget={remainingBudget}
            />
          </div>
        )}

        {/* Pitch + Bench (center/right) */}
        <div
          className={
            showCatalog
              ? "lg:col-span-2 lg:order-2 space-y-4"
              : "lg:col-span-3 space-y-4"
          }
        >
          {/* Pitch */}
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
            onPlayerClick={(playerId) => {
              const player = starters.find((p) => p.id === playerId);
              if (player && !player.isCaptain) {
                handlePlayerAction(playerId, "captain");
              }
            }}
          />

          {/* Bench */}
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
            onRemove={handleRemovePlayer}
            onPlayerClick={(playerId) =>
              handlePlayerAction(playerId, "toggleStarter")
            }
          />

          {/* Starter list (quick actions) */}
          <div className="card-retro">
            <div className="card-retro-header flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Titulares — Acciones
            </div>
            <div className="card-retro-body">
              {starters.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Agregá jugadores del catálogo
                </div>
              ) : (
                <table className="table-retro">
                  <thead>
                    <tr>
                      <th>Jugador</th>
                      <th>Pos</th>
                      <th>Rating</th>
                      <th>Precio</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {starters.map((p) => (
                      <tr key={p.id}>
                        <td className="font-heading font-bold text-xs">
                          {p.name}
                          {p.isCaptain && (
                            <span className="ml-1 badge-position bg-accent text-accent-foreground">
                              C
                            </span>
                          )}
                          {p.isCaptainSub && (
                            <span className="ml-1 badge-position bg-accent/60 text-accent-foreground">
                              CS
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge-${p.position.toLowerCase()}`}
                          >
                            {p.position}
                          </span>
                        </td>
                        <td className="text-center font-heading">
                          {p.rating?.toFixed(1) || "-"}
                        </td>
                        <td className="text-center text-xs">
                          ${p.fantasyPrice.toFixed(1)}M
                        </td>
                        <td className="space-x-1">
                          {!p.isCaptain && (
                            <button
                              onClick={() =>
                                handlePlayerAction(p.id, "captain")
                              }
                              className="btn-retro text-[10px] px-1 py-0.5 bg-accent text-accent-foreground border-accent"
                              disabled={actionLoading}
                              title="Hacer capitán"
                            >
                              C
                            </button>
                          )}
                          {!p.isCaptainSub && (
                            <button
                              onClick={() =>
                                handlePlayerAction(p.id, "captainSub")
                              }
                              className="btn-retro text-[10px] px-1 py-0.5 bg-muted text-foreground border-border"
                              disabled={actionLoading}
                              title="Capitán suplente"
                            >
                              CS
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handlePlayerAction(p.id, "toggleStarter")
                            }
                            className="btn-retro text-[10px] px-1 py-0.5 bg-muted text-foreground border-border"
                            disabled={actionLoading}
                            title="Mover al banco"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => handleRemovePlayer(p.id)}
                            className="btn-retro text-[10px] px-1 py-0.5 bg-destructive text-destructive-foreground border-destructive"
                            disabled={actionLoading}
                            title="Quitar del equipo"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
