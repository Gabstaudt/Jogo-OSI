import { useState, useEffect, useCallback, useMemo } from "react";
import { phases } from "@/data/phases";
import GameHeader from "@/components/GameHeader";
import StartScreen from "@/components/StartScreen";
import PhaseCard from "@/components/PhaseCard";
import FinalScreen from "@/components/FinalScreen";
import OsiVisualization from "@/components/OsiVisualization";
import FinalMission from "@/components/FinalMission";

export type GameState = "start" | "playing" | "final-mission" | "finished";

const initialStars = Array.from({ length: phases.length }).map(() => 0);
const initialLayerStats = Array.from({ length: phases.length }).map(() => ({
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
  const [gameState, setGameState] = useState<GameState>("start");
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState(0);

  const [xp, setXp] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [starsByLayer, setStarsByLayer] = useState<number[]>(initialStars);
  const [layerStats, setLayerStats] = useState(initialLayerStats);

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

  const finalizeGame = useCallback(() => {
    const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    setTotalTime(elapsed);
    setGameState("finished");
  }, [startTime]);

  const handleStart = useCallback(() => {
    setGameState("playing");
    setStartTime(Date.now());
    setTimeLeft(30 * 60);
    setCurrentPhase(0);
    setXp(0);
    setWrongAttempts(0);
    setCorrectAttempts(0);
    setStarsByLayer(initialStars);
    setLayerStats(initialLayerStats);
  }, []);

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

      if (currentPhase < phases.length - 1) {
        setCurrentPhase((prev) => prev + 1);
      } else {
        setGameState("final-mission");
      }
    },
    [currentPhase]
  );

  const handleMissionSolved = useCallback(
    (attempts: number) => {
      const bonusStars = starsFromAttempts(attempts);
      setXp((prev) => prev + bonusStars * 120);
      setCorrectAttempts((prev) => prev + 1);
      setWrongAttempts((prev) => prev + Math.max(0, attempts - 1));
      finalizeGame();
    },
    [finalizeGame]
  );

  const handleRestart = useCallback(() => {
    setGameState("start");
    setCurrentPhase(0);
    setTimeLeft(30 * 60);
    setStartTime(null);
    setTotalTime(0);
    setXp(0);
    setWrongAttempts(0);
    setCorrectAttempts(0);
    setStarsByLayer(initialStars);
    setLayerStats(initialLayerStats);
  }, []);

  const accuracy = useMemo(() => {
    const total = correctAttempts + wrongAttempts;
    if (!total) return 0;
    return Math.round((correctAttempts / total) * 100);
  }, [correctAttempts, wrongAttempts]);

  const totalStars = useMemo(() => starsByLayer.reduce((sum, value) => sum + value, 0), [starsByLayer]);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 scanline z-50 pointer-events-none" />

      {gameState !== "start" && (
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
        {gameState === "start" && <StartScreen onStart={handleStart} />}

        {gameState === "playing" && (
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
              <div className="order-1 min-w-0">
                <PhaseCard key={currentPhase} phase={phases[currentPhase]} onComplete={handlePhaseComplete} />
              </div>
              <div className="order-2 min-w-0">
                <OsiVisualization phase={phases[currentPhase]} completedLayers={currentPhase} />
              </div>
            </div>
          </div>
        )}

        {gameState === "final-mission" && <FinalMission onSolved={handleMissionSolved} />}

        {gameState === "finished" && (
          <FinalScreen
            totalTime={totalTime}
            onRestart={handleRestart}
            xp={xp}
            accuracy={accuracy}
            starsByLayer={starsByLayer}
            layerStats={layerStats}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
