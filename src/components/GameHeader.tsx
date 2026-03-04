import { GameState } from "@/pages/Index";

interface GameHeaderProps {
  timeLeft: number;
  currentPhase: number;
  gameState: GameState;
}

const GameHeader = ({ timeLeft, currentPhase, gameState }: GameHeaderProps) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft < 5 * 60;
  const progress = gameState === 'finished' ? 100 : ((currentPhase) / 7) * 100;

  const layerColors = [
    "#888888", "#E17055", "#FDCB6E", "#6C63FF", "#00B894", "#E84393", "#FF6B35"
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-primary/20">
      <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg"></span>
          <span className="font-bold text-sm md:text-base text-foreground text-glow-green tracking-wider">
            CONEXÃO PERDIDA
          </span>
        </div>

        <div className={`font-bold text-xl md:text-2xl tracking-widest font-mono ${isLow ? 'text-destructive text-glow-red animate-pulse-glow' : 'text-foreground text-glow-green'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        <div className="text-sm font-semibold text-secondary text-glow-purple tracking-wide">
          CAMADA {currentPhase + 1}/7
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${layerColors.slice(0, currentPhase + 1).join(', ')}${currentPhase === 0 ? ', ' + layerColors[0] : ''})`,
          }}
        />
      </div>
    </header>
  );
};

export default GameHeader;
