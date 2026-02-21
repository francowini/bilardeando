"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { PlayerCard } from "./player-card";

interface CatalogPlayer {
  id: number;
  name: string;
  photo: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  teamName: string;
  teamId: number;
  rating: number | null;
  fantasyPrice: number;
}

interface CatalogTeam {
  id: number;
  name: string;
}

interface PlayerCatalogProps {
  selectedPlayerIds: Set<number>;
  onSelectPlayer: (player: CatalogPlayer) => void;
  remainingBudget: number;
}

const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
const PAGE_SIZE = 20;

export function PlayerCatalog({
  selectedPlayerIds,
  onSelectPlayer,
  remainingBudget,
}: PlayerCatalogProps) {
  const [players, setPlayers] = useState<CatalogPlayer[]>([]);
  const [teams, setTeams] = useState<CatalogTeam[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"rating" | "value" | "name">("rating");

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (posFilter) params.set("position", posFilter);
    if (teamFilter) params.set("teamId", teamFilter);
    params.set("sortBy", sortBy);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    try {
      const res = await fetch(`/api/players?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [search, posFilter, teamFilter, sortBy, page]);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/players?_teams=1");
      if (res.ok) {
        const data = await res.json();
        if (data.teams) setTeams(data.teams);
      }
    } catch {
      // teams list is optional
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, posFilter, teamFilter, sortBy]);

  return (
    <div className="card-retro">
      <div className="card-retro-header flex items-center justify-between">
        <span>Catálogo de Jugadores</span>
        <span className="text-xs font-normal opacity-80">
          {total} jugadores
        </span>
      </div>
      <div className="card-retro-body space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar jugador o equipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border-2 border-border bg-background text-sm font-body"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          {/* Position filter */}
          <select
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value)}
            className="border-2 border-border bg-background px-2 py-1 text-xs font-heading font-bold uppercase"
          >
            <option value="">Todas las posiciones</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Team filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="border-2 border-border bg-background px-2 py-1 text-xs font-heading font-bold uppercase"
          >
            <option value="">Todos los equipos</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "rating" | "value" | "name")
            }
            className="border-2 border-border bg-background px-2 py-1 text-xs font-heading font-bold uppercase"
          >
            <option value="rating">Rating ↓</option>
            <option value="value">Precio ↓</option>
            <option value="name">Nombre ↑</option>
          </select>
        </div>

        {/* Player list */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-muted animate-pulse border-2 border-border"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {players.map((player) => {
              const isSelected = selectedPlayerIds.has(player.id);
              const canAfford = player.fantasyPrice <= remainingBudget;
              return (
                <div
                  key={player.id}
                  className={
                    !isSelected && !canAfford ? "opacity-50" : ""
                  }
                >
                  <PlayerCard
                    id={player.id}
                    name={player.name}
                    photo={player.photo}
                    position={player.position}
                    teamName={player.teamName}
                    rating={player.rating}
                    fantasyPrice={player.fantasyPrice}
                    isSelected={isSelected}
                    onSelect={
                      !isSelected && canAfford
                        ? () => onSelectPlayer(player)
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t-2 border-border">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-retro-outline text-xs px-2 py-1 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-heading">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-retro-outline text-xs px-2 py-1 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
