import { useState, useCallback } from "react";
import { Phase } from "@/data/phases";
import DragOrder from "@/components/DragOrder";

interface PhaseCardProps {
  phase: Phase;
  onComplete: () => void;
}

const PhaseCard = ({ phase, onComplete }: PhaseCardProps) => {
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [dragOrder, setDragOrder] = useState<string[]>(() => {
    if (phase.enigmaType === 'drag-order' && Array.isArray(phase.correctAnswer)) {
      // Shuffle
      const shuffled = [...phase.correctAnswer].sort(() => Math.random() - 0.5);
      // Make sure it's not already correct
      if (JSON.stringify(shuffled) === JSON.stringify(phase.correctAnswer)) {
        return [...shuffled].reverse();
      }
      return shuffled;
    }
    return [];
  });
  const [isShaking, setIsShaking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

  const checkAnswer = useCallback(() => {
    let correct = false;

    if (phase.enigmaType === 'text') {
      correct = normalize(answer) === normalize(String(phase.correctAnswer));
    } else if (phase.enigmaType === 'multiple-choice') {
      correct = selectedOption === phase.correctAnswer;
    } else if (phase.enigmaType === 'drag-order') {
      correct = JSON.stringify(dragOrder) === JSON.stringify(phase.correctAnswer);
    }

    if (correct) {
      setShowExplanation(true);
      setErrorMessage("");
    } else {
      setErrorMessage("❌ Resposta incorreta. Tente novamente!");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  }, [answer, selectedOption, dragOrder, phase]);

  // Frame table for layer 2
  const renderEthernetFrame = () => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-xs border border-primary/30">
        <thead>
          <tr className="bg-muted">
            <th className="px-3 py-2 text-left text-muted-foreground border-r border-primary/20">Campo</th>
            <th className="px-3 py-2 text-left text-foreground">Valor</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["MAC Origem", "AA:BB:CC:DD:EE:FF"],
            ["MAC Destino", "FF:FF:FF:FF:FF:FF"],
            ["Tipo", "0x0800"],
            ["Dados", "[payload]"],
          ].map(([field, value]) => (
            <tr key={field} className="border-t border-primary/20">
              <td className="px-3 py-2 text-warning font-semibold border-r border-primary/20">{field}</td>
              <td className="px-3 py-2 text-foreground font-mono">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={`animate-fade-in-up ${isShaking ? 'animate-shake' : ''}`}>
      {/* Badge */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
          style={{ backgroundColor: phase.badgeColor + '22', color: phase.badgeColor, border: `1px solid ${phase.badgeColor}44` }}
        >
          {phase.icon} CAMADA {phase.layer} — {phase.name.toUpperCase()}
        </span>
      </div>

      {/* Protocols */}
      <p className="text-muted-foreground text-xs mb-6 tracking-wide">
        Protocolos: {phase.protocols}
      </p>

      {/* Main card */}
      <div className="bg-card border border-primary/20 rounded-lg p-6 border-glow-green">
        {/* Narrative */}
        <div className="mb-6 pb-4 border-b border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-warning text-xs">▶</span>
            <span className="text-warning text-xs font-semibold tracking-widest">LOG DO SISTEMA</span>
          </div>
          <p className="text-foreground/80 text-sm leading-relaxed">{phase.narrative}</p>
        </div>

        {/* Enigma */}
        {phase.enigmaDisplay && (
          <div className="bg-muted rounded-md p-4 mb-4 text-center">
            <code className="text-xl md:text-2xl font-bold text-warning tracking-wider break-all">
              {phase.enigmaDisplay}
            </code>
          </div>
        )}

        {phase.layer === 2 && renderEthernetFrame()}

        <p className="text-foreground text-sm font-semibold mb-4">{phase.instruction}</p>

        {/* Input area */}
        {phase.enigmaType === 'text' && (
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
            placeholder="Digite sua resposta..."
            className="w-full bg-input border border-primary/30 rounded-md px-4 py-3 text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_10px_hsl(152_100%_50%/0.2)] transition-all"
          />
        )}

        {phase.enigmaType === 'multiple-choice' && (
          <div className="flex flex-col gap-2">
            {phase.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedOption(i)}
                className={`
                  text-left px-4 py-3 rounded-md border text-sm transition-all
                  ${selectedOption === i
                    ? 'border-secondary bg-secondary/15 text-foreground'
                    : 'border-primary/20 bg-muted text-foreground/80 hover:border-primary/40'
                  }
                `}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {phase.enigmaType === 'drag-order' && (
          <DragOrder
            items={phase.correctAnswer as string[]}
            order={dragOrder}
            onReorder={setDragOrder}
          />
        )}

        {/* Error message */}
        {errorMessage && (
          <p className="text-destructive text-sm mt-3 font-semibold">{errorMessage}</p>
        )}

        {/* Action buttons */}
        {!showExplanation && (
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={checkAnswer}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-bold text-sm tracking-wider hover:shadow-[0_0_20px_hsl(152_100%_50%/0.3)] transition-all"
            >
              VERIFICAR
            </button>
            <button
              onClick={() => setShowHint(true)}
              className="px-4 py-2.5 bg-muted text-warning rounded-md text-sm font-semibold hover:bg-muted/80 transition-all"
            >
              💡 Dica
            </button>
          </div>
        )}

        {/* Hint */}
        {showHint && !showExplanation && (
          <div className="mt-4 p-3 rounded-md bg-warning/10 border border-warning/30">
            <p className="text-warning text-sm">💡 {phase.hint}</p>
          </div>
        )}

        {/* Explanation (correct answer) */}
        {showExplanation && (
          <div className="mt-6 animate-fade-in-up">
            <div className="p-4 rounded-md border border-primary/40 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-primary text-lg">✅</span>
                <span className="text-primary font-bold text-sm tracking-wider">CAMADA RESTAURADA!</span>
              </div>
              <p className="text-foreground/80 text-sm leading-relaxed">{phase.explanation}</p>
            </div>
            <button
              onClick={onComplete}
              className="mt-4 px-6 py-2.5 bg-secondary text-secondary-foreground rounded-md font-bold text-sm tracking-wider hover:shadow-[0_0_20px_hsl(245_100%_69%/0.3)] transition-all"
            >
              {phase.layer < 7 ? 'PRÓXIMA CAMADA →' : 'FINALIZAR MISSÃO →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhaseCard;
