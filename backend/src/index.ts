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

// Root route (Status Page)
// Root route (Status Page)
app.get('/', (req, res) => {
  const frontendUrl = allowedOrigins[0] || 'http://localhost:3000';
  const uptime = process.uptime();
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Backend Status</title>
      <style>
        body {
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #ffffff;
          color: #111827;
          padding: 4rem 2rem;
          margin: 0;
          line-height: 1.5;
        }
        .container {
          max-width: 640px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 2rem;
        }
        h1 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: -0.025em;
        }
        .subtitle {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        .status {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
          color: #059669;
          font-weight: 500;
        }
        .status::before {
          content: '';
          display: block;
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
          margin-right: 8px;
        }
        .section {
          margin-bottom: 2.5rem;
        }
        .section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .metrics {
          display: flex;
          gap: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #f3f4f6;
        }
        .metric-label {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }
        .metric-value {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
        }
        .api-list {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
        }
        .api-item {
          display: flex;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f9fafb;
        }
        .method {
          width: 56px;
          font-weight: 500;
        }
        .method.get { color: #2563eb; }
        .method.post { color: #059669; }
        .method.put { color: #d97706; }
        .method.delete { color: #dc2626; }
        .route {
          color: #374151;
        }
        .footer {
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px solid #f3f4f6;
        }
        .btn {
          color: #2563eb;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .btn:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1>typespace-api</h1>
            <div class="subtitle">Core backend services</div>
          </div>
          <div class="status">All systems operational</div>
        </div>

        <div class="metrics">
          <div>
            <div class="metric-label">Uptime</div>
            <div class="metric-value">${formatUptime(uptime)}</div>
          </div>
          <div>
            <div class="metric-label">Node</div>
            <div class="metric-value">${process.version}</div>
          </div>
          <div>
            <div class="metric-label">Env</div>
            <div class="metric-value">${process.env.NODE_ENV || 'development'}</div>
          </div>
        </div>

        <div class="section" style="margin-top: 2rem;">
          <div class="section-title">Available Routes</div>
          <div class="api-list">
            <div class="api-item"><span class="method get">GET</span><span class="route">/health</span></div>
            <div class="api-item"><span class="method post">POST</span><span class="route">/api/auth/register</span></div>
            <div class="api-item"><span class="method post">POST</span><span class="route">/api/auth/login</span></div>
            <div class="api-item"><span class="method get">GET</span><span class="route">/api/auth/me</span></div>
            <div class="api-item"><span class="method get">GET</span><span class="route">/api/documents</span></div>
            <div class="api-item"><span class="method post">POST</span><span class="route">/api/documents</span></div>
            <div class="api-item"><span class="method get">GET</span><span class="route">/api/documents/:id</span></div>
            <div class="api-item"><span class="method put">PUT</span><span class="route">/api/documents/:id</span></div>
            <div class="api-item"><span class="method delete">DELETE</span><span class="route">/api/documents/:id</span></div>
          </div>
        </div>

        <div class="footer">
          <a href="${frontendUrl}" class="btn">&larr; Return to App</a>
        </div>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// Health check route for API polling
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
