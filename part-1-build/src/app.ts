import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import { swaggerSpec } from './docs/swagger';
import router from './routes';
import { errorHandler } from './middleware/error.middleware';
import { sendSuccess } from './utils/apiResponse';

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use(morgan('dev'));

// Health check
app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok' });
});

// API routes
app.use('/', router);

// Swagger UI — interactive docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Global error handler — must be registered last
app.use(errorHandler);

export default app;
