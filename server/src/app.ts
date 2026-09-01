import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import env from './config/env';
import errorHandler from './middleware/errorHandler.middleware';
import notFoundHandler from './middleware/notFound.middleware';
import routes from './routes';

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Root Health Check Route
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'VisitorOne API is running perfectly!',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api', routes);

// 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
