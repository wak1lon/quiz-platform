# QuizPlatform

Plataforma web para criação, gestão, publicação e análise de quizzes interativos, preparada para GitHub Pages e Firebase/Firestore.

## Recursos

- Dashboard com métricas e quizzes recentes.
- Criação e gestão de múltiplos quizzes.
- Editor com drag & drop e painel de propriedades.
- Campos de resposta: radio, checkbox, texto, textarea, número, data, upload, rating, slider, select e opções com imagem.
- Elementos de estrutura, navegação e resultado.
- Regras condicionais de exibição.
- Personalização de cores, fontes, logo, favicon, fundos, botões e cards.
- Configurações de progresso, voltar, autosave, tempo limite e tentativas.
- GTM, Meta Pixel, Google Analytics, webhook, email e WhatsApp.
- Resultados, estatísticas e exportação CSV.
- Templates prontos.
- Publicação por link, iframe, QR Code e compartilhamento.
- Responsivo para desktop e mobile.
- `localStorage` como fallback quando Firebase não estiver configurado.
- Firestore com respostas em subcoleção privada.
- Login administrativo por Firebase Authentication quando ativado.

## Estrutura

```text
quiz-platform/
├── index.html
├── 404.html
├── admin/
│   └── index.html
├── quiz/
│   └── index.html
├── assets/
│   ├── css/
│   ├── js/
│   │   └── admin-parts/
│   └── images/
├── data/
├── firebase/
├── .github/workflows/pages.yml
├── firebase.json
└── README.md
```

## GitHub Pages

O workflow `.github/workflows/pages.yml` publica a branch `main` usando GitHub Actions.

No GitHub, abra **Settings → Pages** e em **Build and deployment** escolha **GitHub Actions**.

Endereço esperado:

```text
https://wak1lon.github.io/quiz-platform/
```

Painel administrativo:

```text
https://wak1lon.github.io/quiz-platform/admin/
```

Quiz publicado:

```text
https://wak1lon.github.io/quiz-platform/quiz/?slug=previdenciario
```

## Incorporar no site

```html
<iframe
  src="https://wak1lon.github.io/quiz-platform/quiz/?slug=previdenciario"
  width="100%"
  height="700"
  style="border:0;width:100%;"
  loading="lazy"
  allow="clipboard-write">
</iframe>
```

## Firebase

A plataforma funciona sem Firebase usando `localStorage`. Para sincronização entre dispositivos:

1. Crie um projeto no Firebase.
2. Ative Firestore.
3. Ative Authentication por Email/Senha.
4. Preencha `assets/js/firebase-config.js` e altere `enabled` para `true`.
5. Publique `firebase/firestore.rules` e `firebase/firestore.indexes.json`.
6. Crie um usuário administrador no Firebase Authentication.

Não coloque service accounts, chaves privadas, tokens secretos ou senhas no repositório.

## Tracking

Eventos emitidos pelo quiz público:

- `quiz_view`
- `quiz_start`
- `quiz_answer`
- `quiz_complete`

## Webhook

Ao concluir o quiz, os dados podem ser enviados via JSON para a URL configurada nas integrações do quiz.
