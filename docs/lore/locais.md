# Locais da Cidadela

> Arquitetura, cor e função narrativa dos três primeiros espaços canônicos. As paletas abaixo são **obrigatórias** nos temas dos JSONs: se um local aparecer com outra cor, corrija o dado, não o cânone.

---

## Pátio Central

**Descrição arquitetônica.** O coração da Cidadela é uma praça circular de pedra escura, com um vão no centro por onde subia a luz do Receptáculo adormecido. Arcos altos e silhuetas de cabos cortam o céu baixo; dali partem os portais que respiram devagar, cada um com o cheiro de uma disciplina ainda não acesa. O vento atravessa o pátio sem pressa, levantando poeira luminosa. É o ponto de chegada do Andarilho e o lugar para onde ele volta sempre que um portal se ilumina.

**Paleta sugerida:** `#070d18` (fundo noite) / `#57e0ff` (neon ciano dos portais).

**Elementos visuais.** Piso com anéis concêntricos fracamente traçados, portais em arco com borda ciano, cabos suspensos como nervos, partículas em suspensão, luz volumétrica filtrando pelas colunas e a capa do Andarilho recortada contra o fundo.

**Função de gameplay.** Hub navegável. Apresenta os portais das disciplinas, sinaliza quais estão desbloqueadas e devolve o jogador após cada ala. O `hubReward` das disciplinas acende aqui: uma nova lâmpada de luz no anel central.

**Fragmentos associados.** Nenhum nasce no Pátio — ele é o índice, não o arquivo. Seus portais apontam para `log-cd-01-architects`, `log-cd-02-noise` e `log-cd-03-receptacle`, todos no Setor de Circuitos Digitais.

---

## Setor de Circuitos Digitais

**Descrição arquitetônica.** Uma ala já desbloqueada, surgida como extensão do Pátio: corredores estreitos de paredes transparentes onde os Cabos de Energia correm à mostra, como veias sob a pele da Cidadela. As placas de circuito servem de piso e respondem ao passo com um brilho que se propaga. É aqui que o Ruído apareceu pela primeira vez — não como sombra, mas como um tremor que desloca uma sílaba do lugar.

**Paleta sugerida:** `#070d18` (fundo noite) / `#5ef2c8` (verde-água dos circuitos ativos) / `#f2c14e` (âmbar dos barramentos em falha).

**Elementos visuais.** Trilhas luminosas correndo sob os pés, cabos que pulsam em âmbar quando a interferência aparece, terminais de pedra com leitores de latão, reflexos úmidos no piso, partículas que saltam em sincronia com os pulsos do Ruído. Luz volumétrica vaza das emendas entre placas.

**Função de gameplay.** Primeira disciplina jogável. Concentra os níveis `cd-1-1`, `cd-1-2` e `cd-1-3`, com desafios de reconhecimento de padrões e lógica elementar. Cada terminal vencido estabiliza um barramento e devolve um fragmento.

**Fragmentos associados.** `log-cd-01-architects` (cd-1-1, o desenho original e Vetra), `log-cd-02-noise` (cd-1-2, a interferência nos barramentos) e `log-cd-03-receptacle` (cd-1-3, o Receptáculo sob o Pátio).

---

## Ala 1: Fundamentos da Lógica

**Descrição arquitetônica.** A primeira ala a reacender, discreta e quase doméstica ao lado da imponência do Setor: salas pequenas, paredes baixas e bancos de leitura alinhados em filas perfeitas. Tudo foi desenhado para caber numa ideia simples antes de tentar conter o mundo. É aqui que a Cidadela volta a ensinar em vez de apenas guardar.

**Paleta sugerida:** variação sutil do Pátio — `#0a1422` (fundo levemente mais claro) / `#6ee7d8` (verde-azulado dos primeiros terminais). O ciano `#57e0ff` aparece só quando a resposta acerta.

**Elementos visuais.** Bancos em silhueta, terminais baixos ao alcance da mão, chaves e alavancas esquemáticas flutuando em luz verde-azulada, pó suspenso em cones de luz suaves. Nada de âmbar aqui: ainda não há falha a sinalizar.

**Função de gameplay.** Introdução pedagógica. Os primeiros terminais ensinam a reconhecer uma única resposta correta e a usar a dica sem medo de errar. O desbloqueio das alas seguintes depende da compreensão destes níveis.

**Fragmentos associados.** `log-cd-01-architects` — o primeiro fragmento, plantado no primeiro terminal e ligado ao desenho de Vetra.
