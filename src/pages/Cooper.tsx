import { useEffect, useMemo, useState } from "react";
import { api, type CooperPlayerView, type CooperRoomView } from "@/lib/api";

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const parseError = (err: unknown) => {
  if (!(err instanceof Error)) return "Falha ao executar acao.";
  try {
    const parsed = JSON.parse(err.message);
    return parsed?.message ?? err.message;
  } catch {
    return err.message;
  }
};

const Cooper = () => {
  const [rooms, setRooms] = useState<CooperRoomView[]>([]);
  const [roomName, setRoomName] = useState("Cooper Room");
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [room, setRoom] = useState<CooperRoomView | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [viewState, setViewState] = useState<CooperPlayerView["view"] | null>(null);
  const [feedback, setFeedback] = useState("");

  const [selectedAction, setSelectedAction] = useState("");
  const [gateway, setGateway] = useState("");
  const [macDest, setMacDest] = useState("");
  const [sequence, setSequence] = useState<string[]>([]);

  const refreshRooms = async () => {
    try {
      setRooms(await api.listCooperRooms());
    } catch {
      setRooms([]);
    }
  };

  useEffect(() => {
    refreshRooms();
  }, []);

  useEffect(() => {
    if (!room || !playerId) return;
    let active = true;
    const tick = async () => {
      if (!active) return;
      try {
        const state = await api.getCooperPlayerView(room.code, playerId);
        if (!active) return;
        setRoom(state.room);
        setViewState(state.view);
      } catch {
        // ignore transient error
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [room?.code, playerId]);

  const isHost = room && playerId === room.hostPlayerId;
  const me = useMemo(() => room?.players.find((p) => p.id === playerId) || null, [room, playerId]);

  const createRoom = async () => {
    if (!playerName.trim()) return setFeedback("Digite seu nome.");
    const result = await api.createCooperRoom(roomName, playerName.trim());
    setRoom(result.room);
    setPlayerId(result.playerId);
    setFeedback("");
    await refreshRooms();
  };

  const joinRoom = async () => {
    if (!playerName.trim()) return setFeedback("Digite seu nome.");
    if (!joinCode.trim()) return setFeedback("Digite o codigo.");
    const result = await api.joinCooperRoom(joinCode.trim().toUpperCase(), playerName.trim());
    setRoom(result.room);
    setPlayerId(result.playerId);
    setFeedback("");
    await refreshRooms();
  };

  const openRoomReadOnly = async (code: string) => {
    setRoom(await api.getCooperRoom(code));
    setFeedback("Entre com nome + codigo para participar.");
  };

  const startRoom = async () => {
    if (!room || !playerId) return;
    setRoom(await api.startCooperRoom(room.code, playerId));
  };

  const clearStepState = () => {
    setSelectedAction("");
    setGateway("");
    setMacDest("");
    setSequence([]);
  };

  const executeAction = async () => {
    if (!room || !playerId || !viewState?.mission) return;
    const step = viewState.mission.stepId;
    let payload: {
      type: string;
      routePath?: string;
      gateway?: string;
      sequence?: string[];
    };

    if (step === "run-ping-portal") payload = { type: "run-command", routePath: "ping portal.empresa.local" };
    else if (step === "restart-dns") payload = { type: "service-action", routePath: selectedAction };
    else if (step === "inspect-physical") payload = { type: "inspect" };
    else if (step === "connect-cable") payload = { type: "service-action", routePath: selectedAction };
    else if (step === "inspect-handshake") payload = { type: "inspect" };
    else if (step === "send-ack") payload = { type: "service-action", routePath: selectedAction };
    else if (step === "run-traceroute") payload = { type: "run-command", routePath: "traceroute server.local" };
    else if (step === "change-route") payload = { type: "service-action", routePath: selectedAction };
    else if (step === "inspect-ip") payload = { type: "inspect" };
    else if (step === "set-gateway") payload = { type: "gateway-set", gateway };
    else if (step === "inspect-packets") payload = { type: "inspect" };
    else if (step === "reorder-packets") payload = { type: "tcp-sequence", sequence };
    else if (step === "inspect-message") payload = { type: "inspect" };
    else if (step === "apply-rot13") payload = { type: "service-action", routePath: selectedAction };
    else if (step === "run-ping-server") payload = { type: "run-command", routePath: "ping server.local" };
    else if (step === "restart-http") payload = { type: "service-action", routePath: selectedAction };
    else if (step === "inspect-frame") payload = { type: "inspect" };
    else if (step === "edit-frame") payload = { type: "frame-edit", routePath: macDest };
    else if (step === "inspect-congestion") payload = { type: "inspect" };
    else payload = { type: "service-action", routePath: selectedAction };

    try {
      const result = await api.submitCooperAction(room.code, playerId, payload);
      setRoom(result.room);
      setFeedback(result.result.feedback);
      if (result.result.correct) clearStepState();
    } catch (err) {
      setFeedback(parseError(err));
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Cooperativo de Redes</h1>
      <p className="text-sm text-muted-foreground mb-6">Operadores controlam sistema; analistas usam manual.</p>

      {!room && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-primary/20 rounded-lg p-5">
            <p className="text-sm font-semibold mb-2">Seu nome</p>
            <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 mb-4" />
            <p className="text-sm font-semibold mb-2">Criar sala</p>
            <input value={roomName} onChange={(e) => setRoomName(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 mb-3" />
            <button onClick={createRoom} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm">Criar</button>
            <p className="text-sm font-semibold mt-6 mb-2">Entrar por codigo</p>
            <div className="flex gap-2">
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2" />
              <button onClick={joinRoom} className="px-4 py-2 bg-secondary text-secondary-foreground rounded text-sm">Entrar</button>
            </div>
          </div>
          <div className="bg-card border border-secondary/20 rounded-lg p-5">
            <p className="text-sm font-semibold mb-2">Salas abertas</p>
            <div className="grid gap-2">
              {rooms.map((r) => (
                <button key={r.code} onClick={() => openRoomReadOnly(r.code)} className="text-left p-3 border border-primary/20 rounded bg-muted/30">
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">Codigo: {r.code} | Jogadores: {r.players.length} | {r.status}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {room && room.status === "waiting" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-card border border-primary/20 rounded-lg p-5">
            <p className="font-semibold">{room.name}</p>
            <p className="text-xs text-muted-foreground mb-4">Lobby | Codigo: {room.code}</p>
            {isHost ? <button onClick={startRoom} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold">Iniciar jogo</button> : <p className="text-sm text-muted-foreground">Aguardando host iniciar.</p>}
          </section>
          <section className="bg-card border border-secondary/20 rounded-lg p-5">
            <p className="text-sm font-semibold mb-2">Equipe</p>
            <div className="grid gap-2">
              {room.players.map((p) => (
                <div key={p.id} className="p-2 rounded border border-primary/20 bg-muted/30 text-xs">
                  {p.name} - {p.role === "operator" ? "OPERADOR" : "ANALISTA"}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {room && room.status === "running" && (
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <section className="bg-card border border-primary/20 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold">Missao {room.currentMissionIndex + 1}/{room.totalMissions}</p>
              <p className="text-xs text-warning">Tempo: {formatTime(viewState?.remainingSeconds ?? room.remainingSeconds)}</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Voce: {me?.name ?? "-"} ({me?.role === "operator" ? "OPERADOR" : "ANALISTA"})
            </p>

            {viewState?.mission && (
              <div>
                <p className="text-sm font-semibold">{viewState.mission.title}</p>
                <p className="text-sm text-foreground/80 mb-2">{viewState.mission.problem}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  {viewState.mission.stepTitle} ({viewState.mission.currentStepIndex + 1}/{viewState.mission.totalSteps})
                </p>
              </div>
            )}

            {viewState?.mission && me?.role === "operator" && (
              <div>
                <p className="text-xs text-secondary font-semibold tracking-widest mb-2">PAINEL DO OPERADOR</p>
                <div className="grid gap-2 mb-3">
                  {viewState.mission.operatorLogs.map((log) => (
                    <div key={log} className="p-2 rounded border border-primary/20 bg-muted/30 text-xs">{log}</div>
                  ))}
                </div>

                {["restart-dns", "connect-cable", "send-ack", "change-route", "apply-rot13", "restart-http", "reduce-traffic"].includes(viewState.mission.stepId) && (
                  <div className="grid gap-2 mb-3">
                    {(
                      viewState.mission.stepId === "restart-dns"
                        ? ["Restart DNS", "Restart HTTP", "Reset router"]
                        : viewState.mission.stepId === "connect-cable"
                          ? ["Connect cable", "Change port", "Replace cable"]
                          : viewState.mission.stepId === "send-ack"
                            ? ["ACK", "FIN", "RST"]
                            : viewState.mission.stepId === "change-route"
                              ? ["Change route", "Reset router", "Increase TTL"]
                              : viewState.mission.stepId === "apply-rot13"
                                ? ["Decode Base64", "Apply ROT13", "Decrypt AES"]
                                : viewState.mission.stepId === "restart-http"
                                  ? ["Restart HTTP", "Restart DNS", "Reboot server"]
                                  : ["Reduce traffic", "Increase buffer", "Limit connections"]
                    ).map((action) => (
                      <button key={action} onClick={() => setSelectedAction(action)} className={`text-left px-3 py-2 rounded border text-xs ${selectedAction === action ? "border-secondary bg-secondary/20" : "border-primary/20 bg-background/60"}`}>{action}</button>
                    ))}
                  </div>
                )}

                {viewState.mission.stepId === "set-gateway" && (
                  <div className="grid gap-2 mb-3">
                    <input value={gateway} onChange={(e) => setGateway(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-xs" placeholder="Gateway (192.168.2.1)" />
                  </div>
                )}

                {viewState.mission.stepId === "reorder-packets" && (
                  <div className="grid gap-2 mb-3">
                    <div className="text-xs p-2 rounded border border-primary/20 bg-muted/30">Ordem: {sequence.length ? sequence.join(" -> ") : "vazia"}</div>
                    {["Packet 1", "Packet 2", "Packet 3"].map((pkt) => (
                      <button key={pkt} onClick={() => setSequence((prev) => [...prev, pkt])} className="text-left px-3 py-2 rounded border border-primary/20 bg-background/60 text-sm">Adicionar {pkt}</button>
                    ))}
                    <button onClick={() => setSequence([])} className="px-3 py-2 rounded bg-muted text-xs">Limpar</button>
                  </div>
                )}

                {viewState.mission.stepId === "edit-frame" && (
                  <div className="grid gap-2 mb-3">
                    <input value={macDest} onChange={(e) => setMacDest(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-xs" placeholder="Destination MAC (00:AB:45:12:FF:90)" />
                  </div>
                )}

                <button onClick={executeAction} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold">Executar acao</button>
              </div>
            )}

            {viewState?.mission && me?.role === "analyst" && (
              <div>
                <p className="text-xs text-warning font-semibold tracking-widest mb-2">MANUAL DO ANALISTA</p>
                <div className="grid gap-2">
                  {viewState.mission.manualSections.map((section) => (
                    <div key={section} className="p-2 rounded border border-warning/30 bg-warning/10 text-xs">{section}</div>
                  ))}
                </div>
              </div>
            )}

            {feedback && <p className="text-xs mt-3 text-foreground/90">{feedback}</p>}
          </section>

          <section className="bg-card border border-secondary/20 rounded-lg p-5">
            <p className="text-xs text-primary font-semibold tracking-widest mb-2">EVENTOS</p>
            <div className="grid gap-2 mb-4">
              {room.events.length ? room.events.map((e, i) => <div key={`${e}-${i}`} className="p-2 rounded border border-primary/20 bg-muted/30 text-xs">{e}</div>) : <p className="text-xs text-muted-foreground">Nenhum evento.</p>}
            </div>
            <p className="text-xs text-muted-foreground mb-2">Ranking</p>
            <div className="grid gap-2">
              {room.ranking.map((entry, idx) => (
                <div key={entry.playerId} className="p-2 rounded border border-secondary/20 bg-secondary/10 text-xs">
                  {idx + 1}. {entry.playerName} ({entry.role === "operator" ? "OPERADOR" : "ANALISTA"}) - {entry.points} pts
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {room && room.status === "finished" && (
        <div className="max-w-4xl mx-auto bg-card border border-secondary/30 rounded-lg p-8 text-center">
          <p className="text-xs text-secondary font-semibold tracking-widest mb-2">REDE RESTAURADA</p>
          <h2 className="text-2xl font-bold mb-3">Missao cooperativa concluida</h2>
          <p className="text-sm text-muted-foreground mb-6">Relatorio final da equipe</p>
          <div className="text-left bg-card border border-primary/20 rounded-lg p-4 mb-6">
            <div className="grid gap-2">
              {room.ranking.map((entry, idx) => (
                <div key={entry.playerId} className="p-2 rounded border border-secondary/20 bg-secondary/10 text-xs">
                  {idx + 1}. {entry.playerName} - {entry.points} pts - Erros {entry.wrongActions}
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => { setRoom(null); setPlayerId(""); setViewState(null); setFeedback(""); refreshRooms(); }} className="px-5 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold">Voltar para salas</button>
        </div>
      )}
    </div>
  );
};

export default Cooper;
