"use client";

interface MatchCardProps {
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
  homeScore: number;
  awayScore: number;
  status: string;
  kickoff: string;
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Programado",
  LIVE: "En vivo",
  FINISHED: "Finalizado",
  POSTPONED: "Suspendido",
};

const statusColors: Record<string, string> = {
  SCHEDULED: "text-muted-foreground",
  LIVE: "text-green-700 font-bold animate-pulse",
  FINISHED: "text-foreground",
  POSTPONED: "text-destructive",
};

export function MatchCard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  kickoff,
}: MatchCardProps) {
  const isFinished = status === "FINISHED";
  const isLive = status === "LIVE";

  return (
    <div className="card-retro">
      <div className="p-3">
        <div className="flex items-center gap-3">
          {/* Home team */}
          <div className="flex-1 flex items-center gap-2 justify-end">
            <span className="font-heading font-bold text-sm text-right truncate">
              {homeTeam.name}
            </span>
            <img
              src={homeTeam.logo}
              alt={homeTeam.name}
              className="w-8 h-8 border border-border object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-team.png";
              }}
            />
          </div>

          {/* Score */}
          <div className="flex items-center gap-1 min-w-[80px] justify-center">
            <span
              className={`font-heading font-bold text-2xl ${
                isFinished || isLive ? "" : "text-muted-foreground"
              }`}
            >
              {isFinished || isLive ? homeScore : "-"}
            </span>
            <span className="text-muted-foreground font-heading text-lg">:</span>
            <span
              className={`font-heading font-bold text-2xl ${
                isFinished || isLive ? "" : "text-muted-foreground"
              }`}
            >
              {isFinished || isLive ? awayScore : "-"}
            </span>
          </div>

          {/* Away team */}
          <div className="flex-1 flex items-center gap-2">
            <img
              src={awayTeam.logo}
              alt={awayTeam.name}
              className="w-8 h-8 border border-border object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-team.png";
              }}
            />
            <span className="font-heading font-bold text-sm truncate">
              {awayTeam.name}
            </span>
          </div>
        </div>

        {/* Status & kickoff */}
        <div className="flex justify-center mt-2">
          <span className={`text-xs ${statusColors[status] || ""}`}>
            {isLive && "● "}
            {statusLabels[status] || status}
            {status === "SCHEDULED" && (
              <span className="ml-1 text-muted-foreground">
                {new Date(kickoff).toLocaleString("es-AR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
