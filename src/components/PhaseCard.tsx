import { useState, useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Phase } from "@/data/phases";
import DragOrder from "@/components/DragOrder";

interface PhaseCardProps {
  phase: Phase;
  onComplete: (attempts: number, timeSpentSeconds: number) => void;
}

const DEFAULT_MODAL_POSITION = { x: 80, y: 120 };

const tutorByLayer: Record<
  number,
  {
    goal: string;
    realExample: string;
    commonMistake: string;
  }
> = {
  1: {
    goal: "Entender como o meio fisico impacta alcance e qualidade do sinal.",
    realExample: "Link de longa distancia em campus usa fibra para reduzir atenuacao.",
    commonMistake: "Tratar qualquer cabo como equivalente, ignorando distancia e ruido.",
  },
  2: {
    goal: "Relacionar entrega local com MAC e estrutura de frame.",
    realExample: "Switch decide porta de saida olhando tabela MAC.",
    commonMistake: "Confundir broadcast com envio unicast.",
  },
  3: {
    goal: "Compreender como roteadores encaminham pacotes entre redes.",
    realExample: "Traceroute mostra cada hop da rota IP ate o destino.",
    commonMistake: "Ignorar TTL ao diagnosticar perda de pacotes.",
  },
  4: {
    goal: "Diferenciar confiabilidade do TCP e rapidez do UDP.",
    realExample: "HTTP usa TCP; streaming em tempo real costuma usar UDP.",
    commonMistake: "Achar que TCP e UDP se comportam igual em ordem/confirmacao.",
  },
  5: {
    goal: "Entender controle de dialogo e continuidade de sessao.",
    realExample: "Sistema precisa retomar sessao apos reconexao sem perder contexto.",
    commonMistake: "Atribuir falha de sessao diretamente ao IP ou ao cabo.",
  },
  6: {
    goal: "Reconhecer transformacao de dados: codificacao, formato e criptografia.",
    realExample: "Conversao para UTF-8 evita caracteres corrompidos no app.",
    commonMistake: "Confundir erro de formato com problema de transporte.",
  },
  7: {
    goal: "Mapear servicos de aplicacao e impacto direto no usuario final.",
    realExample: "Sem DNS, navegador nao encontra o host mesmo com rede ativa.",
    commonMistake: "Assumir que falha de URL sempre e problema de internet/cabo.",
  },
};

const PhaseCard = ({ phase, onComplete }: PhaseCardProps) => {
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [dragOrder, setDragOrder] = useState<string[]>(() => {
    if (phase.enigmaType === "drag-order" && Array.isArray(phase.correctAnswer)) {
      const shuffled = [...phase.correctAnswer].sort(() => Math.random() - 0.5);
      return JSON.stringify(shuffled) === JSON.stringify(phase.correctAnswer)
        ? [...shuffled].reverse()
        : shuffled;
    }
    return [];
  });
  const [isShaking, setIsShaking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [modalPosition, setModalPosition] = useState(DEFAULT_MODAL_POSITION);
  const modalDragOffset = useRef({ x: 0, y: 0 });
  const phaseStartRef = useRef(Date.now());

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

  useEffect(() => {
    phaseStartRef.current = Date.now();
    setAnswer("");
    setSelectedOption(null);
    setShowHint(false);
    setShowTutor(false);
    setShowExplanation(false);
    setFeedback("");
    setAttempts(0);
    setShowReferenceModal(false);
    setIsDraggingModal(false);
    setModalPosition(DEFAULT_MODAL_POSITION);
    if (phase.enigmaType === "drag-order" && Array.isArray(phase.correctAnswer)) {
      const shuffled = [...phase.correctAnswer].sort(() => Math.random() - 0.5);
      setDragOrder(
        JSON.stringify(shuffled) === JSON.stringify(phase.correctAnswer) ? [...shuffled].reverse() : shuffled
      );
    } else {
      setDragOrder([]);
    }
  }, [phase]);

  useEffect(() => {
    if (!isDraggingModal) return;

    const handlePointerMove = (event: PointerEvent) => {
      setModalPosition({
        x: Math.max(16, event.clientX - modalDragOffset.current.x),
        y: Math.max(16, event.clientY - modalDragOffset.current.y),
      });
    };

    const handlePointerUp = () => setIsDraggingModal(false);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingModal]);

  const handleModalDragStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      modalDragOffset.current = {
        x: event.clientX - modalPosition.x,
        y: event.clientY - modalPosition.y,
      };
      setIsDraggingModal(true);
    },
    [modalPosition]
  );

  const checkAnswer = useCallback(() => {
    let correct = false;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (phase.enigmaType === "text") {
      correct = normalize(answer) === normalize(String(phase.correctAnswer));
    } else if (phase.enigmaType === "multiple-choice") {
      correct = selectedOption === phase.correctAnswer;
    } else if (phase.enigmaType === "drag-order") {
      correct = JSON.stringify(dragOrder) === JSON.stringify(phase.correctAnswer);
    }

    if (correct) {
      setShowExplanation(true);
      setFeedback("Correto. " + phase.explanation);
    } else {
      if (nextAttempts === 1) {
        setFeedback("Incorreto. " + phase.wrongFeedback);
      } else if (nextAttempts === 2) {
        setFeedback(`Incorreto. Pista tecnica: ${phase.hint}`);
      } else {
        setFeedback(`Incorreto. Guia rapido: ${phase.explanation}`);
      }
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  }, [answer, attempts, dragOrder, phase, selectedOption]);

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
    <>
      <div className={`animate-fade-in-up ${isShaking ? "animate-shake" : ""}`}>
        <div className="bg-card border border-primary/20 rounded-lg p-6 border-glow-green">
          <div className="mb-4 pb-4 border-b border-primary/10">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
                style={{
                  backgroundColor: `${phase.badgeColor}22`,
                  color: phase.badgeColor,
                  border: `1px solid ${phase.badgeColor}44`,
                }}
              >
                {phase.icon} CAMADA {phase.layer} - {phase.name.toUpperCase()}
              </span>
            </div>
            <p className="text-muted-foreground text-xs tracking-wide">Protocolos: {phase.protocols}</p>
          </div>

          <div className="mb-6 pb-4 border-b border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-warning text-xs">{">"}</span>
              <span className="text-warning text-xs font-semibold tracking-widest">LOG DO SISTEMA</span>
            </div>
            <p className="text-foreground/80 text-sm leading-relaxed">{phase.narrative}</p>
          </div>

          <div className="mb-5 rounded-md border border-secondary/30 bg-secondary/10 p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs text-secondary font-semibold tracking-widest">MODO TUTOR</p>
              <button
                type="button"
                onClick={() => setShowTutor((prev) => !prev)}
                className="text-xs px-2 py-1 rounded bg-muted text-foreground/80 hover:bg-muted/80 transition-all"
              >
                {showTutor ? "OCULTAR" : "MOSTRAR"}
              </button>
            </div>
            {showTutor && (
              <div className="grid gap-2 text-xs md:text-sm">
                <p className="text-foreground/90">
                  <span className="text-secondary font-semibold">Objetivo:</span>{" "}
                  {tutorByLayer[phase.layer]?.goal}
                </p>
                <p className="text-foreground/85">
                  <span className="text-secondary font-semibold">Exemplo real:</span>{" "}
                  {tutorByLayer[phase.layer]?.realExample}
                </p>
                <p className="text-foreground/85">
                  <span className="text-secondary font-semibold">Erro comum:</span>{" "}
                  {tutorByLayer[phase.layer]?.commonMistake}
                </p>
              </div>
            )}
          </div>

          {phase.enigmaDisplay && (
            <div className="bg-muted rounded-md p-4 mb-4 text-center">
              <code className="text-xl md:text-2xl font-bold text-warning tracking-wider break-all">
                {phase.enigmaDisplay}
              </code>
            </div>
          )}

          {phase.layer === 2 && renderEthernetFrame()}

          <p className="text-foreground text-sm font-semibold mb-4">{phase.instruction}</p>

          {phase.enigmaType === "text" && (
            <input
              type="text"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && checkAnswer()}
              placeholder="Digite sua resposta..."
              className="w-full bg-input border border-primary/30 rounded-md px-4 py-3 text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_10px_hsl(152_100%_50%/0.2)] transition-all"
            />
          )}

          {phase.enigmaType === "multiple-choice" && (
            <div className="flex flex-col gap-2">
              {phase.options?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedOption(i)}
                  className={`text-left px-4 py-3 rounded-md border text-sm transition-all ${
                    selectedOption === i
                      ? "border-secondary bg-secondary/15 text-foreground"
                      : "border-primary/20 bg-muted text-foreground/80 hover:border-primary/40"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {phase.enigmaType === "drag-order" && (
            <DragOrder items={phase.correctAnswer as string[]} order={dragOrder} onReorder={setDragOrder} />
          )}

          {!showExplanation && (
            <div className="flex flex-wrap items-center gap-3 mt-6">
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
                DICA
              </button>
              {phase.referenceImage && (
                <button
                  onClick={() => setShowReferenceModal(true)}
                  className="px-4 py-2.5 bg-muted text-secondary rounded-md text-sm font-semibold hover:bg-muted/80 transition-all"
                >
                  VER TABELA
                </button>
              )}
            </div>
          )}

          {showHint && !showExplanation && (
            <div className="mt-4 p-3 rounded-md bg-warning/10 border border-warning/30">
              <p className="text-warning text-sm">{phase.hint}</p>
            </div>
          )}

          {feedback && (
            <div className="mt-4 p-3 rounded-md border border-secondary/30 bg-secondary/10">
              <p className="text-sm text-foreground/90">{feedback}</p>
            </div>
          )}

          {showExplanation && (
            <button
              onClick={() => onComplete(attempts, Math.max(1, Math.floor((Date.now() - phaseStartRef.current) / 1000)))}
              className="mt-4 px-6 py-2.5 bg-secondary text-secondary-foreground rounded-md font-bold text-sm tracking-wider hover:shadow-[0_0_20px_hsl(245_100%_69%/0.3)] transition-all"
            >
              {phase.layer < 7 ? "PROXIMA CAMADA ->" : "IR PARA MISSAO FINAL ->"}
            </button>
          )}
        </div>
      </div>

      {showReferenceModal && phase.referenceImage && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" onClick={() => setShowReferenceModal(false)} />
          <div
            className="absolute w-[min(92vw,560px)] bg-card border border-primary/30 rounded-lg border-glow-green shadow-2xl"
            style={{ left: modalPosition.x, top: modalPosition.y }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-primary/20 cursor-grab active:cursor-grabbing bg-muted/70"
              onPointerDown={handleModalDragStart}
            >
              <span className="text-xs tracking-widest text-secondary font-semibold">TABELA DE APOIO</span>
              <button
                onClick={() => setShowReferenceModal(false)}
                className="text-sm px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground/80"
              >
                FECHAR
              </button>
            </div>
            <div className="p-3">
              <img
                src={phase.referenceImage}
                alt={phase.referenceImageAlt ?? "Tabela de apoio"}
                className="w-full h-auto rounded border border-primary/20"
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhaseCard;
