import type {
  StatsProvider,
  TeamData,
  PlayerData,
  MatchData,
  MatchdayData,
  PlayerMatchStats,
  PlayerFilters,
  PaginatedResult,
} from "./stats-provider.interface";

// Teams and players come from the pre-processed API-Football data pipeline
// (see data/README.md for details on the pipeline)
import teamsJson from "../../data/processed/teams.json";
import playersJson from "../../data/processed/players.json";

// Matches and per-match stats are mock data for demo purposes
import matchesJson from "@/mock-data/matches.json";
import statsJson from "@/mock-data/stats.json";

const teams: TeamData[] = teamsJson as TeamData[];
const players: PlayerData[] = playersJson as PlayerData[];
const matchdays: MatchdayData[] = matchesJson.matchdays as MatchdayData[];
const matches: MatchData[] = matchesJson.matches as MatchData[];
const stats: PlayerMatchStats[] = statsJson as PlayerMatchStats[];

const DEFAULT_PAGE_SIZE = 20;

/**
 * Mock stats provider backed by local JSON fixtures.
 * Uses real player/team data from API-Football (889 players, 28 teams)
 * with generated match results and per-match stats for 2 matchdays.
 */
export class MockStatsProvider implements StatsProvider {
  async getTeams(): Promise<TeamData[]> {
    return teams;
  }

  async getTeam(teamApiId: number): Promise<TeamData | null> {
    return teams.find((t) => t.apiId === teamApiId) ?? null;
  }

  async getPlayers(
    filters?: PlayerFilters,
  ): Promise<PaginatedResult<PlayerData>> {
    let filtered = [...players];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.teamName.toLowerCase().includes(q),
      );
    }

    if (filters?.position) {
      filtered = filtered.filter((p) => p.position === filters.position);
    }

    if (filters?.teamApiId) {
      filtered = filtered.filter((p) => p.teamApiId === filters.teamApiId);
    }

    // Sort
    const sortBy = filters?.sortBy ?? "rating";
    const sortOrder = filters?.sortOrder ?? "desc";
    const dir = sortOrder === "asc" ? 1 : -1;

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "value":
          return (a.fantasyPrice - b.fantasyPrice) * dir;
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "rating":
        default: {
          const rA = a.stats?.rating ?? 0;
          const rB = b.stats?.rating ?? 0;
          return (rA - rB) * dir;
        }
      }
    });

    // Paginate
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? DEFAULT_PAGE_SIZE;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return { data, total, page, pageSize, totalPages };
  }

  async getPlayer(playerApiId: number): Promise<PlayerData | null> {
    return players.find((p) => p.apiId === playerApiId) ?? null;
  }

  async getMatchdays(): Promise<MatchdayData[]> {
    return matchdays;
  }

  async getMatchday(matchdayId: number): Promise<MatchdayData | null> {
    return matchdays.find((m) => m.id === matchdayId) ?? null;
  }

  async getMatchesByMatchday(matchdayId: number): Promise<MatchData[]> {
    return matches.filter((m) => m.matchdayId === matchdayId);
  }

  async getMatchStats(matchId: number): Promise<PlayerMatchStats[]> {
    return stats.filter((s) => s.matchId === matchId);
  }

  async getPlayerRating(
    playerApiId: number,
    matchId: number,
  ): Promise<number | null> {
    const stat = stats.find(
      (s) => s.playerApiId === playerApiId && s.matchId === matchId,
    );
    return stat?.rating ?? null;
  }

  async getPlayerStats(playerApiId: number): Promise<PlayerMatchStats[]> {
    return stats.filter((s) => s.playerApiId === playerApiId);
  }
}

/** Singleton instance for app-wide use */
let providerInstance: MockStatsProvider | null = null;

export function getMockStatsProvider(): MockStatsProvider {
  if (!providerInstance) {
    providerInstance = new MockStatsProvider();
  }
  return providerInstance;
}
