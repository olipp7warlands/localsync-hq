import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { prisma } from './lib/prisma';

// Start BullMQ workers (side effects)
import './jobs/workers/scanWorker';
import './jobs/workers/syncWorker';

import authRoutes from './routes/auth';
import locationRoutes from './routes/locations';
import listingRoutes from './routes/listings';
import alertRoutes from './routes/alerts';
import dashboardRoutes from './routes/dashboard';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    res.status(401).json({ error: 'User session expired — please log in again' });
    return;
  }
  res.json({ user: req.user });
});
app.use('/api/locations', authMiddleware, locationRoutes);
app.use('/api/listings', authMiddleware, listingRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
