"use client";

import type { Position } from "@/generated/prisma/client";

interface PlayerPointData {
  playerId: number;
  playerName: string;
  position: Position;
  teamName: string;
  rawPoints: number;
  multiplier: number;
  finalPoints: number;
  isStarter: boolean;
  isCaptain: boolean;
  isCaptainSub: boolean;
  played: boolean;
}

interface SquadPointsProps {
  playerPoints: PlayerPointData[];
  totalPoints: number;
}

const positionBadgeClass: Record<string, string> = {
  GK: "badge-gk",
  DEF: "badge-def",
  MID: "badge-mid",
  FWD: "badge-fwd",
};

function MultiplierBadge({ multiplier }: { multiplier: number }) {
  const label = `${multiplier}×`;
  let className = "badge-position ";
  if (multiplier === 2) {
    className += "bg-accent text-accent-foreground";
  } else if (multiplier === 1) {
    className += "bg-primary text-primary-foreground";
  } else {
    className += "bg-muted text-muted-foreground";
  }
  return <span className={className}>{label}</span>;
}

export function SquadPoints({ playerPoints, totalPoints }: SquadPointsProps) {
  const starters = playerPoints.filter((p) => p.isStarter);
  const bench = playerPoints.filter((p) => !p.isStarter);

  return (
    <div className="card-retro">
      <div className="card-retro-header flex items-center justify-between">
        <span>Puntaje del Equipo</span>
        <span className="text-lg">
          {totalPoints.toFixed(1)} pts
        </span>
      </div>
      <div className="card-retro-body">
        {/* Starters */}
        <table className="table-retro mb-3">
          <thead>
            <tr>
              <th>Titular</th>
              <th>Pos</th>
              <th className="text-center">Puntos</th>
              <th className="text-center">Mult.</th>
              <th className="text-center">Final</th>
            </tr>
          </thead>
          <tbody>
            {starters.map((p) => (
              <tr key={p.playerId}>
                <td className="font-heading font-bold text-xs">
                  {p.playerName}
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
                  <span className={positionBadgeClass[p.position]}>
                    {p.position}
                  </span>
                </td>
                <td className="text-center font-heading">
                  {p.played ? p.rawPoints.toFixed(1) : "-"}
                </td>
                <td className="text-center">
                  <MultiplierBadge multiplier={p.multiplier} />
                </td>
                <td className="text-center font-heading font-bold">
                  {p.played ? p.finalPoints.toFixed(1) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bench */}
        {bench.length > 0 && (
          <table className="table-retro">
            <thead>
              <tr>
                <th>Suplente</th>
                <th>Pos</th>
                <th className="text-center">Puntos</th>
                <th className="text-center">Mult.</th>
                <th className="text-center">Final</th>
              </tr>
            </thead>
            <tbody>
              {bench.map((p) => (
                <tr key={p.playerId} className="opacity-80">
                  <td className="font-heading text-xs">{p.playerName}</td>
                  <td>
                    <span className={positionBadgeClass[p.position]}>
                      {p.position}
                    </span>
                  </td>
                  <td className="text-center font-heading">
                    {p.played ? p.rawPoints.toFixed(1) : "-"}
                  </td>
                  <td className="text-center">
                    <MultiplierBadge multiplier={0.5} />
                  </td>
                  <td className="text-center font-heading">
                    {p.played ? p.finalPoints.toFixed(1) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Total */}
        <div className="mt-3 pt-3 border-t-2 border-border flex justify-between items-center">
          <span className="font-heading font-bold text-sm uppercase">
            Total
          </span>
          <span className="font-heading font-bold text-2xl">
            {totalPoints.toFixed(1)} pts
          </span>
        </div>
      </div>
    </div>
  );
}
