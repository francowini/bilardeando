"use client";

import { Trophy, Medal, Award, ChevronLeft, ChevronRight } from "lucide-react";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  matchdayNames?: { id: number; name: string }[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  title?: string;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
  return <span className="text-sm font-bold text-muted-foreground">{rank}</span>;
}

export function LeaderboardTable({
  entries,
  currentUserId,
  matchdayNames,
  page,
  totalPages,
  onPageChange,
  title = "Ranking General",
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="card-retro">
        <div className="card-retro-header">{title}</div>
        <div className="card-retro-body text-center py-12 text-muted-foreground">
          No hay puntajes todavía. Simulá una fecha para ver el ranking.
        </div>
      </div>
    );
  }

  // Get all unique matchday IDs from all entries
  const allMatchdayIds = Array.from(
    new Set(
      entries.flatMap((e) => e.matchdayBreakdown.map((m) => m.matchdayId)),
    ),
  ).sort((a, b) => a - b);

  return (
    <div className="card-retro">
      <div className="card-retro-header flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="table-retro w-full">
          <thead>
            <tr>
              <th className="w-12 text-center">#</th>
              <th>Jugador</th>
              <th className="text-right w-24">Total</th>
              {allMatchdayIds.map((mdId) => {
                const name = matchdayNames?.find((m) => m.id === mdId)?.name;
                return (
                  <th key={mdId} className="text-right w-20 text-xs">
                    {name ?? `F${mdId}`}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId;
              return (
                <tr
                  key={entry.userId}
                  className={
                    isCurrentUser
                      ? "bg-accent/15 font-bold border-l-4 border-l-accent"
                      : ""
                  }
                >
                  <td className="text-center">
                    <RankIcon rank={entry.rank} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {entry.userImage ? (
                        <img
                          src={entry.userImage}
                          alt=""
                          className="w-6 h-6 border border-border"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold border border-border">
                          {(entry.userName || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <span className="font-heading text-sm">
                        {entry.userName}
                        {isCurrentUser && (
                          <span className="ml-1 text-[10px] text-accent font-normal">
                            (vos)
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="text-right font-heading font-bold text-lg">
                    {entry.totalPoints.toFixed(1)}
                  </td>
                  {allMatchdayIds.map((mdId) => {
                    const md = entry.matchdayBreakdown.find(
                      (m) => m.matchdayId === mdId,
                    );
                    return (
                      <td
                        key={mdId}
                        className="text-right text-xs text-muted-foreground"
                      >
                        {md ? md.points.toFixed(1) : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t-2 border-border text-xs">
          <span className="text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="btn-retro-outline px-2 py-1 text-xs disabled:opacity-30"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="btn-retro-outline px-2 py-1 text-xs disabled:opacity-30"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
