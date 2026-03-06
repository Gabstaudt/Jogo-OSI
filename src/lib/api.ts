import type { Phase } from "@/data/phases";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/api";

export interface ApiValidateResult {
  correct: boolean;
  feedback: string;
  hint?: string;
  stats?: {
    xp: number;
    correctAttempts: number;
    wrongAttempts: number;
    layerStats: Record<number, { stars: number; xp: number; attempts: number }>;
    totalAttempts: number;
    accuracy: number;
  };
  stars?: number;
  xpEarned?: number;
}

export interface CompetitionRoomView {
  code: string;
  name: string;
  hostPlayerId: string;
  hostName: string | null;
  status: "waiting" | "running" | "finished";
  createdAt: number;
  startedAt: number | null;
  currentLayer: number;
  playerCount: number;
  players: {
    id: string;
    name: string;
    xp: number;
    solvedLayers: number;
    wrongAttempts: number;
    elapsedSeconds: number;
    finishedAt: number | null;
  }[];
  scoreboard: {
    playerId: string;
    playerName: string;
    xp: number;
    solvedLayers: number;
    wrongAttempts: number;
    elapsedSeconds: number;
    finishedAt: number | null;
  }[];
}

export interface CompetitionQuestionView {
  roomCode: string;
  status: "waiting" | "running" | "finished";
  currentLayer: number;
  question: Phase;
}

export interface CompetitionRoomJoinResult {
  room: CompetitionRoomView;
  playerId: string;
}

const handleJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
};

export const api = {
  async getPhases(): Promise<Phase[]> {
    const res = await fetch(`${API_BASE}/game/phases`);
    return handleJson<Phase[]>(res);
  },

  async startSession(playerName?: string): Promise<{ sessionId: string }> {
    const res = await fetch(`${API_BASE}/game/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName }),
    });
    return handleJson<{ sessionId: string }>(res);
  },

  async submitAnswer(sessionId: string, layer: number, answer: unknown): Promise<ApiValidateResult> {
    const res = await fetch(`${API_BASE}/game/sessions/${sessionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layer, answer }),
    });
    return handleJson<ApiValidateResult>(res);
  },

  async validate(layer: number, answer: unknown): Promise<ApiValidateResult> {
    const res = await fetch(`${API_BASE}/game/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layer, answer }),
    });
    return handleJson<ApiValidateResult>(res);
  },

  async listRooms(): Promise<CompetitionRoomView[]> {
    const res = await fetch(`${API_BASE}/game/competition/rooms`);
    return handleJson<CompetitionRoomView[]>(res);
  },

  async createRoom(name: string, hostName: string): Promise<CompetitionRoomJoinResult> {
    const res = await fetch(`${API_BASE}/game/competition/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, hostName }),
    });
    return handleJson<CompetitionRoomJoinResult>(res);
  },

  async joinRoom(roomCode: string, playerName: string): Promise<CompetitionRoomJoinResult> {
    const res = await fetch(`${API_BASE}/game/competition/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName }),
    });
    return handleJson<CompetitionRoomJoinResult>(res);
  },

  async getRoom(roomCode: string): Promise<CompetitionRoomView> {
    const res = await fetch(`${API_BASE}/game/competition/rooms/${roomCode}`);
    return handleJson<CompetitionRoomView>(res);
  },

  async getRoomQuestion(roomCode: string): Promise<CompetitionQuestionView> {
    const res = await fetch(`${API_BASE}/game/competition/rooms/${roomCode}/question`);
    return handleJson<CompetitionQuestionView>(res);
  },

  async startRoom(roomCode: string, playerId: string): Promise<CompetitionRoomView> {
    const res = await fetch(`${API_BASE}/game/competition/rooms/${roomCode}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    return handleJson<CompetitionRoomView>(res);
  },

  async submitPlayerAnswer(
    roomCode: string,
    playerId: string,
    layer: number,
    answer: unknown,
  ): Promise<{ room: CompetitionRoomView; result: ApiValidateResult }> {
    const res = await fetch(`${API_BASE}/game/competition/rooms/${roomCode}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, layer, answer }),
    });
    return handleJson<{ room: CompetitionRoomView; result: ApiValidateResult }>(res);
  },
};
