import dotenv from 'dotenv';
import path from 'path';
import { EnvConfig } from '../types';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CORS_ORIGIN',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Environment variable ${envVar} is missing.`);
    process.exit(1);
  }
}

const env: EnvConfig = {
  port: process.env['PORT'] as string,
  nodeEnv: process.env['NODE_ENV'] as string,
  mongoUri: process.env['MONGO_URI'] as string,
  jwt: {
    secret: process.env['JWT_SECRET'] as string,
    expiresIn: process.env['JWT_EXPIRES_IN'] as string,
  },
  corsOrigin: process.env['CORS_ORIGIN'] as string,
};

export default env;
