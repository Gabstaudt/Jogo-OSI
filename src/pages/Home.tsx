import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-background relative px-4 py-10">
      <div className="fixed inset-0 scanline z-50 pointer-events-none" />

      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="text-3xl md:text-5xl font-bold tracking-wider text-foreground text-glow-green mb-3">
            JOGO OSI
          </h1>
          <p className="text-secondary text-sm tracking-widest">
            Escolha o modo de jogo
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <article className="bg-card border border-secondary/20 rounded-lg p-6 border-glow-green md:col-span-3">
            <p className="text-xs text-secondary font-semibold tracking-widest mb-2">PLATAFORMA</p>
            <h2 className="text-lg font-semibold mb-2">Portal de professores e alunos</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Professores criam quizzes personalizados, definem modo mentor, dicas, imagens de apoio e abrem salas. Alunos entram com login e codigo da turma.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-md border border-secondary px-4 py-2 text-sm font-semibold transition hover:bg-secondary/10"
            >
              Acessar portal
            </Link>
          </article>

          <article className="bg-card border border-primary/20 rounded-lg p-6 border-glow-green">
            <p className="text-xs text-warning font-semibold tracking-widest mb-2">INDIVIDUAL</p>
            <h2 className="text-lg font-semibold mb-2">Campanha OSI</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Jogue sozinho no fluxo original das camadas e desafios.
            </p>
            <Link
              to="/individual"
              className="inline-flex items-center justify-center rounded-md border border-primary px-4 py-2 text-sm font-semibold transition hover:bg-primary/10"
            >
              Entrar
            </Link>
          </article>

          <article className="bg-card border border-primary/20 rounded-lg p-6 border-glow-green">
            <p className="text-xs text-warning font-semibold tracking-widest mb-2">COOPERATIVO</p>
            <h2 className="text-lg font-semibold mb-2">Operador e Analista</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Resolva incidentes em equipe na rota cooperativa.
            </p>
            <Link
              to="/cooper"
              className="inline-flex items-center justify-center rounded-md border border-primary px-4 py-2 text-sm font-semibold transition hover:bg-primary/10"
            >
              Entrar
            </Link>
          </article>

          <article className="bg-card border border-primary/20 rounded-lg p-6 border-glow-green">
            <p className="text-xs text-warning font-semibold tracking-widest mb-2">COMPETITIVO</p>
            <h2 className="text-lg font-semibold mb-2">Corrida de Camadas</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Mesmo fluxo do individual, com varios jogadores competindo por melhor desempenho e tempo.
            </p>
            <Link
              to="/competition"
              className="inline-flex items-center justify-center rounded-md border border-primary px-4 py-2 text-sm font-semibold transition hover:bg-primary/10"
            >
              Entrar
            </Link>
          </article>
        </div>
      </div>
    </div>
  );
};

export default Home;
