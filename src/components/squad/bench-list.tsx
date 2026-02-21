"use client";

import { PlayerCard } from "@/components/player/player-card";

interface BenchPlayer {
  id: number;
  name: string;
  photo: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  teamName: string;
  rating: number | null;
  fantasyPrice: number;
}

interface BenchListProps {
  players: BenchPlayer[];
  onRemove?: (playerId: number) => void;
  onPlayerClick?: (playerId: number) => void;
}

export function BenchList({ players, onRemove, onPlayerClick }: BenchListProps) {
  return (
    <div className="card-retro">
      <div className="card-retro-header flex items-center justify-between">
        <span>Suplentes</span>
        <span className="text-xs font-normal opacity-80">
          {players.length}/7 — 0.5× puntos
        </span>
      </div>
      <div className="card-retro-body">
        {players.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            Sin suplentes — Seleccioná jugadores del catálogo
          </div>
        ) : (
          <div className="space-y-1">
            {players.map((player) => (
              <div
                key={player.id}
                className="cursor-pointer"
                onClick={() => onPlayerClick?.(player.id)}
              >
                <PlayerCard
                  id={player.id}
                  name={player.name}
                  photo={player.photo}
                  position={player.position}
                  teamName={player.teamName}
                  rating={player.rating}
                  fantasyPrice={player.fantasyPrice}
                  compact
                  onRemove={onRemove ? () => onRemove(player.id) : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
