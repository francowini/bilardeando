"use client";

import { useState, useEffect, useCallback } from "react";
import { PlayerCatalog } from "@/components/player/player-catalog";
import { SquadRoster } from "@/components/squad/squad-roster";
import { BudgetBar } from "@/components/squad/budget-bar";
import { AlertTriangle } from "lucide-react";
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

export default function TransfersPage() {
  const [players, setPlayers] = useState<SquadPlayer[]>([]);
  const [remainingBudget, setRemainingBudget] = useState(STARTING_BUDGET);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSquad = useCallback(async () => {
    try {
      const res = await fetch("/api/squad");
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.squad?.players ?? []);
        if (data.summary) {
          setRemainingBudget(data.summary.remainingBudget);
        } else {
          setRemainingBudget(STARTING_BUDGET);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSquad();
  }, [fetchSquad]);

  const handleBuyPlayer = async (player: { id: number; position: string }) => {
    setActionLoading(true);
    setError(null);
    try {
      // Ensure squad exists
      const squadRes = await fetch("/api/squad");
      const squadData = await squadRes.json();
      if (!squadData.squad) {
        await fetch("/api/squad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formation: "4-3-3" }),
        });
      }

      const res = await fetch("/api/squad/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id, isStarter: false }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al comprar jugador");
        return;
      }

      await fetchSquad();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSellPlayer = async (playerId: number) => {
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
        setError(data.error || "Error al vender jugador");
        return;
      }
      await fetchSquad();
    } finally {
      setActionLoading(false);
    }
  };

  const selectedPlayerIds = new Set(players.map((p) => p.id));
  const totalSpent = players.reduce((s, p) => s + p.fantasyPrice, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted animate-pulse border-2 border-border" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-96 bg-muted animate-pulse border-2 border-border" />
          <div className="h-96 bg-muted animate-pulse border-2 border-border" />
        </div>
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

      {/* Budget bar */}
      <BudgetBar
        totalBudget={STARTING_BUDGET}
        spent={totalSpent}
        playerCount={players.length}
      />

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Player catalog (2/3) */}
        <div className="lg:col-span-2">
          <PlayerCatalog
            selectedPlayerIds={selectedPlayerIds}
            onSelectPlayer={handleBuyPlayer}
            remainingBudget={remainingBudget}
          />
        </div>

        {/* Right: Squad roster (1/3) */}
        <div className="lg:col-span-1">
          <SquadRoster
            players={players.map((p) => ({
              id: p.id,
              name: p.name,
              photo: p.photo,
              position: p.position,
              teamName: p.teamName,
              rating: p.rating,
              fantasyPrice: p.fantasyPrice,
              isStarter: p.isStarter,
            }))}
            onSell={handleSellPlayer}
            disabled={actionLoading}
          />
        </div>
      </div>
    </div>
  );
}
