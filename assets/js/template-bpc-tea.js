import { blankQuiz, makeQuestion, uid } from './defaults.js';

function opt(label, value, weight = 0, icon = '') {
  return { id: uid('opt'), label, value, weight, icon, image: '' };
}

function radio(label, id, options, description = '') {
  const question = makeQuestion('radio', label);
  question.id = id;
  question.required = true;
  question.description = description;
  question.options = options;
  return question;
}

function number(label, id, placeholder = '', description = '') {
  const question = makeQuestion('number', label);
  question.id = id;
  question.required = true;
  question.placeholder = placeholder;
  question.description = description;
  return question;
}

function input(label, id, placeholder = '', description = '') {
  const question = makeQuestion('input', label);
  question.id = id;
  question.required = true;
  question.placeholder = placeholder;
  question.description = description;
  return question;
}

export function createBpcTeaTemplate() {
  const quiz = blankQuiz();

  quiz.id = uid('template');
  quiz.title = 'Triagem BPC/LOAS — Criança com TEA';
  quiz.slug = '';
  quiz.description = 'Triagem inicial com 15 perguntas sobre TEA, impedimento de longo prazo, barreiras, renda familiar, despesas, CadÚnico e documentação.';
  quiz.category = 'Jurídico · BPC/LOAS';
  quiz.tags = ['BPC', 'LOAS', 'TEA', 'autismo', 'criança', 'triagem jurídica'];
  quiz.status = 'draft';

  quiz.settings.showWelcome = true;
  quiz.settings.showProgress = true;
  quiz.settings.showQuestionNumber = true;
  quiz.settings.allowBack = true;
  quiz.settings.autoSave = true;
  quiz.settings.maxAttempts = 10;

  quiz.messages.welcome = 'Seu filho com TEA pode ter direito ao BPC/LOAS? Responda com atenção. A triagem leva poucos minutos, deve ser preenchida pelo responsável e não substitui a análise jurídica individual.';
  quiz.messages.requiredError = 'Preencha ou selecione uma resposta para continuar a análise.';
  quiz.messages.completion = 'Triagem concluída. A nota indica apenas o nível de compatibilidade inicial e não garante a concessão do benefício.';
  quiz.settings.thankYouMessage = 'Obrigado por preencher corretamente. Nossa equipe poderá entrar em contato para analisar as informações com mais detalhes.';

  quiz.resultSettings.showPercentage = false;
  quiz.resultSettings.showCorrectAnswers = false;
  quiz.resultSettings.showFeedback = false;

  quiz.design.primaryColor = '#003347';
  quiz.design.secondaryColor = '#0B5F73';
  quiz.design.accentColor = '#4AE1BB';
  quiz.design.successColor = '#10B981';
  quiz.design.backgroundColor = '#F3F8F9';
  quiz.design.textColor = '#003347';
  quiz.design.buttonBackground = '#003347';
  quiz.design.buttonText = '#FFFFFF';
  quiz.design.buttonRadius = 12;
  quiz.design.cardRadius = 20;
  quiz.design.fontFamily = 'Poppins';
  quiz.design.titleFont = 'Poppins';

  quiz.questions = [
    number(
      '👶 Qual é a idade da criança?',
      'child_age',
      'Idade em anos',
      'O BPC para pessoa com deficiência não exige idade mínima. A idade ajuda a comparar o desenvolvimento e a necessidade de apoio com outras crianças da mesma faixa etária.'
    ),

    radio(
      '🧩 A criança possui diagnóstico ou documentação indicando TEA?',
      'tea_diagnosis',
      [
        opt('Sim, possui laudo médico com indicação de TEA e CID', 'medical_report_with_cid', 12, '✅'),
        opt('Possui relatórios clínicos ou multiprofissionais, mas o laudo ainda está incompleto', 'clinical_reports_only', 7, '📄'),
        opt('Está em processo de avaliação', 'under_evaluation', 3, '⏳'),
        opt('Ainda não possui diagnóstico ou documentação', 'no_documentation', 0, '❌')
      ],
      'A Lei nº 12.764/2012 considera a pessoa com TEA pessoa com deficiência para todos os efeitos legais. Mesmo assim, o BPC exige a conferência dos demais requisitos.'
    ),

    radio(
      '📑 Os documentos explicam como o TEA afeta a rotina e a participação da criança?',
      'functional_documents',
      [
        opt('Sim, há laudos e relatórios detalhados de profissionais e/ou da escola', 'detailed', 6, '✅'),
        opt('Há alguns documentos, mas são pouco detalhados', 'partial', 3, '📝'),
        opt('Tenho apenas o diagnóstico, sem descrição das limitações', 'diagnosis_only', 1, '📄'),
        opt('Não tenho documentos sobre essas dificuldades', 'none', 0, '❌')
      ],
      'Relatórios médicos, terapêuticos e escolares ajudam a demonstrar barreiras de comunicação, interação, aprendizagem, autonomia e participação social.'
    ),

    radio(
      '⏳ As dificuldades da criança são ou devem ser de longo prazo?',
      'long_term_impairment',
      [
        opt('Sim, existem há 2 anos ou mais ou têm previsão de permanecer por esse período', 'two_years_or_more', 10, '✅'),
        opt('Existem há menos de 2 anos, mas os profissionais indicam continuidade', 'less_than_two_years', 7, '📆'),
        opt('Ainda não sei informar', 'unknown', 2, '❓'),
        opt('Não, foram dificuldades passageiras', 'temporary', 0, '❌')
      ],
      'Para o BPC, impedimento de longo prazo é aquele que produz efeitos por, no mínimo, 2 anos. A duração é analisada junto com as barreiras enfrentadas.'
    ),

    radio(
      '🤝 Quanto apoio a criança precisa nas atividades do dia a dia?',
      'daily_support',
      [
        opt('Ajuda constante em várias atividades, segurança, comunicação ou cuidados pessoais', 'constant_support', 8, '🫶'),
        opt('Ajuda frequente em algumas atividades', 'frequent_support', 6, '🤝'),
        opt('Ajuda ocasional ou supervisão', 'occasional_support', 3, '👀'),
        opt('Realiza a maioria das atividades esperadas para a idade sem apoio relevante', 'mostly_independent', 0, '✅')
      ],
      'Considere a necessidade de apoio em comparação com outras crianças da mesma idade, incluindo alimentação, higiene, comunicação, deslocamento, segurança e organização da rotina.'
    ),

    radio(
      '🏫 Como o TEA afeta a participação na escola ou em outros ambientes sociais?',
      'school_social_barriers',
      [
        opt('Precisa de acompanhante, adaptação ou apoio especializado documentado', 'specialized_support', 5, '🎓'),
        opt('Enfrenta barreiras frequentes registradas pela escola ou por profissionais', 'documented_barriers', 4, '📋'),
        opt('Há dificuldades, mas ainda não existem registros', 'unrecorded_barriers', 2, '📝'),
        opt('Não há barreiras relevantes percebidas', 'no_relevant_barriers', 0, '✅'),
        opt('Ainda não frequenta a escola por causa da idade', 'not_school_age', 1, '👶')
      ],
      'A análise considera como as barreiras do ambiente dificultam aprendizagem, comunicação, interação e participação, e não somente o diagnóstico.'
    ),

    radio(
      '🩺 A criança precisa de tratamento, terapia, medicamento ou acompanhamento contínuo?',
      'continuous_care',
      [
        opt('Sim, realiza três ou mais acompanhamentos ou usa medicação contínua', 'three_or_more', 4, '✅'),
        opt('Sim, realiza um ou dois acompanhamentos contínuos', 'one_or_two', 3, '🩺'),
        opt('Há indicação, mas a família não consegue acesso ou custeio', 'no_access', 3, '⚠️'),
        opt('Não há tratamento ou acompanhamento contínuo indicado', 'not_indicated', 0, '❌')
      ],
      'Considere terapias e acompanhamentos como fonoaudiologia, terapia ocupacional, psicologia, neurologia, psiquiatria, fisioterapia e nutrição, quando indicados.'
    ),

    input(
      '👤 Qual é o nome do responsável pela criança?',
      'lead_name',
      'Digite seu nome completo',
      'Informe o nome da pessoa responsável pelo preenchimento e pelo contato sobre esta triagem.'
    ),

    input(
      '📱 Qual é o seu número de WhatsApp?',
      'lead_whatsapp',
      '(00) 00000-0000',
      'Preencha com DDD para que a equipe possa entrar em contato caso seja necessário conferir documentos ou informações.'
    ),

    number(
      '👨‍👩‍👧‍👦 Quantas pessoas fazem parte do grupo familiar do BPC?',
      'family_count',
      'Ex.: 4',
      'Em regra, conte apenas quem mora na mesma casa e integra o grupo familiar do BPC: a criança, pais ou padrasto/madrasta, cônjuge ou companheiro, irmãos solteiros, filhos e enteados solteiros e menores tutelados. Nem todo morador entra automaticamente no cálculo.'
    ),

    radio(
      '💰 Em qual faixa está a renda mensal por pessoa do grupo familiar?',
      'income_per_capita',
      [
        opt('Até 1/4 do salário mínimo por pessoa', 'up_to_quarter', 45, '✅'),
        opt('Acima de 1/4 e até 1/2 salário mínimo por pessoa', 'quarter_to_half', 25, '🔎'),
        opt('Acima de 1/2 salário mínimo por pessoa', 'above_half', 0, '📊'),
        opt('Ainda não sei calcular', 'unknown', 8, '❓')
      ],
      'Some as rendas mensais dos integrantes considerados no grupo familiar e divida pelo número dessas pessoas. Alguns benefícios e rendimentos podem ser excluídos, e despesas específicas podem alterar a análise; por isso, responda com a informação mais próxima da realidade.'
    ),

    radio(
      '➖ Existe renda que pode ser desconsiderada no cálculo do BPC?',
      'income_exclusions',
      [
        opt('Sim, outro integrante recebe BPC', 'another_bpc', 4, '✅'),
        opt('Sim, há benefício de até um salário mínimo recebido por pessoa idosa com 65 anos ou mais ou pessoa com deficiência', 'eligible_small_benefit', 4, '✅'),
        opt('Pode existir, mas preciso conferir', 'needs_review', 2, '🔎'),
        opt('Não existe nenhuma dessas situações', 'none', 0, '❌')
      ],
      'Certos valores não entram no cálculo, como outro BPC e, nas hipóteses legais, benefício previdenciário de até um salário mínimo recebido por pessoa idosa com 65 anos ou mais ou pessoa com deficiência.'
    ),

    radio(
      '🧾 A família possui despesas contínuas relacionadas à condição da criança?',
      'continuous_expenses',
      [
        opt('Sim, tenho comprovantes e prova de que o SUS/SUAS não fornece o tratamento ou serviço', 'documented_not_provided', 3, '✅'),
        opt('Sim, tenho recibos, mas ainda não pedi ou comprovei a falta de fornecimento público', 'receipts_only', 2, '🧾'),
        opt('Sim, mas não tenho comprovantes', 'no_proof', 1, '📝'),
        opt('Não há despesas contínuas desse tipo', 'none', 0, '❌')
      ],
      'Podem ser relevantes gastos necessários e contínuos com saúde, médicos, terapias, fraldas, alimentos especiais e medicamentos não fornecidos pelo SUS, ou serviços não prestados pelo SUAS, quando devidamente comprovados.'
    ),

    radio(
      '🇧🇷 A criança reside no Brasil e possui CPF regular?',
      'residency_cpf',
      [
        opt('Sim, reside no Brasil e possui CPF', 'yes', 1, '✅'),
        opt('Reside no Brasil, mas o CPF precisa ser emitido ou regularizado', 'cpf_pending', 0, '⏳'),
        opt('Não reside no Brasil', 'not_resident', 0, '❌')
      ],
      'A residência no Brasil e a identificação pelo CPF fazem parte das verificações do pedido.'
    ),

    radio(
      '🗂️ Como está o CadÚnico e a identificação da família?',
      'cadunico_biometrics',
      [
        opt('CadÚnico atualizado, CPF de todos e biometria disponível', 'all_ready', 2, '✅'),
        opt('CadÚnico existe, mas precisa atualizar algum dado, CPF ou biometria', 'needs_update', 1, '🔄'),
        opt('A família ainda não possui CadÚnico', 'not_registered', 0, '❌'),
        opt('Não sei informar', 'unknown', 0, '❓')
      ],
      'O grupo familiar deve estar inscrito e com dados atualizados no CadÚnico, com CPF de todos. Também é exigido registro biométrico da criança ou, quando não for possível, do responsável legal.'
    )
  ];

  quiz.results = [
    {
      id: 'bpc_tea_25',
      minScore: 0,
      maxScore: 25,
      title: 'Nota de triagem: 25%',
      message: 'Poucos elementos essenciais foram confirmados. Isso não significa que a criança não tenha direito. Reúna laudos, relatórios, dados da renda e do CadÚnico para uma avaliação individual. A pontuação é apenas informativa e não garante resultado.',
      badge: '📋',
      action: { type: 'whatsapp', value: '', label: 'Quero analisar o caso' }
    },
    {
      id: 'bpc_tea_50',
      minScore: 26,
      maxScore: 50,
      title: 'Nota de triagem: 50%',
      message: 'Há elementos que merecem atenção, mas documentação, renda, despesas ou cadastro ainda precisam ser conferidos. Uma análise individual pode identificar informações que o questionário não alcança. A pontuação não garante concessão.',
      badge: '🔎',
      action: { type: 'whatsapp', value: '', label: 'Quero analisar o caso' }
    },
    {
      id: 'bpc_tea_75',
      minScore: 51,
      maxScore: 75,
      title: 'Nota de triagem: 75%',
      message: 'As respostas apresentam indícios relevantes para uma análise detalhada do BPC/LOAS. É necessário conferir laudos, avaliação funcional, composição familiar, renda e CadÚnico. A decisão pertence ao INSS ou ao Judiciário e não pode ser prometida.',
      badge: '⚖️',
      action: { type: 'whatsapp', value: '', label: 'Quero analisar o caso' }
    },
    {
      id: 'bpc_tea_100',
      minScore: 76,
      maxScore: 100,
      title: 'Nota de triagem: 100%',
      message: 'As respostas mostram forte compatibilidade inicial com os principais critérios analisados. O caso merece avaliação prioritária dos documentos e da renda. Esta nota não representa certeza nem promessa de concessão do benefício.',
      badge: '🧩',
      action: { type: 'whatsapp', value: '', label: 'Quero analisar o caso' }
    }
  ];

  quiz.statistics = {
    totalViews: 0,
    totalResponses: 0,
    completionRate: 0,
    averageScore: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  quiz.submissions = [];

  return {
    id: 'template_bpc_tea',
    title: quiz.title,
    description: '15 perguntas com análise em quatro notas: 25%, 50%, 75% e 100%. Inclui contato, renda, documentos, barreiras, CadÚnico e despesas.',
    icon: '🧩',
    category: quiz.category,
    quiz
  };
}
