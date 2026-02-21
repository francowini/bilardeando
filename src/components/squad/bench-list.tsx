"use client";

import { useState } from "react";
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

interface DragData {
  playerId: number;
  position: string;
  isStarter: boolean;
}

interface BenchListProps {
  players: BenchPlayer[];
  onRemove?: (playerId: number) => void;
  onPlayerClick?: (playerId: number) => void;
  onSwap?: (playerIdA: number, playerIdB: number) => void;
}

export function BenchList({
  players,
  onRemove,
  onPlayerClick,
  onSwap,
}: BenchListProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverPlayerId, setDragOverPlayerId] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent, player: BenchPlayer) {
    const data: DragData = {
      playerId: player.id,
      position: player.position,
      isStarter: false,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleContainerDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleContainerDragLeave(e: React.DragEvent) {
    // Only clear if leaving the container entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setIsDragOver(false);
    }
  }

  function handleContainerDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData("application/json"));
      // If a starter is dropped on the bench container, toggle them
      if (data.isStarter) {
        onPlayerClick?.(data.playerId);
      }
    } catch {
      // ignore
    }
  }

  function handlePlayerDragOver(e: React.DragEvent, playerId: number) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPlayerId(playerId);
  }

  function handlePlayerDragLeave() {
    setDragOverPlayerId(null);
  }

  function handlePlayerDrop(e: React.DragEvent, targetPlayerId: number) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPlayerId(null);
    setIsDragOver(false);
    try {
      const data: DragData = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.playerId === targetPlayerId) return;
      onSwap?.(data.playerId, targetPlayerId);
    } catch {
      // ignore
    }
  }

  return (
    <div className="card-retro">
      <div className="card-retro-header flex items-center justify-between">
        <span>Suplentes</span>
        <span className="text-xs font-normal opacity-80">
          {players.length}/7 — 0.5× puntos
          {onSwap && (
            <span className="ml-2 text-accent">Arrastrá aquí</span>
          )}
        </span>
      </div>
      <div
        className={`card-retro-body transition-colors ${
          isDragOver ? "bg-green-900/20 ring-2 ring-inset ring-green-400/50" : ""
        }`}
        onDragOver={handleContainerDragOver}
        onDragLeave={handleContainerDragLeave}
        onDrop={handleContainerDrop}
      >
        {players.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            Sin suplentes
            {isDragOver && (
              <div className="mt-2 text-green-600 font-heading font-bold text-xs">
                Soltá para mover al banco
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {players.map((player) => {
              const isTarget = dragOverPlayerId === player.id;
              return (
                <div
                  key={player.id}
                  draggable={!!onSwap}
                  onDragStart={(e) => handleDragStart(e, player)}
                  onDragOver={(e) => handlePlayerDragOver(e, player.id)}
                  onDragLeave={handlePlayerDragLeave}
                  onDrop={(e) => handlePlayerDrop(e, player.id)}
                  className={`cursor-pointer transition-all ${
                    isTarget
                      ? "ring-2 ring-green-400 scale-[1.02]"
                      : ""
                  }`}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
