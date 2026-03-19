import { GameState } from "@/pages/Index";

interface GameHeaderProps {
  timeLeft: number;
  currentPhase: number;
  totalPhases: number;
  gameState: GameState;
  xp: number;
  accuracy: number;
  totalStars: number;
}

const GameHeader = ({ timeLeft, currentPhase, totalPhases, gameState, xp, accuracy, totalStars }: GameHeaderProps) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft < 5 * 60;
  const progress = gameState === "finished" ? 100 : ((currentPhase + 1) / Math.max(totalPhases, 1)) * 100;

  const layerColors = ["#888888", "#E17055", "#FDCB6E", "#6C63FF", "#00B894", "#E84393", "#FF6B35"];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-primary/20">
      <div className="container max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm md:text-base text-foreground text-glow-green tracking-wider">
            CONEXAO PERDIDA
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`font-bold text-xl md:text-2xl tracking-widest font-mono ${
              isLow ? "text-destructive text-glow-red animate-pulse-glow" : "text-foreground text-glow-green"
            }`}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>

          <div className="text-xs md:text-sm text-secondary font-semibold">FASE {Math.min(currentPhase + 1, totalPhases)}/{totalPhases}</div>
        </div>

        <div className="flex items-center gap-3 text-xs md:text-sm">
          <span className="px-2 py-1 rounded border border-primary/30 bg-muted">XP {xp}</span>
          <span className="px-2 py-1 rounded border border-secondary/30 bg-muted">Precisao {accuracy}%</span>
          <span className="px-2 py-1 rounded border border-warning/30 bg-muted">Estrelas {totalStars}</span>
        </div>
      </div>

      <div className="h-1 bg-muted">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${layerColors.slice(0, Math.min(currentPhase + 1, layerColors.length)).join(", ")})`,
          }}
        />
      </div>
    </header>
  );
};

export default GameHeader;
