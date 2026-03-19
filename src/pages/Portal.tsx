import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  api,
  type AuthUser,
  type TeacherQuestionType,
  type TeacherQuiz,
  type TeacherQuizMode,
  type TeacherQuizRoom,
} from "@/lib/api";

const emptyQuestion = {
  title: "",
  osiLayer: 7,
  type: "multiple_choice" as TeacherQuestionType,
  narrative: "",
  instruction: "",
  optionsText: "",
  correctAnswerText: "",
  hint: "",
  mentorTitle: "",
  mentorContent: "",
  explanation: "",
  wrongFeedback: "",
  referenceImage: "",
  referenceImageAlt: "",
};

const Portal = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<AuthUser | null>(api.getStoredAuth().user);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);

  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([]);
  const [roomPreview, setRoomPreview] = useState<TeacherQuizRoom | null>(null);
  const [studentCode, setStudentCode] = useState("");
  const [studentName, setStudentName] = useState("");

  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [questions, setQuestions] = useState([emptyQuestion]);
  const [roomNames, setRoomNames] = useState<Record<string, string>>({});
  const [roomModes, setRoomModes] = useState<Record<string, TeacherQuizMode>>({});

  const parseError = (err: unknown) => {
    if (!(err instanceof Error)) return "Falha na operacao.";
    try {
      const parsed = JSON.parse(err.message);
      return parsed?.message ?? err.message;
    } catch {
      return err.message;
    }
  };

  const refreshTeacherData = async () => {
    const data = await api.listTeacherQuizzes();
    setQuizzes(data);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const currentUser = await api.me();
        if (!active) return;
        setMe(currentUser);
        if (currentUser.role === "teacher") {
          await refreshTeacherData();
        }
      } catch {
        api.clearAuth();
        if (!active) return;
        navigate("/auth");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [navigate]);

  const teacherReady = useMemo(() => me?.role === "teacher", [me]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion]);
  };

  const updateQuestion = (index: number, key: keyof typeof emptyQuestion, value: string | number) => {
    setQuestions((prev) => prev.map((question, idx) => (idx === index ? { ...question, [key]: value } : question)));
  };

  const createQuiz = async () => {
    try {
      const payload = {
        title: quizTitle,
        description: quizDescription,
        isPublished,
        questions: questions.map((question) => ({
          title: question.title,
          osiLayer: Number(question.osiLayer),
          type: question.type,
          narrative: question.narrative,
          instruction: question.instruction,
          options:
            question.type === "multiple_choice" || question.type === "drag_order"
              ? question.optionsText.split("\n").map((item) => item.trim()).filter(Boolean)
              : undefined,
          correctAnswer:
            question.type === "multiple_choice"
              ? Number(question.correctAnswerText)
              : question.type === "drag_order"
                ? question.correctAnswerText.split("\n").map((item) => item.trim()).filter(Boolean)
                : question.correctAnswerText,
          hint: question.hint,
          mentorTitle: question.mentorTitle,
          mentorContent: question.mentorContent,
          explanation: question.explanation,
          wrongFeedback: question.wrongFeedback,
          referenceImage: question.referenceImage,
          referenceImageAlt: question.referenceImageAlt,
        })),
      };
      await api.createTeacherQuiz(payload);
      setFeedback("Quiz criado com sucesso.");
      setQuizTitle("");
      setQuizDescription("");
      setIsPublished(true);
      setQuestions([emptyQuestion]);
      await refreshTeacherData();
    } catch (err) {
      setFeedback(parseError(err));
    }
  };

  const createRoom = async (quizId: string) => {
    try {
      const room = await api.createTeacherQuizRoom(quizId, {
        name: roomNames[quizId] || "Sala da turma",
        mode: roomModes[quizId] || "competitive",
      });
      setRoomPreview(room);
      setFeedback(`Sala ${room.code} criada com sucesso.`);
      await refreshTeacherData();
    } catch (err) {
      setFeedback(parseError(err));
    }
  };

  const joinRoom = async () => {
    try {
      const room = await api.joinTeacherQuizRoom(studentCode.trim().toUpperCase(), {
        name: studentName || me?.name || "Aluno",
        userId: me?.id,
      });
      setRoomPreview(room);
      setFeedback(`Entrada confirmada na sala ${room.code}.`);
    } catch (err) {
      setFeedback(parseError(err));
    }
  };

  const logout = () => {
    api.clearAuth();
    navigate("/auth");
  };

  if (loading) {
    return <div className="min-h-screen bg-background px-4 py-12 text-sm text-muted-foreground">Carregando portal...</div>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="container max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Portal OSI</h1>
            <p className="text-sm text-muted-foreground">
              {me?.name} ({me?.role === "teacher" ? "Professor" : "Aluno"})
            </p>
          </div>
          <button onClick={logout} className="px-4 py-2 rounded bg-muted text-sm">
            Sair
          </button>
        </div>

        {feedback && <p className="text-sm text-warning mb-4">{feedback}</p>}

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <section className="bg-card border border-primary/20 rounded-lg p-5">
            {teacherReady ? (
              <>
                <h2 className="text-lg font-semibold mb-4">Criar quiz</h2>
                <div className="grid gap-3 mb-4">
                  <input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2" placeholder="Titulo do quiz" />
                  <textarea value={quizDescription} onChange={(e) => setQuizDescription(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 min-h-24" placeholder="Descricao" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
                    Publicar quiz ao criar
                  </label>
                </div>

                <div className="grid gap-4">
                  {questions.map((question, index) => (
                    <div key={index} className="rounded border border-secondary/20 p-4 bg-muted/20">
                      <p className="text-sm font-semibold mb-3">Questao {index + 1}</p>
                      <div className="grid gap-3">
                        <input value={question.title} onChange={(e) => updateQuestion(index, "title", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2" placeholder="Titulo da questao" />
                        <div className="grid md:grid-cols-2 gap-3">
                          <select value={question.osiLayer} onChange={(e) => updateQuestion(index, "osiLayer", Number(e.target.value))} className="w-full bg-input border border-primary/30 rounded px-3 py-2">
                            {[1, 2, 3, 4, 5, 6, 7].map((layer) => <option key={layer} value={layer}>Camada {layer}</option>)}
                          </select>
                          <select value={question.type} onChange={(e) => updateQuestion(index, "type", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2">
                            <option value="multiple_choice">Multipla escolha</option>
                            <option value="text">Preenchimento</option>
                            <option value="drag_order">Ordenacao</option>
                          </select>
                        </div>
                        <textarea value={question.narrative} onChange={(e) => updateQuestion(index, "narrative", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 min-h-20" placeholder="Narrativa / contexto" />
                        <textarea value={question.instruction} onChange={(e) => updateQuestion(index, "instruction", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 min-h-20" placeholder="Instrucao" />
                        {(question.type === "multiple_choice" || question.type === "drag_order") && (
                          <textarea value={question.optionsText} onChange={(e) => updateQuestion(index, "optionsText", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 min-h-24" placeholder="Uma opcao por linha" />
                        )}
                        <input value={question.correctAnswerText} onChange={(e) => updateQuestion(index, "correctAnswerText", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2" placeholder={question.type === "multiple_choice" ? "Indice correto (0,1,2...)" : question.type === "drag_order" ? "Resposta correta em linhas" : "Resposta correta"} />
                        <input value={question.hint} onChange={(e) => updateQuestion(index, "hint", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2" placeholder="Dica" />
                        <input value={question.mentorTitle} onChange={(e) => updateQuestion(index, "mentorTitle", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2" placeholder="Titulo do modo mentor" />
                        <textarea value={question.mentorContent} onChange={(e) => updateQuestion(index, "mentorContent", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 min-h-20" placeholder="Conteudo do modo mentor" />
                        <textarea value={question.explanation} onChange={(e) => updateQuestion(index, "explanation", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 min-h-20" placeholder="Explicacao da resposta" />
                        <textarea value={question.wrongFeedback} onChange={(e) => updateQuestion(index, "wrongFeedback", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 min-h-20" placeholder="Feedback de erro" />
                        <input value={question.referenceImage} onChange={(e) => updateQuestion(index, "referenceImage", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2" placeholder="URL da imagem de apoio" />
                        <input value={question.referenceImageAlt} onChange={(e) => updateQuestion(index, "referenceImageAlt", e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2" placeholder="Texto alternativo da imagem" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={addQuestion} className="px-4 py-2 rounded bg-muted text-sm">Adicionar questao</button>
                  <button onClick={createQuiz} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-semibold">Salvar quiz</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4">Entrar em sala da turma</h2>
                <div className="grid gap-3 max-w-md">
                  <input value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2" placeholder="Nome exibido na sala" />
                  <input value={studentCode} onChange={(e) => setStudentCode(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2" placeholder="Codigo da sala" />
                  <button onClick={joinRoom} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-semibold">Entrar</button>
                </div>
              </>
            )}
          </section>

          <section className="bg-card border border-secondary/20 rounded-lg p-5">
            {teacherReady ? (
              <>
                <h2 className="text-lg font-semibold mb-4">Seus quizzes</h2>
                <div className="grid gap-4">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="rounded border border-primary/20 p-4 bg-muted/20">
                      <p className="font-semibold">{quiz.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {quiz.questionCount} questoes | {quiz.isPublished ? "Publicado" : "Rascunho"}
                      </p>
                      <div className="grid gap-2 mb-3">
                        <input
                          value={roomNames[quiz.id] ?? ""}
                          onChange={(e) => setRoomNames((prev) => ({ ...prev, [quiz.id]: e.target.value }))}
                          className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-sm"
                          placeholder="Nome da sala"
                        />
                        <select
                          value={roomModes[quiz.id] ?? "competitive"}
                          onChange={(e) => setRoomModes((prev) => ({ ...prev, [quiz.id]: e.target.value as TeacherQuizMode }))}
                          className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-sm"
                        >
                          <option value="competitive">Competitivo</option>
                          <option value="individual">Individual</option>
                        </select>
                      </div>
                      <button onClick={() => createRoom(quiz.id)} className="px-4 py-2 rounded bg-secondary text-secondary-foreground text-sm font-semibold">
                        Criar sala
                      </button>
                      {quiz.rooms.length > 0 && (
                        <div className="mt-3 grid gap-2">
                          {quiz.rooms.map((room) => (
                            <div key={room.code} className="text-xs border border-secondary/20 rounded px-2 py-2 bg-secondary/10">
                              Sala {room.code} - {room.mode} - {room.status}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {quizzes.length === 0 && <p className="text-sm text-muted-foreground">Nenhum quiz criado ainda.</p>}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4">Visao da sala</h2>
                {roomPreview ? (
                  <div className="grid gap-2 text-sm">
                    <p className="font-semibold">{roomPreview.name}</p>
                    <p className="text-muted-foreground">Codigo: {roomPreview.code}</p>
                    <p className="text-muted-foreground">Modo: {roomPreview.mode}</p>
                    <p className="text-muted-foreground">Participantes: {roomPreview.participants.length}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Entre em uma sala para visualizar o lobby.</p>
                )}
              </>
            )}

            {roomPreview && teacherReady && (
              <div className="mt-6 border-t border-primary/10 pt-4">
                <h3 className="font-semibold mb-2">Ultima sala criada</h3>
                <div className="grid gap-2 text-sm">
                  <p>Codigo: {roomPreview.code}</p>
                  <p>Modo: {roomPreview.mode}</p>
                  <p>Status: {roomPreview.status}</p>
                  <p>Participantes: {roomPreview.participants.length}</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Portal;
