import express from 'express';
import cors from 'cors';
import { wordsRouter } from './routes/words.js';
import { authRouter } from './routes/auth.js';
import { playerRouter } from './routes/player.js';
import { requireAuth, requireRole } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (corsOrigins.length > 0) {
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origem não permitida pelo CORS'));
        }
      },
    })
  );
} else {
  app.use(cors());
}

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'Soletrando API' });
});

app.use('/api/auth', authRouter);
app.use('/api/words', requireAuth, requireRole('presenter'), wordsRouter);
app.use('/api/player', requireAuth, requireRole('player'), playerRouter);

const server = app.listen(PORT, () => {
  console.log(`Soletrando API rodando em http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`
Erro: a porta ${PORT} já está em uso.

Outra instância do backend já está rodando. Você pode:

  1) Usar o backend que já está ativo (http://localhost:${PORT}/api/health)
  2) Liberar a porta no PowerShell:

     netstat -ano | findstr :${PORT}
     taskkill /PID <numero_da_ultima_coluna> /F

  3) Usar outra porta:  $env:PORT=3002; npm run dev
`);
    process.exit(1);
  }
  throw err;
});
