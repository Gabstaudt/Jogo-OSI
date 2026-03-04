import { useState, useEffect } from "react";
import { phases } from "@/data/phases";

interface FinalScreenProps {
  totalTime: number;
  onRestart: () => void;
}

const FinalScreen = ({ totalTime, onRestart }: FinalScreenProps) => {
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
    <div className="container max-w-3xl mx-auto px-4 pt-8">
      <div className="animate-fade-in-up text-center">
        {/* Typewriter message */}
        <div className="mb-8">
          <p className="text-foreground text-xl md:text-2xl font-bold text-glow-green font-mono tracking-wider">
            {message.slice(0, visibleChars)}
            <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse-glow" />
          </p>
        </div>

        {/* Secret code */}
        <div className="bg-card border-2 border-primary rounded-lg p-8 mb-8 border-glow-green inline-block">
          <p className="text-muted-foreground text-xs tracking-widest mb-2">CÓDIGO SECRETO</p>
          <p className="text-4xl md:text-5xl font-bold text-foreground text-glow-green tracking-[0.3em]">
            OSI-7-OK
          </p>
        </div>

        {/* Time */}
        <div className="mb-8">
          <p className="text-muted-foreground text-sm mb-1">Tempo total</p>
          <p className="text-secondary text-2xl font-bold text-glow-purple">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
        </div>

        {/* Layer summary */}
        <div className="bg-card border border-primary/20 rounded-lg p-6 mb-8 text-left">
          <p className="text-warning text-xs font-semibold tracking-widest mb-4">RESUMO DA MISSÃO</p>
          <div className="grid gap-2">
            {phases.map((phase) => (
              <div key={phase.layer} className="flex items-center gap-3 text-sm">
                <span className="text-primary">✅</span>
                <span
                  className="font-semibold"
                  style={{ color: phase.badgeColor }}
                >
                  {phase.icon} Camada {phase.layer}
                </span>
                <span className="text-muted-foreground">— {phase.name}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-foreground/80 text-sm mb-8 max-w-lg mx-auto">
          Missão cumprida. Todas as 7 camadas do modelo OSI foram restauradas. A rede está operacional.
        </p>

        <button
          onClick={onRestart}
          className="px-8 py-3 bg-secondary text-secondary-foreground rounded-md font-bold text-sm tracking-wider hover:shadow-[0_0_20px_hsl(245_100%_69%/0.3)] transition-all"
        >
          🔄 JOGAR NOVAMENTE
        </button>
      </div>
    </div>
  );
};

export default FinalScreen;
