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

export function createAposentadoriaRuralTemplate() {
  const quiz = blankQuiz();

  quiz.id = uid('template');
  quiz.title = 'Triagem — Aposentadoria por Idade Rural';
  quiz.slug = '';
  quiz.description = 'Triagem inicial com 10 perguntas sobre idade, atividade rural, tempo trabalhado, documentos e períodos urbanos.';
  quiz.category = 'Jurídico · Previdenciário Rural';
  quiz.tags = ['aposentadoria rural', 'idade rural', 'segurado especial', 'INSS', 'triagem jurídica'];
  quiz.status = 'draft';

  quiz.settings.showWelcome = true;
  quiz.settings.showProgress = true;
  quiz.settings.showQuestionNumber = true;
  quiz.settings.allowBack = true;
  quiz.settings.autoSave = true;
  quiz.settings.maxAttempts = 10;

  quiz.messages.welcome = 'Você pode ter direito à aposentadoria por idade rural? Responda às 10 perguntas com atenção. Esta é uma triagem inicial e não substitui a conferência individual dos documentos.';
  quiz.messages.requiredError = 'Selecione ou preencha uma resposta para continuar a triagem.';
  quiz.messages.completion = 'Triagem concluída. A nota mostra apenas a compatibilidade inicial das respostas e não garante a concessão do benefício.';
  quiz.settings.thankYouMessage = 'Obrigado pelas informações. Nossa equipe poderá entrar em contato para conferir o período rural e os documentos do caso.';

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
      '🎂 Em qual situação de idade você se encontra?',
      'rural_age',
      [
        opt('Mulher com 55 anos ou mais, ou homem com 60 anos ou mais', 'rural_minimum_age', 25, '✅'),
        opt('Mulher entre 50 e 54 anos, ou homem entre 55 e 59 anos', 'close_to_age', 5, '⏳'),
        opt('Mulher com menos de 50 anos, ou homem com menos de 55 anos', 'below_age', 0, '❌'),
        opt('Prefiro confirmar minha idade durante o atendimento', 'age_review', 2, '🔎')
      ],
      'Na aposentadoria exclusivamente rural, a idade mínima é, em regra, 55 anos para a mulher e 60 anos para o homem. Quando é necessário somar tempo rural e urbano, podem existir regras de idade diferentes.'
    ),

    radio(
      '🌾 Qual opção descreve melhor o seu trabalho rural?',
      'rural_worker_type',
      [
        opt('Agricultor familiar, pescador artesanal ou indígena, trabalhando como segurado especial', 'special_insured', 10, '✅'),
        opt('Empregado rural, trabalhador avulso rural ou contribuinte individual rural', 'formal_rural_worker', 10, '📄'),
        opt('Trabalhei parte da vida no campo e parte na cidade', 'mixed_work', 5, '🔄'),
        opt('Não exerci atividade rural', 'no_rural_work', 0, '❌')
      ],
      'Segurado especial é, de forma simplificada, quem trabalha no meio rural em regime de economia familiar, sem estrutura empresarial predominante. Empregados e outros trabalhadores rurais também podem ter direito, conforme as provas e contribuições.'
    ),

    radio(
      '📅 Por quanto tempo você trabalhou em atividade rural?',
      'rural_months',
      [
        opt('15 anos ou mais, ainda que existam intervalos', 'fifteen_or_more', 25, '✅'),
        opt('De 10 a menos de 15 anos', 'ten_to_fourteen', 15, '📆'),
        opt('De 5 a menos de 10 anos', 'five_to_nine', 7, '🗓️'),
        opt('Menos de 5 anos ou não sei informar', 'under_five_or_unknown', 0, '❓')
      ],
      'O requisito geral é comprovar 180 meses de atividade rural, equivalentes a 15 anos. O trabalho pode ter períodos descontínuos, mas cada intervalo precisa ser analisado.'
    ),

    radio(
      '🧑‍🌾 Você ainda trabalhava no meio rural quando pediu o benefício ou quando completou os requisitos?',
      'rural_activity_timing',
      [
        opt('Sim, eu ainda exercia atividade rural', 'active_when_eligible', 10, '✅'),
        opt('Parei depois de completar a idade e o tempo rural necessários', 'stopped_after_requirements', 10, '📌'),
        opt('Parei antes e preciso conferir se ainda mantinha a qualidade de segurado', 'stopped_needs_review', 4, '🔎'),
        opt('Não trabalhava mais no meio rural e ainda não tinha completado os requisitos', 'stopped_before_requirements', 0, '❌')
      ],
      'Para o segurado especial, é importante verificar a atividade rural na data do pedido ou na data em que todos os requisitos foram completados, incluindo eventual período de manutenção da qualidade de segurado.'
    ),

    radio(
      '📚 Quais provas da atividade rural você possui?',
      'rural_evidence',
      [
        opt('Tenho vários documentos de épocas diferentes ligados ao trabalho rural', 'multiple_documents', 12, '✅'),
        opt('Tenho alguns documentos, mas existem períodos sem prova', 'some_documents', 7, '📄'),
        opt('Tenho principalmente testemunhas e poucos documentos', 'few_documents', 2, '👥'),
        opt('Ainda não localizei documentos nem testemunhas', 'no_evidence', 0, '❌')
      ],
      'Podem ajudar documentos como autodeclaração rural, notas de produtor, contratos rurais, cadastro ou imposto da propriedade, registros de sindicato, documentos escolares, certidões e outros registros contemporâneos. A utilidade de cada prova depende do caso.'
    ),

    radio(
      '👨‍👩‍👧‍👦 Como a atividade rural era exercida?',
      'rural_work_structure',
      [
        opt('Em família, para a própria subsistência ou pequena produção, sem empregados permanentes', 'family_economy', 8, '✅'),
        opt('Como empregado rural, com carteira, contrato, recibos ou outros registros', 'rural_employee', 8, '📋'),
        opt('Havia ajuda temporária, outra renda ou situação que precisa ser analisada', 'needs_structure_review', 4, '🔎'),
        opt('Como empresa rural ou com empregados permanentes de forma predominante', 'business_structure', 0, '🏢')
      ],
      'Regime de economia familiar significa que o trabalho dos integrantes da família é essencial para a subsistência e o desenvolvimento do grupo. Tamanho da propriedade, empregados e outras rendas podem exigir análise específica.'
    ),

    radio(
      '🏙️ Você também teve períodos de trabalho ou contribuição urbana?',
      'urban_periods',
      [
        opt('Não, meu período necessário é rural', 'rural_only', 5, '✅'),
        opt('Sim, e já tenho 60 anos se mulher ou 65 anos se homem', 'hybrid_age_reached', 5, '🔄'),
        opt('Sim, mas ainda não alcancei 60 anos se mulher ou 65 anos se homem', 'hybrid_age_not_reached', 2, '⏳'),
        opt('Não sei se meus registros urbanos interferem', 'urban_unknown', 1, '❓')
      ],
      'Quando não há 15 anos apenas de atividade rural, pode ser possível somar períodos rurais e urbanos na aposentadoria híbrida. Essa modalidade costuma exigir 60 anos para a mulher e 65 anos para o homem.'
    ),

    radio(
      '📨 Você já fez pedido de aposentadoria no INSS?',
      'rural_request_status',
      [
        opt('Ainda não pedi e quero organizar os documentos antes', 'not_requested', 5, '📂'),
        opt('Sim, e o pedido foi negado; tenho a decisão do INSS', 'denied_with_decision', 5, '⚠️'),
        opt('O pedido está em análise ou recebi uma exigência', 'pending_or_requirement', 3, '⏳'),
        opt('Já pedi, mas não tenho a decisão nem os documentos', 'requested_no_documents', 0, '❓')
      ],
      'A decisão ou a exigência do INSS ajuda a identificar quais períodos e documentos foram aceitos, desconsiderados ou ainda precisam ser apresentados.'
    ),

    input(
      '👤 Qual é o seu nome completo?',
      'lead_name',
      'Digite seu nome completo',
      'Informe o nome da pessoa que deseja receber a análise inicial.'
    ),

    input(
      '📱 Qual é o seu número de WhatsApp?',
      'lead_whatsapp',
      '(00) 00000-0000',
      'Preencha com DDD para que a equipe possa entrar em contato e conferir as informações da triagem.'
    )
  ];

  quiz.results = [
    {
      id: 'rural_25', minScore: 0, maxScore: 25,
      title: 'Nota de triagem: 25%', badge: '📋',
      message: 'As respostas ainda não confirmam vários requisitos essenciais. Isso não encerra a análise: idade, períodos rurais, atividade na data correta e documentos precisam ser conferidos individualmente. A nota é informativa e não garante resultado.',
      action: { type: 'whatsapp', value: '', label: 'Quero analisar meu caso' }
    },
    {
      id: 'rural_50', minScore: 26, maxScore: 50,
      title: 'Nota de triagem: 50%', badge: '🔎',
      message: 'Existem alguns elementos favoráveis, mas o tempo rural, a idade, a forma de trabalho ou as provas ainda precisam de confirmação. Uma análise documental pode revelar períodos aproveitáveis que o questionário não identifica.',
      action: { type: 'whatsapp', value: '', label: 'Quero analisar meu caso' }
    },
    {
      id: 'rural_75', minScore: 51, maxScore: 75,
      title: 'Nota de triagem: 75%', badge: '🌾',
      message: 'As respostas apresentam compatibilidade relevante com a aposentadoria rural ou com uma possível análise híbrida. É necessário conferir documentos, intervalos e registros do INSS antes de qualquer conclusão.',
      action: { type: 'whatsapp', value: '', label: 'Quero analisar meu caso' }
    },
    {
      id: 'rural_100', minScore: 76, maxScore: 100,
      title: 'Nota de triagem: 100%', badge: '⚖️',
      message: 'As respostas mostram forte compatibilidade inicial com os principais critérios avaliados. O caso merece conferência detalhada dos documentos e do histórico rural. Esta nota não representa certeza nem promessa de concessão pelo INSS ou pelo Judiciário.',
      action: { type: 'whatsapp', value: '', label: 'Quero analisar meu caso' }
    }
  ];

  quiz.statistics = {
    totalViews: 0, totalResponses: 0, completionRate: 0, averageScore: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  quiz.submissions = [];

  return {
    id: 'template_aposentadoria_rural',
    title: quiz.title,
    description: '10 perguntas com nota em quatro níveis: 25%, 50%, 75% e 100%. Inclui idade, tempo rural, documentos, períodos urbanos e contato.',
    icon: '🌾',
    category: quiz.category,
    quiz
  };
}
