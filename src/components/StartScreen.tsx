import { useState } from "react";

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen = ({ onStart }: StartScreenProps) => {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4"></div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground text-glow-green tracking-wider mb-2">
            CONEXÃO PERDIDA
          </h1>
          <p className="text-secondary text-sm tracking-widest text-glow-purple">
            ESCAPE ROOM — MODELO OSI
          </p>
        </div>

        <div className="bg-card border border-primary/20 rounded-lg p-6 md:p-8 border-glow-green mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-warning text-xs">▶</span>
            <span className="text-warning text-xs font-semibold tracking-widest">BRIEFING DA MISSÃO</span>
          </div>
          <p className="text-foreground/90 text-sm md:text-base leading-relaxed">
            A rede da universidade foi comprometida. Todas as 7 camadas do modelo OSI falharam em sequência.
            Você é o engenheiro convocado às 3h da manhã para restaurar a conexão.
            Resolva os enigmas de cada camada — do físico ao virtual — antes que o sistema entre em colapso definitivo.
          </p>
          <div className="mt-4 flex items-center gap-2 text-muted-foreground text-xs">
            <span>⏱</span>
            <span>Tempo limite: 30 minutos</span>
            <span className="mx-2">|</span>
            <span></span>
            <span>7 camadas para restaurar</span>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onStart}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className={`
              px-8 py-4 rounded-md font-bold text-sm tracking-widest
              bg-primary text-primary-foreground
              border-2 border-primary
              transition-all duration-300
              ${hovering ? 'shadow-[0_0_30px_hsl(152_100%_50%/0.4)] scale-105' : ''}
            `}
          >
            {'>'} INICIAR MISSÃO
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
