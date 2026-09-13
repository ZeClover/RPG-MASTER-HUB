/**
 * Consequence Suggester (Fase 8, ver ARCHITECTURE.md, seção 19.4) — a
 * biblioteca de templates em si. Constante em código, não uma tabela no
 * banco (justificado em detalhe na seção 19.4): são 120 frases fixas que o
 * mestre nunca precisa editar, só sortear — o único estado que varia por
 * campanha (quais NPCs/Facções/Locais/Itens entram nos placeholders) já vem
 * do banco através de `queries.ts`, então uma tabela aqui só adicionaria
 * complexidade de CRUD sem nenhum ganho real de flexibilidade.
 *
 * Cada `text` é uma frase com placeholders opcionais (`{{NPC}}`, `{{FACCAO}}`,
 * `{{LOCAL}}`, `{{ITEM}}`), preenchidos por `generator.ts` com entidades reais
 * da campanha quando existirem, ou um substituto genérico quando não. Todo
 * placeholder é usado "nu" (sem artigo colado antes) nos templates — exceto
 * `{{FACCAO}}`, sempre precedido do substantivo "facção" ("a facção
 * {{FACCAO}}") para deixar claro que o nome ali é uma organização — para que
 * tanto um nome real da campanha quanto o substituto genérico (ver
 * `PLACEHOLDER_FALLBACKS` em `generator.ts`) encaixem gramaticalmente sem
 * duplicar artigo. Isso não garante português perfeito em toda combinação
 * possível (nomes reais são texto livre do mestre, fora do nosso controle),
 * mas mantém a esmagadora maioria das combinações legível — o mesmo tipo de
 * limitação admitida do Lore Guardian (comparação de string, não de
 * significado).
 */

export type ConsequenceTemplateCategory = "POLITICA" | "PESSOAL" | "AMBIENTAL" | "SOBRENATURAL" | "ECONOMICA" | "MILITAR";

export const CONSEQUENCE_CATEGORY_LABELS: Record<ConsequenceTemplateCategory, string> = {
  POLITICA: "Política",
  PESSOAL: "Pessoal",
  AMBIENTAL: "Ambiental",
  SOBRENATURAL: "Sobrenatural",
  ECONOMICA: "Econômica",
  MILITAR: "Militar",
};

export interface ConsequenceTemplate {
  category: ConsequenceTemplateCategory;
  text: string;
}

export const CONSEQUENCE_TEMPLATES: ConsequenceTemplate[] = [
  // ── Política ──────────────────────────────────────────────────────────
  { category: "POLITICA", text: "A facção {{FACCAO}} aproveita o vácuo de poder deixado pelos eventos recentes e reivindica controle sobre {{LOCAL}}." },
  { category: "POLITICA", text: "Um conselho de anciãos em {{LOCAL}} convoca os jogadores para prestar contas sobre o que aconteceu, sob pena de perderem apoio político." },
  { category: "POLITICA", text: "{{NPC}} usa a situação para consolidar poder, espalhando boatos que colocam a culpa nos jogadores." },
  { category: "POLITICA", text: "A facção {{FACCAO}} rompe relações diplomáticas com outra facção da região, citando os jogadores como o estopim." },
  { category: "POLITICA", text: "Um decreto é assinado proibindo forasteiros de entrar em {{LOCAL}} sem escolta, em resposta direta às ações do grupo." },
  { category: "POLITICA", text: "{{NPC}} é promovido a uma posição de autoridade em {{LOCAL}}, graças ao papel que desempenhou (ou alegou ter desempenhado) nos eventos recentes." },
  { category: "POLITICA", text: "A facção {{FACCAO}} oferece uma aliança formal aos jogadores, mas exige lealdade exclusiva em troca." },
  { category: "POLITICA", text: "Uma eleição improvisada em {{LOCAL}} é convocada, e o resultado depende diretamente de quem os jogadores apoiarem publicamente." },
  { category: "POLITICA", text: "{{NPC}} perde o cargo que ocupava, culpando abertamente os jogadores pela queda." },
  { category: "POLITICA", text: "A facção {{FACCAO}} passa a exigir taxas mais altas de quem circula por {{LOCAL}}, financiando uma resposta aos eventos recentes." },
  { category: "POLITICA", text: "Espiões da facção {{FACCAO}} começam a seguir os passos dos jogadores, relatando cada movimento a seus superiores." },
  { category: "POLITICA", text: "{{NPC}} propõe uma lei em {{LOCAL}} inspirada diretamente no que os jogadores fizeram, dividindo opiniões entre a população." },
  { category: "POLITICA", text: "A facção {{FACCAO}} declara os jogadores persona non grata em todo o seu território." },
  { category: "POLITICA", text: "Um tratado de paz entre duas facções da região desmorona, e {{NPC}} responsabiliza publicamente o grupo." },
  { category: "POLITICA", text: "A administração de {{LOCAL}} convoca uma audiência pública para debater os eventos recentes, com {{NPC}} presidindo." },
  { category: "POLITICA", text: "A facção {{FACCAO}} tenta recrutar um dos jogadores oferecendo um cargo de destaque em {{LOCAL}}." },
  { category: "POLITICA", text: "Um movimento popular em {{LOCAL}} começa a usar o nome dos jogadores como símbolo de resistência contra a facção {{FACCAO}}." },
  { category: "POLITICA", text: "{{NPC}} exige uma audiência privada com os jogadores para negociar os termos de um acordo político delicado." },
  { category: "POLITICA", text: "A facção {{FACCAO}} confisca propriedades em {{LOCAL}} associadas, ainda que injustamente, aos jogadores." },
  { category: "POLITICA", text: "Rumores de corrupção envolvendo {{NPC}} vêm à tona em {{LOCAL}}, e o momento não poderia ser mais inconveniente para a facção {{FACCAO}}." },

  // ── Pessoal ───────────────────────────────────────────────────────────
  { category: "PESSOAL", text: "{{NPC}} nunca mais confia plenamente nos jogadores, mesmo reconhecendo publicamente o que fizeram." },
  { category: "PESSOAL", text: "{{NPC}} passa a devotar-se a retribuir o favor, aparecendo em momentos inesperados para ajudar o grupo." },
  { category: "PESSOAL", text: "Um parente de {{NPC}} procura os jogadores em {{LOCAL}}, buscando respostas sobre o que realmente aconteceu." },
  { category: "PESSOAL", text: "{{NPC}} desenvolve um ressentimento silencioso que só se manifesta meses depois, de forma inesperada." },
  { category: "PESSOAL", text: "{{NPC}} pede que um dos jogadores se torne seu mentor, ou aceite ser mentorado por ele." },
  { category: "PESSOAL", text: "Um antigo amor de {{NPC}} reaparece em {{LOCAL}}, complicando ainda mais a relação dele com o grupo." },
  { category: "PESSOAL", text: "{{NPC}} começa a contar uma versão exagerada dos eventos, transformando os jogadores em lendas locais." },
  { category: "PESSOAL", text: "{{NPC}} some sem deixar rastro, deixando apenas um bilhete enigmático em {{LOCAL}}." },
  { category: "PESSOAL", text: "Um filho ou pupilo de {{NPC}} idolatra os jogadores e insiste em segui-los na próxima aventura." },
  { category: "PESSOAL", text: "{{NPC}} adoece logo após os eventos, e há quem diga que o estresse causado pela situação foi determinante." },
  { category: "PESSOAL", text: "{{NPC}} muda de comportamento drasticamente, tornando-se mais cauteloso ou mais ousado, dependendo de como foi afetado." },
  { category: "PESSOAL", text: "Um rival de longa data de {{NPC}} usa os eventos recentes como munição para desacreditá-lo publicamente em {{LOCAL}}." },
  { category: "PESSOAL", text: "{{NPC}} escreve uma carta aos jogadores revelando um segredo pessoal que só faz sentido agora." },
  { category: "PESSOAL", text: "{{NPC}} pede abrigo aos jogadores, tendo perdido a casa ou o emprego por causa dos eventos recentes." },
  { category: "PESSOAL", text: "Um vínculo de confiança se rompe entre {{NPC}} e sua própria família, e ele culpa indiretamente os jogadores por isso." },
  { category: "PESSOAL", text: "{{NPC}} organiza uma pequena celebração em {{LOCAL}} para homenagear os jogadores, reunindo quem ainda confia neles." },
  { category: "PESSOAL", text: "{{NPC}} decide seguir os jogadores em sua próxima jornada, disposto a retribuir o que fizeram por ele." },
  { category: "PESSOAL", text: "Um segredo antigo de {{NPC}} vem à tona como consequência direta do que aconteceu, mudando como os jogadores o enxergam." },
  { category: "PESSOAL", text: "{{NPC}} passa a evitar os jogadores deliberadamente, mesmo cruzando com eles com frequência em {{LOCAL}}." },
  { category: "PESSOAL", text: "{{NPC}} jura vingança contra os jogadores, mesmo que discretamente, esperando o momento certo para agir." },

  // ── Ambiental ─────────────────────────────────────────────────────────
  { category: "AMBIENTAL", text: "Uma chuva incomum começa a cair sobre {{LOCAL}}, e os mais velhos dizem nunca ter visto nada parecido." },
  { category: "AMBIENTAL", text: "Parte da vegetação ao redor de {{LOCAL}} começa a morrer sem explicação aparente, dias após os eventos recentes." },
  { category: "AMBIENTAL", text: "Um rio próximo a {{LOCAL}} muda de curso, inundando áreas que antes eram seguras." },
  { category: "AMBIENTAL", text: "Animais selvagens começam a evitar os arredores de {{LOCAL}}, como se pressentissem algo que os habitantes ainda não perceberam." },
  { category: "AMBIENTAL", text: "Uma névoa espessa e persistente passa a cobrir {{LOCAL}} nas primeiras horas da manhã, todos os dias." },
  { category: "AMBIENTAL", text: "Tremores leves, mas frequentes, começam a ser sentidos em {{LOCAL}}, alarmando a população local." },
  { category: "AMBIENTAL", text: "Uma safra inteira é perdida nos arredores de {{LOCAL}}, agravando a situação de quem depende da terra." },
  { category: "AMBIENTAL", text: "Um incêndio de origem desconhecida consome parte de {{LOCAL}}, e os moradores buscam alguém para culpar." },
  { category: "AMBIENTAL", text: "As águas próximas a {{LOCAL}} ficam visivelmente mais escuras, e a pesca despenca." },
  { category: "AMBIENTAL", text: "Uma estação inteira parece atrasar ou nunca chegar em {{LOCAL}}, alterando plantios e migrações de costume." },
  { category: "AMBIENTAL", text: "Um cheiro estranho, impossível de identificar, passa a pairar sobre {{LOCAL}} sem explicação." },
  { category: "AMBIENTAL", text: "Pássaros migratórios abandonam suas rotas de sempre, evitando completamente os céus sobre {{LOCAL}}." },
  { category: "AMBIENTAL", text: "Uma parte de {{LOCAL}} desmorona ou afunda ligeiramente, revelando estruturas que ninguém sabia que existiam ali embaixo." },
  { category: "AMBIENTAL", text: "Um veneno na água atinge o gado de {{LOCAL}}, e alguém precisa descobrir a origem antes que se espalhe." },
  { category: "AMBIENTAL", text: "Ventos fortes e incomuns começam a soprar constantemente sobre {{LOCAL}}, derrubando construções mal fixadas." },
  { category: "AMBIENTAL", text: "Uma doença nas plantações se espalha a partir dos arredores de {{LOCAL}}, ameaçando o abastecimento de toda a região." },
  { category: "AMBIENTAL", text: "Uma fonte de água em {{LOCAL}} seca completamente da noite para o dia, sem explicação natural aparente." },
  { category: "AMBIENTAL", text: "Enxames de insetos incomuns começam a aparecer em {{LOCAL}}, coincidindo exatamente com os eventos recentes." },
  { category: "AMBIENTAL", text: "Uma parte da paisagem ao redor de {{LOCAL}} muda de cor ou textura, e ninguém consegue explicar o porquê." },
  { category: "AMBIENTAL", text: "O rigor da estação chega mais cedo do que nunca em {{LOCAL}}, pegando todos despreparados." },

  // ── Sobrenatural ──────────────────────────────────────────────────────
  { category: "SOBRENATURAL", text: "Um espírito inquieto começa a se manifestar em {{LOCAL}}, aparentemente ligado diretamente aos eventos recentes." },
  { category: "SOBRENATURAL", text: "{{ITEM}} começa a emitir um brilho fraco à noite, algo que ninguém havia notado antes." },
  { category: "SOBRENATURAL", text: "Sonhos estranhos e recorrentes começam a atormentar quem esteve presente nos eventos recentes, incluindo os jogadores." },
  { category: "SOBRENATURAL", text: "Um culto secreto em {{LOCAL}} passa a venerar os jogadores, ou o que eles fizeram, como um sinal profético." },
  { category: "SOBRENATURAL", text: "{{NPC}} começa a exibir um comportamento que sugere possessão, ou algo muito próximo disso." },
  { category: "SOBRENATURAL", text: "Um portal ou fenda instável surge em {{LOCAL}}, e ninguém sabe ao certo o que existe do outro lado." },
  { category: "SOBRENATURAL", text: "{{ITEM}} se recusa a ser separado de quem o carrega, resistindo fisicamente a qualquer tentativa de descarte." },
  { category: "SOBRENATURAL", text: "Profecias antigas em {{LOCAL}} são reinterpretadas à luz dos eventos recentes, e o nome dos jogadores começa a circular nelas." },
  { category: "SOBRENATURAL", text: "Uma maldição sutil parece seguir um dos jogadores, manifestando-se em pequenos azares difíceis de provar." },
  { category: "SOBRENATURAL", text: "{{NPC}} revela ter visões relacionadas aos eventos recentes, insistindo que os jogadores precisam ouvi-lo." },
  { category: "SOBRENATURAL", text: "Um objeto amaldiçoado é encontrado nos escombros ou remanescentes dos eventos recentes em {{LOCAL}}." },
  { category: "SOBRENATURAL", text: "As estrelas visíveis sobre {{LOCAL}} parecem se reorganizar sutilmente, algo que só um estudioso de astrologia notaria." },
  { category: "SOBRENATURAL", text: "{{ITEM}} muda de forma ou peso de maneira sutil, mas perceptível a quem o examina com atenção." },
  { category: "SOBRENATURAL", text: "Vozes sussurrantes começam a ser ouvidas por moradores de {{LOCAL}} durante a noite, sem fonte aparente." },
  { category: "SOBRENATURAL", text: "Um ritual antigo, esquecido havia gerações, volta a ser praticado em {{LOCAL}} como resposta aos eventos recentes." },
  { category: "SOBRENATURAL", text: "{{NPC}} passa a carregar um talismã novo, recusando-se a explicar de onde veio ou o que significa." },
  { category: "SOBRENATURAL", text: "Animais de {{LOCAL}} começam a agir de forma anormal, evitando certos lugares como se sentissem algo ali." },
  { category: "SOBRENATURAL", text: "Um eco dos eventos recentes parece se repetir em sonhos compartilhados por várias pessoas de {{LOCAL}} ao mesmo tempo." },
  { category: "SOBRENATURAL", text: "{{ITEM}} atrai a atenção de um estudioso do oculto, que oferece uma soma generosa (ou uma barganha arriscada) para examiná-lo." },
  { category: "SOBRENATURAL", text: "Uma sombra que não pertence a ninguém é avistada repetidas vezes em {{LOCAL}}, sempre no mesmo horário." },

  // ── Econômica ─────────────────────────────────────────────────────────
  { category: "ECONOMICA", text: "O preço de bens essenciais dispara em {{LOCAL}}, e a população começa a procurar um culpado." },
  { category: "ECONOMICA", text: "A facção {{FACCAO}} aproveita a instabilidade para monopolizar o comércio de um recurso essencial em {{LOCAL}}." },
  { category: "ECONOMICA", text: "Uma rota comercial que passava por {{LOCAL}} é interrompida, afetando mercadores de toda a região." },
  { category: "ECONOMICA", text: "{{NPC}} perde uma fortuna considerável como resultado direto dos eventos recentes e busca compensação." },
  { category: "ECONOMICA", text: "Um mercado negro surge em {{LOCAL}} para suprir uma demanda criada pelos eventos recentes." },
  { category: "ECONOMICA", text: "A facção {{FACCAO}} oferece uma recompensa substancial por informações relacionadas aos jogadores." },
  { category: "ECONOMICA", text: "O valor de {{ITEM}} dispara nos círculos certos, e colecionadores começam a fazer perguntas." },
  { category: "ECONOMICA", text: "Uma falência em cadeia atinge pequenos comerciantes de {{LOCAL}}, todos direta ou indiretamente ligados aos eventos recentes." },
  { category: "ECONOMICA", text: "{{NPC}} vê uma oportunidade de negócio na situação e tenta envolver os jogadores em um empreendimento arriscado." },
  { category: "ECONOMICA", text: "Impostos extraordinários são anunciados em {{LOCAL}} para cobrir os custos causados pelos eventos recentes." },
  { category: "ECONOMICA", text: "A facção {{FACCAO}} corta relações comerciais com {{LOCAL}}, alegando os eventos recentes como justificativa." },
  { category: "ECONOMICA", text: "Um investidor misterioso começa a comprar propriedades em {{LOCAL}} a preços muito acima do mercado." },
  { category: "ECONOMICA", text: "{{ITEM}} se torna impossível de encontrar no mercado local, e seu preço no mercado paralelo triplica." },
  { category: "ECONOMICA", text: "Trabalhadores de {{LOCAL}} entram em greve, exigindo compensação pelos prejuízos causados pelos eventos recentes." },
  { category: "ECONOMICA", text: "A facção {{FACCAO}} propõe um acordo comercial vantajoso aos jogadores, mas com condições pouco claras." },
  { category: "ECONOMICA", text: "Uma dívida antiga de {{NPC}} vem à tona, e o credor exige que os jogadores intercedam ou paguem em seu lugar." },
  { category: "ECONOMICA", text: "O fluxo de visitantes para {{LOCAL}} dispara, movido pela curiosidade sobre os eventos recentes." },
  { category: "ECONOMICA", text: "A facção {{FACCAO}} tenta monopolizar o conhecimento revelado pelos eventos recentes, restringindo o acesso a ele." },
  { category: "ECONOMICA", text: "{{NPC}} oferece financiar a próxima empreitada dos jogadores, em troca de um favor a ser cobrado no futuro." },
  { category: "ECONOMICA", text: "Uma inspeção fiscal inesperada em {{LOCAL}} revela irregularidades que ninguém queria que viessem à tona agora." },

  // ── Militar ───────────────────────────────────────────────────────────
  { category: "MILITAR", text: "A facção {{FACCAO}} reforça sua presença militar em {{LOCAL}}, citando os eventos recentes como justificativa." },
  { category: "MILITAR", text: "Um destacamento é enviado a {{LOCAL}} para investigar os eventos recentes, e os jogadores são os primeiros suspeitos." },
  { category: "MILITAR", text: "{{NPC}} é convocado para uma milícia local formada às pressas em resposta aos eventos recentes." },
  { category: "MILITAR", text: "A facção {{FACCAO}} declara mobilização parcial, temendo que os eventos recentes sejam o prenúncio de algo maior." },
  { category: "MILITAR", text: "Uma patrulha da guarda de {{LOCAL}} começa a seguir os jogadores de perto, sem disfarçar a vigilância." },
  { category: "MILITAR", text: "Um antigo inimigo militar da facção {{FACCAO}} aproveita a instabilidade para lançar um ataque em {{LOCAL}}." },
  { category: "MILITAR", text: "{{NPC}} exige que os jogadores treinem um grupo de recrutas despreparados em {{LOCAL}}." },
  { category: "MILITAR", text: "A facção {{FACCAO}} fecha as fronteiras de {{LOCAL}}, impondo um toque de recolher até que a situação se esclareça." },
  { category: "MILITAR", text: "Um posto avançado perto de {{LOCAL}} pede reforços urgentes, citando movimentação suspeita na região." },
  { category: "MILITAR", text: "{{NPC}} é nomeado responsável pela defesa de {{LOCAL}}, um cargo para o qual claramente não estava preparado." },
  { category: "MILITAR", text: "A facção {{FACCAO}} recruta à força civis de {{LOCAL}}, aproveitando o clima de urgência gerado pelos eventos recentes." },
  { category: "MILITAR", text: "Um arsenal antigo é reaberto em {{LOCAL}}, distribuindo armas para uma milícia recém-formada." },
  { category: "MILITAR", text: "A facção {{FACCAO}} oferece aos jogadores uma comissão militar, com todas as obrigações e riscos que isso implica." },
  { category: "MILITAR", text: "Escaramuças isoladas começam a ocorrer nos arredores de {{LOCAL}}, cada lado culpando o outro pelo início." },
  { category: "MILITAR", text: "{{NPC}} deserta de seu posto na facção {{FACCAO}}, buscando refúgio ou aliança com os jogadores." },
  { category: "MILITAR", text: "Um cerco é temido em {{LOCAL}}, e os mantimentos começam a ser racionados como precaução." },
  { category: "MILITAR", text: "A facção {{FACCAO}} exige que os jogadores devolvam ou entreguem {{ITEM}}, alegando que tem valor estratégico." },
  { category: "MILITAR", text: "Um tratado militar entre duas facções se rompe, e {{LOCAL}} fica exposto entre as duas frentes." },
  { category: "MILITAR", text: "{{NPC}} organiza uma resistência armada em {{LOCAL}}, pedindo abertamente o apoio dos jogadores." },
  { category: "MILITAR", text: "A facção {{FACCAO}} confisca {{ITEM}} sob a alegação de que representa risco à segurança de {{LOCAL}}." },
];
