"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy } from "lucide-react";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardData {
  data: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  matchdays: { id: number; name: string }[];
  currentUserId: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchLeaderboard = useCallback(async (p: number) => {
    try {
      setError(null);
      const res = await fetch(`/api/leaderboard?page=${p}&pageSize=50`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar ranking");
      setLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(page);
  }, [fetchLeaderboard, page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  if (error) {
    return (
      <div className="card-retro">
        <div className="card-retro-header flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Ranking General
        </div>
        <div className="card-retro-body text-center py-8">
          <p className="text-red-600 font-bold">{error}</p>
          <button
            onClick={() => fetchLeaderboard(page)}
            className="btn-retro-outline mt-4"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold uppercase">
        Ranking General
      </h1>

      {/* Summary stats */}
      {leaderboard && leaderboard.data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Jugadores"
            value={String(leaderboard.total)}
          />
          <StatCard
            label="Fechas jugadas"
            value={String(leaderboard.matchdays.length)}
          />
          <StatCard
            label="Líder"
            value={leaderboard.data[0]?.userName ?? "—"}
          />
          <StatCard
            label="Mejor puntaje"
            value={
              leaderboard.data[0]
                ? `${leaderboard.data[0].totalPoints.toFixed(1)} pts`
                : "—"
            }
          />
        </div>
      )}

      {/* Leaderboard table */}
      {leaderboard && (
        <LeaderboardTable
          entries={leaderboard.data}
          currentUserId={leaderboard.currentUserId}
          matchdayNames={leaderboard.matchdays}
          page={leaderboard.page}
          totalPages={leaderboard.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-retro">
      <div className="card-retro-body text-center py-2">
        <div className="text-[10px] text-muted-foreground uppercase font-heading">
          {label}
        </div>
        <div className="font-heading font-bold text-lg truncate">{value}</div>
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 bg-muted animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-retro">
            <div className="card-retro-body text-center py-2">
              <div className="h-3 w-16 bg-muted animate-pulse mx-auto mb-1" />
              <div className="h-6 w-12 bg-muted animate-pulse mx-auto" />
            </div>
          </div>
        ))}
      </div>
      <div className="card-retro">
        <div className="card-retro-header">Ranking General</div>
        <div className="card-retro-body p-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex gap-4 px-3 py-3 border-b border-border"
            >
              <div className="h-5 w-8 bg-muted animate-pulse" />
              <div className="h-5 w-32 bg-muted animate-pulse" />
              <div className="h-5 w-16 bg-muted animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
