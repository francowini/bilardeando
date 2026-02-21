"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Trophy,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface MatchdayInfo {
  id: number;
  name: string;
  status: string;
  matchCount: number;
  liveCount: number;
  finishedCount: number;
  scheduledCount: number;
}

interface LeaderboardUser {
  name: string;
  email: string;
  totalPoints: number;
  breakdown: { matchday: string; points: number }[];
}

interface DemoState {
  currentMatchday: MatchdayInfo | null;
  allMatchdays: { id: number; name: string; status: string; matchCount: number }[];
  leaderboard: LeaderboardUser[];
}

const STEPS = [
  {
    status: "OPEN",
    label: "Abierto",
    desc: "Se pueden armar equipos y hacer pases. La fecha aún no empezó.",
    action: "Bloquear fecha (LOCK)",
  },
  {
    status: "LOCK",
    label: "Bloqueado",
    desc: "No se pueden modificar equipos. Los partidos están por empezar.",
    action: "Iniciar partidos (LIVE)",
  },
  {
    status: "LIVE",
    label: "En Vivo",
    desc: "Mitad de los partidos ya terminaron, algunos en vivo y otros por jugar. Los puntajes se van acumulando.",
    action: "Finalizar fecha (RESULTS)",
  },
  {
    status: "RESULTS",
    label: "Resultados",
    desc: "Todos los partidos terminaron. Se computaron los puntajes de los 3 usuarios.",
    action: "Crear siguiente fecha",
  },
];

export default function DemoPage() {
  const [state, setState] = useState<DemoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const fetchState = useCallback(async () => {
    const res = await fetch("/api/demo");
    if (res.ok) {
      const data = await res.json();
      setState(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleAdvance = async () => {
    setAdvancing(true);
    setMessage(null);
    const res = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "advance" }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setHistory((h) => [...h, data.message]);
    } else {
      setMessage(data.error || "Error");
    }
    setAdvancing(false);
    await fetchState();
  };

  const handleReset = async () => {
    setAdvancing(true);
    setMessage(null);
    const res = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    setHistory([]);
    setAdvancing(false);
    await fetchState();
  };

  const currentStatus = state?.currentMatchday?.status || "OPEN";
  const currentStepIdx = STEPS.findIndex((s) => s.status === currentStatus);
  const currentStep = STEPS[currentStepIdx] || STEPS[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-espn-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="header-bar text-lg px-4 py-3 flex items-center justify-between">
        <span>BILARDEANDO — Demo Step-by-Step</span>
        <Link
          href="/login"
          className="text-sm text-primary-foreground/80 hover:text-primary-foreground underline"
        >
          Ir al Login
        </Link>
      </div>

      <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
        {/* Step progress bar */}
        <div className="card-retro">
          <div className="header-bar-accent px-4 py-2 font-heading font-bold text-sm uppercase">
            Flujo de una Fecha
          </div>
          <div className="card-retro-body">
            <div className="flex items-center gap-1">
              {STEPS.map((step, i) => {
                const isDone = i < currentStepIdx;
                const isCurrent = i === currentStepIdx;
                const allDone = currentStatus === "RESULTS";
                return (
                  <div key={step.status} className="flex items-center gap-1 flex-1">
                    <div
                      className={`flex-1 text-center py-2 px-2 border-2 text-xs font-heading font-bold uppercase transition-colors ${
                        isDone || (allDone && i === STEPS.length - 1)
                          ? "bg-green-800 text-white border-green-900"
                          : isCurrent
                            ? "bg-espn-gold text-espn-green border-espn-green"
                            : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {isDone && <CheckCircle className="w-3 h-3 inline mr-1" />}
                      {step.label}
                    </div>
                    {i < STEPS.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current state */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: State + actions */}
          <div className="space-y-4">
            <div className="card-retro">
              <div className="card-retro-header">Estado Actual</div>
              <div className="card-retro-body space-y-3">
                {state?.currentMatchday ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold">
                        {state.currentMatchday.name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 font-heading font-bold text-xs uppercase border-2 border-border ${
                          currentStatus === "OPEN"
                            ? "bg-green-800 text-white"
                            : currentStatus === "LOCK"
                              ? "bg-amber-700 text-white"
                              : currentStatus === "LIVE"
                                ? "bg-red-700 text-white animate-pulse"
                                : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {currentStep.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentStep.desc}
                    </p>
                    <div className="text-xs space-y-1 border-t-2 border-border pt-2">
                      <div className="flex justify-between">
                        <span>Partidos totales:</span>
                        <span className="font-bold">{state.currentMatchday.matchCount}</span>
                      </div>
                      {state.currentMatchday.liveCount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>En vivo:</span>
                          <span className="font-bold">{state.currentMatchday.liveCount}</span>
                        </div>
                      )}
                      {state.currentMatchday.finishedCount > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>Finalizados:</span>
                          <span className="font-bold">{state.currentMatchday.finishedCount}</span>
                        </div>
                      )}
                      {state.currentMatchday.scheduledCount > 0 && (
                        <div className="flex justify-between">
                          <span>Programados:</span>
                          <span className="font-bold">{state.currentMatchday.scheduledCount}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    No hay fechas activas
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="card-retro">
              <div className="card-retro-header flex items-center gap-2">
                <Play className="w-4 h-4" />
                Acciones
              </div>
              <div className="card-retro-body space-y-3">
                {currentStep.action && (
                  <button
                    onClick={handleAdvance}
                    disabled={advancing}
                    className="btn-retro-primary w-full text-sm py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {advancing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    {advancing ? "Procesando..." : currentStep.action}
                  </button>
                )}

                <button
                  onClick={handleReset}
                  disabled={advancing}
                  className="btn-retro-outline w-full text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Resetear demo
                </button>

                {message && (
                  <div className="flex items-start gap-2 text-xs p-2 bg-muted border-2 border-border">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {message}
                  </div>
                )}
              </div>
            </div>

            {/* History log */}
            {history.length > 0 && (
              <div className="card-retro">
                <div className="card-retro-header">Log de Acciones</div>
                <div className="card-retro-body">
                  <div className="space-y-1">
                    {history.map((h, i) => (
                      <div
                        key={i}
                        className="text-xs font-mono flex items-center gap-2"
                      >
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Leaderboard */}
          <div className="space-y-4">
            <div className="card-retro">
              <div className="card-retro-header flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Ranking General — 3 Usuarios
              </div>
              <div className="card-retro-body">
                {state?.leaderboard && state.leaderboard.length > 0 ? (
                  <table className="table-retro">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Usuario</th>
                        {state.leaderboard[0]?.breakdown.map((b) => (
                          <th key={b.matchday} className="text-center">
                            {b.matchday}
                          </th>
                        ))}
                        <th className="text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.leaderboard.map((user, i) => (
                        <tr
                          key={user.email}
                          className={i === 0 ? "bg-espn-gold/10" : ""}
                        >
                          <td className="font-heading font-bold text-lg">
                            {i === 0 ? "🏆" : i + 1}
                          </td>
                          <td className="font-heading font-bold text-xs">
                            {user.name}
                          </td>
                          {user.breakdown.map((b) => (
                            <td
                              key={b.matchday}
                              className="text-center font-heading text-xs"
                            >
                              {b.points > 0 ? b.points.toFixed(1) : "-"}
                            </td>
                          ))}
                          <td className="text-center font-heading font-bold text-sm">
                            {user.totalPoints > 0
                              ? user.totalPoints.toFixed(1)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Los puntajes se computan cuando la fecha llega a RESULTADOS
                  </p>
                )}
              </div>
            </div>

            {/* All matchdays */}
            <div className="card-retro">
              <div className="card-retro-header">Todas las Fechas</div>
              <div className="card-retro-body">
                <table className="table-retro">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th className="text-center">Partidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state?.allMatchdays.map((md) => (
                      <tr key={md.id}>
                        <td className="font-heading font-bold text-xs">
                          {md.name}
                        </td>
                        <td>
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-bold uppercase border border-border ${
                              md.status === "RESULTS"
                                ? "bg-primary text-primary-foreground"
                                : md.status === "OPEN"
                                  ? "bg-green-800 text-white"
                                  : md.status === "LOCK"
                                    ? "bg-amber-700 text-white"
                                    : "bg-red-700 text-white"
                            }`}
                          >
                            {md.status}
                          </span>
                        </td>
                        <td className="text-center">{md.matchCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick links */}
            <div className="card-retro">
              <div className="card-retro-header">Links</div>
              <div className="card-retro-body space-y-2">
                <Link
                  href="/login"
                  className="btn-retro-outline w-full text-sm py-2 flex items-center justify-center gap-2"
                >
                  Ir al Login (demo1@bilardeando.com / demo123)
                </Link>
                <Link
                  href="/matchday"
                  className="btn-retro-outline w-full text-sm py-2 flex items-center justify-center gap-2"
                >
                  Ver Fecha (requiere login)
                </Link>
                <Link
                  href="/leaderboard"
                  className="btn-retro-outline w-full text-sm py-2 flex items-center justify-center gap-2"
                >
                  Ver Ranking (requiere login)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t-2 border-border px-4 py-2 text-center text-xs text-muted-foreground mt-auto">
        Bilardeando Demo &copy; 2026
      </footer>
    </div>
  );
}
