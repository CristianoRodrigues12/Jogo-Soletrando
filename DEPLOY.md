# Publicar Soletrando (Render + Netlify)

Ordem recomendada: **backend no Render primeiro**, depois **frontend na Netlify**.

## 1. Backend no Render

1. Acesse [render.com](https://render.com) e faça login (pode usar conta GitHub).
2. **New** → **Web Service**.
3. Conecte o repositório `CristianoRodrigues12/Jogo-Soletrando`.
4. Configuração:
   - **Name:** `jogo-soletrando-api` (ou outro; anote a URL gerada)
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
5. **Environment Variables:**
   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | gere uma senha longa aleatória |
   | `FRONTEND_URL` | deixe vazio por agora; preenche após o passo 2 |
6. **Create Web Service** e aguarde o deploy.
7. Teste no navegador: `https://SEU-SERVICO.onrender.com/api/health`  
   Deve retornar `{"status":"ok",...}`.

Anote a URL base, por exemplo:  
`https://jogo-soletrando-api.onrender.com`

---

## 2. Frontend na Netlify

1. Acesse [netlify.com](https://www.netlify.com) e faça login com GitHub.
2. **Add new site** → **Import an existing project** → GitHub → repositório `Jogo-Soletrando`.
3. Configuração (o arquivo `netlify.toml` na raiz já define isso):
   - **Base directory:** `frontend` (ou deixe vazio se usar só o toml da raiz)
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
4. **Environment variables** (Site settings → Environment variables):
   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://SEU-SERVICO.onrender.com/api` |
   
   Use a URL real do Render do passo 1, **com** `/api` no final.
5. **Deploy site**.
6. Anote a URL do site, por exemplo: `https://jogo-soletrando.netlify.app`.

---

## 3. Ligar CORS (Render ← Netlify)

Volte ao **Render** → seu Web Service → **Environment**:

| Key | Value |
|-----|--------|
| `FRONTEND_URL` | `https://SEU-SITE.netlify.app` |

(Sem barra no final.)

Salve — o Render faz redeploy automático.

---

## 4. Testar

1. Abra a URL da Netlify.
2. Crie conta ou entre com usuário cadastrado.
3. Teste modo **Apresentador** e **Jogador**.

Se der erro de rede no login, confira:
- `VITE_API_URL` na Netlify está correta e você fez **novo deploy** depois de alterar a variável.
- `FRONTEND_URL` no Render é exatamente a URL da Netlify (https, sem `/` no fim).

---

## Atualizações futuras

- Push no GitHub → Netlify e Render redeployam sozinhos (se auto-deploy estiver ativo).
- Ao mudar `VITE_API_URL`, faça **Trigger deploy** na Netlify de novo.

## Plano gratuito Render

O serviço free **hiberna** após inatividade; o primeiro acesso pode demorar ~30–60 s.
