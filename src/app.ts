import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { prisma } from './config/database.js';
import { swaggerSpec, swaggerUiOptions } from './config/swagger.js';
import authRoutes from './modules/auth/auth.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { generalLimiter } from './middlewares/rateLimit.middleware.js';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api/v1', generalLimiter);

// Root / Welcome Endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Haoxing Core API',
    version: '1.0.0',
    healthCheck: '/api/v1/health',
    apiDocumentation: '/api-docs',
  });
});

// Health Check Endpoint
app.get('/api/v1/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: 'Success connected to database',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server berjalan tetapi gagal terhubung ke database Neon',
      error: error instanceof Error ? error.message : 'Unknown database error',
    });
  }
});

// Swagger API Documentation (Vercel-Ready)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// API Routes
app.use('/api/v1/auth', authRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
