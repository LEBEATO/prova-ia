export type MockTopic = {
  category: string;
  subject: string;
  subtopic: string | null;
  expected_questions: number | null;
};

type MockQuestionTemplate = {
  statement: string;
  options: { key: string; text: string }[];
  correct_answer: string;
  explanation: string;
};

const portugueseBank: MockQuestionTemplate[] = [
  {
    statement: "Leia a frase: “Os alunos chegaram cedo à escola.” Qual é o sujeito da oração?",
    options: [
      { key: "A", text: "cedo" },
      { key: "B", text: "à escola" },
      { key: "C", text: "Os alunos" },
      { key: "D", text: "chegaram" },
    ],
    correct_answer: "C",
    explanation: "O sujeito é “Os alunos”, pois é o termo sobre o qual se declara que chegaram cedo.",
  },
  {
    statement: "Em qual alternativa todas as palavras estão grafadas corretamente?",
    options: [
      { key: "A", text: "exceção, pesquisa, análise" },
      { key: "B", text: "excessão, pesquiza, análise" },
      { key: "C", text: "exceção, pesquiza, analize" },
      { key: "D", text: "excessão, pesquisa, analize" },
    ],
    correct_answer: "A",
    explanation: "As grafias corretas são “exceção”, “pesquisa” e “análise”.",
  },
  {
    statement: "Na frase “A professora explicou o conteúdo com clareza”, a expressão “com clareza” indica:",
    options: [
      { key: "A", text: "tempo" },
      { key: "B", text: "modo" },
      { key: "C", text: "lugar" },
      { key: "D", text: "causa" },
    ],
    correct_answer: "B",
    explanation: "“Com clareza” expressa o modo como a professora explicou o conteúdo.",
  },
  {
    statement: "Assinale a alternativa em que há concordância verbal adequada.",
    options: [
      { key: "A", text: "Houveram muitos alunos na reunião." },
      { key: "B", text: "Fazem dois anos que estudo aqui." },
      { key: "C", text: "Existem boas propostas para a escola." },
      { key: "D", text: "Deve haverem novas vagas." },
    ],
    correct_answer: "C",
    explanation: "O verbo “existir” concorda normalmente com o sujeito: “Existem boas propostas”.",
  },
  {
    statement: "Em “Embora estivesse cansada, a professora concluiu a aula”, a palavra “Embora” estabelece ideia de:",
    options: [
      { key: "A", text: "concessão" },
      { key: "B", text: "conclusão" },
      { key: "C", text: "explicação" },
      { key: "D", text: "condição" },
    ],
    correct_answer: "A",
    explanation: "“Embora” é uma conjunção concessiva.",
  },
  {
    statement: "Qual alternativa apresenta um pronome demonstrativo?",
    options: [
      { key: "A", text: "meu" },
      { key: "B", text: "aquele" },
      { key: "C", text: "quem" },
      { key: "D", text: "algum" },
    ],
    correct_answer: "B",
    explanation: "“Aquele” é pronome demonstrativo.",
  },
  {
    statement: "Na frase “Os livros que comprei são novos”, a palavra “que” retoma:",
    options: [
      { key: "A", text: "comprei" },
      { key: "B", text: "novos" },
      { key: "C", text: "Os livros" },
      { key: "D", text: "são" },
    ],
    correct_answer: "C",
    explanation: "O pronome relativo “que” retoma o antecedente “Os livros”.",
  },
  {
    statement: "Assinale a alternativa em que a vírgula está empregada de forma adequada.",
    options: [
      { key: "A", text: "Os alunos, fizeram a atividade." },
      { key: "B", text: "Maria, por favor, feche a porta." },
      { key: "C", text: "A escola ofereceu, novos cursos." },
      { key: "D", text: "O professor explicou, a matéria." },
    ],
    correct_answer: "B",
    explanation: "A expressão “por favor” aparece intercalada e deve ser isolada por vírgulas.",
  },
];

const pedagogyBank: MockQuestionTemplate[] = [
  {
    statement: "Segundo a LDB, a educação escolar deve vincular-se:",
    options: [
      { key: "A", text: "apenas ao mercado de trabalho" },
      { key: "B", text: "ao mundo do trabalho e à prática social" },
      { key: "C", text: "somente à formação acadêmica" },
      { key: "D", text: "exclusivamente à preparação para exames" },
    ],
    correct_answer: "B",
    explanation: "A LDB estabelece a vinculação da educação escolar ao mundo do trabalho e à prática social.",
  },
  {
    statement: "Na avaliação formativa, o principal objetivo é:",
    options: [
      { key: "A", text: "classificar os estudantes ao final do período" },
      { key: "B", text: "acompanhar a aprendizagem e orientar intervenções pedagógicas" },
      { key: "C", text: "substituir todo o planejamento docente" },
      { key: "D", text: "atribuir somente uma nota numérica" },
    ],
    correct_answer: "B",
    explanation: "A avaliação formativa acompanha o processo de aprendizagem e ajuda a orientar intervenções.",
  },
  {
    statement: "Em uma perspectiva inclusiva, a escola deve:",
    options: [
      { key: "A", text: "separar estudantes com dificuldades em atividades permanentes" },
      { key: "B", text: "garantir participação, acessibilidade e oportunidades de aprendizagem" },
      { key: "C", text: "reduzir o currículo para todos os alunos" },
      { key: "D", text: "transferir toda responsabilidade à família" },
    ],
    correct_answer: "B",
    explanation: "A educação inclusiva busca participação, acessibilidade e aprendizagem para todos.",
  },
  {
    statement: "A BNCC define, para a Educação Básica:",
    options: [
      { key: "A", text: "um currículo único e imutável para todas as escolas" },
      { key: "B", text: "aprendizagens essenciais a serem desenvolvidas" },
      { key: "C", text: "somente conteúdos de Língua Portuguesa e Matemática" },
      { key: "D", text: "apenas regras administrativas das redes de ensino" },
    ],
    correct_answer: "B",
    explanation: "A BNCC estabelece aprendizagens essenciais, que orientam os currículos.",
  },
  {
    statement: "O planejamento pedagógico é mais eficaz quando:",
    options: [
      { key: "A", text: "é rígido e não admite ajustes" },
      { key: "B", text: "considera objetivos, estratégias, avaliação e características da turma" },
      { key: "C", text: "é elaborado apenas ao final do ano" },
      { key: "D", text: "dispensa o acompanhamento da aprendizagem" },
    ],
    correct_answer: "B",
    explanation: "Um bom planejamento articula objetivos, estratégias, avaliação e necessidades dos estudantes.",
  },
  {
    statement: "A recuperação da aprendizagem deve ser entendida como:",
    options: [
      { key: "A", text: "ação apenas punitiva para quem teve baixo rendimento" },
      { key: "B", text: "oportunidade de retomada e avanço nas aprendizagens" },
      { key: "C", text: "substituição da avaliação regular" },
      { key: "D", text: "atividade opcional sem acompanhamento docente" },
    ],
    correct_answer: "B",
    explanation: "A recuperação busca retomar conteúdos e apoiar o avanço do estudante.",
  },
  {
    statement: "Uma prática pedagógica baseada em metodologias ativas tende a:",
    options: [
      { key: "A", text: "colocar o estudante em papel mais participativo no processo de aprendizagem" },
      { key: "B", text: "eliminar a mediação do professor" },
      { key: "C", text: "substituir todos os conteúdos por atividades livres" },
      { key: "D", text: "dispensar objetivos de aprendizagem" },
    ],
    correct_answer: "A",
    explanation: "Metodologias ativas ampliam a participação do estudante, sem eliminar a mediação docente.",
  },
  {
    statement: "O Projeto Político-Pedagógico da escola deve:",
    options: [
      { key: "A", text: "ser construído de forma coletiva e orientar as ações da instituição" },
      { key: "B", text: "ser elaborado apenas pela direção" },
      { key: "C", text: "tratar somente de questões financeiras" },
      { key: "D", text: "ser atualizado apenas quando houver troca de governo" },
    ],
    correct_answer: "A",
    explanation: "O PPP expressa a identidade e as diretrizes da escola e deve ser construído coletivamente.",
  },
];

const teacherBank: MockQuestionTemplate[] = [
  {
    statement: "Ao identificar diferentes ritmos de aprendizagem em uma turma, a prática mais adequada é:",
    options: [
      { key: "A", text: "usar sempre a mesma estratégia para todos" },
      { key: "B", text: "diversificar estratégias e acompanhar as necessidades dos estudantes" },
      { key: "C", text: "separar permanentemente os alunos com dificuldade" },
      { key: "D", text: "reduzir os objetivos de aprendizagem sem avaliação" },
    ],
    correct_answer: "B",
    explanation: "A diversificação de estratégias ajuda a atender diferentes necessidades de aprendizagem.",
  },
  {
    statement: "Uma sequência didática bem estruturada deve:",
    options: [
      { key: "A", text: "articular atividades progressivas em torno de objetivos definidos" },
      { key: "B", text: "reunir atividades sem relação entre si" },
      { key: "C", text: "dispensar avaliação e retomada" },
      { key: "D", text: "ser igual para qualquer turma" },
    ],
    correct_answer: "A",
    explanation: "Sequências didáticas organizam atividades de forma progressiva e coerente com objetivos de aprendizagem.",
  },
  {
    statement: "O uso pedagógico do erro do estudante deve servir principalmente para:",
    options: [
      { key: "A", text: "punir o estudante" },
      { key: "B", text: "identificar dificuldades e orientar novas intervenções" },
      { key: "C", text: "eliminar a necessidade de avaliação" },
      { key: "D", text: "comparar publicamente os alunos" },
    ],
    correct_answer: "B",
    explanation: "O erro pode fornecer evidências sobre o raciocínio do estudante e orientar intervenções.",
  },
  {
    statement: "A mediação docente favorece a aprendizagem quando o professor:",
    options: [
      { key: "A", text: "apenas transmite respostas prontas" },
      { key: "B", text: "propõe desafios, oferece pistas e acompanha o desenvolvimento" },
      { key: "C", text: "evita perguntas dos estudantes" },
      { key: "D", text: "mantém o mesmo percurso mesmo quando não há compreensão" },
    ],
    correct_answer: "B",
    explanation: "A mediação envolve acompanhamento, problematização e apoio ao avanço do estudante.",
  },
  {
    statement: "Em alfabetização, é importante que o estudante:",
    options: [
      { key: "A", text: "tenha contato com diferentes práticas de leitura e escrita" },
      { key: "B", text: "memorize apenas listas de palavras" },
      { key: "C", text: "escreva somente após dominar todas as regras gramaticais" },
      { key: "D", text: "evite textos reais até o final do processo" },
    ],
    correct_answer: "A",
    explanation: "A alfabetização se fortalece com práticas significativas de leitura e escrita.",
  },
  {
    statement: "Uma boa devolutiva ao estudante deve ser:",
    options: [
      { key: "A", text: "genérica e sem indicação de como melhorar" },
      { key: "B", text: "clara, específica e orientada para os próximos passos" },
      { key: "C", text: "restrita à nota final" },
      { key: "D", text: "sempre feita apenas no fim do semestre" },
    ],
    correct_answer: "B",
    explanation: "Feedback efetivo informa o que foi alcançado e indica caminhos para avançar.",
  },
  {
    statement: "No trabalho com leitura, formular hipóteses antes e durante o texto contribui para:",
    options: [
      { key: "A", text: "ampliar a compreensão e a participação do leitor" },
      { key: "B", text: "substituir completamente a leitura do texto" },
      { key: "C", text: "evitar a interpretação" },
      { key: "D", text: "memorizar frases sem contexto" },
    ],
    correct_answer: "A",
    explanation: "Antecipações e hipóteses são estratégias que favorecem a compreensão leitora.",
  },
  {
    statement: "Ao organizar atividades em grupo, o professor deve priorizar:",
    options: [
      { key: "A", text: "tarefas sem objetivo comum" },
      { key: "B", text: "interação, colaboração e participação dos estudantes" },
      { key: "C", text: "apenas a divisão física da turma" },
      { key: "D", text: "a competição como única estratégia" },
    ],
    correct_answer: "B",
    explanation: "O trabalho em grupo é mais produtivo quando há objetivos comuns, colaboração e participação.",
  },
];

const localBank: MockQuestionTemplate[] = [
  {
    statement: "Para estudar conhecimentos específicos de um município para concurso, a fonte mais adequada é:",
    options: [
      { key: "A", text: "postagens sem autoria em redes sociais" },
      { key: "B", text: "legislação municipal e páginas oficiais do município" },
      { key: "C", text: "comentários anônimos em fóruns" },
      { key: "D", text: "qualquer resumo sem referência" },
    ],
    correct_answer: "B",
    explanation: "Legislação e fontes oficiais oferecem maior confiabilidade para conteúdos locais.",
  },
  {
    statement: "Quando o edital cobra história e características locais, o candidato deve priorizar:",
    options: [
      { key: "A", text: "os tópicos expressamente indicados no edital e fontes oficiais" },
      { key: "B", text: "apenas conhecimentos de outros municípios" },
      { key: "C", text: "somente conteúdos nacionais" },
      { key: "D", text: "informações sem relação com o edital" },
    ],
    correct_answer: "A",
    explanation: "O estudo deve seguir o conteúdo programático do edital e fontes confiáveis.",
  },
  {
    statement: "Uma lei orgânica municipal corresponde, em termos gerais, a:",
    options: [
      { key: "A", text: "uma norma básica de organização do município" },
      { key: "B", text: "um regulamento de uma empresa privada" },
      { key: "C", text: "uma lei exclusiva da União" },
      { key: "D", text: "um documento sem força normativa" },
    ],
    correct_answer: "A",
    explanation: "A Lei Orgânica estabelece regras fundamentais de organização do município.",
  },
  {
    statement: "Para confirmar um dado histórico local cobrado em prova, é recomendável:",
    options: [
      { key: "A", text: "usar uma única postagem sem fonte" },
      { key: "B", text: "comparar fontes oficiais, arquivos públicos ou instituições reconhecidas" },
      { key: "C", text: "usar apenas comentários de terceiros" },
      { key: "D", text: "considerar qualquer informação como verdadeira" },
    ],
    correct_answer: "B",
    explanation: "A confirmação por fontes oficiais ou reconhecidas reduz o risco de estudar informação incorreta.",
  },
  {
    statement: "Se o edital mencionar legislação municipal específica, a preparação mais segura é:",
    options: [
      { key: "A", text: "estudar a redação atualizada da norma indicada" },
      { key: "B", text: "ignorar alterações legislativas" },
      { key: "C", text: "usar somente resumos antigos" },
      { key: "D", text: "substituir a norma por conteúdos de outro município" },
    ],
    correct_answer: "A",
    explanation: "Legislação pode ser alterada; por isso é importante consultar a redação atualizada.",
  },
  {
    statement: "Em questões sobre administração municipal, a leitura do próprio edital é importante porque ele:",
    options: [
      { key: "A", text: "delimita os conteúdos que podem ser cobrados" },
      { key: "B", text: "não possui relação com a prova" },
      { key: "C", text: "substitui todas as leis mencionadas" },
      { key: "D", text: "dispensa o estudo do conteúdo programático" },
    ],
    correct_answer: "A",
    explanation: "O edital é o documento que delimita regras e conteúdos do concurso.",
  },
];

function pickBank(topic: MockTopic) {
  const text = `${topic.category} ${topic.subject} ${topic.subtopic ?? ""}`.toLowerCase();

  if (text.includes("portugu")) return portugueseBank;
  if (
    text.includes("pedag") ||
    text.includes("ldb") ||
    text.includes("bncc") ||
    text.includes("legislação educacional")
  ) {
    return pedagogyBank;
  }
  if (text.includes("município") || text.includes("local")) return localBank;
  return teacherBank;
}

export function buildMockQuestions(topics: MockTopic[], count: number) {
  const safeTopics =
    topics.length > 0
      ? topics
      : [
          {
            category: "Conhecimentos Gerais",
            subject: "Língua Portuguesa",
            subtopic: "Interpretação de texto",
            expected_questions: count,
          },
        ];

  const weighted = safeTopics.flatMap((topic) => {
    const weight = Math.max(1, topic.expected_questions ?? 1);
    return Array.from({ length: weight }, () => topic);
  });

  const bankIndexes = new Map<string, number>();

  return Array.from({ length: count }, (_, index) => {
    const topic = weighted[index % weighted.length];
    const bank = pickBank(topic);
    const bankKey = `${topic.category}|${topic.subject}|${topic.subtopic ?? ""}`;
    const bankIndex = bankIndexes.get(bankKey) ?? 0;
    const template = bank[bankIndex % bank.length];
    bankIndexes.set(bankKey, bankIndex + 1);

    return {
      subject: topic.subject,
      topic: topic.category,
      subtopic: topic.subtopic || "conteúdo previsto no edital",
      difficulty: index % 3 === 0 ? "fácil" : index % 3 === 1 ? "média" : "difícil",
      statement: `[MODO TESTE] ${template.statement}`,
      options: template.options,
      correct_answer: template.correct_answer,
      explanation: `MODO TESTE: ${template.explanation}`,
      source_reference: "MODO TESTE",
      is_ai_generated: true,
    };
  });
}
