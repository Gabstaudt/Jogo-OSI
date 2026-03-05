import { useState, useEffect } from "react";
import { phases } from "@/data/phases";

interface FinalScreenProps {
  totalTime: number;
  onRestart: () => void;
  xp: number;
  accuracy: number;
  starsByLayer: number[];
  layerStats: {
    attempts: number;
    timeSpentSeconds: number;
    stars: number;
    xp: number;
  }[];
}

const formatSeconds = (total: number) => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const FinalScreen = ({ totalTime, onRestart, xp, accuracy, starsByLayer, layerStats }: FinalScreenProps) => {
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

  const weakLayers = phases
    .map((phase, index) => ({ phase, stat: layerStats[index] }))
    .filter(({ stat }) => stat.stars <= 2 || stat.attempts > 1 || stat.timeSpentSeconds > 90);

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
                <div>
                  <span className="font-semibold" style={{ color: phase.badgeColor }}>
                    {phase.icon} Camada {phase.layer} - {phase.name}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tentativas: {layerStats[index]?.attempts || 0} | Tempo: {formatSeconds(layerStats[index]?.timeSpentSeconds || 0)} | XP: {layerStats[index]?.xp || 0}
                  </p>
                </div>
                <span className="text-warning">
                  {Array.from({ length: starsByLayer[index] || 0 })
                    .map(() => "★")
                    .join("") || "-"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-secondary/20 rounded-lg p-6 mb-8 text-left">
          <p className="text-secondary text-xs font-semibold tracking-widest mb-4">REVISAO AUTOMATICA</p>
          {weakLayers.length === 0 ? (
            <p className="text-sm text-foreground/85">Excelente consistencia. Nenhum ponto fraco critico detectado.</p>
          ) : (
            <div className="grid gap-3">
              {weakLayers.map(({ phase, stat }) => (
                <div key={`review-${phase.layer}`} className="rounded-md border border-secondary/30 bg-secondary/10 p-3">
                  <p className="text-sm font-semibold" style={{ color: phase.badgeColor }}>
                    Camada {phase.layer} - {phase.name}
                  </p>
                  <p className="text-xs text-foreground/80 mt-1">
                    Indicadores: {stat.attempts} tentativas, {formatSeconds(stat.timeSpentSeconds)} de resolucao, {stat.stars} estrela(s).
                  </p>
                  <p className="text-xs text-foreground/90 mt-2">
                    Revisar: {phase.explanation}
                  </p>
                  <p className="text-xs text-warning mt-2">Proximo treino sugerido: {phase.instruction}</p>
                </div>
              ))}
            </div>
          )}
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
