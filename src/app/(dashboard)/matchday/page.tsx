"use client";

import { useState, useEffect, useCallback } from "react";
import { MatchCard } from "@/components/matchday/match-card";
import { SquadPoints } from "@/components/matchday/squad-points";
import { StatusBadge } from "@/components/matchday/status-badge";
import { Calendar, Play, ChevronLeft, ChevronRight } from "lucide-react";

interface MatchTeam {
  id: number;
  name: string;
  logo: string;
}

interface MatchData {
  id: number;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  homeScore: number;
  awayScore: number;
  status: string;
  kickoff: string;
}

interface MatchdayData {
  id: number;
  name: string;
  status: "OPEN" | "LOCK" | "LIVE" | "RESULTS";
  startDate: string;
  endDate: string;
  matches: MatchData[];
}

interface PlayerPointData {
  playerId: number;
  playerName: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  teamName: string;
  rawPoints: number;
  multiplier: number;
  finalPoints: number;
  isStarter: boolean;
  isCaptain: boolean;
  isCaptainSub: boolean;
  played: boolean;
}

interface PointsData {
  totalPoints: number;
  playerPoints: PlayerPointData[];
}

interface MatchdayListItem {
  id: number;
  name: string;
  status: string;
  matchCount: number;
}

export default function MatchdayPage() {
  const [matchday, setMatchday] = useState<MatchdayData | null>(null);
  const [points, setPoints] = useState<PointsData | null>(null);
  const [allMatchdays, setAllMatchdays] = useState<MatchdayListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  const fetchMatchday = useCallback(async (id?: number) => {
    setLoading(true);
    try {
      const url = id ? `/api/matchday?id=${id}` : "/api/matchday";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMatchday(data.matchday);

        // Fetch points if matchday exists
        if (data.matchday?.id) {
          const pRes = await fetch(
            `/api/matchday/${data.matchday.id}/points`,
          );
          if (pRes.ok) {
            const pData = await pRes.json();
            setPoints(pData);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllMatchdays = useCallback(async () => {
    try {
      const res = await fetch("/api/matchday?all=1");
      if (res.ok) {
        const data = await res.json();
        setAllMatchdays(data.matchdays || []);
      }
    } catch {
      // optional
    }
  }, []);

  useEffect(() => {
    fetchMatchday();
    fetchAllMatchdays();
  }, [fetchMatchday, fetchAllMatchdays]);

  const handleSimulate = async () => {
    setSimulating(true);
    setSimMessage(null);
    try {
      const res = await fetch("/api/matchday/simulate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSimMessage(data.message);
        // Refresh data
        await Promise.all([
          fetchMatchday(matchday?.id),
          fetchAllMatchdays(),
        ]);
      } else {
        setSimMessage(data.error || "Error en simulación");
      }
    } finally {
      setSimulating(false);
    }
  };

  const currentIdx = allMatchdays.findIndex((m) => m.id === matchday?.id);
  const canGoPrev = currentIdx > 0;
  const canGoNext = currentIdx < allMatchdays.length - 1;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted animate-pulse border-2 border-border" />
        <div className="h-64 bg-muted animate-pulse border-2 border-border" />
      </div>
    );
  }

  if (!matchday) {
    return (
      <div className="card-retro">
        <div className="card-retro-header">Fecha</div>
        <div className="card-retro-body text-center py-12 text-muted-foreground">
          No hay fechas disponibles
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Matchday header with navigation */}
      <div className="card-retro">
        <div className="card-retro-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{matchday.name}</span>
          </div>
          <StatusBadge status={matchday.status} />
        </div>
        <div className="card-retro-body flex items-center justify-between">
          <button
            onClick={() =>
              canGoPrev && fetchMatchday(allMatchdays[currentIdx - 1].id)
            }
            disabled={!canGoPrev}
            className="btn-retro-outline text-xs px-2 py-1 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center text-xs text-muted-foreground">
            {new Date(matchday.startDate).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
            })}{" "}
            —{" "}
            {new Date(matchday.endDate).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
            })}
          </div>
          <button
            onClick={() =>
              canGoNext && fetchMatchday(allMatchdays[currentIdx + 1].id)
            }
            disabled={!canGoNext}
            className="btn-retro-outline text-xs px-2 py-1 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simulation controls (demo only) */}
      {matchday.status !== "RESULTS" && (
        <div className="card-retro">
          <div className="header-bar-accent flex items-center gap-2">
            <Play className="w-4 h-4" />
            Demo — Simulación
          </div>
          <div className="card-retro-body flex items-center gap-3">
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="btn-retro-primary disabled:opacity-50"
            >
              {simulating
                ? "Simulando..."
                : `Avanzar: ${matchday.status} → ${
                    { OPEN: "LOCK", LOCK: "LIVE", LIVE: "RESULTS" }[
                      matchday.status
                    ]
                  }`}
            </button>
            {simMessage && (
              <span className="text-xs text-muted-foreground">
                {simMessage}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Two-column layout: Matches + Points */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Matches */}
        <div className="space-y-2">
          <h2 className="font-heading font-bold text-sm uppercase">
            Partidos ({matchday.matches.length})
          </h2>
          {matchday.matches.map((match) => (
            <MatchCard
              key={match.id}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              status={match.status}
              kickoff={match.kickoff}
            />
          ))}
        </div>

        {/* Squad points */}
        <div>
          {points && points.playerPoints.length > 0 ? (
            <SquadPoints
              playerPoints={points.playerPoints}
              totalPoints={points.totalPoints}
            />
          ) : (
            <div className="card-retro">
              <div className="card-retro-header">Puntaje del Equipo</div>
              <div className="card-retro-body text-center py-8 text-muted-foreground text-sm">
                {matchday.status === "OPEN"
                  ? "Los puntajes se calculan cuando la fecha avanza a RESULTADOS"
                  : "Armá tu equipo en la pestaña Equipo para ver tus puntos"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Matchday selector (all matchdays) */}
      {allMatchdays.length > 1 && (
        <div className="card-retro">
          <div className="card-retro-header">Todas las Fechas</div>
          <div className="card-retro-body">
            <div className="flex flex-wrap gap-2">
              {allMatchdays.map((md) => (
                <button
                  key={md.id}
                  onClick={() => fetchMatchday(md.id)}
                  className={`btn-retro text-xs px-3 py-1 ${
                    md.id === matchday.id
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-background text-foreground border-border"
                  }`}
                >
                  {md.name}
                  <span className="ml-1 opacity-70">({md.status})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
