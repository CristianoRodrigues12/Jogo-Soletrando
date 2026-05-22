# Soletrando

Jogo de soletração em português com três níveis de dificuldade, integração ao [Dicionário Aberto](https://dicionario-aberto.net/) e interface moderna em React.

## Login e cadastro

Na tela inicial use **Entrar** ou **Criar conta** para registrar novo usuário e senha.

| Campo | Valor padrão (conta inicial) |
|-------|----------------|
| Usuário | `admin` |
| Senha | `soletrando123` |

Regras do cadastro: usuário com 3+ caracteres (letras, números, `.` `_` `-`); senha com 6+ caracteres.

No login, escolha o perfil:
- **Apresentador** — vê a palavra, controla certo/errado e ranking
- **Jogador** — palavra oculta, ouve dicas por áudio, soletra por voz

## Funcionalidades

- **Níveis:** fácil, médio e difícil (listas de palavras por complexidade)
- **Dicionário:** definição, etimologia (origem) e exemplos em frase (opcionais)
- **Modo jogador:** reconhecimento de voz (Chrome/Edge), palavra não exibida
- **Autenticação:** JWT com perfil apresentador ou jogador

## Requisitos

- Node.js 18+

## Como executar

### Backend (porta 3001)

```bash
cd backend
npm install
npm run dev
```

### Frontend (porta 5173)

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) no navegador.

## Estrutura

```
Soletrando/
├── backend/          # API Express
│   └── src/
│       ├── data/words.json
│       ├── routes/words.js
│       └── services/dictionary.js
└── frontend/         # React + Vite
    └── src/
        └── App.jsx
```

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/words/levels` | Lista níveis |
| GET | `/api/words/random?level=easy&details=true` | Palavra aleatória |
| GET | `/api/words/:word/details` | Detalhes do dicionário |
| POST | `/api/words/validate` | Valida soletração `{ attempt, answer }` |

## Licença

Projeto educacional. Definições via Dicionário Aberto (domínio público / uso aberto).
