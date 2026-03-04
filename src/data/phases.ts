export interface Phase {
  layer: number;
  name: string;
  icon: string;
  badgeColor: string;
  protocols: string;
  narrative: string;
  enigmaType: 'text' | 'multiple-choice' | 'drag-order';
  enigmaDisplay?: string;
  instruction: string;
  options?: string[];
  correctAnswer: string | number | string[];
  hint: string;
  explanation: string;
}

export const phases: Phase[] = [
  {
    layer: 1,
    name: "Física",
    icon: "🔌",
    badgeColor: "#888888",
    protocols: "RS-232, 100BASE-T, DSL, Bluetooth, Fibra Óptica",
    narrative: "Os sinais físicos estão completamente silenciosos. Nenhum bit atravessa o meio. Uma mensagem foi deixada codificada em Morse pelo último técnico.",
    enigmaType: 'text',
    enigmaDisplay: ". --- -",
    instruction: "Decifre o código Morse abaixo para descobrir o que foi perdido:",
    correctAnswer: "sot",
    hint: "Ponto = dit (som curto), Traço = dah (som longo). S = •••, O = −−−, T = −",
    explanation: "A Camada Física é responsável pela transmissão de bits brutos pelo meio físico — cabos de cobre, fibra óptica, ondas de rádio. Ela define voltagem, frequência, conectores e taxas de transmissão. Sem ela, nenhuma comunicação é possível."
  },
  {
    layer: 2,
    name: "Enlace de Dados",
    icon: "🔗",
    badgeColor: "#E17055",
    protocols: "Ethernet, Wi-Fi 802.11, MAC, PPP, HDLC",
    narrative: "O sinal físico foi restaurado, mas os frames estão sendo entregues para o endereço errado. Algo no endereçamento MAC está incorreto.",
    enigmaType: 'multiple-choice',
    instruction: "Analise o frame Ethernet abaixo. Qual campo está incorreto para uma comunicação unicast?",
    options: ["A) MAC Origem", "B) MAC Destino", "C) Tipo do protocolo", "D) Dados do payload"],
    correctAnswer: 1,
    hint: "FF:FF:FF:FF:FF:FF é um endereço especial. O que ele significa em redes?",
    explanation: "A Camada de Enlace organiza bits em frames e controla o acesso ao meio. O endereço MAC identifica unicamente cada dispositivo na rede local. FF:FF:FF:FF:FF:FF é o endereço de broadcast — enviado a todos. Para comunicação direta entre dois dispositivos, é necessário o MAC específico do destino."
  },
  {
    layer: 3,
    name: "Rede",
    icon: "🗺️",
    badgeColor: "#FDCB6E",
    protocols: "IPv4, IPv6, ICMP, ARP, OSPF, BGP, RIP",
    narrative: "Os frames chegam à rede local, mas os pacotes somem antes de alcançar o servidor. O roteador principal está descartando tudo silenciosamente.",
    enigmaType: 'text',
    instruction: "Um pacote foi enviado com TTL = 5. Ao chegar ao destino, o TTL era 2. Quantos roteadores intermediários ele atravessou?",
    correctAnswer: "3",
    hint: "Cada roteador reduz o TTL em 1. Se saiu com 5 e chegou com 2... quantas reduções ocorreram?",
    explanation: "A Camada de Rede é responsável pelo endereçamento lógico (IP) e roteamento entre redes diferentes. O TTL (Time To Live) evita que pacotes circulem infinitamente — cada roteador decrementa 1. Se chegar a 0, o pacote é descartado e um ICMP Time Exceeded é enviado."
  },
  {
    layer: 4,
    name: "Transporte",
    icon: "🚚",
    badgeColor: "#6C63FF",
    protocols: "TCP, UDP",
    narrative: "O roteamento foi restaurado! Mas as conexões caem no meio da transmissão. Dados chegam fragmentados e fora de ordem. O handshake está sendo feito incorretamente.",
    enigmaType: 'drag-order',
    instruction: "Arraste as etapas do TCP Three-Way Handshake na ordem correta:",
    correctAnswer: ["SYN", "SYN-ACK", "ACK"],
    hint: "Quem inicia a conexão? O cliente envia o primeiro passo.",
    explanation: "O Three-Way Handshake do TCP garante que ambos os lados estejam prontos antes de transmitir dados: (1) Cliente envia SYN sinalizando intenção de conectar, (2) Servidor responde SYN-ACK confirmando e sincronizando, (3) Cliente confirma com ACK. Só então os dados trafegam."
  },
  {
    layer: 5,
    name: "Sessão",
    icon: "🤝",
    badgeColor: "#00B894",
    protocols: "NetBIOS, RPC, SIP, PPTP",
    narrative: "Conexões TCP funcionando! Porém as sessões entre cliente e servidor se encerram abruptamente sem aviso. O gerenciamento de sessão está comprometido.",
    enigmaType: 'multiple-choice',
    instruction: "Qual é a função PRINCIPAL da Camada de Sessão no modelo OSI?",
    options: [
      "A) Converter dados para o formato correto",
      "B) Gerenciar o estabelecimento, manutenção e encerramento de sessões de comunicação",
      "C) Garantir entrega confiável de pacotes",
      "D) Definir o endereço lógico dos dispositivos"
    ],
    correctAnswer: 1,
    hint: "Pense em uma ligação telefônica: alguém precisa 'abrir a linha', manter ativa e 'desligar' ao final.",
    explanation: "A Camada de Sessão controla o diálogo entre aplicações: estabelece a sessão (abre a comunicação), mantém (sincroniza e controla o fluxo de dados) e encerra (fecha ordenadamente). Ela permite retomar sessões interrompidas sem perda de dados."
  },
  {
    layer: 6,
    name: "Apresentação",
    icon: "🎨",
    badgeColor: "#E84393",
    protocols: "SSL/TLS, JPEG, MPEG, ASCII, UTF-8, MIME",
    narrative: "Sessões estáveis! Mas os dados chegam ilegíveis — caracteres estranhos no lugar do conteúdo esperado. A codificação está errada.",
    enigmaType: 'text',
    enigmaDisplay: "UmVkZXMgZSBDb21wdXRhZG9yZXM=",
    instruction: "Esta string está codificada em Base64. Decodifique-a para restaurar os dados:",
    correctAnswer: "redes e computadores",
    hint: "Base64 transforma dados binários em texto ASCII. Use uma tabela Base64 ou lembre: R = Redes...",
    explanation: "A Camada de Apresentação é responsável por traduzir, formatar, comprimir e criptografar os dados. Ela garante que o que o emissor envia seja interpretado corretamente pelo receptor. O SSL/TLS — que garante o 'S' do HTTPS — opera nessa camada."
  },
  {
    layer: 7,
    name: "Aplicação",
    icon: "🖥️",
    badgeColor: "#FF6B35",
    protocols: "HTTP, HTTPS, FTP, SMTP, DNS, POP3, IMAP, SSH",
    narrative: "Estamos quase lá! Último problema: nenhuma URL está sendo resolvida. Uma mensagem cifrada foi encontrada nos logs do servidor.",
    enigmaType: 'text',
    enigmaDisplay: "B freivçb QAF rfgá nhfragr",
    instruction: "Decodifique esta mensagem em ROT13 para descobrir o serviço com falha:",
    correctAnswer: "o serviço dns está ausente",
    hint: "ROT13 substitui cada letra pela 13ª letra seguinte. A↔N, B↔O, C↔P...",
    explanation: "A Camada de Aplicação é a mais próxima do usuário — é onde vivem HTTP, DNS, FTP, SMTP. O DNS é essencial: sem ele, nenhum nome de domínio é resolvido para um endereço IP, tornando a web inacessível mesmo com toda a rede funcionando."
  }
];
