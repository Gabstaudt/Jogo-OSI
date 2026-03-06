import { useEffect, useMemo, useState } from "react";
import { Phase } from "@/data/phases";

interface OsiVisualizationProps {
  phase: Phase;
  completedLayers: number;
}

const flowLayers = ["Aplicacao", "Apresentacao", "Sessao", "Transporte", "Rede", "Enlace", "Fisica"];

const encapsulationTargets = ["DATA", "TCP HEADER", "IP HEADER", "ETH HEADER", "FCS"];

const OsiVisualization = ({ phase, completedLayers }: OsiVisualizationProps) => {
  const activeIndex = flowLayers.findIndex((layer) => layer.toLowerCase() === phase.name.toLowerCase());
  const [encapsulationOrder, setEncapsulationOrder] = useState<string[]>([]);
  const [encapFeedback, setEncapFeedback] = useState("");

  const requiredPieces = useMemo(() => {
    if (phase.layer <= 2) return ["DATA"];
    if (phase.layer <= 3) return ["DATA", "TCP HEADER", "IP HEADER"];
    return [...encapsulationTargets];
  }, [phase.layer]);

  useEffect(() => {
    const shuffled = [...requiredPieces].sort(() => Math.random() - 0.5);
    setEncapsulationOrder(shuffled);
    setEncapFeedback("");
  }, [requiredPieces, phase.layer]);

  const movePiece = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= encapsulationOrder.length) return;
    const copy = [...encapsulationOrder];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setEncapsulationOrder(copy);
  };

  const checkEncapsulation = () => {
    const validOrder = requiredPieces.filter((p) => encapsulationTargets.includes(p));
    const targetOrder = encapsulationTargets.filter((p) => validOrder.includes(p));
    const ok = JSON.stringify(encapsulationOrder) === JSON.stringify(targetOrder);
    setEncapFeedback(ok ? "Correto: encapsulamento montado na ordem certa." : "Ainda fora de ordem. Pense na descida da pilha.");
  };

  return (
    <section className="bg-card border border-primary/20 rounded-lg p-5 border-glow-green">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold tracking-wider text-secondary">VISUALIZACAO OSI</h3>
        <span className="text-xs text-muted-foreground">Camada ativa: {phase.layer}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-muted/40 border border-primary/10 rounded-md p-3">
          <p className="text-xs text-warning mb-2">Fluxo de dados (descendo a pilha)</p>
          <div className="space-y-1.5">
            <div className="text-xs text-foreground/90">Usuario envia mensagem</div>
            {flowLayers.map((layer, idx) => (
              <div key={layer} className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">v</span>
                <div
                  className={`text-xs px-2 py-1 rounded border ${
                    idx === activeIndex
                      ? "border-secondary bg-secondary/20 text-foreground font-semibold"
                      : "border-primary/20 bg-background/40 text-muted-foreground"
                  }`}
                >
                  {layer}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/40 border border-primary/10 rounded-md p-3">
          <p className="text-xs text-warning mb-2">Mini puzzle de encapsulamento</p>
          <div className="space-y-2">
            {encapsulationOrder.map((piece, idx) => (
              <div key={`${piece}-${idx}`} className="flex items-center gap-2 border border-primary/20 rounded px-2 py-1 bg-background/60">
                <span className="text-[11px] md:text-xs font-mono flex-1">{piece}</span>
                <button className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80" onClick={() => movePiece(idx, -1)}>
                  ^
                </button>
                <button className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80" onClick={() => movePiece(idx, 1)}>
                  v
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={checkEncapsulation}
            className="mt-3 text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground font-semibold hover:shadow-[0_0_12px_hsl(152_100%_50%/0.25)]"
          >
            VALIDAR ORDEM
          </button>
          {encapFeedback && <p className="text-xs mt-2 text-foreground/85">{encapFeedback}</p>}
          <p className="text-[11px] text-muted-foreground mt-3">Camadas restauradas: {completedLayers}/7</p>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-md border border-secondary/30 bg-secondary/10">
        <p className="text-xs text-secondary font-semibold mb-1">O que esta acontecendo na rede</p>
        <p className="text-sm text-foreground/85">{phase.networkMessage}</p>
      </div>

      {phase.layer === 4 && phase.dynamicFlow && (
        <div className="mt-4 p-3 rounded-md border border-primary/30 bg-primary/5">
          <p className="text-xs text-primary font-semibold mb-2">Three-Way Handshake (visual)</p>
          <div className="grid gap-2">
            {phase.dynamicFlow.map((step, index) => (
              <div
                key={step}
                className="text-xs font-mono border border-primary/20 rounded px-2 py-1 bg-background/50 animate-fade-in-up"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default OsiVisualization;
