const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/api";

export interface Phase {
  layer: number;
  name: string;
  icon: string;
  badgeColor: string;
  protocols: string;
  narrative: string;
  enigmaType: "text" | "multiple-choice" | "drag-order";
  enigmaDisplay?: string;
  instruction: string;
  options?: string[];
  hint: string;
  explanation: string;
  wrongFeedback: string;
  networkMessage: string;
  dynamicFlow?: string[];
  referenceImage?: string;
  referenceImageAlt?: string;
}

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

export interface FinalMissionView {
  title: string;
  symptom: string;
  objective: string;
  options: string[];
  commandOutputs: Record<string, string>;
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

export type NocRoleKey =
  | "fisico"
  | "enlace"
  | "rede"
  | "transporte"
  | "sessao"
  | "apresentacao"
  | "aplicacao";

export interface NocRoomView {
  code: string;
  name: string;
  status: "waiting" | "running" | "finished";
  createdAt: number;
  hostPlayerId: string;
  currentScenarioIndex: number;
  totalScenarios: number;
  players: { id: string; name: string; roles: NocRoleKey[]; points: number }[];
  events: string[];
  ranking: {
    playerId: string;
    playerName: string;
    roles: NocRoleKey[];
    points: number;
    wrongActions: number;
  }[];
}

export interface NocRoomJoinResult {
  room: NocRoomView;
  playerId: string;
}

export interface NocPlayerView {
  room: NocRoomView;
  view: {
    isAnalyst: boolean;
    isOperator: boolean;
    analystName: string | null;
    operatorName: string | null;
    operatorAllowed: boolean;
    scenario: {
      id: string;
      title: string;
      problem: string;
      role: NocRoleKey;
      kind: "single" | "sequence";
      analystLogs: string[];
      operatorActions: string[];
    } | null;
  };
}

export interface CooperRoomView {
  code: string;
  name: string;
  status: "waiting" | "running" | "finished";
  createdAt: number;
  hostPlayerId: string;
  currentMissionIndex: number;
  currentStepIndex: number;
  totalMissions: number;
  missionDurationSeconds: number;
  remainingSeconds: number;
  players: { id: string; name: string; role: "operator" | "analyst"; points: number }[];
  events: string[];
  ranking: {
    playerId: string;
    playerName: string;
    role: "operator" | "analyst";
    points: number;
    wrongActions: number;
  }[];
}

export interface CooperRoomJoinResult {
  room: CooperRoomView;
  playerId: string;
}

export interface CooperPlayerView {
  room: CooperRoomView;
  view: {
    role: "operator" | "analyst";
    remainingSeconds: number;
    mission: {
      id: string;
      title: string;
      problem: string;
      affectedLayer: string;
      stepId: string;
      stepTitle: string;
      currentStepIndex: number;
      totalSteps: number;
      operatorLogs: string[];
      manualSections: string[];
    } | null;
  };
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

  async getFinalMission(): Promise<FinalMissionView> {
    const res = await fetch(`${API_BASE}/game/final-mission`);
    return handleJson<FinalMissionView>(res);
  },

  async validateFinalMission(selectedIndex: number): Promise<{ correct: boolean; feedback: string }> {
    const res = await fetch(`${API_BASE}/game/final-mission/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedIndex }),
    });
    return handleJson<{ correct: boolean; feedback: string }>(res);
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

  async listNocRooms(): Promise<NocRoomView[]> {
    const res = await fetch(`${API_BASE}/game/noc/rooms`);
    return handleJson<NocRoomView[]>(res);
  },

  async createNocRoom(name: string, hostName: string): Promise<NocRoomJoinResult> {
    const res = await fetch(`${API_BASE}/game/noc/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, hostName }),
    });
    return handleJson<NocRoomJoinResult>(res);
  },

  async joinNocRoom(roomCode: string, playerName: string): Promise<NocRoomJoinResult> {
    const res = await fetch(`${API_BASE}/game/noc/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName }),
    });
    return handleJson<NocRoomJoinResult>(res);
  },

  async getNocRoom(roomCode: string): Promise<NocRoomView> {
    const res = await fetch(`${API_BASE}/game/noc/rooms/${roomCode}`);
    return handleJson<NocRoomView>(res);
  },

  async startNocRoom(roomCode: string, playerId: string): Promise<NocRoomView> {
    const res = await fetch(`${API_BASE}/game/noc/rooms/${roomCode}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    return handleJson<NocRoomView>(res);
  },

  async getNocPlayerView(roomCode: string, playerId: string): Promise<NocPlayerView> {
    const res = await fetch(`${API_BASE}/game/noc/rooms/${roomCode}/view/${playerId}`);
    return handleJson<NocPlayerView>(res);
  },

  async submitNocAction(
    roomCode: string,
    playerId: string,
    selectedAction?: string,
    sequence?: string[],
  ): Promise<{ room: NocRoomView; result: { correct: boolean; feedback: string } }> {
    const res = await fetch(`${API_BASE}/game/noc/rooms/${roomCode}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, selectedAction, sequence }),
    });
    return handleJson<{ room: NocRoomView; result: { correct: boolean; feedback: string } }>(res);
  },

  async listCooperRooms(): Promise<CooperRoomView[]> {
    const res = await fetch(`${API_BASE}/game/cooper/rooms`);
    return handleJson<CooperRoomView[]>(res);
  },

  async createCooperRoom(name: string, hostName: string): Promise<CooperRoomJoinResult> {
    const res = await fetch(`${API_BASE}/game/cooper/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, hostName }),
    });
    return handleJson<CooperRoomJoinResult>(res);
  },

  async joinCooperRoom(roomCode: string, playerName: string): Promise<CooperRoomJoinResult> {
    const res = await fetch(`${API_BASE}/game/cooper/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName }),
    });
    return handleJson<CooperRoomJoinResult>(res);
  },

  async getCooperRoom(roomCode: string): Promise<CooperRoomView> {
    const res = await fetch(`${API_BASE}/game/cooper/rooms/${roomCode}`);
    return handleJson<CooperRoomView>(res);
  },

  async startCooperRoom(roomCode: string, playerId: string): Promise<CooperRoomView> {
    const res = await fetch(`${API_BASE}/game/cooper/rooms/${roomCode}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    return handleJson<CooperRoomView>(res);
  },

  async getCooperPlayerView(roomCode: string, playerId: string): Promise<CooperPlayerView> {
    const res = await fetch(`${API_BASE}/game/cooper/rooms/${roomCode}/view/${playerId}`);
    return handleJson<CooperPlayerView>(res);
  },

  async submitCooperAction(
    roomCode: string,
    playerId: string,
    payload: {
      type: string;
      routePath?: string;
      gateway?: string;
      ttl?: string;
      dnsServer?: string;
      sequence?: string[];
      decodedText?: string;
      cables?: string[];
      cableType?: string;
    },
  ): Promise<{ room: CooperRoomView; result: { correct: boolean; feedback: string } }> {
    const res = await fetch(`${API_BASE}/game/cooper/rooms/${roomCode}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, ...payload }),
    });
    return handleJson<{ room: CooperRoomView; result: { correct: boolean; feedback: string } }>(res);
  },
};
