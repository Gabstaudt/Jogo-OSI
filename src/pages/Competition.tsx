import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type CompetitionRoomView } from "@/lib/api";

const Competition = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<CompetitionRoomView[]>([]);
  const [activeRoom, setActiveRoom] = useState<CompetitionRoomView | null>(null);
  const [playerId, setPlayerId] = useState("");

  const [playerName, setPlayerName] = useState("");
  const [roomName, setRoomName] = useState("Sala OSI");
  const [joinCode, setJoinCode] = useState("");
  const [feedback, setFeedback] = useState("");

  const isHost = !!activeRoom && playerId === activeRoom.hostPlayerId;

  const refreshRooms = async () => {
    try {
      const data = await api.listRooms();
      setRooms(data);
    } catch {
      setRooms([]);
    }
  };

  const refreshActiveRoom = async (roomCode: string) => {
    const room = await api.getRoom(roomCode);
    setActiveRoom(room);
  };

  useEffect(() => {
    refreshRooms();
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      try {
        const room = await api.getRoom(activeRoom.code);
        if (!alive) return;
        setActiveRoom(room);
        if (playerId && room.status === "running" && room.players.some((p) => p.id === playerId)) {
          navigate(`/?room=${room.code}&player=${playerId}`);
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
  }, [activeRoom?.code, navigate, playerId]);

  const createRoom = async () => {
    if (!playerName.trim()) {
      setFeedback("Digite seu nome para criar a sala.");
      return;
    }
    const result = await api.createRoom(roomName, playerName.trim());
    setActiveRoom(result.room);
    setPlayerId(result.playerId);
    setFeedback("");
    await refreshRooms();
    await refreshActiveRoom(result.room.code);
  };

  const joinRoom = async () => {
    if (!playerName.trim()) {
      setFeedback("Digite seu nome para entrar na sala.");
      return;
    }
    if (!joinCode.trim()) {
      setFeedback("Digite o codigo da sala.");
      return;
    }
    const result = await api.joinRoom(joinCode.trim().toUpperCase(), playerName.trim());
    setActiveRoom(result.room);
    setPlayerId(result.playerId);
    setFeedback("");
    await refreshRooms();
    await refreshActiveRoom(result.room.code);
  };

  const openRoomReadOnly = async (code: string) => {
    await refreshActiveRoom(code);
    setFeedback("Entre na sala com seu nome e codigo para competir.");
  };

  const startMatch = async () => {
    if (!activeRoom || !playerId) return;
    const room = await api.startRoom(activeRoom.code, playerId);
    setActiveRoom(room);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Competicao OSI (lobby)</h1>
      <p className="text-sm text-muted-foreground mb-6">Fluxo: nome - criar/entrar sala - lobby - jogo normal</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-primary/20 rounded-lg p-5">
          <p className="text-sm font-semibold mb-3">Seu nome</p>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-input border border-primary/30 rounded px-3 py-2 mb-4"
            placeholder="Ex: Gabriel"
          />

          <p className="text-sm font-semibold mb-2">Criar sala</p>
          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="w-full bg-input border border-primary/30 rounded px-3 py-2 mb-3"
            placeholder="Nome da sala"
          />
          <button
            onClick={createRoom}
            className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold"
          >
            Criar sala
          </button>

          <p className="text-sm font-semibold mt-6 mb-2">Entrar em sala</p>
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

          <p className="text-sm font-semibold mt-6 mb-2">Salas abertas</p>
          <div className="grid gap-2">
            {rooms.map((room) => (
              <button
                key={room.code}
                onClick={() => openRoomReadOnly(room.code)}
                className="text-left p-3 border border-primary/20 rounded bg-muted/40 hover:border-primary/50"
              >
                <p className="text-sm font-semibold">{room.name}</p>
                <p className="text-xs text-muted-foreground">
                  Codigo: {room.code} | Jogadores: {room.playerCount} | Status: {room.status}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-secondary/20 rounded-lg p-5">
          {!activeRoom ? (
            <p className="text-sm text-muted-foreground">Crie ou entre em uma sala para abrir o lobby.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">{activeRoom.name}</p>
                <span className="text-xs text-muted-foreground">Codigo: {activeRoom.code}</span>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                Status: {activeRoom.status} | Rodada (camada): {activeRoom.currentLayer}
              </p>

              {isHost && activeRoom.status === "waiting" && (
                <button
                  onClick={startMatch}
                  className="mb-4 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-semibold"
                >
                  Iniciar partida
                </button>
              )}

              {!isHost && activeRoom.status === "waiting" && (
                <p className="text-sm text-muted-foreground mb-4">
                  Lobby aberto. Aguarde o host iniciar a partida.
                </p>
              )}

              {activeRoom.status === "running" && (
                <p className="text-sm text-secondary mb-4">Partida iniciada. Redirecionando para o jogo...</p>
              )}

              <p className="text-sm font-semibold mb-2">Jogadores no lobby</p>
              <div className="grid gap-2 mb-4">
                {activeRoom.players.map((player) => (
                  <div key={player.id} className="p-2 rounded border border-primary/20 bg-muted/30 text-sm">
                    {player.name} {player.id === activeRoom.hostPlayerId ? "(host)" : ""}
                  </div>
                ))}
              </div>

              {feedback && <p className="text-sm text-warning">{feedback}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Competition;
