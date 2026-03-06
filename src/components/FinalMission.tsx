import { useState } from "react";

interface FinalMissionProps {
  onSolved: (attempts: number) => void;
}

const options = ["Falha de DNS", "Falha de handshake TCP", "Erro de rota IP", "Bloqueio de firewall"];
const correctIndex = 0;

const commandOutputs: Record<string, string> = {
  ping: [
    "> ping 10.10.20.8",
    "Reply from 10.10.20.8: bytes=32 time=7ms TTL=60",
    "Reply from 10.10.20.8: bytes=32 time=8ms TTL=60",
    "Status: conectividade IP OK",
  ].join("\n"),
  traceroute: [
    "> traceroute 10.10.20.8",
    "1 10.10.1.1  2ms",
    "2 10.10.5.2  5ms",
    "3 10.10.20.8 7ms",
    "Status: rota completa",
  ].join("\n"),
  nslookup: [
    "> nslookup portal.empresa.local",
    "Server: dns1.local",
    "Address: 10.10.1.53",
    "*** dns1.local nao encontrou portal.empresa.local: NXDOMAIN",
    "Status: falha de resolucao de nome",
  ].join("\n"),
};

const FinalMission = ({ onSolved }: FinalMissionProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState("Execute testes para investigar o incidente.");

  const verify = () => {
    if (selected === null) {
      setFeedback("Selecione uma causa raiz para continuar.");
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (selected === correctIndex) {
      setFeedback("Correto. O incidente esta na camada de Aplicacao: DNS ausente.");
      setTimeout(() => onSolved(nextAttempts), 800);
      return;
    }

    setFeedback("Incorreto. Use os testes: ping/traceroute OK e nslookup com NXDOMAIN.");
  };

  return (
    <div className="container max-w-5xl mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-primary/20 rounded-lg p-6 border-glow-green animate-fade-in-up">
          <p className="text-xs text-warning tracking-widest mb-2">MISSAO FINAL</p>
          <h2 className="text-xl md:text-2xl font-bold text-glow-green mb-4">Investigacao de incidente completo</h2>

          <div className="space-y-2 text-sm text-foreground/85 mb-5">
            <p>Sintoma: usuario nao consegue acessar o portal por URL.</p>
            <p>Objetivo: descobrir a causa raiz e camada afetada.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <button onClick={() => setTerminalOutput(commandOutputs.ping)} className="px-3 py-2 rounded bg-muted text-xs hover:bg-muted/80">ping</button>
            <button onClick={() => setTerminalOutput(commandOutputs.traceroute)} className="px-3 py-2 rounded bg-muted text-xs hover:bg-muted/80">traceroute</button>
            <button onClick={() => setTerminalOutput(commandOutputs.nslookup)} className="px-3 py-2 rounded bg-muted text-xs hover:bg-muted/80">nslookup</button>
          </div>

          <pre className="bg-background border border-primary/20 rounded-md p-3 text-[11px] md:text-xs text-foreground/85 min-h-[170px] whitespace-pre-wrap">
            {terminalOutput}
          </pre>
        </div>

        <div className="bg-card border border-secondary/20 rounded-lg p-6 border-glow-purple animate-fade-in-up">
          <p className="text-xs text-secondary tracking-widest mb-4">DIAGNOSTICO</p>
          <div className="grid gap-2">
            {options.map((opt, index) => (
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
