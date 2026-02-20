import type { Position, MatchdayStatus } from "@/generated/prisma/client";

// ── Formation types ──

export type FormationCode =
  | "4-3-3"
  | "4-4-2"
  | "3-5-2"
  | "3-4-3"
  | "4-5-1"
  | "5-3-2"
  | "5-4-1";

export interface FormationSlots {
  GK: number;
  DEF: number;
  MID: number;
  FWD: number;
}

export interface FormationDefinition {
  code: FormationCode;
  label: string; // display name
  slots: FormationSlots;
}

// ── Player filter types (for API routes) ──

export interface PlayerFilters {
  search?: string;
  position?: Position;
  teamId?: number;
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

// ── Squad validation ──

export interface SquadValidation {
  valid: boolean;
  errors: string[];
}

export interface SquadSummary {
  id: number;
  formation: FormationCode;
  playerCount: number;
  starterCount: number;
  benchCount: number;
  totalValue: number;
  remainingBudget: number;
  captainId: number | null;
  captainSubId: number | null;
}

// ── Matchday view ──

export interface MatchdayView {
  id: number;
  name: string;
  status: MatchdayStatus;
  startDate: string;
  endDate: string;
  matchCount: number;
  finishedCount: number;
}

export interface MatchView {
  id: number;
  homeTeam: { id: number; name: string; logo: string };
  awayTeam: { id: number; name: string; logo: string };
  homeScore: number;
  awayScore: number;
  status: string;
  kickoff: string;
}

export interface PlayerPointsView {
  playerId: number;
  playerName: string;
  position: Position;
  teamName: string;
  rawPoints: number;
  multiplier: number; // 1x, 0.5x, 2x
  finalPoints: number;
  isStarter: boolean;
  isCaptain: boolean;
}

// ── Leaderboard ──

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userImage: string | null;
  totalPoints: number;
  matchdayBreakdown: { matchdayId: number; points: number }[];
}

// ── Payment types ──

export interface PaymentLink {
  preferenceId: string;
  initPoint: string; // MP checkout URL
}

export interface PaymentResult {
  paymentId: string;
  status: "approved" | "rejected" | "pending";
  amountArs: number;
}
