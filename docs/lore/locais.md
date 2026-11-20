# Locais da Cidadela

> Arquitetura, cor e função narrativa dos três primeiros espaços canônicos. As paletas abaixo são **obrigatórias** nos temas dos JSONs: se um local aparecer com outra cor, corrija o dado, não o cânone. As nove Alas de Circuitos Digitais têm paletas próprias, registradas no fim deste arquivo.

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

## Ala 1: O Alfabeto dos Sinais

**Descrição arquitetônica.** A primeira ala a reacender, discreta e quase doméstica ao lado da imponência do Setor: salas pequenas, paredes baixas e bancos de leitura alinhados em filas perfeitas. Tudo foi desenhado para caber numa ideia simples antes de tentar conter o mundo. É aqui que a Cidadela volta a ensinar em vez de apenas guardar.

**Paleta sugerida:** variação sutil do Pátio — `#0a1422` (fundo levemente mais claro) / `#6ee7d8` (verde-azulado dos primeiros terminais). O ciano `#57e0ff` aparece só quando a resposta acerta.

**Elementos visuais.** Bancos em silhueta, terminais baixos ao alcance da mão, chaves e alavancas esquemáticas flutuando em luz verde-azulada, pó suspenso em cones de luz suaves. Nada de âmbar aqui: ainda não há falha a sinalizar.

**Função de gameplay.** Introdução pedagógica. Os primeiros terminais ensinam a reconhecer uma única resposta correta e a usar a dica sem medo de errar. O desbloqueio das alas seguintes depende da compreensão destes níveis.

**Fragmentos associados.** `log-cd-01-architects` — o primeiro fragmento, plantado no primeiro terminal e ligado ao desenho de Vetra. `log-cd-02-noise` e `log-cd-03-receptacle` também nascem nesta Ala: a interferência nos barramentos e o vão sob o Pátio são as outras duas primeiras vozes do Setor.

---

## Marcas recorrentes para o `level-architect`

Quatro sinais podem ser escondidos nos cenários das Alas. São **elementos visuais**: aparecem, não recebem letreiro, não são comentados por NPC e nunca são explicados em `loreFragment`. A descrição abaixo é para quem projeta o mapa — o jogador deve perceber a marca e formular a própria pergunta. As paletas canônicas acima permanecem obrigatórias e inalteradas.

1. **A Linha em Branco** — retângulo vazio na última linha de toda tabela ou placa, às vezes tremendo. Em Cálculo vira limite sem valor; em Algoritmos, um retorno sem destino. Objeto concreto, nunca glossado.
2. **O Eixo que Abre para Dentro** — assinatura de Vetra: dobradiça invertida, arco que parece sair e entra. Sugere que o Átrio não é para onde se vai, mas o que se abre dentro.
3. **A Sílaba Deslocada** — assinatura do Ruído: uma letra um espaço à direita do devido em letreiros; no áudio, o nome chega um segundo atrasado. Nunca corrigir a grafia no cenário — o deslocamento é a pista.
4. **O Ponto de Costura** — nó de luz com dois fios desiguais gravado na pedra. Indica que o Receptáculo já passou por ali; essa informação **nunca** pode ser dita em texto de jogo.

---

## Paletas das Alas de Circuitos Digitais

As nove Alas formam uma só descida: o verde-ar dos circuitos esfria enquanto o âmbar do Ruído aquece, até que a última Ala termina no dourado do Ponto de Costura. Os cinco campos são, em ordem, `background`, `light`, `cableActive`, `cableInactive` e `accent`. Nenhuma Ala pode trocar seus valores sem passar pelo `lorekeeper`.

| Ala | Aulas | Nome | Paleta (`fundo · luz · ativo · inativo · acento`) |
| --- | --- | --- | --- |
| 1 | 01–10 | O Alfabeto dos Sinais | `#0a1422 · #6ee7d8 · #5ef2c8 · #1b3446 · #57e0ff` |
| 2 | 11–19 | A Álgebra das Decisões | `#0b1725 · #72e0cc · #55dcc0 · #1c3646 · #d8a746` |
| 3 | 20–30 | O Mapa e a Soma | `#0c1a28 · #78dbc0 · #4fd8b4 · #1e3a48 · #dfae48` |
| 4 | 31–40 | Comparar, Converter, Decodificar | `#0d1d2a · #80d5b4 · #49d3a8 · #203e4a · #e5b44c` |
| 5 | 41–50 | O Caminho Escolhido | `#0e202c · #88cda8 · #43cd9d · #22424c · #ebbb52` |
| 6 | 51–60 | A Máquina que Decide | `#10232e · #90c59c · #3dc791 · #254650 · #f2c14e` |
| 7 | 61–71 | O Instante Guardado | `#122630 · #98bd90 · #37c186 · #284a54 · #f2c14e` |
| 8 | 72–82 | O Desenho do Caminho | `#142933 · #a0b584 · #31bb7b · #2b4e58 · #f5c95e` |
| 9 | 83–93 | O Estado que se Reconhece | `#162c36 · #a8ad78 · #2bb570 · #2e525c · #ffd873` |

**Nota de continuidade.** A Ala 1 não usa âmbar: ainda não há falha a sinalizar. O acento ciano `#57e0ff` é o da resposta que acende; o âmbar `#d8a746` entra na Ala 2, quando a sílaba deslocada aparece, e o âmbar canônico `#f2c14e` chega em toda a sua força na Ala 6, com o barramento já tomado pelo Ruído, e segue na Ala 7. As paletas do Pátio (`#070d18`/`#57e0ff`) e do Setor (`#070d18`/`#5ef2c8`/`#f2c14e`) permanecem como estão — são o exterior das Alas, não o seu interior.
