import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type UserRole } from "@/lib/api";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const parseError = (err: unknown) => {
    if (!(err instanceof Error)) return "Falha de autenticacao.";
    try {
      const parsed = JSON.parse(err.message);
      return parsed?.message ?? err.message;
    } catch {
      return err.message;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setFeedback("");
    try {
      const result =
        mode === "login"
          ? await api.login({ email, password })
          : await api.register({ name, email, password, role });
      api.storeAuth(result);
      navigate("/portal");
    } catch (err) {
      setFeedback(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="container max-w-xl mx-auto">
        <div className="bg-card border border-primary/20 rounded-lg p-6 border-glow-green">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`px-4 py-2 rounded text-sm ${mode === "login" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`px-4 py-2 rounded text-sm ${mode === "register" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Cadastro
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-2">
            {mode === "login" ? "Entrar na plataforma" : "Criar conta"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Professores criam quizzes e salas. Alunos entram com codigo e acompanham suas turmas.
          </p>

          <div className="grid gap-4">
            {mode === "register" && (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-input border border-primary/30 rounded px-3 py-2"
                  placeholder="Nome"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-input border border-primary/30 rounded px-3 py-2"
                >
                  <option value="student">Aluno</option>
                  <option value="teacher">Professor</option>
                </select>
              </>
            )}

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-input border border-primary/30 rounded px-3 py-2"
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input border border-primary/30 rounded px-3 py-2"
              placeholder="Senha"
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Enviando..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>

            {feedback && <p className="text-sm text-warning">{feedback}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
