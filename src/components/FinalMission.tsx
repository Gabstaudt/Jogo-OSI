import { useState } from "react";

interface FinalMissionProps {
  onSolved: (attempts: number) => void;
}

const options = [
  "Falha de DNS",
  "Falha de handshake TCP",
  "Erro de rota IP",
  "Bloqueio de firewall",
];

const correctIndex = 0;

const FinalMission = ({ onSolved }: FinalMissionProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [attempts, setAttempts] = useState(0);

  const verify = () => {
    if (selected === null) {
      setFeedback("Selecione uma causa raiz para continuar.");
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (selected === correctIndex) {
      setFeedback("Correto. Sem DNS, o usuario nao resolve o dominio para IP.");
      setTimeout(() => onSolved(nextAttempts), 700);
      return;
    }

    setFeedback("Incorreto. A pista principal e: URL nao resolve nome para IP.");
  };

  return (
    <div className="container max-w-3xl mx-auto px-4">
      <div className="bg-card border border-primary/20 rounded-lg p-6 border-glow-green animate-fade-in-up">
        <p className="text-xs text-warning tracking-widest mb-2">MISSAO FINAL</p>
        <h2 className="text-xl md:text-2xl font-bold text-glow-green mb-4">
          Incidente completo de rede
        </h2>

        <div className="space-y-2 text-sm text-foreground/85 mb-5">
          <p>Sintoma: usuario nao consegue acessar o site corporativo.</p>
          <p>Pistas: link fisico ativo, ping por IP responde, URL falha.</p>
          <p>Diagnostique a camada raiz do problema.</p>
        </div>

        <div className="grid gap-2">
          {options.map((opt, index) => (
            <button
              key={opt}
              onClick={() => setSelected(index)}
              className={`text-left px-4 py-3 rounded-md border text-sm transition-all ${
                selected === index
                  ? "border-secondary bg-secondary/20 text-foreground"
                  : "border-primary/20 bg-muted hover:border-primary/50 text-foreground/85"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {feedback && (
          <p className="mt-4 text-sm font-semibold text-warning">{feedback}</p>
        )}

        <button
          onClick={verify}
          className="mt-5 px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-bold text-sm tracking-wider hover:shadow-[0_0_20px_hsl(152_100%_50%/0.3)] transition-all"
        >
          VALIDAR DIAGNOSTICO
        </button>
      </div>
    </div>
  );
};

export default FinalMission;
