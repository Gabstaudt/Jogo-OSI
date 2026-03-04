import { useState, useEffect, useCallback } from "react";
import { phases } from "@/data/phases";
import GameHeader from "@/components/GameHeader";
import StartScreen from "@/components/StartScreen";
import PhaseCard from "@/components/PhaseCard";
import FinalScreen from "@/components/FinalScreen";

export type GameState = 'start' | 'playing' | 'finished';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min in seconds
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (gameState !== 'playing') return;
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

  const handleStart = useCallback(() => {
    setGameState('playing');
    setStartTime(Date.now());
    setTimeLeft(30 * 60);
    setCurrentPhase(0);
  }, []);

  const handlePhaseComplete = useCallback(() => {
    if (currentPhase < 6) {
      setCurrentPhase((prev) => prev + 1);
    } else {
      const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      setTotalTime(elapsed);
      setGameState('finished');
    }
  }, [currentPhase, startTime]);

  const handleRestart = useCallback(() => {
    setGameState('start');
    setCurrentPhase(0);
    setTimeLeft(30 * 60);
    setStartTime(null);
    setTotalTime(0);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Scanline overlay */}
      <div className="fixed inset-0 scanline z-50 pointer-events-none" />

      {gameState !== 'start' && (
        <GameHeader
          timeLeft={timeLeft}
          currentPhase={currentPhase}
          gameState={gameState}
        />
      )}

      <main className={`${gameState !== 'start' ? 'pt-28' : ''} pb-12`}>
        {gameState === 'start' && <StartScreen onStart={handleStart} />}

        {gameState === 'playing' && (
          <div className="container max-w-3xl mx-auto px-4">
            <PhaseCard
              key={currentPhase}
              phase={phases[currentPhase]}
              onComplete={handlePhaseComplete}
            />
          </div>
        )}

        {gameState === 'finished' && (
          <FinalScreen totalTime={totalTime} onRestart={handleRestart} />
        )}
      </main>
    </div>
  );
};

export default Index;
