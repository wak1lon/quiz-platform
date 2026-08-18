import { blankQuiz, makeQuestion, uid } from './defaults.js';

function opt(label,value,weight=0,icon=''){return {id:uid('opt'),label,value,weight,icon,image:''};}
function radio(label,id,options,required=true){const q=makeQuestion('radio',label);q.id=id;q.required=required;q.options=options;return q;}
function number(label,id,placeholder='0'){const q=makeQuestion('number',label);q.id=id;q.required=true;q.placeholder=placeholder;return q;}
function text(label,id,description=''){const q=makeQuestion('text',label);q.id=id;q.description=description;return q;}

export function createBpcTeaTemplate(){
  const q=blankQuiz();
  q.id=uid('template');
  q.title='Triagem BPC/LOAS — Criança com TEA';
  q.slug='';
  q.description='Modelo de triagem baseado no mapa informado pelo administrador. Não substitui análise jurídica individual.';
  q.category='Jurídico · BPC/LOAS';
  q.tags=['BPC','LOAS','TEA','criança','triagem'];
  q.status='draft';
  q.settings.showProgress=true;q.settings.allowBack=true;q.settings.maxAttempts=10;
  q.messages.welcome='Responda às perguntas para organizar uma triagem inicial sobre BPC/LOAS para criança com TEA.';
  q.messages.completion='Triagem concluída. O resultado é informativo e deve ser confirmado por análise profissional.';
  q.questions=[
    text('Antes de começar','intro','Este formulário organiza informações sobre deficiência, renda familiar e composição do grupo familiar.'),
    number('Qual é a idade da criança?','child_age','Idade em anos'),
    radio('A criança possui diagnóstico de TEA?','tea_diagnosis',[opt('Sim','sim',15,'✅'),opt('Não','nao',0,'❌')]),
    radio('Há laudo ou documentação médica disponível?','medical_report',[opt('Sim','sim',10,'📄'),opt('Ainda não','nao',0,'⏳')]),
    radio('O impedimento/condição produz limitações de longo prazo na participação social?','long_term',[opt('Sim','sim',20),opt('Não / não sei','nao',0)]),
    number('Quantas pessoas fazem parte do grupo familiar considerado?','family_count','Ex.: 4'),
    radio('O pai recebe aposentadoria?','father_retired',[opt('Sim','sim',0),opt('Não','nao',0)]),
    number('Qual é a idade do pai?','father_age','Ex.: 52'),
    number('Qual é o valor mensal da aposentadoria ou renda do pai?','father_income','R$'),
    radio('A mãe recebe aposentadoria?','mother_retired',[opt('Sim','sim',0),opt('Não','nao',0)]),
    number('Qual é a idade da mãe?','mother_age','Ex.: 48'),
    number('Qual é o valor mensal da aposentadoria ou renda da mãe?','mother_income','R$'),
    number('Qual é o total de outras rendas mensais do grupo familiar?','other_income','R$'),
    radio('Existe Bolsa Família entre as receitas informadas?','bolsa_familia',[opt('Sim','sim',0),opt('Não','nao',0)]),
    radio('Existe outro BPC recebido por idoso ou pessoa com deficiência na família?','other_bpc',[opt('Sim','sim',0),opt('Não','nao',0)]),
    radio('Há pensão alimentícia recebida por alguém do grupo?','alimony',[opt('Sim','sim',0),opt('Não','nao',0)]),
    radio('A família tem gastos elevados e comprováveis com terapia, medicamentos, alimentação especial ou cuidados relacionados à deficiência?','high_costs',[opt('Sim','sim',20),opt('Não','nao',0)]),
    radio('O CadÚnico está atualizado?','cadunico',[opt('Sim','sim',10),opt('Não / não sei','nao',0)]),
    text('Observação sobre renda','income_note','O mapa informado considera análise de renda per capita, possíveis exclusões legais e situações que podem exigir recurso ou análise judicial. O sistema não deve emitir conclusão jurídica automática apenas pela renda bruta.'),
    makeQuestion('input','Nome do responsável'),
    makeQuestion('input','WhatsApp para contato')
  ];
  q.questions[q.questions.length-2].id='lead_name';q.questions[q.questions.length-2].required=true;
  q.questions[q.questions.length-1].id='lead_whatsapp';q.questions[q.questions.length-1].required=true;
  q.results=[
    {id:uid('result'),minScore:0,maxScore:39,title:'Análise adicional necessária',message:'As respostas indicam pontos que precisam ser conferidos com documentação, renda familiar e critérios aplicáveis ao caso concreto. Não é uma negativa automática de direito.',badge:'📋',action:{type:'whatsapp',value:'',label:'Solicitar análise'}},
    {id:uid('result'),minScore:40,maxScore:100,title:'Caso com elementos para análise',message:'Há elementos relevantes para uma análise detalhada do BPC/LOAS. A concessão depende da verificação dos requisitos, documentos e avaliação aplicável.',badge:'⚖️',action:{type:'whatsapp',value:'',label:'Solicitar análise'}}
  ];
  q.statistics={totalViews:0,totalResponses:0,completionRate:0,averageScore:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  q.submissions=[];
  return {id:'template_bpc_tea',title:q.title,description:'Triagem organizada de deficiência, renda, grupo familiar, CadÚnico e gastos relacionados ao TEA.',icon:'🧩',category:q.category,quiz:q};
}
