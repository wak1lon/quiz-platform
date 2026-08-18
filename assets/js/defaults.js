export const VERSION = '1.0.0';

export const DEFAULT_GLOBAL_SETTINGS = {
  platformName: 'QuizPlatform',
  primaryColor: '#1E3A8A',
  secondaryColor: '#3B82F6',
  backgroundColor: '#F3F4F6',
  textColor: '#1F2937',
  accentColor: '#F59E0B',
  successColor: '#10B981',
  errorColor: '#EF4444',
  fontFamily: 'Poppins',
  logo: '',
  favicon: '',
  gtmId: '',
  fbPixelId: '',
  gaId: ''
};

export const PALETTE = [
  { type:'title', label:'Título', group:'Estrutura', icon:'📝' },
  { type:'text', label:'Texto/Descrição', group:'Estrutura', icon:'📄' },
  { type:'image', label:'Imagem', group:'Estrutura', icon:'🖼️' },
  { type:'separator', label:'Separador', group:'Estrutura', icon:'➕' },
  { type:'container', label:'Container', group:'Estrutura', icon:'📦' },
  { type:'grid', label:'Grid', group:'Estrutura', icon:'📐' },
  { type:'button', label:'Botão', group:'Estrutura', icon:'🎬' },
  { type:'checkbox', label:'Checkbox', group:'Resposta', icon:'☑️' },
  { type:'radio', label:'Radio', group:'Resposta', icon:'🔘' },
  { type:'input', label:'Texto curto', group:'Resposta', icon:'✍️' },
  { type:'textarea', label:'Texto longo', group:'Resposta', icon:'📝' },
  { type:'number', label:'Número', group:'Resposta', icon:'🔢' },
  { type:'date', label:'Data', group:'Resposta', icon:'📅' },
  { type:'file', label:'Upload', group:'Resposta', icon:'📎' },
  { type:'rating', label:'Rating', group:'Resposta', icon:'⭐' },
  { type:'slider', label:'Slider', group:'Resposta', icon:'📊' },
  { type:'select', label:'Select', group:'Resposta', icon:'🔽' },
  { type:'image-options', label:'Opções com imagem', group:'Resposta', icon:'🖼️' },
  { type:'progress', label:'Barra de progresso', group:'Navegação', icon:'📊' },
  { type:'back', label:'Voltar', group:'Navegação', icon:'⏪' },
  { type:'next', label:'Avançar', group:'Navegação', icon:'⏩' },
  { type:'submit', label:'Enviar', group:'Navegação', icon:'✅' },
  { type:'retry', label:'Refazer', group:'Navegação', icon:'🔄' },
  { type:'percentage', label:'Porcentagem', group:'Resultado', icon:'🎯' },
  { type:'chart', label:'Gráfico', group:'Resultado', icon:'📊' },
  { type:'results-list', label:'Lista de resultados', group:'Resultado', icon:'📋' },
  { type:'badge', label:'Badge/Medalha', group:'Resultado', icon:'🏆' },
  { type:'message', label:'Mensagem', group:'Resultado', icon:'💬' },
  { type:'action', label:'Botão de ação', group:'Resultado', icon:'🔗' }
];

export const RESPONSE_TYPES = new Set(['checkbox','radio','input','textarea','number','date','file','rating','slider','select','image-options']);
export const OPTION_TYPES = new Set(['checkbox','radio','select','image-options']);

export function uid(prefix='id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

export function makeQuestion(type='radio', label='Nova pergunta') {
  const base = {
    id: uid('field'), type, label, description:'', placeholder:'', required:false, visible:true,
    defaultValue:'', multiple:type === 'checkbox', options:[], condition:null,
    style:{ backgroundColor:'#FFFFFF', textColor:'#1F2937', fontSize:16, fontWeight:600, fontFamily:'Poppins', align:'left', margin:0, padding:0, border:false, borderColor:'#E2E8F0', borderWidth:1, borderRadius:12, shadow:false, width:'100%', height:'auto' }
  };
  if (OPTION_TYPES.has(type)) {
    base.options = [
      { id:uid('opt'), label:'Opção 1', value:'opcao_1', icon:'', image:'', weight:0 },
      { id:uid('opt'), label:'Opção 2', value:'opcao_2', icon:'', image:'', weight:0 }
    ];
  }
  if (type === 'image-options') Object.assign(base, { autoAdvance:false });
  if (type === 'rating') Object.assign(base, { min:1, max:5, step:1 });
  if (type === 'slider') Object.assign(base, { min:0, max:100, step:1 });
  if (type === 'title') Object.assign(base, { label:'Título da seção', level:'h2' });
  if (type === 'text') Object.assign(base, { label:'Texto de apoio', description:'Edite este conteúdo nas propriedades.' });
  if (type === 'image') Object.assign(base, { label:'Imagem', imageUrl:'', alt:'Imagem', objectFit:'cover', effect:'none' });
  if (type === 'grid') Object.assign(base, { columns:2, gap:16, verticalAlign:'top', itemsPerRow:2 });
  if (['button','action'].includes(type)) Object.assign(base, { label:'Continuar', actionType:'next', actionValue:'', buttonSize:'medium', icon:'' });
  return base;
}

export function blankQuiz() {
  const now = new Date().toISOString();
  return {
    id: uid('quiz'),
    title:'Novo Quiz', slug:`quiz-${Date.now().toString(36)}`, description:'', status:'draft', category:'', tags:[],
    settings:{ showWelcome:true, showProgress:true, showQuestionNumber:true, allowBack:true, autoSave:true, timeLimit:null, limitByIp:false, maxAttempts:3, thankYouMessage:'Obrigado por responder!' },
    messages:{ welcome:'Bem-vindo! Responda às perguntas para ver seu resultado.', requiredError:'Selecione ou preencha uma resposta para continuar.', completion:'Quiz concluído com sucesso.', timeout:'O tempo do quiz terminou.', attemptLimit:'Você atingiu o limite de tentativas.' },
    resultSettings:{ showPercentage:true, showCorrectAnswers:false, showFeedback:true, redirectUrl:'', emailResult:false, resultEmail:'' },
    design:{ primaryColor:'#1E3A8A', secondaryColor:'#3B82F6', backgroundColor:'#F3F4F6', textColor:'#1F2937', accentColor:'#F59E0B', successColor:'#10B981', errorColor:'#EF4444', fontFamily:'Poppins', titleFont:'Poppins', titleSize:32, titleWeight:700, bodySize:16, bodyWeight:400, logo:'', favicon:'', backgroundImage:'', backgroundPattern:'', buttonBackground:'#1E3A8A', buttonText:'#FFFFFF', buttonRadius:10, buttonShadow:true, cardBackground:'#FFFFFF', cardShadow:true, cardRadius:18, cardPadding:32 },
    integrations:{ gtmId:'', gtmEnabled:false, fbPixelId:'', fbPixelEnabled:false, gaId:'', gaEnabled:false, emailTo:'', emailSubject:'Nova resposta do quiz', webhookUrl:'', webhookMethod:'POST', webhookHeaders:'{}', whatsappNumber:'', whatsappMessage:'Olá! Acabei de responder o quiz.' },
    questions:[makeQuestion('radio','Qual opção melhor descreve você?')],
    results:[{ id:uid('result'), minScore:0, maxScore:100, title:'Resultado', message:'Obrigado por concluir o quiz.', badge:'🏆', action:{ type:'whatsapp', value:'', label:'Falar com Especialista' } }],
    statistics:{ totalViews:0, totalResponses:0, completionRate:0, averageScore:0, createdAt:now, updatedAt:now },
    submissions:[]
  };
}

export const DEMO_QUIZ = (() => {
  const q = blankQuiz();
  q.id = 'quiz_001'; q.title='Quiz Previdenciário'; q.slug='previdenciario'; q.description='Descubra informações importantes sobre o seu perfil previdenciário.'; q.status='published'; q.category='Previdenciário'; q.tags=['previdenciário','triagem'];
  q.messages.welcome = 'Responda algumas perguntas rápidas para entender melhor o seu cenário.';
  q.questions = [
    { ...makeQuestion('radio','Em qual tipo de atividade você trabalhou?'), id:'page_002', required:true, options:[
      {id:'opt_001',label:'Trabalhador da cidade',icon:'🏙️',value:'cidade',image:'',weight:10},
      {id:'opt_002',label:'Trabalhador rural',icon:'🌾',value:'rural',image:'',weight:15}
    ]},
    { ...makeQuestion('select','Por quanto tempo você contribuiu?'), id:'page_003', required:true, options:[
      {id:uid('opt'),label:'Até 15 anos',value:'ate_15',icon:'',image:'',weight:5},
      {id:uid('opt'),label:'15 a 20 anos',value:'15_20',icon:'',image:'',weight:10},
      {id:uid('opt'),label:'20 a 30 anos',value:'20_30',icon:'',image:'',weight:15},
      {id:uid('opt'),label:'Mais de 30 anos',value:'mais_30_anos',icon:'',image:'',weight:20}
    ]},
    { ...makeQuestion('input','Qual é o seu nome?'), id:'lead_name', required:true, placeholder:'Digite seu nome' },
    { ...makeQuestion('input','Qual é o seu WhatsApp?'), id:'lead_whatsapp', required:true, placeholder:'(00) 00000-0000' }
  ];
  q.results = [
    {id:'result_low',minScore:0,maxScore:19,title:'Perfil inicial',message:'Suas respostas indicam que vale aprofundar a análise do seu caso.',badge:'📋',action:{type:'whatsapp',value:'',label:'Falar com Especialista'}},
    {id:'result_001',minScore:20,maxScore:100,title:'Alta Chance',message:'Suas respostas indicam um cenário que merece uma análise detalhada.',badge:'🏆',action:{type:'whatsapp',value:'',label:'Falar com Especialista'}}
  ];
  q.statistics = {totalViews:120,totalResponses:45,completionRate:89,averageScore:76,createdAt:'2026-08-18T10:00:00Z',updatedAt:'2026-08-18T15:30:00Z'};
  q.submissions = [
    {id:'sub_001',answers:{page_002:'cidade',page_003:'mais_30_anos',lead_name:'João Silva'},score:78,completed:true,createdAt:'2026-08-18T11:00:00Z'},
    {id:'sub_002',answers:{page_002:'rural',page_003:'20_30',lead_name:'Maria Santos'},score:92,completed:true,createdAt:'2026-08-18T12:00:00Z'},
    {id:'sub_003',answers:{page_002:'cidade',page_003:'15_20',lead_name:'Pedro Costa'},score:45,completed:true,createdAt:'2026-08-17T18:00:00Z'}
  ];
  return q;
})();

function templateFrom(title, description, icon, category, questions) {
  const q = blankQuiz();
  q.id = uid('template'); q.title=title; q.slug=''; q.description=description; q.category=category; q.questions=questions; q.status='draft'; q.submissions=[]; q.statistics={...q.statistics,totalViews:0,totalResponses:0,completionRate:0,averageScore:0};
  return { id:q.id, title, description, icon, category, quiz:q };
}

export const TEMPLATES = [
  templateFrom('Quiz Previdenciário','Triagem inicial com perguntas de perfil e contato.','📝','Jurídico',[makeQuestion('radio','Qual é o tipo de atividade?'),makeQuestion('select','Quanto tempo de contribuição?'),makeQuestion('input','Nome'),makeQuestion('input','WhatsApp')]),
  templateFrom('Pesquisa de Satisfação','Colete avaliações e comentários dos usuários.','📊','Pesquisa',[makeQuestion('rating','Como você avalia sua experiência?'),makeQuestion('textarea','Conte mais sobre sua experiência')]),
  templateFrom('Teste Vocacional','Organize respostas com pesos e resultados por faixa.','🎯','Educação',[makeQuestion('radio','Qual atividade você mais gosta?'),makeQuestion('radio','Como prefere trabalhar?')]),
  templateFrom('Formulário de Contato','Captação simples de nome, e-mail, telefone e mensagem.','💼','Leads',[makeQuestion('input','Nome'),makeQuestion('input','E-mail'),makeQuestion('input','Telefone'),makeQuestion('textarea','Mensagem')]),
  templateFrom('Teste de Personalidade','Estrutura de perguntas com pontuação e resultado.','❤️','Perfil',[makeQuestion('radio','Como você reage a novos desafios?'),makeQuestion('radio','Qual ambiente prefere?')]),
  templateFrom('Quiz Educacional','Perguntas objetivas com feedback e pontuação.','🎓','Educação',[makeQuestion('radio','Pergunta 1'),makeQuestion('radio','Pergunta 2'),makeQuestion('radio','Pergunta 3')]),
  templateFrom('Quiz de Saúde','Questionário informativo com campos variados.','🏥','Saúde',[makeQuestion('radio','Selecione uma opção'),makeQuestion('number','Informe um valor'),makeQuestion('textarea','Observações')]),
  templateFrom('Quiz Gamer','Experiência leve com opções, imagens e resultado.','🎮','Entretenimento',[makeQuestion('image-options','Escolha seu estilo de jogo'),makeQuestion('radio','Qual plataforma você usa?')])
];
