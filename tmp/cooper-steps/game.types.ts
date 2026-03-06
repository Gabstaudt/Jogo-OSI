export type EnigmaType = 'text' | 'multiple-choice' | 'drag-order';

export interface PhaseRecord {
  layer: number;
  name: string;
  enigmaType: EnigmaType;
  instruction: string;
  options?: string[];
  correctAnswer: string | number | string[];
  hint: string;
  explanation: string;
  wrongFeedback: string;
}

export interface SessionLayerStat {
  attempts: number;
  solved: boolean;
  wrongAttempts: number;
  stars: number;
  xp: number;
}

export interface PlayerAnswerRecord {
  layer: number;
  answer: unknown;
  correct: boolean;
  at: number;
  attempt: number;
}

export interface CompetitionPlayer {
  id: string;
  name: string;
  xp: number;
  startedAt?: number;
  finishedAt?: number;
  stats: Record<number, SessionLayerStat>;
  answers: PlayerAnswerRecord[];
}

export interface CompetitionRoom {
  code: string;
  name: string;
  status: 'waiting' | 'running' | 'finished';
  createdAt: number;
  startedAt?: number;
  currentLayer: number;
  hostPlayerId: string;
  players: Record<string, CompetitionPlayer>;
}

export type NocRoleKey =
  | 'fisico'
  | 'enlace'
  | 'rede'
  | 'transporte'
  | 'sessao'
  | 'apresentacao'
  | 'aplicacao';

export interface NocPlayer {
  id: string;
  name: string;
  roles: NocRoleKey[];
  points: number;
  wrongActions: number;
}

export interface NocRoom {
  code: string;
  name: string;
  status: 'waiting' | 'running' | 'finished';
  createdAt: number;
  hostPlayerId: string;
  playerOrder: string[];
  players: Record<string, NocPlayer>;
  currentScenarioIndex: number;
  events: string[];
}

export type CooperRole = 'operator' | 'analyst';

export interface CooperPlayer {
  id: string;
  name: string;
  role: CooperRole;
  points: number;
  wrongActions: number;
}

export interface CooperRoom {
  code: string;
  name: string;
  status: 'waiting' | 'running' | 'finished';
  createdAt: number;
  startedAt?: number;
  currentMissionStartedAt?: number;
  hostPlayerId: string;
  playerOrder: string[];
  players: Record<string, CooperPlayer>;
  currentMissionIndex: number;
  currentStepIndex: number;
  events: string[];
}
