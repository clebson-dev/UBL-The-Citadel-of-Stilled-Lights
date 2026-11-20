# Mistérios da Cidadela

> Tabela viva das pistas plantadas. Todo fragmento que existe no jogo **precisa** aparecer aqui — e nenhuma linha aqui pode apontar para um fragmento que não existe em `src/data/disciplines/`.

| ID do Log | Disciplina/Nível | Pista Plantada | Status [Em Aberto / Resolvido] | Resolução Planejada |
| --- | --- | --- | --- | --- |
| `log-cd-01-architects` | circuitos-digitais / cd-1-1 | pista sobre Vetra e o primeiro desenho da Cidadela | Em Aberto | Revelação futura sobre o **Projeto Átrio**: o primeiro desenho de Vetra não era apenas a planta da Cidadela, mas o esboço de um núcleo que ligaria todas as disciplinas. A revelação virá quando outra ala acender e o mapa puder ser lido por completo. |
| `log-cd-02-noise` | circuitos-digitais / cd-1-2 | pista sobre interferência do Ruído nos barramentos | Em Aberto | Resolução futura em disciplina de **Sistemas Operacionais/Redes**: as medições de Lin serão reinterpretadas como um ataque à camada de transporte do saber, explicando por que o Ruído desfaz referências em vez de destruir suportes. |
| `log-cd-03-receptacle` | circuitos-digitais / cd-1-3 | pista sobre o Receptáculo adormecido sob o Pátio | Em Aberto | Resolução final na **fusão das disciplinas**: quando várias alas estiverem acesas, o Receptáculo deixará de ser um depósito e passará a distribuir luz — fechando o arco do Projeto Átrio e respondendo, enfim, à voz que falou pelo Ruído. |

---

## Fluxo de atualização do status

1. **Plantio.** Ao criar um nível com `loreFragment`, o autor registra a pista nesta tabela com status **Em Aberto**. Ler o fragmento no jogo **não** muda o status: o jogador encontrou a pista, mas o mistério ainda não foi explicado.
2. **Aprofundamento.** Outra disciplina pode retomar a mesma pista com mais informação. Atualize a coluna **Resolução Planejada** para descrever a nova etapa, mantendo o status **Em Aberto** enquanto faltar a revelação final.
3. **Resolução.** Só quando o cânone efetivamente responder à pergunta — em um fragmento novo, devidamente registrado aqui — a linha muda para **Resolvido** e a resolução planejada é substituída pela resolução ocorrida, com o ID do fragmento que a fechou.
4. **Auditoria.** Toda mudança de status passa pela leitura obrigatória dos cinco documentos de `docs/lore/` e entra no commit como `lore:` (ou `lore!:` se mudar cânone).

Regra de ouro: **status muda quando o saber muda, não quando o jogador clica.**

---

## Sincronização com os JSONs

Todo `loreFragment.id` usado em `src/data/disciplines/*.json` **precisa** ter uma linha nesta tabela, com disciplina/nível idênticos ao do JSON. O inverso também vale: linha sem fragmento correspondente é dívida de conteúdo e deve ser removida ou implementada.

O script **`npm run validate`** verifica essa sincronização explicitamente. Ele percorre os JSONs, coleta os IDs de fragmento, compara com esta tabela e falha se houver ID órfão, ID duplicado, associação divergente ou status fora de `Em Aberto / Resolvido`. Por isso, ao adicionar uma disciplina ou um tipo de desafio, atualize `misterios.md` **antes** de rodar o validador — e rode-o de novo depois de qualquer edição narrativa.
