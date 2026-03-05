import { useState, useEffect } from "react";
import { phases } from "@/data/phases";

interface FinalScreenProps {
  totalTime: number;
  onRestart: () => void;
  xp: number;
  accuracy: number;
  starsByLayer: number[];
}

const FinalScreen = ({ totalTime, onRestart, xp, accuracy, starsByLayer }: FinalScreenProps) => {
  const [visibleChars, setVisibleChars] = useState(0);
  const message = "SISTEMA RESTAURADO COM SUCESSO";

  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;

  useEffect(() => {
    if (visibleChars < message.length) {
      const timeout = setTimeout(() => setVisibleChars((v) => v + 1), 60);
      return () => clearTimeout(timeout);
    }
  }, [visibleChars, message.length]);

  return (
    <div className="container max-w-4xl mx-auto px-4 pt-8">
      <div className="animate-fade-in-up text-center">
        <div className="mb-8">
          <p className="text-foreground text-xl md:text-2xl font-bold text-glow-green font-mono tracking-wider">
            {message.slice(0, visibleChars)}
            <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse-glow" />
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-8">
          <div className="bg-card border border-primary/20 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Tempo</p>
            <p className="text-2xl font-bold text-secondary">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </p>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">XP total</p>
            <p className="text-2xl font-bold text-foreground">{xp}</p>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Precisao</p>
            <p className="text-2xl font-bold text-warning">{accuracy}%</p>
          </div>
        </div>

        <div className="bg-card border border-primary/20 rounded-lg p-6 mb-8 text-left">
          <p className="text-warning text-xs font-semibold tracking-widest mb-4">DESEMPENHO POR CAMADA</p>
          <div className="grid gap-2">
            {phases.map((phase, index) => (
              <div key={phase.layer} className="flex items-center justify-between text-sm border-b border-primary/10 pb-2">
                <span className="font-semibold" style={{ color: phase.badgeColor }}>
                  {phase.icon} Camada {phase.layer} - {phase.name}
                </span>
                <span className="text-warning">{Array.from({ length: starsByLayer[index] || 0 }).map(() => "★").join("") || "-"}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-foreground/80 text-sm mb-8 max-w-xl mx-auto">
          Missao concluida. Voce restaurou as 7 camadas do modelo OSI e diagnosticou o incidente final da rede.
        </p>

        <button
          onClick={onRestart}
          className="px-8 py-3 bg-secondary text-secondary-foreground rounded-md font-bold text-sm tracking-wider hover:shadow-[0_0_20px_hsl(245_100%_69%/0.3)] transition-all"
        >
          JOGAR NOVAMENTE
        </button>
      </div>
    </div>
  );
};

export default FinalScreen;
