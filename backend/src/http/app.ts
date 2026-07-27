import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import gamesRoutes from './routes/games.routes.js';
import fairnessRoutes from './routes/fairness.routes.js';
import adminRoutes from './routes/admin.routes.js';
import auditRoutes from './routes/audit.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security & Parsing Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Health Check Endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', network: 'chipnet', timestamp: Date.now() });
});

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/games', gamesRoutes);
app.use('/api/v1/fairness', fairnessRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/audit', auditRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

import { startBackgroundDepositScanner } from '../services/wallet.service.js';

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 BingoPlus Satoshi Backend running on http://localhost:${PORT}`);
    console.log(`🔗 Chipnet environment initialized`);
    if (process.env.DEPOSIT_SCAN_ENABLED !== 'false') {
      startBackgroundDepositScanner(10000);
    }
  });
}

export default app;
