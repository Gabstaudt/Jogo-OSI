import { useState, useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Phase } from "@/data/phases";
import DragOrder from "@/components/DragOrder";
import type { ApiValidateResult } from "@/lib/api";

interface PhaseCardProps {
  phase: Phase;
  onComplete: (attempts: number, timeSpentSeconds: number) => void;
  onValidate: (layer: number, answer: unknown) => Promise<ApiValidateResult>;
}

const DEFAULT_MODAL_POSITION = { x: 80, y: 120 };

const tutorByLayer: Record<number, { goal: string; realExample: string; commonMistake: string }> = {
  1: {
    goal: "Identificar o meio fisico ideal para manter sinal estavel.",
    realExample: "Backbone entre predios usa fibra para maior distancia.",
    commonMistake: "Escolher cabo sem considerar distancia/atenuacao.",
  },
  2: {
    goal: "Relacionar entrega local com endereco MAC e frame.",
    realExample: "Switch encaminha frame baseado em tabela MAC.",
    commonMistake: "Usar broadcast onde deveria ser unicast.",
  },
  3: {
    goal: "Entender roteamento e TTL entre redes diferentes.",
    realExample: "Traceroute mostra cada hop ate o destino.",
    commonMistake: "Ignorar TTL ao diagnosticar perda.",
  },
  4: {
    goal: "Diferenciar confiabilidade TCP de baixa latencia UDP.",
    realExample: "Upload de arquivo usa TCP; voz em tempo real costuma usar UDP.",
    commonMistake: "Tratar TCP e UDP como se tivessem o mesmo comportamento.",
  },
  5: {
    goal: "Controlar abertura e encerramento de sessoes.",
    realExample: "Sessao autenticada precisa continuar apos reconexao curta.",
    commonMistake: "Atribuir queda de sessao a erro fisico imediatamente.",
  },
  6: {
    goal: "Reconhecer codificacao e formato como parte do problema.",
    realExample: "Troca para UTF-8 corrige caracteres quebrados.",
    commonMistake: "Confundir falha de codificacao com falha de transporte.",
  },
  7: {
    goal: "Mapear servico de aplicacao ao sintoma do usuario.",
    realExample: "Sem DNS, URL nao resolve mesmo com IP funcionando.",
    commonMistake: "Supor que toda falha de site e de internet fisica.",
  },
};

const PhaseCard = ({ phase, onComplete, onValidate }: PhaseCardProps) => {
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [dragOrder, setDragOrder] = useState<string[]>([]);
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
    if (phase.enigmaType === "drag-order") {
      const baseItems = Array.isArray(phase.options)
        ? phase.options
        : Array.isArray(phase.correctAnswer)
          ? phase.correctAnswer
          : [];
      setDragOrder([...baseItems].sort(() => Math.random() - 0.5));
    } else {
      setDragOrder([]);
    }
    setShowHint(false);
    setShowTutor(false);
    setShowExplanation(false);
    setFeedback("");
    setAttempts(0);
    setShowReferenceModal(false);
    setIsDraggingModal(false);
    setModalPosition(DEFAULT_MODAL_POSITION);
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
      modalDragOffset.current = { x: event.clientX - modalPosition.x, y: event.clientY - modalPosition.y };
      setIsDraggingModal(true);
    },
    [modalPosition]
  );

  const checkAnswer = useCallback(async () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    const userAnswer =
      phase.enigmaType === "text"
        ? normalize(answer)
        : phase.enigmaType === "multiple-choice"
          ? selectedOption
          : dragOrder;

    if (userAnswer === null || userAnswer === "" || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      setFeedback("Preencha a resposta antes de verificar.");
      return;
    }

    let result: ApiValidateResult;
    try {
      result = await onValidate(phase.layer, userAnswer);
    } catch (err) {
      setFeedback(`Erro ao validar resposta: ${err instanceof Error ? err.message : "falha de rede"}`);
      return;
    }

    if (result.correct) {
      setShowExplanation(true);
      setFeedback(result.feedback || "Correto.");
      return;
    }

    if (nextAttempts === 1) setFeedback(result.feedback || "Incorreto.");
    else if (nextAttempts === 2) setFeedback(`Incorreto. Pista tecnica: ${result.hint || phase.hint}`);
    else setFeedback(`Incorreto. Guia rapido: ${phase.explanation}`);

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }, [answer, attempts, dragOrder, normalize, onValidate, phase, selectedOption]);

  return (
    <>
      <div className={`animate-fade-in-up ${isShaking ? "animate-shake" : ""}`}>
        <div className="bg-card border border-primary/20 rounded-lg p-6 border-glow-green">
          <div className="mb-4 pb-4 border-b border-primary/10">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
              style={{ backgroundColor: `${phase.badgeColor}22`, color: phase.badgeColor, border: `1px solid ${phase.badgeColor}44` }}
            >
              {phase.icon} CAMADA {phase.layer} - {phase.name.toUpperCase()}
            </span>
            <p className="text-muted-foreground text-xs tracking-wide mt-2">Protocolos: {phase.protocols}</p>
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
              <p className="text-xs text-secondary font-semibold tracking-widest">MODO MENTOR</p>
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
                <p><span className="text-secondary font-semibold">Conceito:</span> {tutorByLayer[phase.layer]?.goal}</p>
                <p><span className="text-secondary font-semibold">Exemplo real:</span> {tutorByLayer[phase.layer]?.realExample}</p>
                <p><span className="text-secondary font-semibold">Erro comum:</span> {tutorByLayer[phase.layer]?.commonMistake}</p>
              </div>
            )}
          </div>

          {phase.enigmaDisplay && (
            <div className="bg-muted rounded-md p-4 mb-4 text-center">
              <code className="text-xl md:text-2xl font-bold text-warning tracking-wider break-all">{phase.enigmaDisplay}</code>
            </div>
          )}

          <p className="text-foreground text-sm font-semibold mb-4">{phase.instruction}</p>

          {phase.enigmaType === "text" && (
            <input
              type="text"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && checkAnswer()}
              placeholder="Digite sua resposta..."
              className="w-full bg-input border border-primary/30 rounded-md px-4 py-3 text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          )}

          {phase.enigmaType === "multiple-choice" && (
            <div className="flex flex-col gap-2">
              {phase.options?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedOption(i)}
                  className={`text-left px-4 py-3 rounded-md border text-sm transition-all ${
                    selectedOption === i ? "border-secondary bg-secondary/15 text-foreground" : "border-primary/20 bg-muted text-foreground/80 hover:border-primary/40"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {phase.enigmaType === "drag-order" && (
            <DragOrder items={(phase.correctAnswer as string[]) || []} order={dragOrder} onReorder={setDragOrder} />
          )}

          {!showExplanation && (
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button onClick={checkAnswer} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-bold text-sm tracking-wider">
                VERIFICAR
              </button>
              <button onClick={() => setShowHint(true)} className="px-4 py-2.5 bg-muted text-warning rounded-md text-sm font-semibold hover:bg-muted/80">
                DICA
              </button>
              {phase.referenceImage && (
                <button onClick={() => setShowReferenceModal(true)} className="px-4 py-2.5 bg-muted text-secondary rounded-md text-sm font-semibold hover:bg-muted/80">
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
              onClick={() =>
                onComplete(
                  attempts,
                  Math.max(1, Math.floor((Date.now() - phaseStartRef.current) / 1000)),
                )
              }
              className="mt-4 px-6 py-2.5 bg-secondary text-secondary-foreground rounded-md font-bold text-sm tracking-wider"
            >
              {phase.layer < 7 ? "PROXIMA CAMADA ->" : "IR PARA MISSAO FINAL ->"}
            </button>
          )}
        </div>
      </div>

      {showReferenceModal && phase.referenceImage && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" onClick={() => setShowReferenceModal(false)} />
          <div className="absolute w-[min(92vw,560px)] bg-card border border-primary/30 rounded-lg border-glow-green shadow-2xl" style={{ left: modalPosition.x, top: modalPosition.y }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20 cursor-grab active:cursor-grabbing bg-muted/70" onPointerDown={handleModalDragStart}>
              <span className="text-xs tracking-widest text-secondary font-semibold">TABELA DE APOIO</span>
              <button onClick={() => setShowReferenceModal(false)} className="text-sm px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground/80">
                FECHAR
              </button>
            </div>
            <div className="p-3">
              <img src={phase.referenceImage} alt={phase.referenceImageAlt ?? "Tabela de apoio"} className="w-full h-auto rounded border border-primary/20" draggable={false} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhaseCard;
