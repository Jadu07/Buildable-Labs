import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middlewares/errorMiddleware';
import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(helmet());
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o: string) => o.trim());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware (must be after routes)
app.use(errorHandler);

import { initializeSocket } from './socket';

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

initializeSocket(io);

// Start server
server.listen(env.PORT, () => {
  logger.info(`🚀 Server running on port ${env.PORT}`);
});
