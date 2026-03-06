import { useMemo, useState } from "react";

const osiLayers = ["Aplicacao", "Apresentacao", "Sessao", "Transporte", "Rede", "Enlace", "Fisica"];
const tcpipOptions = ["Aplicacao", "Transporte", "Internet", "Acesso a Rede"];
const targetMap: Record<string, string> = {
  Aplicacao: "Aplicacao",
  Apresentacao: "Aplicacao",
  Sessao: "Aplicacao",
  Transporte: "Transporte",
  Rede: "Internet",
  Enlace: "Acesso a Rede",
  Fisica: "Acesso a Rede",
};

const OsiTcpipMatch = () => {
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");

  const score = useMemo(() => {
    return osiLayers.reduce((acc, layer) => acc + (selection[layer] === targetMap[layer] ? 1 : 0), 0);
  }, [selection]);

  const validate = () => {
    if (Object.keys(selection).length < osiLayers.length) {
      setFeedback("Complete todos os mapeamentos primeiro.");
      return;
    }
    setFeedback(score === osiLayers.length ? "Perfeito: mapeamento OSI vs TCP/IP correto." : `Voce acertou ${score}/7. Revise as camadas intermediarias.`);
  };

  return (
    <div className="bg-card border border-primary/20 rounded-lg p-6 text-left">
      <p className="text-warning text-xs font-semibold tracking-widest mb-4">TREINO OSI VS TCP/IP</p>
      <div className="grid gap-2 mb-4">
        {osiLayers.map((layer) => (
          <div key={layer} className="grid grid-cols-[1fr,1fr] gap-2 items-center">
            <span className="text-sm text-foreground/85">{layer}</span>
            <select
              value={selection[layer] ?? ""}
              onChange={(e) => setSelection((prev) => ({ ...prev, [layer]: e.target.value }))}
              className="bg-input border border-primary/30 rounded px-2 py-1.5 text-sm"
            >
              <option value="">Selecionar...</option>
              {tcpipOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button onClick={validate} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-semibold">
        VALIDAR MAPEAMENTO
      </button>
      {feedback && <p className="text-sm text-foreground/85 mt-3">{feedback}</p>}
    </div>
  );
};

export default OsiTcpipMatch;
