"use client";

import { Shield } from "lucide-react";

interface PlayerCardProps {
  id: number;
  name: string;
  photo: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  teamName: string;
  rating: number | null;
  fantasyPrice: number;
  isSelected?: boolean;
  isCaptain?: boolean;
  isCaptainSub?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  compact?: boolean;
}

const positionBadgeClass: Record<string, string> = {
  GK: "badge-gk",
  DEF: "badge-def",
  MID: "badge-mid",
  FWD: "badge-fwd",
};

export function PlayerCard({
  name,
  photo,
  position,
  teamName,
  rating,
  fantasyPrice,
  isSelected,
  isCaptain,
  isCaptainSub,
  onSelect,
  onRemove,
  compact,
}: PlayerCardProps) {
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 p-2 border-2 border-border bg-card ${
          isSelected ? "ring-2 ring-accent" : ""
        }`}
      >
        <img
          src={photo}
          alt={name}
          className="w-8 h-8 border border-border object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-player.png";
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-heading font-bold text-xs truncate">{name}</div>
          <div className="flex items-center gap-1">
            <span className={positionBadgeClass[position]}>{position}</span>
            {isCaptain && (
              <span className="badge-position bg-accent text-accent-foreground">
                C
              </span>
            )}
            {isCaptainSub && (
              <span className="badge-position bg-accent/60 text-accent-foreground">
                CS
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-heading font-bold text-xs">
            {rating ? rating.toFixed(1) : "-"}
          </div>
          <div className="text-[10px] text-muted-foreground">
            ${fantasyPrice.toFixed(1)}M
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="btn-retro text-[10px] px-1.5 py-0.5 bg-destructive text-destructive-foreground border-destructive"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`card-retro cursor-pointer transition-colors ${
        isSelected
          ? "ring-2 ring-accent"
          : "hover:bg-muted/50"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3 p-3">
        <div className="relative">
          <img
            src={photo}
            alt={name}
            className="w-14 h-14 border-2 border-border object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-player.png";
            }}
          />
          {isCaptain && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent border border-border flex items-center justify-center">
              <Shield className="w-3 h-3 text-accent-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-heading font-bold text-sm truncate">{name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {teamName}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={positionBadgeClass[position]}>{position}</span>
            {isCaptain && (
              <span className="badge-position bg-accent text-accent-foreground">
                CAP
              </span>
            )}
            {isCaptainSub && (
              <span className="badge-position bg-accent/60 text-accent-foreground">
                SUB CAP
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-heading font-bold text-lg">
            {rating ? rating.toFixed(1) : "-"}
          </div>
          <div className="text-xs text-muted-foreground font-heading">
            ${fantasyPrice.toFixed(1)}M
          </div>
        </div>
      </div>
    </div>
  );
}
