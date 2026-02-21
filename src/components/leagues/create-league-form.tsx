"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface Matchday {
  id: number;
  name: string;
}

interface CreateLeagueFormProps {
  matchdays: Matchday[];
  onSubmit: (data: {
    name: string;
    buyIn: number;
    maxPlayers: number;
    startMatchdayId: number;
    endMatchdayId: number;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const BUYIN_OPTIONS = [10000, 15000, 20000, 25000, 30000, 50000, 75000, 100000];

export function CreateLeagueForm({
  matchdays,
  onSubmit,
  onCancel,
  loading = false,
}: CreateLeagueFormProps) {
  const [name, setName] = useState("");
  const [buyIn, setBuyIn] = useState(10000);
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [startMatchdayId, setStartMatchdayId] = useState(
    matchdays[0]?.id ?? 1,
  );
  const [endMatchdayId, setEndMatchdayId] = useState(
    matchdays[matchdays.length - 1]?.id ?? 2,
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Ingresá un nombre para la liga");
      return;
    }

    if (startMatchdayId >= endMatchdayId) {
      setError("La fecha de inicio debe ser anterior a la de fin");
      return;
    }

    try {
      await onSubmit({ name, buyIn, maxPlayers, startMatchdayId, endMatchdayId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear liga");
    }
  };

  return (
    <div className="card-retro">
      <div className="header-bar-accent flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          Crear Liga
        </span>
        <button onClick={onCancel} className="hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="card-retro-body space-y-4">
        {error && (
          <div className="border-2 border-destructive bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-heading font-bold uppercase mb-1">
            Nombre de la Liga
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Liga de Amigos"
            className="w-full border-2 border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
            maxLength={50}
          />
        </div>

        {/* Buy-in */}
        <div>
          <label className="block text-xs font-heading font-bold uppercase mb-1">
            Buy-in (ARS)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {BUYIN_OPTIONS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setBuyIn(amount)}
                className={`border-2 px-2 py-1.5 text-xs font-heading font-bold transition-colors ${
                  buyIn === amount
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border hover:border-accent/50"
                }`}
              >
                ${amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Max players */}
        <div>
          <label className="block text-xs font-heading font-bold uppercase mb-1">
            Máximo de jugadores: {maxPlayers}
          </label>
          <input
            type="range"
            min={3}
            max={100}
            step={1}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>3</span>
            <span>100</span>
          </div>
        </div>

        {/* Matchday range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-heading font-bold uppercase mb-1">
              Fecha inicio
            </label>
            <select
              value={startMatchdayId}
              onChange={(e) => setStartMatchdayId(Number(e.target.value))}
              className="w-full border-2 border-border bg-background px-2 py-2 text-sm"
            >
              {matchdays.map((md) => (
                <option key={md.id} value={md.id}>
                  {md.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-heading font-bold uppercase mb-1">
              Fecha fin
            </label>
            <select
              value={endMatchdayId}
              onChange={(e) => setEndMatchdayId(Number(e.target.value))}
              className="w-full border-2 border-border bg-background px-2 py-2 text-sm"
            >
              {matchdays.map((md) => (
                <option key={md.id} value={md.id}>
                  {md.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prize info */}
        <div className="border-2 border-border bg-muted/50 p-3 text-xs">
          <div className="font-heading font-bold text-sm mb-1">Premios estimados</div>
          <PrizeBreakdown buyIn={buyIn} maxPlayers={maxPlayers} />
        </div>

        {/* Submit */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-retro flex-1 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear Liga"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-retro-outline"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

const RAKE_PERCENT = 5;
const POSITION_LABELS = ["1ro", "2do", "3ro", "4to"];

function PrizeBreakdown({ buyIn, maxPlayers }: { buyIn: number; maxPlayers: number }) {
  const totalPool = buyIn * maxPlayers;
  const rake = totalPool * (RAKE_PERCENT / 100);
  const netPool = totalPool - rake;

  let percentages: number[];
  if (maxPlayers <= 6) {
    percentages = [70, 30];
  } else if (maxPlayers <= 15) {
    percentages = [50, 30, 20];
  } else {
    percentages = [40, 25, 20, 15];
  }

  const prizes = percentages.map((pct, i) => ({
    position: POSITION_LABELS[i],
    percentage: pct,
    amount: Math.round((netPool * pct) / 100),
  }));

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Pozo total ({maxPlayers} jugadores)</span>
        <span className="font-heading font-bold">${totalPool.toLocaleString("es-AR")} ARS</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Comisión plataforma ({RAKE_PERCENT}%)</span>
        <span>-${rake.toLocaleString("es-AR")} ARS</span>
      </div>
      <div className="flex justify-between border-t border-border pt-1">
        <span className="font-heading font-bold">Pozo neto</span>
        <span className="font-heading font-bold text-espn-green">${netPool.toLocaleString("es-AR")} ARS</span>
      </div>
      <div className="mt-2 space-y-1">
        {prizes.map((p) => (
          <div key={p.position} className="flex justify-between">
            <span>
              {p.position} ({p.percentage}%)
            </span>
            <span className="font-heading font-bold">${p.amount.toLocaleString("es-AR")} ARS</span>
          </div>
        ))}
      </div>
    </div>
  );
}
