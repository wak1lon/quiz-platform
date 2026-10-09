# Auditoria e modernização do Quiz Plataforma

Base: `c97dbf5b7100132a7c4188739fd951c17040a256` (main em 09/10/2026 UTC).
Branch: `perf/quiz-ui-modernization`. Sem merge ou publicação em produção.

## Evidências e alterações

- A Vercel confirmou que o deployment `dpl_ENpaVCo9T3MsbSCkpx6RNbCnyfhK` pertence ao projeto `quiz-platform`, equipe `team_3p1YXFuCEgrzfWhXagc2ubOA`, produção e commit de referência.
- `/assets/js/admin-bundle.js` nesse deployment respondeu **404**. O carregador anterior fazia uma tentativa de bundle antes de buscar 14 fragmentos, concatenar e importar um Blob.
- Agora `admin-bundle.js` é versionado e reproduzível por `npm run build:admin`. Todos os 14 fragmentos continuam como fontes, na ordem original. O carregador usa importação ES nativa. O caminho de carregamento administrativo passa de 15 buscas de código (1 falha + 14 fontes) para 1 módulo gerado, além dos mesmos módulos auxiliares. Não se afirma redução de bytes nem de tempo de rede sem medição no navegador.
- As cinco importações iniciais independentes do painel carregam em paralelo.
- A primeira renderização anteriormente ocorria no fragmento 6, antes de instalar os overrides e filtros nos fragmentos 7–14. A inicialização autenticada foi movida ao fim para que o primeiro Dashboard use as rotinas finais. O requisito de autenticação permanece intacto.
- Firebase App e Firestore agora carregam em paralelo. Chamadas simultâneas de inicialização compartilham uma promessa, com nova tentativa permitida após falha.
- O quiz deixa de aguardar tracking para renderizar. Os eventos ficam em fila e são enviados na ordem original após inicializar tracking. Falha de tracking continua sem bloquear o quiz.
- Foram acrescentados modulepreloads para dependências locais da primeira tela; o SDK Firebase não é pré-carregado no quiz público.
- O HTML público possui estado de carregamento antes da execução do JavaScript.
- Se REST e SDK falharem com Firebase ativo, uma cópia local potencialmente desatualizada deixa de ser exibida. O visitante vê um erro recuperável e um botão para tentar novamente. O modo local com Firebase desativado continua disponível. Nenhum cache persistente de publicação foi adicionado.
- Timeout REST de 9 s, fallback SDK de 9 s, consulta de compatibilidade e envio de respostas foram preservados. Falhas de rede podem portanto continuar prolongadas; os tempos abaixo não justificam reduzir arbitrariamente os limites nem alterar índices/regras.
- `incrementView` continua local. Seu custo não foi isolado nem atribuído como causa.

## Componentes

Referência consultada: https://ui.shadcn.com/docs/components (09/10/2026 UTC).
Equivalentes leves em CSS e JavaScript nativo; sem migração React ou dependência de produção nova.

- Sidebar: ícones SVG locais, alinhamento, estado ativo, indicação acessível de página atual, menu mobile com backdrop, Escape e contenção de foco.
- Cards, indicadores, filtros de período, listas, tabela e badges: hierarquia, espaçamentos, bordas, estados de interação e números tabulares.
- Editor: paleta, perguntas selecionadas, propriedades, abas, ações e foco por teclado, conservando drag/drop e objetos existentes.
- Formulários e switches: labels associados, nomes acessíveis, foco visível, desabilitados e campos mobile.
- Modais: nome acessível, foco inicial, Tab contido, fundo inerte, retorno de foco e Escape para modais com botão de fechamento. Login sem botão de fechamento permanece obrigatório.
- Quiz e preview: foco em campos/alternativas, agrupamento acessível e associação do título ao campo. Erros públicos anunciam validação. CSS público adicional não altera cores, fontes, imagens ou dimensões configuradas.
- Os patchers de publicação de imagens/design foram mantidos. A camada de UI observa apenas mudanças de nós e atributos de navegação; não substitui handlers de upload nem nomes/data-path dos controles.
- Variáveis e paleta globais permanecem intactas. A maior parte da modernização é restrita a `.admin-page`.

## Medições

| Medição | Antes | Depois | Condições / limites |
|---|---:|---:|---|
| Fontes carregadas pelo bootstrap administrativo | 15 buscas (inclui 404) | 1 módulo gerado | Contagem estrutural; não é medição de TTI |
| Primeira tela no harness DOM com tracking artificialmente atrasado 600 ms | 606 ms | 8 ms | Dados REST simulados imediatos, sem layout/pintura/rede reais |
| Consulta pública REST real, primeiro pedido | 6.920 ms | consulta não alterada | Node nesta sessão, inclui conexão inicial; não é tempo de browser |
| Consulta pública REST real, pedidos seguintes | 317 ms / 649 ms | consulta não alterada | Mesma sessão; não é cache de conteúdo de quiz |

Não foram medidos LCP, FCP, INP, TTI, transferência real, SDK alternativo real ou primeira/segunda visita no navegador. Não se oferece uma promessa de porcentagem de ganho em produção. O grande valor inicial de REST pode incluir overhead desta rede de execução e precisa ser comparado com visitantes reais.

## Verificação

`npm run check:bundle`, análise sintática de todos os arquivos JS e `git diff --check`.
`npm test` usa Node VM e LinkeDOM como **dependência exclusiva de desenvolvimento**, sem acesso a contas, writes reais ou alterações das regras Firebase.

Passaram no harness DOM:

- Welcome antes do tracking atrasado e ordem dos eventos preservada.
- Obrigatoriedade, condicionais, imagem, voltar mantendo respostas, consentimento e score.
- Dois documentos REST simulados: início e conclusão.
- Rejeição de cópia local desatualizada quando REST e SDK falham.
- Dashboard inicial com cinco indicadores e filtros de período.
- Quizzes, templates, criação pela paleta, reordenação pelo handler de drop, cinco abas.
- Salvamento e publicação usando repository real com SDK simulado; confirmação do link.
- Pré-visualização do rascunho e telas de resultados, configurações e conexões.
- Ícones, página ativa acessível, labels, nomes dos switches e isolamento do fundo de modal.

Não validados em ambiente real:

- Login Firebase/Google e restauração de sessão.
- Layout e foco em navegadores desktop/mobile, uploads reais e personalizações visuais comparadas por screenshot.
- Escrita/leitura real de respostas, publicação real, permissões/índices, latência de fallback SDK.
- Webhooks, Pixel, GA, GTM, CAPI, WhatsApp/email externos.
- Métricas após respostas reais, exclusões, CSV/VCF e erros parciais.

O navegador Playwright não estava disponível; os downloads de Chromium retornaram HTML em vez de ZIP e não foi possível executar o teste visual. Os testes DOM não substituem navegador. Não houve alterações de regras, índices, estruturas de dados ou URLs públicas.

## Arquivos

- Carregamento: `assets/js/admin.js`, `assets/js/admin-bundle.js`, `scripts/build-admin.mjs`, `assets/js/admin-parts/part01.txt`, `part06.txt`, `part14.txt`, `assets/js/firebase.js`.
- Público: `assets/js/quiz.js`, `assets/js/quiz-bootstrap.js`, `assets/js/public-repository.js`, `assets/js/preview.js`, `quiz/index.html`.
- UI: `assets/js/admin-ui.js`, `admin/index.html`, `assets/css/admin.css`, `responsive.css`, `metrics.css`, `quiz.css`.
- Verificação: `package.json`, `package-lock.json`, `.gitignore`, `scripts/test-regressions.mjs`, este relatório.

## Preview e bloqueio de validação visual

Preview inicial: https://quiz-platform-l53cpkgfj-wakilon-projetos.vercel.app
Deployment: `dpl_C9p56yZXCnHC7xAvcrvFSkzWE5hc`, estado READY, commit `2f0b446e9c7acaae90f003f9d05f2609c9c90011`. A leitura autenticada de `/admin/` retornou HTTP 200 e confirmou `admin-page`, `admin-ui.js` e o preload de `admin-bundle.js`. O domínio de produção foi confirmado como vinculado e verificado na Vercel; os arquivos públicos conferidos coincidiam com a referência antes das mudanças.

O navegador cloud abriu a preview, mas foi redirecionado ao login da Vercel. A revisão automática rejeitou criar um link temporário de acesso por risco de ampliar acesso ao deployment privado. Não foram removidas proteções nem tentados contornos. A interface administrativa completa continua sem inspeção visual real; requer acesso autorizado para concluir.

## Antes de liberar produção

1. Conferir que a branch continua baseada na main atual, sem sobrescrever novas alterações.
2. Validar a versão preview com login autorizado, quizzes de teste, mobile e screenshots.
3. Validar respostas, regras, tracking, integrações e métricas em ambiente apropriado.
4. Comparar navegação cold/warm e rede lenta com os mesmos dados antes/depois.
5. Só então aprovar merge/release. Este PR deve permanecer em rascunho até concluir esses passos.
