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

function input(label, id, placeholder = '', description = '') {
  const question = makeQuestion('input', label);
  question.id = id;
  question.required = true;
  question.placeholder = placeholder;
  question.description = description;
  return question;
}

export function createIncapacidadeNegadoTemplate() {
  const quiz = blankQuiz();

  quiz.id = uid('template');
  quiz.title = 'Triagem — Benefício por Incapacidade Negado';
  quiz.slug = '';
  quiz.description = 'Triagem inicial com 10 perguntas para quem teve auxílio ou aposentadoria por incapacidade negados pelo INSS.';
  quiz.category = 'Jurídico · Benefício por Incapacidade';
  quiz.tags = ['benefício negado', 'incapacidade', 'auxílio-doença', 'aposentadoria por invalidez', 'INSS'];
  quiz.status = 'draft';

  quiz.settings.showWelcome = true;
  quiz.settings.showProgress = true;
  quiz.settings.showQuestionNumber = true;
  quiz.settings.allowBack = true;
  quiz.settings.autoSave = true;
  quiz.settings.maxAttempts = 10;

  quiz.messages.welcome = 'O INSS negou seu benefício por incapacidade? Responda às 10 perguntas para uma triagem inicial. Tenha em mãos a decisão do INSS e seus documentos médicos, se possível.';
  quiz.messages.requiredError = 'Selecione ou preencha uma resposta para continuar a triagem.';
  quiz.messages.completion = 'Triagem concluída. A nota é apenas uma indicação inicial e não garante recurso, processo ou concessão do benefício.';
  quiz.settings.thankYouMessage = 'Obrigado pelas informações. Nossa equipe poderá entrar em contato para entender a negativa e conferir os documentos do caso.';

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
    radio(
      '📄 Qual benefício foi negado ou encerrado pelo INSS?',
      'incapacity_benefit_type',
      [
        opt('Auxílio por incapacidade temporária, antigo auxílio-doença', 'temporary_denied', 5, '🩺'),
        opt('Aposentadoria por incapacidade permanente, antiga aposentadoria por invalidez', 'permanent_denied', 5, '♿'),
        opt('Meu benefício foi encerrado após perícia ou revisão', 'benefit_ceased', 5, '⚠️'),
        opt('Não sei identificar qual benefício consta na decisão', 'unknown_benefit', 2, '❓')
      ],
      'O auxílio por incapacidade temporária é destinado à incapacidade por período limitado. A aposentadoria por incapacidade permanente exige incapacidade para o trabalho sem possibilidade de reabilitação para atividade que garanta subsistência.'
    ),

    radio(
      '🗓️ Quando você tomou conhecimento da decisão do INSS?',
      'denial_notice_date',
      [
        opt('Há até 30 dias', 'within_thirty_days', 10, '✅'),
        opt('Há mais de 30 dias e tenho a decisão', 'over_thirty_days', 5, '📄'),
        opt('Recebi a informação, mas não sei a data exata', 'date_unknown', 2, '❓'),
        opt('Ainda não consegui acessar a decisão', 'decision_unavailable', 1, '🔎')
      ],
      'Em regra, o recurso administrativo à Junta de Recursos pode ser apresentado em até 30 dias após a ciência da decisão. Depois desse período, outras possibilidades ainda podem depender da análise do caso; por isso, guarde a carta ou o resultado do Meu INSS.'
    ),

    radio(
      '🚫 Sua condição de saúde ainda impede você de trabalhar?',
      'current_work_incapacity',
      [
        opt('Sim, estou totalmente incapaz para minha atividade atual', 'unable_current_job', 25, '✅'),
        opt('Sim, não consigo exercer nenhuma atividade e não vejo possibilidade de reabilitação', 'unable_any_job', 25, '♿'),
        opt('Consigo trabalhar apenas com limitações ou adaptações importantes', 'partial_limitations', 12, '⚠️'),
        opt('Recuperei a capacidade e já consigo trabalhar normalmente', 'recovered', 0, '❌')
      ],
      'O diagnóstico sozinho não define o direito. A análise considera como a doença ou lesão afeta, na prática, as tarefas da profissão, a duração do afastamento e a possibilidade de reabilitação.'
    ),

    radio(
      '🩻 Como estão seus documentos médicos atuais?',
      'medical_evidence',
      [
        opt('Tenho atestado ou relatório recente, detalhado e assinado, com limitações e tempo de afastamento', 'detailed_recent_report', 20, '✅'),
        opt('Tenho relatórios, exames ou receitas, mas faltam detalhes sobre a incapacidade', 'partial_medical_documents', 10, '📑'),
        opt('Tenho somente documentos antigos ou receitas simples', 'old_or_simple_documents', 4, '📝'),
        opt('Não tenho documentos médicos', 'no_medical_documents', 0, '❌')
      ],
      'Um documento útil costuma identificar o profissional, a data, o diagnóstico quando cabível, as limitações funcionais, o tratamento e o período estimado de afastamento. Exames devem ser relacionados às tarefas do trabalho.'
    ),

    radio(
      '🛡️ Como estava sua situação no INSS quando a incapacidade começou?',
      'insured_status',
      [
        opt('Eu estava contribuindo, empregado ou recebendo benefício previdenciário', 'active_insured', 15, '✅'),
        opt('Eu tinha parado de contribuir recentemente e posso estar no período de graça', 'possible_grace_period', 8, '⏳'),
        opt('Sou trabalhador rural segurado especial e tenho provas da atividade', 'rural_special_insured', 12, '🌾'),
        opt('Fazia muito tempo que eu não contribuía nem exercia atividade coberta pelo INSS', 'not_insured', 0, '❌'),
        opt('Não sei informar', 'insured_status_unknown', 3, '❓')
      ],
      'Qualidade de segurado é o vínculo de proteção com o INSS. Ela pode continuar por algum tempo mesmo após a última contribuição, no chamado período de graça, cuja duração depende do histórico da pessoa.'
    ),

    radio(
      '🔢 Você cumpriu a carência exigida para o benefício?',
      'incapacity_waiting_period',
      [
        opt('Tenho pelo menos 12 contribuições antes da incapacidade', 'twelve_contributions', 10, '✅'),
        opt('A incapacidade decorre de acidente ou de situação que pode dispensar carência', 'possible_exemption', 10, '⚠️'),
        opt('Tenho menos de 12 contribuições e não houve acidente', 'under_twelve', 2, '📉'),
        opt('Não sei quantas contribuições tenho', 'contributions_unknown', 3, '❓')
      ],
      'Carência é o número mínimo de contribuições exigidas. A regra geral para benefícios por incapacidade é de 12 contribuições, mas acidentes e algumas doenças previstas em norma podem dispensá-la. Isso deve ser conferido no histórico do segurado.'
    ),

    radio(
      '🧬 Quando surgiu a doença ou lesão que causa a incapacidade?',
      'condition_onset',
      [
        opt('Começou depois que passei a ter cobertura do INSS', 'after_insurance', 10, '✅'),
        opt('Já existia, mas piorou e passou a impedir o trabalho depois da filiação', 'worsened_after_insurance', 10, '📈'),
        opt('Resultou de acidente de qualquer natureza', 'accident', 10, '⚠️'),
        opt('Já causava incapacidade antes de eu me filiar ao INSS e não houve agravamento', 'preexisting_without_worsening', 0, '❌'),
        opt('Não sei definir quando começou', 'onset_unknown', 2, '❓')
      ],
      'Doença anterior à filiação não impede automaticamente o benefício. O ponto importante é verificar se a incapacidade surgiu depois ou se houve agravamento comprovado após a pessoa passar a ter cobertura previdenciária.'
    ),

    radio(
      '🔎 Qual motivo aparece na decisão de negativa?',
      'denial_reason',
      [
        opt('O INSS disse que não constatou incapacidade, mas continuo sem conseguir trabalhar', 'no_incapacity_found', 5, '⚠️'),
        opt('Faltaram documentos, informações ou comparecimento', 'missing_information', 3, '📂'),
        opt('O problema indicado foi qualidade de segurado ou carência', 'insured_or_waiting_issue', 2, '🛡️'),
        opt('Não entendi o motivo da decisão', 'reason_unknown', 1, '❓')
      ],
      'O motivo exato da negativa direciona a análise. É importante comparar a decisão, o laudo da perícia, o CNIS, a profissão exercida e os documentos médicos apresentados.'
    ),

    input(
      '👤 Qual é o seu nome completo?',
      'lead_name',
      'Digite seu nome completo',
      'Informe o nome da pessoa que teve o benefício negado ou encerrado.'
    ),

    input(
      '📱 Qual é o seu número de WhatsApp?',
      'lead_whatsapp',
      '(00) 00000-0000',
      'Preencha com DDD para que a equipe possa entrar em contato e conferir a decisão e os documentos.'
    )
  ];

  quiz.results = [
    {
      id: 'incapacity_denied_25', minScore: 0, maxScore: 25,
      title: 'Nota de triagem: 25%', badge: '📋',
      message: 'As respostas ainda mostram poucos elementos para contestar a negativa. Isso não significa que não exista direito. A decisão, o CNIS e os documentos médicos precisam ser conferidos para identificar o motivo e as opções possíveis.',
      action: { type: 'whatsapp', value: '', label: 'Quero analisar a negativa' }
    },
    {
      id: 'incapacity_denied_50', minScore: 26, maxScore: 50,
      title: 'Nota de triagem: 50%', badge: '🔎',
      message: 'Há pontos que merecem avaliação, mas podem existir falhas nos documentos médicos, na carência ou na qualidade de segurado. A data da ciência da decisão também deve ser conferida rapidamente.',
      action: { type: 'whatsapp', value: '', label: 'Quero analisar a negativa' }
    },
    {
      id: 'incapacity_denied_75', minScore: 51, maxScore: 75,
      title: 'Nota de triagem: 75%', badge: '🩺',
      message: 'As respostas indicam elementos relevantes para revisar a negativa. É necessário confrontar as limitações atuais com a profissão, a perícia, o CNIS e os relatórios médicos antes de escolher a medida adequada.',
      action: { type: 'whatsapp', value: '', label: 'Quero analisar a negativa' }
    },
    {
      id: 'incapacity_denied_100', minScore: 76, maxScore: 100,
      title: 'Nota de triagem: 100%', badge: '⚖️',
      message: 'As respostas mostram forte compatibilidade inicial para uma análise prioritária da negativa. A conclusão depende dos documentos, da perícia e do histórico previdenciário. Esta nota não garante recurso, ação ou concessão do benefício.',
      action: { type: 'whatsapp', value: '', label: 'Quero analisar a negativa' }
    }
  ];

  quiz.statistics = {
    totalViews: 0, totalResponses: 0, completionRate: 0, averageScore: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  quiz.submissions = [];

  return {
    id: 'template_incapacidade_negado',
    title: quiz.title,
    description: '10 perguntas com nota em quatro níveis: 25%, 50%, 75% e 100%. Inclui negativa, prazo, incapacidade, documentos, carência e contato.',
    icon: '🩺',
    category: quiz.category,
    quiz
  };
}
