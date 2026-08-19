import { blankQuiz, makeQuestion, uid } from './defaults.js';

function opt(label,value,weight=0,icon='',image=''){
  return {id:uid('opt'),label,value,weight,icon,image};
}

function choice(label,id,options,description=''){
  const question=makeQuestion('radio',label);
  question.id=id;
  question.required=true;
  question.description=description;
  question.options=options;
  return question;
}

function imageChoice(label,id,options,description=''){
  const question=makeQuestion('image-options',label);
  question.id=id;
  question.required=true;
  question.description=description;
  question.autoAdvance=true;
  question.options=options;
  return question;
}

export function createAdvogadoPrevidenciarioTemplate(){
  const quiz=blankQuiz();
  const now=new Date().toISOString();

  quiz.id=uid('template');
  quiz.title='Mapa de Crescimento para Advogados Previdenciários';
  quiz.slug='';
  quiz.description='Quiz de qualificação em 8 etapas para identificar o momento de marketing, vendas e estrutura do escritório previdenciário.';
  quiz.category='Marketing Jurídico · Previdenciário';
  quiz.tags=['advogado previdenciário','marketing jurídico','qualificação','faturamento','estrutura comercial'];
  quiz.status='draft';

  quiz.settings={
    ...quiz.settings,
    showWelcome:true,
    showProgress:true,
    showQuestionNumber:true,
    allowBack:true,
    autoSave:true,
    maxAttempts:10
  };

  quiz.messages={
    ...quiz.messages,
    welcome:'Seu escritório previdenciário está preparado para crescer com mais previsibilidade? Responda 8 perguntas rápidas e descubra o estágio atual da sua estrutura.',
    requiredError:'Escolha uma opção para avançar.',
    completion:'Diagnóstico concluído. Use o resultado como orientação inicial para organizar os próximos passos do seu marketing.',
    attemptLimit:'Você atingiu o limite de tentativas deste diagnóstico.'
  };

  quiz.design={
    ...quiz.design,
    primaryColor:'#003347',
    secondaryColor:'#0B6E79',
    backgroundColor:'#F4F8F9',
    textColor:'#003347',
    accentColor:'#4AE1BB',
    successColor:'#16A085',
    buttonBackground:'#003347',
    buttonText:'#FFFFFF',
    buttonRadius:12,
    cardRadius:20,
    cardPadding:32
  };

  quiz.questions=[
    imageChoice(
      'Como você se identifica?',
      'lawyer_gender',
      [
        opt('Homem','homem',0,'','../assets/images/templates/advogado-homem.svg'),
        opt('Mulher','mulher',0,'','../assets/images/templates/advogada-mulher.svg')
      ],
      'Toque diretamente na imagem para selecionar.'
    ),
    choice(
      'Qual é a sua principal área de atuação hoje?',
      'practice_area',
      [
        opt('Previdenciário','previdenciario',16,'⚖️'),
        opt('Previdenciário e outras áreas','previdenciario_outras',12,'📚'),
        opt('Trabalhista','trabalhista',5,'💼'),
        opt('Cível ou Família','civel_familia',4,'🏛️'),
        opt('Outra área jurídica','outra_area',2,'📋')
      ]
    ),
    choice(
      'Qual é o faturamento médio mensal do escritório?',
      'monthly_revenue',
      [
        opt('Até R$ 10 mil','ate_10_mil',2,'📈'),
        opt('De R$ 10 mil a R$ 30 mil','10_a_30_mil',6,'📈'),
        opt('De R$ 30 mil a R$ 80 mil','30_a_80_mil',10,'📈'),
        opt('De R$ 80 mil a R$ 150 mil','80_a_150_mil',14,'📈'),
        opt('Acima de R$ 150 mil','acima_150_mil',18,'📈')
      ],
      'Considere a média dos últimos meses.'
    ),
    choice(
      'Você já anunciou o escritório pela internet?',
      'paid_traffic_history',
      [
        opt('Nunca anunciei','nunca',2,'🌱'),
        opt('Já anunciei, mas não tive retorno claro','sem_retorno',6,'🔎'),
        opt('Anuncio em alguns períodos','alguns_periodos',10,'📅'),
        opt('Anuncio de forma contínua','continuo',14,'🚀')
      ]
    ),
    choice(
      'Hoje você conta com videomaker ou social media?',
      'content_structure',
      [
        opt('Tenho videomaker e social media','ambos',12,'🎬'),
        opt('Tenho apenas um dos dois','apenas_um',9,'📱'),
        opt('Contrato freelancer quando preciso','freelancer',6,'🤝'),
        opt('Ainda não tenho nenhum','nenhum',2,'⏳')
      ]
    ),
    choice(
      'Como é formada a equipe do escritório?',
      'team_size',
      [
        opt('Trabalho sozinho','sozinho',2,'👤'),
        opt('Tenho um sócio ou parceiro','socio_parceiro',5,'👥'),
        opt('Equipe de 2 a 3 pessoas','2_a_3',8,'👥'),
        opt('Equipe de 4 a 7 pessoas','4_a_7',11,'🏢'),
        opt('Equipe com 8 pessoas ou mais','8_ou_mais',14,'🏢')
      ]
    ),
    choice(
      'Como você acompanha e converte os contatos que chegam?',
      'sales_structure',
      [
        opt('Tenho CRM e processo de vendas definido','crm_e_processo',14,'✅'),
        opt('Tenho processo, mas não uso CRM','processo_sem_crm',9,'📋'),
        opt('Uso CRM, mas o processo ainda não é claro','crm_sem_processo',7,'🧩'),
        opt('Ainda não tenho estrutura comercial','sem_estrutura',2,'🛠️')
      ]
    ),
    choice(
      'Quando você pretende melhorar a captação do escritório?',
      'implementation_timing',
      [
        opt('Quero começar agora','agora',12,'⚡'),
        opt('Nos próximos 30 dias','30_dias',9,'📆'),
        opt('Nos próximos 3 meses','3_meses',5,'🗓️'),
        opt('Estou apenas pesquisando','pesquisando',1,'🔍')
      ],
      'Escolha a opção que melhor representa o seu momento atual.'
    )
  ];

  quiz.results=[
    {
      id:uid('result'),minScore:0,maxScore:29,
      title:'Estrutura em fase inicial',
      message:'Seu escritório tem oportunidades de organizar posicionamento, conteúdo e processo comercial antes de acelerar a captação. Um plano simples e consistente pode dar mais clareza aos próximos passos.',
      badge:'🧭',
      action:{type:'whatsapp',value:'',label:'Solicitar uma análise'}
    },
    {
      id:uid('result'),minScore:30,maxScore:59,
      title:'Base pronta para organizar a aquisição',
      message:'Você já possui alguns elementos importantes, mas ainda pode integrar tráfego, conteúdo, funil e acompanhamento comercial para reduzir perdas e ganhar consistência.',
      badge:'📊',
      action:{type:'whatsapp',value:'',label:'Solicitar uma análise'}
    },
    {
      id:uid('result'),minScore:60,maxScore:79,
      title:'Bom momento para ganhar previsibilidade',
      message:'A estrutura atual permite trabalhar uma estratégia mais coordenada de captação, qualificação e vendas. O próximo passo é transformar ações isoladas em um processo mensurável.',
      badge:'🎯',
      action:{type:'whatsapp',value:'',label:'Solicitar uma análise'}
    },
    {
      id:uid('result'),minScore:80,maxScore:100,
      title:'Estrutura preparada para escalar',
      message:'Seu escritório demonstra maturidade operacional para testar e otimizar uma aquisição mais previsível. A evolução dependerá de estratégia, acompanhamento de dados e execução comercial consistente.',
      badge:'🚀',
      action:{type:'whatsapp',value:'',label:'Solicitar uma análise'}
    }
  ];

  quiz.resultSettings={...quiz.resultSettings,showPercentage:true,showFeedback:true};
  quiz.integrations={
    ...quiz.integrations,
    whatsappMessage:'Olá! Concluí o Mapa de Crescimento para Advogados Previdenciários e quero entender os próximos passos para o meu escritório.'
  };
  quiz.statistics={totalViews:0,totalResponses:0,completionRate:0,averageScore:0,createdAt:now,updatedAt:now};
  quiz.submissions=[];

  return {
    id:'template_advogado_previdenciario',
    title:quiz.title,
    description:'8 etapas para qualificar área de atuação, faturamento, anúncios, conteúdo, equipe, CRM e momento de investimento.',
    icon:'⚖️',
    category:quiz.category,
    quiz
  };
}
