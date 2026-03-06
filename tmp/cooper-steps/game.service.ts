import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { phases } from './phases.data';
import {
  CooperPlayer,
  CooperRoom,
  CooperRole,
  CompetitionPlayer,
  CompetitionRoom,
  NocPlayer,
  NocRoleKey,
  NocRoom,
  PhaseRecord,
  SessionLayerStat,
} from './game.types';

interface SessionRecord {
  id: string;
  playerName?: string;
  startedAt: number;
  xp: number;
  correctAttempts: number;
  wrongAttempts: number;
  layerStats: Record<number, SessionLayerStat>;
}

interface NocScenarioBase {
  id: string;
  title: string;
  problem: string;
  role: NocRoleKey;
  analystLogs: string[];
  operatorActions: string[];
  eventPool: string[];
}

type NocScenario =
  | (NocScenarioBase & { kind: 'single'; correctAction: string })
  | (NocScenarioBase & { kind: 'sequence'; correctSequence: string[] });

interface CooperMissionStep {
  id: string;
  title: string;
  operatorLogs: string[];
  manualSections: string[];
}

interface CooperMission {
  id: string;
  title: string;
  problem: string;
  affectedLayer: string;
  eventPool: string[];
  steps: CooperMissionStep[];
}

const starsFromAttempts = (attempts: number) => {
  if (attempts <= 1) return 3;
  if (attempts <= 3) return 2;
  return 1;
};

const buildEmptyLayerStats = () =>
  phases.reduce<Record<number, SessionLayerStat>>((acc, phase) => {
    acc[phase.layer] = {
      attempts: 0,
      solved: false,
      wrongAttempts: 0,
      stars: 0,
      xp: 0,
    };
    return acc;
  }, {});

const nocRoleGroups: NocRoleKey[][] = [
  ['fisico', 'enlace'],
  ['rede', 'transporte'],
  ['sessao', 'apresentacao', 'aplicacao'],
];

const nocAllRoles: NocRoleKey[] = nocRoleGroups.flat();

const nocScenarios: NocScenario[] = [
  {
    id: 'cable-offline',
    title: 'Missao 1 - Cabo desconectado',
    problem: 'Backbone sem conectividade entre Router e Server.',
    role: 'fisico',
    analystLogs: [
      'Link entre Router e Server aparece down',
      'Switch reporta perda de sinal no uplink',
      'Pacotes nao alcancam o servidor',
    ],
    operatorActions: ['CABO_OK'],
    kind: 'single',
    correctAction: 'CABO_OK',
    eventPool: ['Signal low', 'Porta fisica down', 'Erro de transmissao detectado'],
  },
  {
    id: 'route-fail',
    title: 'Missao 2 - Rota incorreta',
    problem: 'No route to host para o servidor principal.',
    role: 'rede',
    analystLogs: [
      'Traceroute para em R2',
      'Tabela aponta rota antiga para R4',
      'TTL expira antes do destino',
    ],
    operatorActions: ['ROTA_OK'],
    kind: 'single',
    correctAction: 'ROTA_OK',
    eventPool: ['TTL expirando', 'Rota oscilando', 'Congestionamento no backbone'],
  },
  {
    id: 'dns-down',
    title: 'Missao 3 - DNS fora do ar',
    problem: 'Usuarios acessam por IP, mas dominio nao resolve.',
    role: 'aplicacao',
    analystLogs: [
      'DNS lookup failed',
      'HTTP 200 ao acessar por IP',
      'Resolver principal sem resposta',
    ],
    operatorActions: ['DNS_OK'],
    kind: 'single',
    correctAction: 'DNS_OK',
    eventPool: ['DNS server down', 'Timeout no resolver', 'Falha de lookup'],
  },
  {
    id: 'handshake-fail',
    title: 'Missao 4 - Handshake TCP falhando',
    problem: 'Conexao nao estabelece no servico interno.',
    role: 'transporte',
    analystLogs: [
      'Manual: iniciar com SYN',
      'Depois aguardar SYN-ACK',
      'Finalizar com ACK',
    ],
    operatorActions: ['SYN', 'ACK', 'SYN-ACK'],
    kind: 'sequence',
    correctSequence: ['SYN', 'SYN-ACK', 'ACK'],
    eventPool: ['Conexao resetada', 'Pacote fora de ordem', 'SYN flood suspeito'],
  },
  {
    id: 'data-corrupted',
    title: 'Missao 5 - Dados corrompidos',
    problem: 'Payload chega codificado e ilegivel na aplicacao.',
    role: 'apresentacao',
    analystLogs: [
      'Mensagem recebida: cmVkZSByZXN0YXVyYWRh',
      'Codificacao esperada: Base64',
      'Sistema nao interpreta payload atual',
    ],
    operatorActions: ['DECODE_OK'],
    kind: 'single',
    correctAction: 'DECODE_OK',
    eventPool: ['Payload corrompido', 'Erro de codificacao', 'Falha de decodificacao'],
  },
  {
    id: 'final-incident',
    title: 'Missao Final - Incidente completo',
    problem: 'Sistema interno indisponivel para toda empresa.',
    role: 'rede',
    analystLogs: [
      'Aplicacao: HTTP 503',
      'Transporte: Connection timeout',
      'Rede: No route to host',
      'Fisica: Signal OK',
    ],
    operatorActions: ['INCIDENTE_OK'],
    kind: 'single',
    correctAction: 'INCIDENTE_OK',
    eventPool: ['Incidente critico', 'SLA em risco', 'Escalonamento automatico'],
  },
];

const cooperMissionDurationSeconds = 300;

const cooperMissions: CooperMission[] = [
  {
    id: 'inc-01-dns',
    title: 'Incidente 01 - DNS fora do ar',
    problem: 'Funcionarios nao acessam portal.empresa.local.',
    affectedLayer: 'Aplicacao',
    eventPool: ['DNS server down', 'Name resolution timeout', 'Unknown host'],
    steps: [
      {
        id: 'run-ping-portal',
        title: 'Etapa 1 - Diagnosticar',
        operatorLogs: ['DNS lookup failed', 'Server unreachable', 'Comando disponivel: ping portal.empresa.local'],
        manualSections: [
          'Se houver DNS lookup failed ou Unknown host, o problema esta no DNS.',
          'Valide o sintoma executando ping para o dominio.',
        ],
      },
      {
        id: 'restart-dns',
        title: 'Etapa 2 - Corrigir',
        operatorLogs: ['HTTP: ONLINE', 'DNS: OFFLINE', 'Acoes: Restart DNS / Restart HTTP / Reset router'],
        manualSections: ['Se DNS estiver offline, reinicie ou reconfigure o servico DNS.'],
      },
    ],
  },
  {
    id: 'inc-02-cable',
    title: 'Incidente 02 - Cabo desconectado',
    problem: 'Setor financeiro sem acesso ao servidor.',
    affectedLayer: 'Fisica',
    eventPool: ['Signal loss', 'Link down', 'Transmission failure'],
    steps: [
      {
        id: 'inspect-physical',
        title: 'Etapa 1 - Diagnosticar',
        operatorLogs: ['PC->Switch: disconnected', 'Switch->Router: connected', 'Router->Server: connected'],
        manualSections: ['Se aparecer disconnected, a falha e fisica.'],
      },
      {
        id: 'connect-cable',
        title: 'Etapa 2 - Corrigir',
        operatorLogs: ['Acoes: Connect cable / Change port / Replace cable'],
        manualSections: ['Um cabo desconectado impede toda comunicacao.'],
      },
    ],
  },
  {
    id: 'inc-03-tcp',
    title: 'Incidente 03 - Handshake TCP incompleto',
    problem: 'Conexao encerra antes de carregar o sistema.',
    affectedLayer: 'Transporte',
    eventPool: ['TCP reset', 'Session timeout', 'Connection dropped'],
    steps: [
      {
        id: 'inspect-handshake',
        title: 'Etapa 1 - Diagnosticar',
        operatorLogs: ['Pacotes capturados: SYN, SYN-ACK, ???'],
        manualSections: ['Three-way handshake: SYN -> SYN-ACK -> ACK.'],
      },
      {
        id: 'send-ack',
        title: 'Etapa 2 - Corrigir',
        operatorLogs: ['Botoes: ACK / FIN / RST'],
        manualSections: ['Apos SYN-ACK, o cliente deve enviar ACK.'],
      },
    ],
  },
  {
    id: 'inc-04-loop',
    title: 'Incidente 04 - Loop de roteamento',
    problem: 'Sistema lento com TTL expirando.',
    affectedLayer: 'Rede',
    eventPool: ['TTL expired', 'Routing loop detected', 'Route flapping'],
    steps: [
      {
        id: 'run-traceroute',
        title: 'Etapa 1 - Diagnosticar',
        operatorLogs: ['Comando: traceroute server.local', 'Resultado repete Router A/B/C', 'Log: TTL expired'],
        manualSections: ['Repeticao de roteadores no traceroute indica loop de roteamento.'],
      },
      {
        id: 'change-route',
        title: 'Etapa 2 - Corrigir',
        operatorLogs: ['Acoes: Change route / Reset router / Increase TTL'],
        manualSections: ['A solucao e alterar a rota para caminho alternativo.'],
      },
    ],
  },
  {
    id: 'inc-05-ip',
    title: 'Incidente 05 - IP configurado incorretamente',
    problem: 'Novo computador sem acesso a rede.',
    affectedLayer: 'Rede',
    eventPool: ['Network unreachable', 'Wrong gateway', 'Host unreachable'],
    steps: [
      {
        id: 'inspect-ip',
        title: 'Etapa 1 - Diagnosticar',
        operatorLogs: ['IP: 192.168.2.15', 'Mask: 255.255.255.0', 'Gateway: 192.168.1.1', 'Log: Network unreachable'],
        manualSections: ['Gateway deve estar na mesma sub-rede do host.'],
      },
      {
        id: 'set-gateway',
        title: 'Etapa 2 - Corrigir',
        operatorLogs: ['Ajustar gateway para host 192.168.2.x'],
        manualSections: ['Gateway correto: 192.168.2.1'],
      },
    ],
  },
  {
    id: 'inc-06-order',
    title: 'Incidente 06 - Pacotes fora de ordem',
    problem: 'Servidor recebe dados corrompidos na transferencia.',
    affectedLayer: 'Transporte',
    eventPool: ['Packets out of order', 'Retransmission spike', 'Data integrity warning'],
    steps: [
      {
        id: 'inspect-packets',
        title: 'Etapa 1 - Diagnosticar',
        operatorLogs: ['Pacotes recebidos: Packet 3, Packet 1, Packet 2'],
        manualSections: ['TCP usa sequencia para manter ordem correta dos pacotes.'],
      },
      {
        id: 'reorder-packets',
        title: 'Etapa 2 - Corrigir',
        operatorLogs: ['Acao disponivel: Reorder packets'],
        manualSections: ['Ordem correta: Packet 1 -> Packet 2 -> Packet 3'],
      },
    ],
  },
  {
    id: 'inc-07-rot13',
    title: 'Incidente 07 - Mensagem codificada',
    problem: 'Servidor recebe texto incompreensivel.',
    affectedLayer: 'Apresentacao',
    eventPool: ['Encoding mismatch', 'Payload unreadable', 'Decode required'],
    steps: [
      {
        id: 'inspect-message',
        title: 'Etapa 1 - Diagnosticar',
        operatorLogs: ['Mensagem: B freivcb QAF rfgb nhfragr'],
        manualSections: ['ROT13 desloca 13 letras e e comum em desafios de rede.'],
      },
      {
        id: 'apply-rot13',
        title: 'Etapa 2 - Corrigir',
        operatorLogs: ['Acoes: Decode Base64 / Apply ROT13 / Decrypt AES'],
        manualSections: ['A acao correta e Apply ROT13. Resultado esperado: O servico DNS esta ausente'],
      },
    ],
  },
  {
    id: 'inc-08-http',
    title: 'Incidente 08 - Servidor HTTP parado',
    problem: 'Ping funciona, mas site nao abre.',
    affectedLayer: 'Aplicacao',
    eventPool: ['HTTP service down', 'Application unavailable', 'Web timeout'],
    steps: [
      {
        id: 'run-ping-server',
        title: 'Etapa 1 - Diagnosticar',
        operatorLogs: ['ping server.local -> Reply from 10.0.0.5', 'HTTP: OFFLINE', 'DNS: ONLINE'],
        manualSections: ['Se ping responde e site nao abre, verifique HTTP.'],
      },
      {
        id: 'restart-http',
        title: 'Etapa 2 - Corrigir',
        operatorLogs: ['Acoes: Restart HTTP / Restart DNS / Reboot server'],
        manualSections: ['Reiniciar HTTP resolve indisponibilidade do site nesse caso.'],
      },
    ],
  },
  {
    id: 'inc-09-frame',
    title: 'Incidente 09 - Frame Ethernet errado',
    problem: 'Switch descartando pacotes no segmento.',
    affectedLayer: 'Enlace',
    eventPool: ['Frame dropped', 'MAC mismatch', 'Broadcast misuse'],
    steps: [
      {
        id: 'inspect-frame',
        title: 'Etapa 1 - Diagnosticar',
        operatorLogs: [
          'Destination MAC: FF:FF:FF:FF:FF:FF',
          'Source MAC: 00:1A:2B:3C:4D:5E',
          'Destino esperado: 00:AB:45:12:FF:90',
        ],
        manualSections: ['Broadcast envia para todos; use MAC de destino correto para unicast.'],
      },
      {
        id: 'edit-frame',
        title: 'Etapa 2 - Corrigir',
        operatorLogs: ['Acao: Edit frame'],
        manualSections: ['Altere Destination MAC para 00:AB:45:12:FF:90.'],
      },
    ],
  },
  {
    id: 'inc-10-congestion',
    title: 'Incidente 10 - Rede congestionada',
    problem: 'Lentidao extrema e filas altas no roteador.',
    affectedLayer: 'Transporte',
    eventPool: ['Router buffer full', 'Queue overload', 'High latency'],
    steps: [
      {
        id: 'inspect-congestion',
        title: 'Etapa 1 - Diagnosticar',
        operatorLogs: ['Router buffer: FULL', 'Packet queue: HIGH'],
        manualSections: ['Buffer cheio indica congestionamento e perda potencial.'],
      },
      {
        id: 'reduce-traffic',
        title: 'Etapa 2 - Corrigir',
        operatorLogs: ['Acoes: Reduce traffic / Increase buffer / Limit connections'],
        manualSections: ['Reduzir taxa de envio estabiliza a rede no curto prazo.'],
      },
    ],
  },
];

@Injectable()
export class GameService {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly rooms = new Map<string, CompetitionRoom>();
  private readonly nocRooms = new Map<string, NocRoom>();
  private readonly cooperRooms = new Map<string, CooperRoom>();

  getPhases() {
    return phases.map((phase) => this.toPublicPhase(phase));
  }

  getPhase(layer: number) {
    return this.toPublicPhase(this.findPhase(layer));
  }

  validateLayerAnswer(layer: number, answer: unknown) {
    const phase = this.findPhase(layer);
    const correct = this.isAnswerCorrect(phase, answer);
    return {
      layer,
      correct,
      feedback: correct
        ? `Correto. ${phase.explanation}`
        : `Incorreto. ${phase.wrongFeedback}`,
      hint: correct ? undefined : phase.hint,
      explanation: phase.explanation,
    };
  }

  startSession(playerName?: string) {
    const id = randomUUID();
    const session: SessionRecord = {
      id,
      playerName,
      startedAt: Date.now(),
      xp: 0,
      correctAttempts: 0,
      wrongAttempts: 0,
      layerStats: buildEmptyLayerStats(),
    };

    this.sessions.set(id, session);
    return {
      sessionId: id,
      playerName: playerName ?? null,
      startedAt: session.startedAt,
    };
  }

  getSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);
    return this.withSessionStats(session);
  }

  submitLayerAnswer(sessionId: string, layer: number, answer: unknown) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    const phase = this.findPhase(layer);
    const stat = session.layerStats[layer];
    const correct = this.isAnswerCorrect(phase, answer);
    stat.attempts += 1;

    if (!correct) {
      stat.wrongAttempts += 1;
      session.wrongAttempts += 1;
      return {
        sessionId,
        layer,
        correct: false,
        feedback: `Incorreto. ${phase.wrongFeedback}`,
        hint: phase.hint,
        stats: this.withSessionStats(session),
      };
    }

    session.correctAttempts += 1;
    if (!stat.solved) {
      stat.solved = true;
      stat.stars = starsFromAttempts(stat.attempts);
      stat.xp = stat.stars * 100;
      session.xp += stat.xp;
    }

    return {
      sessionId,
      layer,
      correct: true,
      feedback: `Correto. ${phase.explanation}`,
      stars: stat.stars,
      xpEarned: stat.xp,
      stats: this.withSessionStats(session),
    };
  }

  createCompetitionRoom(name: string, hostName: string) {
    const trimmedHost = (hostName || '').trim();
    if (!trimmedHost) {
      throw new BadRequestException('Host name is required.');
    }

    const code = this.generateRoomCode(this.rooms);
    const hostPlayer = this.createPlayer(trimmedHost);

    const room: CompetitionRoom = {
      code,
      name: name || 'Sala OSI',
      status: 'waiting',
      createdAt: Date.now(),
      currentLayer: 1,
      hostPlayerId: hostPlayer.id,
      players: {
        [hostPlayer.id]: hostPlayer,
      },
    };

    this.rooms.set(code, room);
    return {
      room: this.publicRoom(room),
      playerId: hostPlayer.id,
    };
  }

  joinCompetitionRoom(code: string, playerName: string) {
    const room = this.findRoom(code);
    if (room.status !== 'waiting') {
      throw new BadRequestException('Room already started.');
    }

    const trimmedName = (playerName || '').trim();
    if (!trimmedName) {
      throw new BadRequestException('Player name is required.');
    }

    const player = this.createPlayer(trimmedName);
    room.players[player.id] = player;

    return {
      room: this.publicRoom(room),
      playerId: player.id,
    };
  }

  listCompetitionRooms() {
    return [...this.rooms.values()].map((room) => this.publicRoom(room));
  }

  getCompetitionRoom(code: string) {
    return this.publicRoom(this.findRoom(code));
  }

  getCompetitionQuestion(code: string) {
    const room = this.findRoom(code);
    const phase = this.findPhase(room.currentLayer);
    return {
      roomCode: room.code,
      status: room.status,
      currentLayer: room.currentLayer,
      question: this.toPublicPhase(phase),
    };
  }

  startCompetitionRoom(code: string, playerId: string) {
    const room = this.findRoom(code);
    if (room.hostPlayerId !== playerId) {
      throw new BadRequestException('Only host can start the room.');
    }
    if (Object.keys(room.players).length < 1) {
      throw new BadRequestException('At least one player is required.');
    }

    room.status = 'running';
    room.startedAt = Date.now();
    room.currentLayer = 1;
    Object.values(room.players).forEach((player) => {
      player.startedAt = room.startedAt;
      player.finishedAt = undefined;
    });
    return this.publicRoom(room);
  }

  submitPlayerAnswer(
    roomCode: string,
    playerId: string,
    layer: number,
    answer: unknown,
  ) {
    const room = this.findRoom(roomCode);
    if (room.status !== 'running') {
      throw new BadRequestException('Match is not running.');
    }

    const player = room.players[playerId];
    if (!player) throw new NotFoundException(`Player ${playerId} not found`);
    const expectedLayer = this.nextLayerForPlayer(player);

    if (expectedLayer > phases.length) {
      return {
        room: this.publicRoom(room),
        result: {
          playerId,
          layer,
          correct: true,
          feedback: 'Voce ja concluiu todas as camadas.',
          stars: 0,
          xpEarned: 0,
        },
      };
    }
    if (layer !== expectedLayer) {
      throw new BadRequestException(`Sua camada atual e ${expectedLayer}.`);
    }

    const phase = this.findPhase(layer);
    const stat = player.stats[layer];

    if (stat.solved) {
      return {
        room: this.publicRoom(room),
        result: {
          playerId,
          layer,
          correct: true,
          feedback: 'Voce ja resolveu esta rodada.',
          stars: stat.stars,
          xpEarned: 0,
        },
      };
    }

    const correct = this.isAnswerCorrect(phase, answer);
    stat.attempts += 1;

    player.answers.push({
      layer,
      answer,
      correct,
      at: Date.now(),
      attempt: stat.attempts,
    });

    if (!correct) {
      stat.wrongAttempts += 1;
      return {
        room: this.publicRoom(room),
        result: {
          playerId,
          layer,
          correct: false,
          feedback: `Incorreto. ${phase.wrongFeedback}`,
          hint: phase.hint,
        },
      };
    }

    stat.solved = true;
    stat.stars = starsFromAttempts(stat.attempts);
    stat.xp = stat.stars * 100;
    player.xp += stat.xp;
    if (this.nextLayerForPlayer(player) > phases.length && !player.finishedAt) {
      player.finishedAt = Date.now();
    }

    this.updateRoomProgress(room);

    return {
      room: this.publicRoom(room),
      result: {
        playerId,
        layer,
        correct: true,
        feedback: `Correto. ${phase.explanation}`,
        stars: stat.stars,
        xpEarned: stat.xp,
      },
    };
  }

  listNocRooms() {
    return [...this.nocRooms.values()].map((room) => this.publicNocRoom(room));
  }

  createNocRoom(name: string, hostName: string) {
    const trimmedHost = (hostName || '').trim();
    if (!trimmedHost) throw new BadRequestException('Host name is required.');
    const code = this.generateRoomCode(this.nocRooms);
    const host = this.createNocPlayer(trimmedHost);
    const room: NocRoom = {
      code,
      name: name || 'NOC Room',
      status: 'waiting',
      createdAt: Date.now(),
      hostPlayerId: host.id,
      playerOrder: [host.id],
      players: { [host.id]: host },
      currentScenarioIndex: 0,
      events: [],
    };
    this.assignNocRoles(room);
    this.nocRooms.set(code, room);
    return { room: this.publicNocRoom(room), playerId: host.id };
  }

  joinNocRoom(code: string, playerName: string) {
    const room = this.findNocRoom(code);
    if (room.status !== 'waiting') {
      throw new BadRequestException('NOC room already started.');
    }
    const trimmed = (playerName || '').trim();
    if (!trimmed) throw new BadRequestException('Player name is required.');
    const player = this.createNocPlayer(trimmed);
    room.players[player.id] = player;
    room.playerOrder.push(player.id);
    this.assignNocRoles(room);
    return { room: this.publicNocRoom(room), playerId: player.id };
  }

  getNocRoom(code: string) {
    return this.publicNocRoom(this.findNocRoom(code));
  }

  startNocRoom(code: string, playerId: string) {
    const room = this.findNocRoom(code);
    if (room.hostPlayerId !== playerId) {
      throw new BadRequestException('Only host can start NOC room.');
    }
    if (room.playerOrder.length < 1) {
      throw new BadRequestException('At least one player is required.');
    }
    room.status = 'running';
    room.currentScenarioIndex = 0;
    room.events = [];
    this.assignNocRoles(room);
    return this.publicNocRoom(room);
  }

  getNocPlayerView(code: string, playerId: string) {
    const room = this.findNocRoom(code);
    const player = room.players[playerId];
    if (!player) throw new NotFoundException(`Player ${playerId} not found`);
    const scenario = nocScenarios[room.currentScenarioIndex] ?? null;
    const analystId = this.getRoundAnalystId(room);
    const operatorId = this.getRoundOperatorId(room, scenario ?? undefined);
    const isAnalyst = analystId === playerId;
    const isOperator = operatorId === playerId;
    const operatorAllowed = Boolean(scenario && operatorId);

    return {
      room: this.publicNocRoom(room),
      view: {
        isAnalyst,
        isOperator,
        analystName: analystId ? room.players[analystId]?.name ?? null : null,
        operatorName: operatorId ? room.players[operatorId]?.name ?? null : null,
        operatorAllowed,
        scenario: scenario
          ? {
              id: scenario.id,
              title: scenario.title,
              problem: scenario.problem,
              role: scenario.role,
              kind: scenario.kind,
              analystLogs: isAnalyst ? scenario.analystLogs : [],
              operatorActions: isOperator ? scenario.operatorActions : [],
            }
          : null,
      },
    };
  }

  submitNocAction(
    code: string,
    playerId: string,
    payload: { selectedAction?: string; sequence?: string[] },
  ) {
    const room = this.findNocRoom(code);
    if (room.status !== 'running') {
      throw new BadRequestException('NOC room is not running.');
    }
    const scenario = nocScenarios[room.currentScenarioIndex];
    if (!scenario) {
      room.status = 'finished';
      return { room: this.publicNocRoom(room), result: { correct: true, feedback: 'Missao finalizada.' } };
    }

    const operatorId = this.getRoundOperatorId(room, scenario);
    const analystId = this.getRoundAnalystId(room);
    if (!operatorId || !analystId) {
      throw new BadRequestException('Invalid player assignment.');
    }
    if (playerId !== operatorId) {
      throw new BadRequestException('Only the current operator can execute action.');
    }

    const operator = room.players[operatorId];
    const analyst = room.players[analystId];
    if (!operator || !analyst) throw new BadRequestException('Invalid round players.');
    if (!operator.roles.includes(scenario.role)) {
      throw new BadRequestException(`Operator lacks required role: ${scenario.role}.`);
    }

    let correct = false;
    if (scenario.kind === 'single') {
      correct = (payload.selectedAction || '').trim() === scenario.correctAction;
    } else {
      const sequence = payload.sequence ?? [];
      correct = JSON.stringify(sequence) === JSON.stringify(scenario.correctSequence);
    }

    if (!correct) {
      operator.wrongActions += 1;
      room.events = [this.pickNocEvent(scenario), ...room.events].slice(0, 5);
      return {
        room: this.publicNocRoom(room),
        result: {
          correct: false,
          feedback:
            'Acao incorreta. Reavaliem logs e coordenem nova execucao.',
        },
      };
    }

    analyst.points += 100;
    if (analyst.id === operator.id) {
      operator.points += 50;
    } else {
      operator.points += 100;
    }
    room.events = [this.pickNocEvent(scenario), ...room.events].slice(0, 5);
    room.currentScenarioIndex += 1;
    if (room.currentScenarioIndex >= nocScenarios.length) {
      room.status = 'finished';
    }

    return {
      room: this.publicNocRoom(room),
      result: {
        correct: true,
        feedback: 'Correto. Diagnostico e execucao alinhados.',
      },
    };
  }

  listCooperRooms() {
    return [...this.cooperRooms.values()].map((room) => this.publicCooperRoom(room));
  }

  createCooperRoom(name: string, hostName: string) {
    const trimmedHost = (hostName || '').trim();
    if (!trimmedHost) throw new BadRequestException('Host name is required.');
    const code = this.generateRoomCode(this.cooperRooms);
    const host = this.createCooperPlayer(trimmedHost);
    const room: CooperRoom = {
      code,
      name: name || 'Cooper Room',
      status: 'waiting',
      createdAt: Date.now(),
      hostPlayerId: host.id,
      playerOrder: [host.id],
      players: { [host.id]: host },
      currentMissionIndex: 0,
      currentStepIndex: 0,
      events: [],
    };
    this.assignCooperRoles(room);
    this.cooperRooms.set(code, room);
    return { room: this.publicCooperRoom(room), playerId: host.id };
  }

  joinCooperRoom(code: string, playerName: string) {
    const room = this.findCooperRoom(code);
    if (room.status !== 'waiting') {
      throw new BadRequestException('Cooper room already started.');
    }
    const trimmed = (playerName || '').trim();
    if (!trimmed) throw new BadRequestException('Player name is required.');
    const player = this.createCooperPlayer(trimmed);
    room.players[player.id] = player;
    room.playerOrder.push(player.id);
    this.assignCooperRoles(room);
    return { room: this.publicCooperRoom(room), playerId: player.id };
  }

  getCooperRoom(code: string) {
    return this.publicCooperRoom(this.findCooperRoom(code));
  }

  startCooperRoom(code: string, playerId: string) {
    const room = this.findCooperRoom(code);
    if (room.hostPlayerId !== playerId) {
      throw new BadRequestException('Only host can start Cooper room.');
    }
    room.status = 'running';
    room.startedAt = Date.now();
    room.currentMissionStartedAt = room.startedAt;
    room.currentMissionIndex = 0;
    room.currentStepIndex = 0;
    room.events = [];
    this.assignCooperRoles(room);
    return this.publicCooperRoom(room);
  }

  getCooperPlayerView(code: string, playerId: string) {
    const room = this.findCooperRoom(code);
    const player = room.players[playerId];
    if (!player) throw new NotFoundException(`Player ${playerId} not found`);
    const mission = cooperMissions[room.currentMissionIndex] ?? null;
    const step = mission?.steps[room.currentStepIndex] ?? null;
    const remainingSeconds = this.getCooperRemainingSeconds(room);
    return {
      room: this.publicCooperRoom(room),
      view: {
        role: player.role,
        mission: mission && step
          ? {
              id: mission.id,
              title: mission.title,
              problem: mission.problem,
              affectedLayer: mission.affectedLayer,
              stepId: step.id,
              stepTitle: step.title,
              currentStepIndex: room.currentStepIndex,
              totalSteps: mission.steps.length,
              operatorLogs: player.role === 'operator' ? step.operatorLogs : [],
              manualSections: player.role === 'analyst' ? step.manualSections : [],
            }
          : null,
        remainingSeconds,
      },
    };
  }

  submitCooperAction(
    code: string,
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
  ) {
    const room = this.findCooperRoom(code);
    if (room.status !== 'running') {
      throw new BadRequestException('Cooper room is not running.');
    }
    const player = room.players[playerId];
    if (!player) throw new NotFoundException(`Player ${playerId} not found`);
    if (player.role !== 'operator') {
      throw new BadRequestException('Only operators can execute actions.');
    }

    const mission = cooperMissions[room.currentMissionIndex];
    if (!mission) {
      room.status = 'finished';
      return { room: this.publicCooperRoom(room), result: { correct: true, feedback: 'Missao finalizada.' } };
    }

    if (this.getCooperRemainingSeconds(room) <= 0) {
      room.status = 'finished';
      room.events = ['Tempo esgotado. Missao encerrada.', ...room.events].slice(0, 6);
      return {
        room: this.publicCooperRoom(room),
        result: { correct: false, feedback: 'Tempo esgotado para a missao atual.' },
      };
    }

    const currentStep = mission.steps[room.currentStepIndex];
    const correct = this.validateCooperAction(mission.id, currentStep?.id || '', payload);
    if (!correct) {
      player.wrongActions += 1;
      room.events = [this.pickCooperEvent(mission), ...room.events].slice(0, 6);
      return {
        room: this.publicCooperRoom(room),
        result: { correct: false, feedback: 'Acao incorreta. Consulte o analista e tente novamente.' },
      };
    }

    const analysts = room.playerOrder.map((id) => room.players[id]).filter((p) => p?.role === 'analyst');
    player.points += 120;
    analysts.forEach((analyst) => {
      analyst.points += 80;
    });
    room.events = [this.pickCooperEvent(mission), ...room.events].slice(0, 6);
    if (room.currentStepIndex < mission.steps.length - 1) {
      room.currentStepIndex += 1;
    } else {
      room.currentMissionIndex += 1;
      room.currentStepIndex = 0;
      room.currentMissionStartedAt = Date.now();
      if (room.currentMissionIndex >= cooperMissions.length) {
        room.status = 'finished';
      }
    }

    return {
      room: this.publicCooperRoom(room),
      result: {
        correct: true,
        feedback:
          room.status === 'finished'
            ? 'Incidente resolvido. Missao concluida.'
            : room.currentStepIndex === 0
              ? 'Incidente resolvido. Missao avancou.'
              : 'Etapa concluida. Continue para a proxima etapa.',
      },
    };
  }

  private updateRoomProgress(room: CompetitionRoom) {
    const players = Object.values(room.players);
    if (!players.length) return;
    const allPlayersFinished = players.every(
      (player) => this.nextLayerForPlayer(player) > phases.length,
    );
    if (allPlayersFinished) {
      room.status = 'finished';
      return;
    }
    room.currentLayer = players.reduce((max, player) => {
      const playerLayer = Math.min(this.nextLayerForPlayer(player), phases.length);
      return Math.max(max, playerLayer);
    }, 1);
  }

  private createPlayer(name: string): CompetitionPlayer {
    return {
      id: randomUUID(),
      name,
      xp: 0,
      stats: buildEmptyLayerStats(),
      answers: [],
    };
  }

  private createNocPlayer(name: string): NocPlayer {
    return {
      id: randomUUID(),
      name,
      roles: [],
      points: 0,
      wrongActions: 0,
    };
  }

  private createCooperPlayer(name: string): CooperPlayer {
    return {
      id: randomUUID(),
      name,
      role: 'analyst',
      points: 0,
      wrongActions: 0,
    };
  }

  private assignNocRoles(room: NocRoom) {
    const ids = room.playerOrder;
    const rolesById: Record<string, NocRoleKey[]> = {};
    ids.forEach((id) => {
      rolesById[id] = [];
    });
    if (!ids.length) return;

    if (ids.length === 1) {
      rolesById[ids[0]] = [...nocAllRoles];
    } else if (ids.length === 2) {
      rolesById[ids[0]] = ['fisico', 'enlace', 'rede'];
      rolesById[ids[1]] = ['transporte', 'sessao', 'apresentacao', 'aplicacao'];
    } else if (ids.length === 3) {
      rolesById[ids[0]] = ['fisico', 'enlace'];
      rolesById[ids[1]] = ['rede', 'transporte'];
      rolesById[ids[2]] = ['sessao', 'apresentacao', 'aplicacao'];
    } else if (ids.length === 4) {
      rolesById[ids[0]] = ['fisico'];
      rolesById[ids[1]] = ['enlace'];
      rolesById[ids[2]] = ['rede'];
      rolesById[ids[3]] = ['transporte', 'sessao', 'apresentacao', 'aplicacao'];
    } else if (ids.length === 5) {
      rolesById[ids[0]] = ['fisico'];
      rolesById[ids[1]] = ['enlace'];
      rolesById[ids[2]] = ['rede'];
      rolesById[ids[3]] = ['transporte'];
      rolesById[ids[4]] = ['sessao', 'apresentacao', 'aplicacao'];
    } else if (ids.length === 6) {
      rolesById[ids[0]] = ['fisico'];
      rolesById[ids[1]] = ['enlace'];
      rolesById[ids[2]] = ['rede'];
      rolesById[ids[3]] = ['transporte'];
      rolesById[ids[4]] = ['sessao'];
      rolesById[ids[5]] = ['apresentacao', 'aplicacao'];
    } else {
      rolesById[ids[0]] = ['fisico'];
      rolesById[ids[1]] = ['enlace'];
      rolesById[ids[2]] = ['rede'];
      rolesById[ids[3]] = ['transporte'];
      rolesById[ids[4]] = ['sessao'];
      rolesById[ids[5]] = ['apresentacao'];
      rolesById[ids[6]] = ['aplicacao'];
      ids.slice(7).forEach((id, idx) => {
        rolesById[id] = [nocAllRoles[idx % nocAllRoles.length]];
      });
    }

    ids.forEach((id) => {
      room.players[id].roles = rolesById[id];
    });
  }

  private assignCooperRoles(room: CooperRoom) {
    const ids = room.playerOrder;
    const size = ids.length;
    if (!size) return;
    let operatorCount = 1;
    if (size === 2) operatorCount = 1;
    else if (size === 3) operatorCount = 1;
    else if (size <= 5) operatorCount = 2;
    else operatorCount = 3;

    ids.forEach((id, index) => {
      room.players[id].role = index < operatorCount ? 'operator' : 'analyst';
    });
  }

  private getRoundAnalystId(room: NocRoom) {
    if (!room.playerOrder.length) return null;
    return room.playerOrder[room.currentScenarioIndex % room.playerOrder.length];
  }

  private findCooperRoom(code: string) {
    const room = this.cooperRooms.get(code.toUpperCase());
    if (!room) throw new NotFoundException(`Cooper room ${code} not found`);
    return room;
  }

  private getCooperRemainingSeconds(room: CooperRoom) {
    if (!room.currentMissionStartedAt) return cooperMissionDurationSeconds;
    const elapsed = Math.floor((Date.now() - room.currentMissionStartedAt) / 1000);
    return Math.max(0, cooperMissionDurationSeconds - elapsed);
  }

  private validateCooperAction(
    missionId: string,
    stepId: string,
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
  ) {
    if (stepId === 'run-ping-portal') {
      return payload.type === 'run-command' && payload.routePath === 'ping portal.empresa.local';
    }
    if (stepId === 'restart-dns') {
      return payload.type === 'service-action' && payload.routePath === 'Restart DNS';
    }
    if (stepId === 'inspect-physical') {
      return payload.type === 'inspect';
    }
    if (stepId === 'connect-cable') {
      return payload.type === 'service-action' && payload.routePath === 'Connect cable';
    }
    if (stepId === 'inspect-handshake') {
      return payload.type === 'inspect';
    }
    if (stepId === 'send-ack') {
      return payload.type === 'service-action' && payload.routePath === 'ACK';
    }
    if (stepId === 'run-traceroute') {
      return payload.type === 'run-command' && payload.routePath === 'traceroute server.local';
    }
    if (stepId === 'change-route') {
      return payload.type === 'service-action' && payload.routePath === 'Change route';
    }
    if (stepId === 'inspect-ip') {
      return payload.type === 'inspect';
    }
    if (stepId === 'set-gateway') {
      return payload.type === 'gateway-set' && payload.gateway === '192.168.2.1';
    }
    if (stepId === 'inspect-packets') {
      return payload.type === 'inspect';
    }
    if (stepId === 'reorder-packets') {
      return payload.type === 'tcp-sequence' && JSON.stringify(payload.sequence || []) === JSON.stringify(['Packet 1', 'Packet 2', 'Packet 3']);
    }
    if (stepId === 'inspect-message') {
      return payload.type === 'inspect';
    }
    if (stepId === 'apply-rot13') {
      return payload.type === 'service-action' && payload.routePath === 'Apply ROT13';
    }
    if (stepId === 'run-ping-server') {
      return payload.type === 'run-command' && payload.routePath === 'ping server.local';
    }
    if (stepId === 'restart-http') {
      return payload.type === 'service-action' && payload.routePath === 'Restart HTTP';
    }
    if (stepId === 'inspect-frame') {
      return payload.type === 'inspect';
    }
    if (stepId === 'edit-frame') {
      return payload.type === 'frame-edit' && payload.routePath === '00:AB:45:12:FF:90';
    }
    if (stepId === 'inspect-congestion') {
      return payload.type === 'inspect';
    }
    if (stepId === 'reduce-traffic') {
      return payload.type === 'service-action' && payload.routePath === 'Reduce traffic';
    }

    if (missionId === 'cooper-cable') {
      const required = ['PC-SWITCH', 'SWITCH-ROUTER', 'ROUTER-SERVER'];
      const links = (payload.cables || []).map((x) => x.toUpperCase());
      return required.every((r) => links.includes(r)) && (payload.cableType || '').toLowerCase() === 'fibra';
    }
    if (missionId === 'cooper-routing') {
      return payload.routePath === 'R1->R3->R4' && payload.gateway === '10.0.0.1' && payload.ttl === '64';
    }
    if (missionId === 'cooper-dns') {
      return payload.type === 'dns-config' && payload.dnsServer === '10.10.0.53';
    }
    if (missionId === 'cooper-tcp') {
      return JSON.stringify(payload.sequence || []) === JSON.stringify(['SYN', 'SYN-ACK', 'ACK']);
    }
    if (missionId === 'cooper-data') {
      return (payload.decodedText || '').trim().toLowerCase() === 'rede restaurada';
    }
    return false;
  }

  private pickCooperEvent(mission: CooperMission) {
    const pool = mission.eventPool;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private getRoundOperatorId(room: NocRoom, scenario?: NocScenario) {
    if (!room.playerOrder.length) return null;
    if (!scenario) {
      return room.playerOrder[(room.currentScenarioIndex + 1) % room.playerOrder.length];
    }
    const analystId = this.getRoundAnalystId(room);
    const candidate = room.playerOrder.find((id) => {
      if (id === analystId && room.playerOrder.length > 1) return false;
      return room.players[id]?.roles.includes(scenario.role);
    });
    if (candidate) return candidate;
    const fallbackWithRole = room.playerOrder.find((id) =>
      room.players[id]?.roles.includes(scenario.role),
    );
    if (fallbackWithRole) return fallbackWithRole;
    return room.playerOrder[(room.currentScenarioIndex + 1) % room.playerOrder.length];
  }

  private pickNocEvent(scenario: NocScenario) {
    const pool = scenario.eventPool;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private publicNocRoom(room: NocRoom) {
    const ranking = room.playerOrder
      .map((id) => room.players[id])
      .filter(Boolean)
      .map((player) => ({
        playerId: player.id,
        playerName: player.name,
        roles: player.roles,
        points: player.points,
        wrongActions: player.wrongActions,
      }))
      .sort((a, b) => b.points - a.points || a.wrongActions - b.wrongActions);

    return {
      code: room.code,
      name: room.name,
      status: room.status,
      createdAt: room.createdAt,
      hostPlayerId: room.hostPlayerId,
      currentScenarioIndex: room.currentScenarioIndex,
      totalScenarios: nocScenarios.length,
      players: room.playerOrder.map((id) => ({
        id,
        name: room.players[id].name,
        roles: room.players[id].roles,
        points: room.players[id].points,
      })),
      events: room.events,
      ranking,
    };
  }

  private publicCooperRoom(room: CooperRoom) {
    const ranking = room.playerOrder
      .map((id) => room.players[id])
      .filter(Boolean)
      .map((player) => ({
        playerId: player.id,
        playerName: player.name,
        role: player.role,
        points: player.points,
        wrongActions: player.wrongActions,
      }))
      .sort((a, b) => b.points - a.points || a.wrongActions - b.wrongActions);

    return {
      code: room.code,
      name: room.name,
      status: room.status,
      createdAt: room.createdAt,
      hostPlayerId: room.hostPlayerId,
      currentMissionIndex: room.currentMissionIndex,
      currentStepIndex: room.currentStepIndex,
      totalMissions: cooperMissions.length,
      missionDurationSeconds: cooperMissionDurationSeconds,
      remainingSeconds: this.getCooperRemainingSeconds(room),
      players: room.playerOrder.map((id) => ({
        id,
        name: room.players[id].name,
        role: room.players[id].role,
        points: room.players[id].points,
      })),
      events: room.events,
      ranking,
    };
  }

  private nextLayerForPlayer(player: CompetitionPlayer) {
    const solvedLayers = Object.values(player.stats).filter((s) => s.solved).length;
    return solvedLayers + 1;
  }

  private toPublicPhase(phase: PhaseRecord) {
    const { correctAnswer, ...publicPhase } = phase;
    return publicPhase;
  }

  private withSessionStats(session: SessionRecord) {
    const totalAttempts = session.correctAttempts + session.wrongAttempts;
    const accuracy = totalAttempts
      ? Math.round((session.correctAttempts / totalAttempts) * 100)
      : 0;
    return { ...session, totalAttempts, accuracy };
  }

  private publicRoom(room: CompetitionRoom) {
    const now = Date.now();
    const scoreboard = Object.values(room.players)
      .map((player) => ({
        playerId: player.id,
        playerName: player.name,
        xp: player.xp,
        solvedLayers: Object.values(player.stats).filter((s) => s.solved).length,
        wrongAttempts: Object.values(player.stats).reduce(
          (acc, s) => acc + s.wrongAttempts,
          0,
        ),
        elapsedSeconds: player.startedAt
          ? Math.max(
              0,
              Math.floor(((player.finishedAt ?? now) - player.startedAt) / 1000),
            )
          : 0,
        finishedAt: player.finishedAt ?? null,
      }))
      .sort((a, b) => {
        if (b.solvedLayers !== a.solvedLayers) return b.solvedLayers - a.solvedLayers;
        if (b.xp !== a.xp) return b.xp - a.xp;
        if (a.finishedAt && b.finishedAt && a.elapsedSeconds !== b.elapsedSeconds) {
          return a.elapsedSeconds - b.elapsedSeconds;
        }
        return a.wrongAttempts - b.wrongAttempts;
      });

    const players = Object.values(room.players).map((player) => ({
      id: player.id,
      name: player.name,
      xp: player.xp,
      solvedLayers: Object.values(player.stats).filter((s) => s.solved).length,
      wrongAttempts: Object.values(player.stats).reduce(
        (acc, s) => acc + s.wrongAttempts,
        0,
      ),
      elapsedSeconds: player.startedAt
        ? Math.max(
            0,
            Math.floor(((player.finishedAt ?? now) - player.startedAt) / 1000),
          )
        : 0,
      finishedAt: player.finishedAt ?? null,
    }));

    const host = room.players[room.hostPlayerId];

    return {
      code: room.code,
      name: room.name,
      hostPlayerId: room.hostPlayerId,
      hostName: host?.name ?? null,
      status: room.status,
      createdAt: room.createdAt,
      startedAt: room.startedAt ?? null,
      currentLayer: room.currentLayer,
      playerCount: players.length,
      players,
      scoreboard,
    };
  }

  private findPhase(layer: number) {
    const phase = phases.find((item) => item.layer === layer);
    if (!phase) throw new NotFoundException(`Layer ${layer} not found`);
    return phase;
  }

  private findRoom(code: string) {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) throw new NotFoundException(`Room ${code} not found`);
    return room;
  }

  private findNocRoom(code: string) {
    const room = this.nocRooms.get(code.toUpperCase());
    if (!room) throw new NotFoundException(`NOC room ${code} not found`);
    return room;
  }

  private generateRoomCode(collection: Map<string, unknown>) {
    let code = '';
    do {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
    } while (collection.has(code));
    return code;
  }

  private isAnswerCorrect(phase: PhaseRecord, answer: unknown) {
    const user = this.normalize(answer);
    const expected = this.normalize(phase.correctAnswer);
    return JSON.stringify(user) === JSON.stringify(expected);
  }

  private normalize(value: unknown): unknown {
    if (typeof value === 'string')
      return value.trim().toLowerCase().replace(/\s+/g, ' ');
    if (Array.isArray(value)) return value.map((item) => this.normalize(item));
    return value;
  }
}
