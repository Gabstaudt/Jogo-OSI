import { useState, useEffect, useCallback, useMemo } from "react";
import GameHeader from "@/components/GameHeader";
import StartScreen from "@/components/StartScreen";
import PhaseCard from "@/components/PhaseCard";
import FinalScreen from "@/components/FinalScreen";
import OsiVisualization from "@/components/OsiVisualization";
import FinalMission from "@/components/FinalMission";
import { api, type ApiValidateResult, type Phase } from "@/lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";

export type GameState = "start" | "playing" | "final-mission" | "finished";

const buildInitialStars = (count: number) => Array.from({ length: count }).map(() => 0);

const buildInitialLayerStats = (count: number) =>
  Array.from({ length: count }).map(() => ({
    attempts: 0,
    timeSpentSeconds: 0,
    stars: 0,
    xp: 0,
  }));

const starsFromAttempts = (attempts: number) => {
  if (attempts <= 1) return 3;
  if (attempts <= 3) return 2;
  return 1;
};

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const competitionRoomCode = searchParams.get("room")?.toUpperCase() || "";
  const competitionPlayerId = searchParams.get("player") || "";
  const isCompetitionMode = Boolean(competitionRoomCode && competitionPlayerId);

  const [phasesData, setPhasesData] = useState<Phase[]>([]);
  const [apiSessionId, setApiSessionId] = useState<string | null>(null);
  const [loadingPhases, setLoadingPhases] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const [gameState, setGameState] = useState<GameState>("start");
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState(0);

  const [xp, setXp] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [starsByLayer, setStarsByLayer] = useState<number[]>([]);
  const [layerStats, setLayerStats] = useState<
    { attempts: number; timeSpentSeconds: number; stars: number; xp: number }[]
  >([]);
  const [competitionRoomName, setCompetitionRoomName] = useState("");
  const [competitionRoomStatus, setCompetitionRoomStatus] = useState<"waiting" | "running" | "finished" | null>(null);
  const [competitionRanking, setCompetitionRanking] = useState<
    {
      playerId: string;
      playerName: string;
      xp: number;
      solvedLayers: number;
      wrongAttempts: number;
      elapsedSeconds: number;
      finishedAt: number | null;
    }[]
  >([]);
  const [competitionPlayerSolvedLayers, setCompetitionPlayerSolvedLayers] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const remote = await api.getPhases();
        if (!active) return;
        setPhasesData(remote);
        setStarsByLayer(buildInitialStars(remote.length));
        setLayerStats(buildInitialLayerStats(remote.length));
        setLoadingError("");
      } catch {
        if (!active) return;
        setLoadingError("Falha ao carregar as fases da OSI-Api.");
      } finally {
        if (active) setLoadingPhases(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (gameState === "start" || gameState === "finished") return;
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  const finalizeGame = useCallback((elapsedOverride?: number) => {
    const elapsed =
      typeof elapsedOverride === "number"
        ? elapsedOverride
        : startTime
          ? Math.floor((Date.now() - startTime) / 1000)
          : 0;
    setTotalTime(elapsed);
    setGameState("finished");
  }, [startTime]);

  useEffect(() => {
    if (!isCompetitionMode) return;
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      try {
        const room = await api.getRoom(competitionRoomCode);
        if (!alive) return;
        setCompetitionRoomName(room.name);
        setCompetitionRoomStatus(room.status);
        setCompetitionRanking(room.scoreboard);
        const me = room.players.find((p) => p.id === competitionPlayerId);
        setCompetitionPlayerSolvedLayers(me?.solvedLayers ?? 0);
        setXp(me?.xp ?? 0);
        setWrongAttempts(me?.wrongAttempts ?? 0);
        setCorrectAttempts(me?.solvedLayers ?? 0);

        if (room.status === "running") {
          setGameState("playing");
          setCurrentPhase(Math.min(Math.max(phasesData.length - 1, 0), me?.solvedLayers ?? 0));
          if (!startTime) {
            setStartTime(Date.now());
            setTimeLeft(30 * 60);
          }
        }

        if (room.status === "finished" || (me?.solvedLayers ?? 0) >= phasesData.length) {
          finalizeGame(me?.elapsedSeconds ?? 0);
        }
      } catch {
        // ignore polling error
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [
    competitionPlayerId,
    competitionRoomCode,
    finalizeGame,
    isCompetitionMode,
    phasesData.length,
    startTime,
  ]);

  const resetRunState = useCallback(() => {
    setCurrentPhase(0);
    setTimeLeft(30 * 60);
    setStartTime(null);
    setTotalTime(0);
    setXp(0);
    setWrongAttempts(0);
    setCorrectAttempts(0);
    setStarsByLayer(buildInitialStars(phasesData.length));
    setLayerStats(buildInitialLayerStats(phasesData.length));
  }, [phasesData.length]);

  const handleStart = useCallback(async () => {
    if (isCompetitionMode) return;
    if (!phasesData.length) {
      setLoadingError("As fases nao foram carregadas da API.");
      return;
    }
    try {
      const session = await api.startSession("player");
      setApiSessionId(session.sessionId);
    } catch (err) {
      setLoadingError(`Falha ao iniciar sessao: ${err instanceof Error ? err.message : "erro desconhecido"}`);
      return;
    }
    resetRunState();
    setGameState("playing");
    setStartTime(Date.now());
  }, [isCompetitionMode, phasesData.length, resetRunState]);

  const handlePhaseComplete = useCallback(
    (attempts: number, timeSpentSeconds: number) => {
      const stars = starsFromAttempts(attempts);
      const phaseXp = stars * 100;
      setXp((prev) => prev + phaseXp);
      setCorrectAttempts((prev) => prev + 1);
      setWrongAttempts((prev) => prev + Math.max(0, attempts - 1));
      setStarsByLayer((prev) => {
        const copy = [...prev];
        copy[currentPhase] = stars;
        return copy;
      });
      setLayerStats((prev) => {
        const copy = [...prev];
        copy[currentPhase] = {
          attempts,
          timeSpentSeconds,
          stars,
          xp: phaseXp,
        };
        return copy;
      });

      if (isCompetitionMode) {
        if (currentPhase < phasesData.length - 1) {
          setCurrentPhase((prev) => prev + 1);
        }
        return;
      }

      if (currentPhase < phasesData.length - 1) {
        setCurrentPhase((prev) => prev + 1);
      } else {
        setGameState("final-mission");
      }
    },
    [currentPhase, isCompetitionMode, phasesData.length]
  );

  const handleMissionSolved = useCallback(
    (attempts: number) => {
      if (isCompetitionMode) return;
      const bonusStars = starsFromAttempts(attempts);
      setXp((prev) => prev + bonusStars * 120);
      setCorrectAttempts((prev) => prev + 1);
      setWrongAttempts((prev) => prev + Math.max(0, attempts - 1));
      finalizeGame();
    },
    [finalizeGame, isCompetitionMode]
  );

  const handleRestart = useCallback(() => {
    if (isCompetitionMode) {
      navigate("/competition");
      return;
    }
    setApiSessionId(null);
    setGameState("start");
    resetRunState();
  }, [isCompetitionMode, navigate, resetRunState]);

  const accuracy = useMemo(() => {
    const total = correctAttempts + wrongAttempts;
    if (!total) return 0;
    return Math.round((correctAttempts / total) * 100);
  }, [correctAttempts, wrongAttempts]);

  const totalStars = useMemo(() => starsByLayer.reduce((sum, value) => sum + value, 0), [starsByLayer]);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 scanline z-50 pointer-events-none" />

      {gameState !== "start" && phasesData.length > 0 && (
        <GameHeader
          timeLeft={timeLeft}
          currentPhase={currentPhase}
          gameState={gameState}
          xp={xp}
          accuracy={accuracy}
          totalStars={totalStars}
        />
      )}

      <main className={`${gameState !== "start" ? "pt-32" : ""} pb-12`}>
        {gameState === "start" && !isCompetitionMode && <StartScreen onStart={handleStart} />}

        {isCompetitionMode && gameState === "start" && (
          <div className="container max-w-3xl mx-auto px-4 text-sm text-muted-foreground">
            Aguardando host iniciar a partida no lobby...
          </div>
        )}

        {loadingPhases && (
          <div className="container max-w-3xl mx-auto px-4 text-sm text-muted-foreground">
            Carregando perguntas do servidor...
          </div>
        )}

        {!loadingPhases && loadingError && (
          <div className="container max-w-3xl mx-auto px-4 text-sm text-destructive">
            {loadingError}
          </div>
        )}

        {gameState === "playing" && !loadingPhases && phasesData.length > 0 && (
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
              <div className="order-1 min-w-0">
                <PhaseCard
                  key={`${currentPhase}-${competitionPlayerSolvedLayers}`}
                  phase={phasesData[currentPhase]}
                  onComplete={handlePhaseComplete}
                  onValidate={async (layer: number, answer: unknown): Promise<ApiValidateResult> => {
                    if (isCompetitionMode) {
                      const response = await api.submitPlayerAnswer(
                        competitionRoomCode,
                        competitionPlayerId,
                        layer,
                        answer,
                      );
                      setCompetitionRoomName(response.room.name);
                      setCompetitionRoomStatus(response.room.status);
                      setCompetitionRanking(response.room.scoreboard);
                      const me = response.room.players.find((p) => p.id === competitionPlayerId);
                      setCompetitionPlayerSolvedLayers(me?.solvedLayers ?? 0);
                      setXp(me?.xp ?? 0);
                      setWrongAttempts(me?.wrongAttempts ?? 0);
                      setCorrectAttempts(me?.solvedLayers ?? 0);
                      return response.result;
                    }
                    if (!apiSessionId) {
                      throw new Error("Sessao individual nao iniciada na API.");
                    }
                    return api.submitAnswer(apiSessionId, layer, answer);
                  }}
                />
              </div>
              <div className="order-2 min-w-0">
                <OsiVisualization phase={phasesData[currentPhase]} completedLayers={currentPhase} />
                {isCompetitionMode && (
                  <div className="mt-4 bg-card border border-secondary/20 rounded-lg p-4">
                    <p className="text-xs text-secondary font-semibold tracking-widest mb-2">
                      RANKING AO VIVO {competitionRoomName ? `- ${competitionRoomName}` : ""}
                    </p>
                    <div className="grid gap-2">
                      {competitionRanking.map((entry, idx) => (
                        <div key={entry.playerId} className="p-2 rounded border border-primary/20 bg-muted/30 text-xs">
                          {idx + 1}. {entry.playerName} - XP {entry.xp} - Camadas {entry.solvedLayers} - Erros{" "}
                          {entry.wrongAttempts}
                        </div>
                      ))}
                      {competitionRanking.length === 0 && (
                        <p className="text-xs text-muted-foreground">Sem dados de ranking ainda.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {gameState === "final-mission" && !isCompetitionMode && <FinalMission onSolved={handleMissionSolved} />}

        {gameState === "finished" && (
          <FinalScreen
            phases={phasesData}
            totalTime={totalTime}
            onRestart={handleRestart}
            xp={xp}
            accuracy={accuracy}
            starsByLayer={starsByLayer}
            layerStats={layerStats}
            competition={
              isCompetitionMode
                ? {
                    roomName: competitionRoomName,
                    status: competitionRoomStatus,
                    ranking: competitionRanking,
                  }
                : null
            }
          />
        )}
      </main>
    </div>
  );
};

export default Index;
