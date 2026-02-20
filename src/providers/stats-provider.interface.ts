/**
 * Stats Provider Interface
 *
 * Abstraction layer for external stats APIs (API-Football, SportMonks, etc.).
 * All external data access goes through this interface so we can swap
 * implementations (mock ↔ real) without touching consumer code.
 */

// ── Data types returned by the provider ──

export interface TeamVenue {
  name: string;
  city: string;
  capacity: number;
  image: string;
}

export interface TeamData {
  apiId: number;
  name: string;
  code: string | null;
  logo: string;
  founded: number;
  national: boolean;
  venue: TeamVenue | null;
  tier: 1 | 2 | 3;
}

export interface PlayerSeasonStats {
  rating: number | null;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  shots: number | null;
  shotsOn: number | null;
  passes: number | null;
  passAccuracy: number | null;
  tackles: number | null;
  saves: number | null;
}

export interface PlayerData {
  apiId: number;
  name: string;
  photo: string;
  age: number | null;
  number: number | null;
  position: "GK" | "DEF" | "MID" | "FWD";
  teamApiId: number;
  teamName: string;
  stats: PlayerSeasonStats | null;
  hasRealStats: boolean;
  fantasyPrice: number; // $1M–$15M virtual currency
}

export interface MatchData {
  id: number;
  matchdayId: number;
  homeTeamApiId: number;
  awayTeamApiId: number;
  homeScore: number;
  awayScore: number;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED";
  kickoff: string; // ISO 8601
}

export interface MatchdayData {
  id: number;
  name: string;
  status: "OPEN" | "LOCK" | "LIVE" | "RESULTS";
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
}

export interface PlayerMatchStats {
  playerApiId: number;
  matchId: number;
  rating: number; // match rating 0-10 (the fantasy score source)
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  saves: number;
}

// ── Filter types ──

export interface PlayerFilters {
  search?: string;
  position?: "GK" | "DEF" | "MID" | "FWD";
  teamApiId?: number;
  sortBy?: "value" | "rating" | "name";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Provider interface ──

export interface StatsProvider {
  /** Get all available teams */
  getTeams(): Promise<TeamData[]>;

  /** Get a single team by API ID */
  getTeam(teamApiId: number): Promise<TeamData | null>;

  /** Get players with optional filtering and pagination */
  getPlayers(filters?: PlayerFilters): Promise<PaginatedResult<PlayerData>>;

  /** Get a single player by API ID */
  getPlayer(playerApiId: number): Promise<PlayerData | null>;

  /** Get all matchdays */
  getMatchdays(): Promise<MatchdayData[]>;

  /** Get a single matchday by ID */
  getMatchday(matchdayId: number): Promise<MatchdayData | null>;

  /** Get matches for a specific matchday */
  getMatchesByMatchday(matchdayId: number): Promise<MatchData[]>;

  /** Get player stats for a specific match */
  getMatchStats(matchId: number): Promise<PlayerMatchStats[]>;

  /** Get a player's rating for a specific match (the fantasy score) */
  getPlayerRating(playerApiId: number, matchId: number): Promise<number | null>;

  /** Get all stats for a player across all matches */
  getPlayerStats(playerApiId: number): Promise<PlayerMatchStats[]>;
}
