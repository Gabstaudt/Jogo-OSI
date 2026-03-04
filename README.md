Conexão Perdida — Escape Room OSI

Dinâmica educacional gamificada para o ensino do modelo OSI de 7 camadas.


Sobre o Projeto
Conexão Perdida é um escape room interativo desenvolvido como proposta de gamificação para a disciplina de Redes e Computadores. O objetivo é ensinar o modelo OSI de forma imersiva, substituindo a aula expositiva tradicional por uma experiência de resolução de problemas em equipe.
A premissa: a rede da universidade foi comprometida camada por camada. O jogador assume o papel de engenheiro de redes convocado às 3h da manhã para restaurar o sistema — do físico ao virtual — antes que tudo entre em colapso definitivo.

Objetivos Pedagógicos

Compreender a função de cada uma das 7 camadas do modelo OSI
Associar protocolos às suas respectivas camadas
Desenvolver raciocínio lógico aplicado a cenários reais de redes
Estimular colaboração, comunicação e pensamento crítico em equipe
Aproximar conceitos teóricos de situações reais de troubleshooting


As 7 Camadas e seus Enigmas
#CamadaProtocolosTipo de Enigma1🔌 FísicaRS-232, DSL, Bluetooth, fibra ópticaCódigo Morse2🔗 Enlace de DadosEthernet, Wi-Fi 802.11, MAC, PPPIdentificação de erro em frame3🗺️ RedeIPv4, IPv6, ICMP, ARP, OSPF, BGPCálculo de TTL4🚚 TransporteTCP, UDPOrdenação do Three-Way Handshake5🤝 SessãoNetBIOS, RPC, SIP, PPTPMúltipla escolha conceitual6🎨 ApresentaçãoSSL/TLS, JPEG, ASCII, UTF-8, MIMEDecodificação Base647🖥️ AplicaçãoHTTP, HTTPS, DNS, FTP, SMTP, SSHCifra ROT13

Como Funciona

O jogo começa com um cronômetro regressivo de 30 minutos
O jogador enfrenta 7 fases sequenciais, uma por camada OSI
Cada fase apresenta uma narrativa de contexto + um enigma único
A resposta errada trava o avanço — é preciso discutir e tentar novamente
A resposta certa desbloqueia uma explicação educativa da camada
Ao completar todas as camadas, o código secreto OSI-7-OK é revelado


Tecnologias

React + Hooks
Tailwind CSS
Drag and drop nativo (fase 4 — Transporte)
Sem back-end 


Como Rodar Localmente
bash# Clone o repositório
git clone https://github.com/seu-usuario/conexao-perdida.git

# Entre na pasta
cd Jogo-OSI

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev


Versão Física
Além da versão online, o projeto inclui uma versão física com envelopes impressos — uma por camada — que podem ser usados em sala de aula sem necessidade de computadores. Os arquivos para impressão estão na pasta /print.

