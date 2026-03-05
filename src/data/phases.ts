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
  correctAnswer: string | number | string[];
  hint: string;
  explanation: string;
  wrongFeedback: string;
  networkMessage: string;
  dynamicFlow?: string[];
  referenceImage?: string;
  referenceImageAlt?: string;
}

export const phases: Phase[] = [
  {
    layer: 1,
    name: "Fisica",
    icon: "PHY",
    badgeColor: "#888888",
    protocols: "RS-232, Ethernet fisico, DSL, Bluetooth, Fibra Optica",
    narrative:
      "Cabos e sinais estao silenciosos. Nenhum bit atravessa o meio fisico da rede.",
    enigmaType: "text",
    enigmaDisplay: ". --- -",
    instruction: "Decifre o codigo Morse para descobrir o que foi perdido:",
    correctAnswer: "sot",
    hint: "Ponto = curto, traco = longo. S = ... , O = --- , T = -",
    explanation:
      "A camada Fisica transmite bits no meio fisico e define sinal, conector e taxa de transmissao.",
    wrongFeedback: "Sem meio fisico correto, nenhum pacote sai do host.",
    networkMessage: "Sinais fracos e atenuacao no enlace de longa distancia.",
    dynamicFlow: ["Bit 1", "Bit 0", "Clock", "Sincronismo"],
    referenceImage: "/images/morse.png",
    referenceImageAlt: "Tabela de codigo Morse",
  },
  {
    layer: 2,
    name: "Enlace",
    icon: "L2",
    badgeColor: "#E17055",
    protocols: "Ethernet, Wi-Fi 802.11, MAC, PPP, HDLC",
    narrative:
      "Os sinais voltaram, mas os frames estao indo para o destino errado na rede local.",
    enigmaType: "multiple-choice",
    instruction: "Qual campo esta incorreto para comunicacao unicast nesse frame?",
    options: ["A) MAC Origem", "B) MAC Destino", "C) Tipo", "D) Payload"],
    correctAnswer: 1,
    hint: "FF:FF:FF:FF:FF:FF indica broadcast para todos.",
    explanation:
      "A camada de Enlace organiza os bits em frames e usa MAC para entrega local entre dispositivos.",
    wrongFeedback: "Broadcast em unicast causa entrega indevida e ruido na LAN.",
    networkMessage: "Frame recebido, mas tabela MAC aponta destino incorreto.",
  },
  {
    layer: 3,
    name: "Rede",
    icon: "L3",
    badgeColor: "#FDCB6E",
    protocols: "IPv4, IPv6, ICMP, OSPF, BGP",
    narrative:
      "Pacotes saem da LAN, mas somem antes do servidor. O roteamento esta instavel.",
    enigmaType: "text",
    instruction: "TTL saiu com 5 e chegou com 2. Quantos roteadores atravessou?",
    correctAnswer: "3",
    hint: "Cada roteador decrementa o TTL em 1.",
    explanation:
      "A camada de Rede faz roteamento IP entre redes e evita loops com TTL.",
    wrongFeedback: "TTL incorreto mascara onde o pacote esta expirando na rota.",
    networkMessage: "Rota convergindo: pacote passou por multiplos hops.",
  },
  {
    layer: 4,
    name: "Transporte",
    icon: "L4",
    badgeColor: "#6C63FF",
    protocols: "TCP, UDP",
    narrative:
      "Conexao cai no meio da transmissao. Segmentos chegam fora de ordem e sem sincronismo.",
    enigmaType: "drag-order",
    instruction: "Arraste o TCP Three-Way Handshake na ordem correta:",
    correctAnswer: ["SYN", "SYN-ACK", "ACK"],
    hint: "Cliente inicia com SYN.",
    explanation:
      "O TCP confirma conexao com SYN -> SYN-ACK -> ACK antes de trafegar dados.",
    wrongFeedback: "Sem handshake correto, nao ha confiabilidade nem controle de sessao TCP.",
    networkMessage: "Dados chegaram fora de ordem. Reconstrucao de sequencia em andamento.",
    dynamicFlow: ["Cliente -> SYN", "Servidor -> SYN-ACK", "Cliente -> ACK"],
  },
  {
    layer: 5,
    name: "Sessao",
    icon: "L5",
    badgeColor: "#00B894",
    protocols: "NetBIOS, RPC, SIP, PPTP",
    narrative:
      "Conexoes TCP estao ativas, mas dialogos aplicacionais encerram abruptamente.",
    enigmaType: "multiple-choice",
    instruction: "Qual e a funcao principal da camada de Sessao?",
    options: [
      "A) Converter formato dos dados",
      "B) Gerenciar abertura, manutencao e encerramento de sessoes",
      "C) Garantir entrega de pacotes IP",
      "D) Definir endereco logico",
    ],
    correctAnswer: 1,
    hint: "Pense em abrir, manter e fechar uma conversa entre processos.",
    explanation:
      "A camada de Sessao controla dialogos entre aplicacoes e sincroniza retomadas.",
    wrongFeedback: "Sem controle de sessao, conexoes podem cair sem recuperacao do contexto.",
    networkMessage: "Checkpoint de sessao ausente. Reautenticacao exigida.",
  },
  {
    layer: 6,
    name: "Apresentacao",
    icon: "L6",
    badgeColor: "#E84393",
    protocols: "TLS, JPEG, MPEG, ASCII, UTF-8, MIME",
    narrative:
      "Os dados chegam, mas com caracteres ilegiveis. A codificacao esta inconsistente.",
    enigmaType: "text",
    enigmaDisplay: "UmVkZXMgZSBDb21wdXRhZG9yZXM=",
    instruction: "Decodifique a string Base64:",
    correctAnswer: "redes e computadores",
    hint: "Base64 converte binario para representacao textual.",
    explanation:
      "A camada de Apresentacao converte formato, cifra e comprime para interoperabilidade.",
    wrongFeedback: "Codificacao incorreta gera dados ilegiveis na aplicacao.",
    networkMessage: "Payload decodificado e normalizado para UTF-8.",
    referenceImage: "/images/base64.png",
    referenceImageAlt: "Tabela de referencia Base64",
  },
  {
    layer: 7,
    name: "Aplicacao",
    icon: "APP",
    badgeColor: "#FF6B35",
    protocols: "HTTP, HTTPS, FTP, SMTP, DNS, IMAP, SSH",
    narrative:
      "Ultima falha detectada: URLs nao resolvem e servicos aparentam estar fora do ar.",
    enigmaType: "text",
    enigmaDisplay: "B freivcb QAF rfgb nhfragr",
    instruction: "Decodifique em ROT13 para descobrir o servico ausente:",
    correctAnswer: "o servico dns esta ausente",
    hint: "ROT13 troca letras com deslocamento de 13 posicoes.",
    explanation:
      "A camada de Aplicacao expõe servicos ao usuario. Sem DNS, nomes nao viram IP.",
    wrongFeedback: "Sem DNS, o usuario ve falha de acesso mesmo com rede fisica ativa.",
    networkMessage: "Consulta DNS falhou: NXDOMAIN para host critico.",
    referenceImage: "/images/ROT13.png",
    referenceImageAlt: "Tabela de referencia ROT13",
  },
];
