"use client";

import { useState } from "react";
import type { FormationCode } from "@/types";
import { FORMATIONS } from "@/lib/formations";
import { Shield } from "lucide-react";

interface PitchPlayer {
  id: number;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  photo: string;
  rating: number | null;
  isCaptain: boolean;
  isCaptainSub: boolean;
}

interface PitchViewProps {
  formation: FormationCode;
  starters: PitchPlayer[];
  onPlayerClick?: (playerId: number) => void;
  onSlotClick?: (position: "GK" | "DEF" | "MID" | "FWD") => void;
  onSwap?: (playerIdA: number, playerIdB: number) => void;
  onMoveToBench?: (playerId: number) => void;
}

const positionColors: Record<string, string> = {
  GK: "bg-amber-700",
  DEF: "bg-blue-800",
  MID: "bg-green-800",
  FWD: "bg-red-700",
};

interface DragData {
  playerId: number;
  position: string;
  isStarter: boolean;
}

export function PitchView({
  formation,
  starters,
  onPlayerClick,
  onSlotClick,
  onSwap,
  onMoveToBench,
}: PitchViewProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const slots = FORMATIONS[formation].slots;
  const rows = formation.split("-").map(Number);
  const posOrder: ("GK" | "DEF" | "MID" | "FWD")[] = [
    "GK",
    "DEF",
    "MID",
    "FWD",
  ];

  // Group starters by position
  const byPosition: Record<string, PitchPlayer[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };
  for (const p of starters) {
    byPosition[p.position]?.push(p);
  }

  // Build rows: GK row + formation rows
  const pitchRows: {
    position: "GK" | "DEF" | "MID" | "FWD";
    count: number;
    players: PitchPlayer[];
  }[] = [
    { position: "GK", count: 1, players: byPosition.GK },
    ...rows.map((count, i) => ({
      position: posOrder[i + 1],
      count,
      players: byPosition[posOrder[i + 1]],
    })),
  ];

  function handleDragStart(e: React.DragEvent, player: PitchPlayer) {
    const data: DragData = {
      playerId: player.id,
      position: player.position,
      isStarter: true,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(targetId);
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  function handleDropOnPlayer(e: React.DragEvent, targetPlayer: PitchPlayer) {
    e.preventDefault();
    setDragOverId(null);
    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.playerId === targetPlayer.id) return;
      onSwap?.(data.playerId, targetPlayer.id);
    } catch {
      // ignore invalid drag data
    }
  }

  function handleDropOnSlot(e: React.DragEvent, slotPosition: string) {
    e.preventDefault();
    setDragOverId(null);
    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData("application/json"));
      // If from bench, toggle to starter
      if (!data.isStarter && data.position === slotPosition) {
        // Find the closest slot — just toggle starter via the parent handler
        // The parent page handles this through onSwap or toggleStarter
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="card-retro">
      <div className="card-retro-header flex items-center justify-between">
        <span>Cancha — {formation}</span>
        <span className="text-xs font-normal opacity-80">
          {starters.length}/11 titulares
          {onSwap && (
            <span className="ml-2 text-accent">Arrastrá para mover</span>
          )}
        </span>
      </div>
      <div
        className="relative w-full overflow-hidden"
        style={{
          background:
            "repeating-linear-gradient(0deg, #2d5a3a 0px, #2d5a3a 40px, #326641 40px, #326641 80px)",
          minHeight: "400px",
        }}
      >
        {/* Pitch lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 border-t border-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/20 rounded-full" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-16 border-t border-x border-white/20" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-16 border-b border-x border-white/20" />
        </div>

        {/* Player rows (bottom = GK, top = FWD) */}
        <div className="relative flex flex-col-reverse justify-between h-full min-h-[400px] py-4 px-2">
          {pitchRows.map((row) => {
            const filledCount = row.players.length;
            const emptyCount = row.count - filledCount;

            return (
              <div
                key={row.position}
                className="flex justify-center items-center gap-2 flex-wrap"
              >
                {row.players.map((player) => {
                  const isDropTarget = dragOverId === `player-${player.id}`;
                  return (
                    <button
                      key={player.id}
                      draggable={!!onSwap}
                      onDragStart={(e) => handleDragStart(e, player)}
                      onDragOver={(e) =>
                        handleDragOver(e, `player-${player.id}`)
                      }
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDropOnPlayer(e, player)}
                      onClick={() => onPlayerClick?.(player.id)}
                      className={`flex flex-col items-center gap-0.5 w-16 group ${
                        isDropTarget ? "scale-110" : ""
                      }`}
                    >
                      <div
                        className={`relative ${
                          isDropTarget
                            ? "ring-2 ring-green-400 ring-offset-1"
                            : ""
                        }`}
                      >
                        <img
                          src={player.photo}
                          alt={player.name}
                          className={`w-10 h-10 border-2 object-cover group-hover:border-accent ${
                            isDropTarget
                              ? "border-green-400"
                              : "border-white/50"
                          }`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder-player.png";
                          }}
                        />
                        {player.isCaptain && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent border border-white flex items-center justify-center">
                            <Shield className="w-2.5 h-2.5 text-accent-foreground" />
                          </div>
                        )}
                        {player.isCaptainSub && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent/60 border border-white flex items-center justify-center text-[8px] font-bold text-accent-foreground">
                            CS
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-white font-heading font-bold truncate w-full text-center drop-shadow-md">
                        {player.name.split(" ").pop()}
                      </span>
                      <span className="text-[9px] text-white/70">
                        {player.rating ? player.rating.toFixed(1) : "-"}
                      </span>
                    </button>
                  );
                })}
                {/* Empty slots */}
                {Array.from({ length: emptyCount }).map((_, i) => {
                  const slotId = `slot-${row.position}-${i}`;
                  const isDropTarget = dragOverId === slotId;
                  return (
                    <button
                      key={slotId}
                      onClick={() => onSlotClick?.(row.position)}
                      onDragOver={(e) => handleDragOver(e, slotId)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDropOnSlot(e, row.position)}
                      className="flex flex-col items-center gap-0.5 w-16"
                    >
                      <div
                        className={`w-10 h-10 border-2 border-dashed flex items-center justify-center ${
                          isDropTarget
                            ? "border-green-400 bg-green-400/20"
                            : `border-white/40 ${positionColors[row.position]}/30`
                        }`}
                      >
                        <span className="text-white/50 text-lg">+</span>
                      </div>
                      <span className="text-[10px] text-white/50 font-heading">
                        {row.position}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
