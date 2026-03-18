import { useEffect, useState } from "react";
import { api, type FinalMissionView } from "@/lib/api";

interface FinalMissionProps {
  onSolved: (attempts: number) => void;
}

const FinalMission = ({ onSolved }: FinalMissionProps) => {
  const [mission, setMission] = useState<FinalMissionView | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState("Carregando investigacao...");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await api.getFinalMission();
        if (!active) return;
        setMission(data);
        setTerminalOutput("Execute testes para investigar o incidente.");
      } catch {
        if (!active) return;
        setFeedback("Falha ao carregar a missao final da API.");
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const verify = async () => {
    if (selected === null) {
      setFeedback("Selecione uma causa raiz para continuar.");
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    try {
      const result = await api.validateFinalMission(selected);
      setFeedback(result.feedback);
      if (result.correct) {
        setTimeout(() => onSolved(nextAttempts), 800);
      }
    } catch (err) {
      setFeedback(`Falha ao validar diagnostico: ${err instanceof Error ? err.message : "erro desconhecido"}`);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-primary/20 rounded-lg p-6 border-glow-green animate-fade-in-up">
          <p className="text-xs text-warning tracking-widest mb-2">MISSAO FINAL</p>
          <h2 className="text-xl md:text-2xl font-bold text-glow-green mb-4">
            {mission?.title ?? "Carregando..."}
          </h2>

          <div className="space-y-2 text-sm text-foreground/85 mb-5">
            <p>Sintoma: {mission?.symptom ?? "-"}</p>
            <p>Objetivo: {mission?.objective ?? "-"}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => setTerminalOutput(mission?.commandOutputs.ping ?? "Sem dados")}
              className="px-3 py-2 rounded bg-muted text-xs hover:bg-muted/80"
            >
              ping
            </button>
            <button
              onClick={() => setTerminalOutput(mission?.commandOutputs.traceroute ?? "Sem dados")}
              className="px-3 py-2 rounded bg-muted text-xs hover:bg-muted/80"
            >
              traceroute
            </button>
            <button
              onClick={() => setTerminalOutput(mission?.commandOutputs.nslookup ?? "Sem dados")}
              className="px-3 py-2 rounded bg-muted text-xs hover:bg-muted/80"
            >
              nslookup
            </button>
          </div>

          <pre className="bg-background border border-primary/20 rounded-md p-3 text-[11px] md:text-xs text-foreground/85 min-h-[170px] whitespace-pre-wrap">
            {terminalOutput}
          </pre>
        </div>

        <div className="bg-card border border-secondary/20 rounded-lg p-6 border-glow-purple animate-fade-in-up">
          <p className="text-xs text-secondary tracking-widest mb-4">DIAGNOSTICO</p>
          <div className="grid gap-2">
            {(mission?.options || []).map((opt, index) => (
              <button
                key={opt}
                onClick={() => setSelected(index)}
                className={`text-left px-4 py-3 rounded-md border text-sm transition-all ${
                  selected === index ? "border-secondary bg-secondary/20 text-foreground" : "border-primary/20 bg-muted hover:border-primary/50 text-foreground/85"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {feedback && <p className="mt-4 text-sm font-semibold text-warning">{feedback}</p>}

          <button
            onClick={verify}
            className="mt-5 px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-bold text-sm tracking-wider hover:shadow-[0_0_20px_hsl(152_100%_50%/0.3)] transition-all"
          >
            VALIDAR DIAGNOSTICO
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalMission;
