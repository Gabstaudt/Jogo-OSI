import { useEffect, useMemo, useState } from "react";
import { api, type NocPlayerView, type NocRoleKey, type NocRoomView } from "@/lib/api";

const ROLE_LABEL: Record<NocRoleKey, string> = {
  fisico: "Fisica",
  enlace: "Enlace",
  rede: "Rede",
  transporte: "Transporte",
  sessao: "Sessao",
  apresentacao: "Apresentacao",
  aplicacao: "Aplicacao",
};

const formatError = (err: unknown) => {
  if (!(err instanceof Error)) return "Falha ao executar acao.";
  try {
    const parsed = JSON.parse(err.message);
    return parsed?.message ?? err.message;
  } catch {
    return err.message;
  }
};

const NOC = () => {
  const [rooms, setRooms] = useState<NocRoomView[]>([]);
  const [roomName, setRoomName] = useState("NOC Room");
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [room, setRoom] = useState<NocRoomView | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [viewState, setViewState] = useState<NocPlayerView["view"] | null>(null);

  const [selectedAction, setSelectedAction] = useState("");
  const [sequence, setSequence] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [cableType, setCableType] = useState("UTP");
  const [links, setLinks] = useState<string[]>([]);
  const [routePath, setRoutePath] = useState("");
  const [gateway, setGateway] = useState("");
  const [ttl, setTtl] = useState("");
  const [serviceAction, setServiceAction] = useState("");
  const [dnsServer, setDnsServer] = useState("");
  const [decodedText, setDecodedText] = useState("");
  const [finalCause, setFinalCause] = useState("");
  const [finalFix, setFinalFix] = useState("");

  const refreshRooms = async () => {
    try {
      setRooms(await api.listNocRooms());
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
        const state = await api.getNocPlayerView(room.code, playerId);
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
    if (!playerName.trim()) {
      setFeedback("Digite seu nome.");
      return;
    }
    const result = await api.createNocRoom(roomName, playerName.trim());
    setRoom(result.room);
    setPlayerId(result.playerId);
    setFeedback("");
    await refreshRooms();
  };

  const joinRoom = async () => {
    if (!playerName.trim()) {
      setFeedback("Digite seu nome.");
      return;
    }
    if (!joinCode.trim()) {
      setFeedback("Digite o codigo da sala.");
      return;
    }
    const result = await api.joinNocRoom(joinCode.trim().toUpperCase(), playerName.trim());
    setRoom(result.room);
    setPlayerId(result.playerId);
    setFeedback("");
    await refreshRooms();
  };

  const openRoomReadOnly = async (code: string) => {
    const opened = await api.getNocRoom(code);
    setRoom(opened);
    setFeedback("Entre com nome + codigo para participar.");
  };

  const startRoom = async () => {
    if (!room || !playerId) return;
    const started = await api.startNocRoom(room.code, playerId);
    setRoom(started);
    setFeedback("");
  };

  const runAction = async () => {
    if (!room || !playerId || !viewState?.scenario) return;
    let actionToken = selectedAction;
    let sequencePayload = viewState.scenario.kind === "sequence" ? sequence : undefined;

    if (viewState.scenario.id === "cable-offline") {
      const required = ["PC-Switch", "Switch-Router", "Router-Server"];
      const allConnected = required.every((link) => links.includes(link));
      if (!allConnected || cableType !== "fibra") {
        setFeedback("Conecte os 3 links e selecione cabo Fibra.");
        return;
      }
      actionToken = "CABO_OK";
    } else if (viewState.scenario.id === "route-fail") {
      if (routePath !== "R1->R3->R4" || gateway !== "10.0.0.1" || ttl !== "64") {
        setFeedback("Configure rota R1->R3->R4, gateway 10.0.0.1 e TTL 64.");
        return;
      }
      actionToken = "ROTA_OK";
    } else if (viewState.scenario.id === "dns-down") {
      if (serviceAction !== "Configurar DNS" || dnsServer !== "10.10.0.53") {
        setFeedback("Configure DNS com servidor 10.10.0.53.");
        return;
      }
      actionToken = "DNS_OK";
    } else if (viewState.scenario.id === "data-corrupted") {
      if (decodedText.trim().toLowerCase() !== "rede restaurada") {
        setFeedback("Decodifique corretamente o payload Base64.");
        return;
      }
      actionToken = "DECODE_OK";
    } else if (viewState.scenario.id === "final-incident") {
      if (
        finalCause.trim().toLowerCase() !== "roteamento quebrado" ||
        finalFix.trim().toLowerCase() !== "corrigir rota para host"
      ) {
        setFeedback("Causa raiz e acao final nao conferem.");
        return;
      }
      actionToken = "INCIDENTE_OK";
    } else if (viewState.scenario.kind === "sequence") {
      if (sequencePayload.length === 0) {
        setFeedback("Monte a sequencia antes de executar.");
        return;
      }
    } else if (!actionToken) {
      setFeedback("Preencha os campos da acao.");
      return;
    }

    try {
      const result = await api.submitNocAction(
        room.code,
        playerId,
        viewState.scenario.kind === "single" ? actionToken : undefined,
        viewState.scenario.kind === "sequence" ? sequencePayload : undefined,
      );
      setRoom(result.room);
      setFeedback(result.result.feedback);
      if (result.result.correct) {
        setSelectedAction("");
        setSequence([]);
        setCableType("UTP");
        setLinks([]);
        setRoutePath("");
        setGateway("");
        setTtl("");
        setServiceAction("");
        setDnsServer("");
        setDecodedText("");
        setFinalCause("");
        setFinalFix("");
      }
    } catch (err) {
      setFeedback(formatError(err));
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">NOC Multiplayer</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Fluxo: entrar em sala por codigo - lobby - host inicia - cada papel ve sua propria tela.
      </p>

      <div className="bg-card border border-primary/20 rounded-lg p-4 mb-6">
        <p className="text-xs text-warning font-semibold tracking-widest mb-2">MODELO DE RESPONSABILIDADE</p>
        <div className="grid md:grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded border border-primary/20 bg-muted/30">Jogador 1: Fisica + Enlace</div>
          <div className="p-2 rounded border border-primary/20 bg-muted/30">Jogador 2: Rede + Transporte</div>
          <div className="p-2 rounded border border-primary/20 bg-muted/30">
            Jogador 3: Sessao + Apresentacao + Aplicacao
          </div>
        </div>
      </div>

      {!room && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-primary/20 rounded-lg p-5">
            <p className="text-sm font-semibold mb-2">Seu nome</p>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-input border border-primary/30 rounded px-3 py-2 mb-4"
              placeholder="Nome do jogador"
            />

            <p className="text-sm font-semibold mb-2">Criar sala NOC</p>
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-input border border-primary/30 rounded px-3 py-2 mb-3"
              placeholder="Nome da sala"
            />
            <button onClick={createRoom} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm">
              Criar sala
            </button>

            <p className="text-sm font-semibold mt-6 mb-2">Entrar por codigo</p>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full bg-input border border-primary/30 rounded px-3 py-2"
                placeholder="Codigo da sala"
              />
              <button onClick={joinRoom} className="px-4 py-2 bg-secondary text-secondary-foreground rounded text-sm">
                Entrar
              </button>
            </div>
          </div>

          <div className="bg-card border border-secondary/20 rounded-lg p-5">
            <p className="text-sm font-semibold mb-2">Salas NOC abertas</p>
            <div className="grid gap-2">
              {rooms.map((item) => (
                <button
                  key={item.code}
                  onClick={() => openRoomReadOnly(item.code)}
                  className="text-left p-3 border border-primary/20 rounded bg-muted/30 hover:border-primary/50"
                >
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Codigo: {item.code} | Jogadores: {item.players.length} | Status: {item.status}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {room && room.status === "waiting" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-card border border-primary/20 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">{room.name}</p>
              <p className="text-xs text-muted-foreground">Codigo: {room.code}</p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Lobby da sala. Aguardando inicio do host.</p>
            {isHost && (
              <button onClick={startRoom} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold">
                Iniciar missao
              </button>
            )}
            {!isHost && <p className="text-xs text-muted-foreground">Somente o host pode iniciar.</p>}
          </section>

          <section className="bg-card border border-secondary/20 rounded-lg p-5">
            <p className="text-sm font-semibold mb-2">Jogadores no lobby</p>
            <div className="grid gap-2">
              {room.players.map((p) => (
                <div key={p.id} className="p-2 rounded border border-primary/20 bg-muted/30">
                  <p className="text-sm">
                    {p.name} {p.id === room.hostPlayerId ? "(host)" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.roles.map((r) => ROLE_LABEL[r]).join(", ")}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {room && room.status === "finished" && (
        <div className="max-w-4xl mx-auto bg-card border border-secondary/30 rounded-lg p-8 text-center animate-fade-in-up">
          <p className="text-xs text-secondary font-semibold tracking-widest mb-2">MISSAO CONCLUIDA</p>
          <h2 className="text-2xl font-bold mb-2">Rede restaurada com sucesso</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Equipe finalizou todos os incidentes do NOC.
          </p>

          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <div className="bg-muted/30 border border-primary/20 rounded p-3">
              <p className="text-xs text-muted-foreground">Sala</p>
              <p className="text-sm font-semibold">{room.name}</p>
            </div>
            <div className="bg-muted/30 border border-primary/20 rounded p-3">
              <p className="text-xs text-muted-foreground">Cenarios</p>
              <p className="text-sm font-semibold">
                {room.totalScenarios}/{room.totalScenarios}
              </p>
            </div>
            <div className="bg-muted/30 border border-primary/20 rounded p-3">
              <p className="text-xs text-muted-foreground">Jogadores</p>
              <p className="text-sm font-semibold">{room.players.length}</p>
            </div>
          </div>

          <div className="text-left bg-card border border-primary/20 rounded-lg p-4 mb-6">
            <p className="text-xs text-warning font-semibold tracking-widest mb-2">RANKING FINAL</p>
            <div className="grid gap-2">
              {room.ranking.map((entry, idx) => (
                <div key={entry.playerId} className="p-2 rounded border border-secondary/20 bg-secondary/10 text-xs">
                  {idx + 1}. {entry.playerName} - {entry.points} pts - Erros {entry.wrongActions}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setRoom(null);
              setPlayerId("");
              setViewState(null);
              setSelectedAction("");
              setSequence([]);
              setFeedback("");
              refreshRooms();
            }}
            className="px-5 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold"
          >
            Voltar ao lobby de salas
          </button>
        </div>
      )}

      {room && room.status === "running" && (
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <section className="bg-card border border-primary/20 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">{room.name}</p>
              <p className="text-xs text-muted-foreground">
                {room.code} | Cenario {Math.min(room.currentScenarioIndex + 1, room.totalScenarios)}/{room.totalScenarios}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Voce: {me?.name ?? "-"} | Papeis: {(me?.roles || []).map((r) => ROLE_LABEL[r]).join(", ") || "-"}
            </p>

            {!viewState?.scenario && <p className="text-sm text-muted-foreground">Missao concluida.</p>}

            {viewState?.scenario && viewState.isAnalyst && (
              <div>
                <p className="text-xs text-warning font-semibold tracking-widest mb-2">PAINEL ANALISTA</p>
                <p className="text-sm font-semibold">{viewState.scenario.title}</p>
                <p className="text-sm text-foreground/85 mb-2">{viewState.scenario.problem}</p>
                <div className="grid gap-2">
                  {viewState.scenario.analystLogs.map((log) => (
                    <div key={log} className="p-2 rounded border border-warning/30 bg-warning/10 text-xs font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewState?.scenario && viewState.isOperator && (
              <div>
                <p className="text-xs text-secondary font-semibold tracking-widest mb-2">PAINEL OPERADOR</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Papel exigido: {ROLE_LABEL[viewState.scenario.role]}
                </p>

                {viewState.scenario.id === "cable-offline" && (
                  <div className="grid gap-2 mb-3">
                    <p className="text-xs text-muted-foreground">Conecte os links:</p>
                    {["PC-Switch", "Switch-Router", "Router-Server"].map((link) => (
                      <button
                        key={link}
                        onClick={() =>
                          setLinks((prev) => (prev.includes(link) ? prev.filter((l) => l !== link) : [...prev, link]))
                        }
                        className={`text-left px-3 py-2 rounded border text-xs ${
                          links.includes(link) ? "border-secondary bg-secondary/20" : "border-primary/20 bg-background/60"
                        }`}
                      >
                        {links.includes(link) ? "Conectado: " : "Conectar: "}
                        {link}
                      </button>
                    ))}
                    <input
                      value={cableType}
                      onChange={(e) => setCableType(e.target.value)}
                      className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-xs"
                      placeholder="Tipo de cabo (ex: fibra)"
                    />
                  </div>
                )}

                {viewState.scenario.id === "route-fail" && (
                  <div className="grid gap-2 mb-3">
                    <input value={routePath} onChange={(e) => setRoutePath(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-xs" placeholder="Rota (R1->R3->R4)" />
                    <input value={gateway} onChange={(e) => setGateway(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-xs" placeholder="Gateway (10.0.0.1)" />
                    <input value={ttl} onChange={(e) => setTtl(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-xs" placeholder="TTL (64)" />
                  </div>
                )}

                {viewState.scenario.id === "dns-down" && (
                  <div className="grid gap-2 mb-3">
                    <input value={serviceAction} onChange={(e) => setServiceAction(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-xs" placeholder="Acao (Configurar DNS)" />
                    <input value={dnsServer} onChange={(e) => setDnsServer(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-xs" placeholder="Servidor DNS (10.10.0.53)" />
                  </div>
                )}

                {viewState.scenario.kind === "sequence" && (
                  <div className="grid gap-2 mb-3">
                    <div className="text-xs p-2 rounded border border-primary/20 bg-muted/30">
                      Ordem atual: {sequence.length ? sequence.join(" -> ") : "vazia"}
                    </div>
                    {viewState.scenario.operatorActions.map((action) => (
                      <button
                        key={action}
                        onClick={() => setSequence((prev) => [...prev, action])}
                        className="text-left px-3 py-2 rounded border border-primary/20 bg-background/60 text-sm"
                      >
                        Adicionar {action}
                      </button>
                    ))}
                    <button onClick={() => setSequence([])} className="px-3 py-2 rounded bg-muted text-xs">
                      Limpar
                    </button>
                  </div>
                )}

                {viewState.scenario.id === "data-corrupted" && (
                  <div className="grid gap-2 mb-3">
                    <p className="text-xs text-muted-foreground">Decodifique: <code>cmVkZSByZXN0YXVyYWRh</code></p>
                    <input value={decodedText} onChange={(e) => setDecodedText(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-xs" placeholder="Texto decodificado" />
                  </div>
                )}

                {viewState.scenario.id === "final-incident" && (
                  <div className="grid gap-2 mb-3">
                    <input value={finalCause} onChange={(e) => setFinalCause(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-xs" placeholder="Causa raiz" />
                    <input value={finalFix} onChange={(e) => setFinalFix(e.target.value)} className="w-full bg-input border border-primary/30 rounded px-3 py-2 text-xs" placeholder="Acao de correcao" />
                  </div>
                )}

                <button
                  onClick={runAction}
                  disabled={!viewState.operatorAllowed || room.status !== "running"}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold disabled:opacity-40"
                >
                  Executar acao
                </button>
              </div>
            )}

            {viewState?.scenario && !viewState.isAnalyst && !viewState.isOperator && (
              <p className="text-sm text-muted-foreground">Aguarde sua vez nesta rodada.</p>
            )}

            {feedback && <p className="text-xs mt-3 text-foreground/90">{feedback}</p>}
          </section>

          <section className="bg-card border border-secondary/20 rounded-lg p-5">
            <p className="text-xs text-primary font-semibold tracking-widest mb-2">EVENTOS E RANKING</p>
            <p className="text-xs text-muted-foreground mb-2">Eventos dinamicos</p>
            <div className="grid gap-2 mb-4">
              {room.events.length ? (
                room.events.map((event, idx) => (
                  <div key={`${event}-${idx}`} className="p-2 rounded border border-primary/20 bg-muted/30 text-xs">
                    {event}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum evento ainda.</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-2">Ranking</p>
            <div className="grid gap-2">
              {room.ranking.map((entry, idx) => (
                <div key={entry.playerId} className="p-2 rounded border border-secondary/20 bg-secondary/10 text-xs">
                  {idx + 1}. {entry.playerName} - {entry.points} pts - Erros {entry.wrongActions}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default NOC;
