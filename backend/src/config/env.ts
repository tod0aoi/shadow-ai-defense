import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const defaultSqliteDir = process.env.LOCALAPPDATA
  ? path.resolve(process.env.LOCALAPPDATA, 'shadow_ai_defense')
  : path.resolve(__dirname, '../../database');

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-shadow-ai-jwt-secret-do-not-use-in-prod!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  dbType: (process.env.DB_TYPE || 'sqlite').toLowerCase(),
  databaseUrl: process.env.DATABASE_URL || '',
  sqlitePath: process.env.SQLITE_DB_PATH || path.join(defaultSqliteDir, 'shadow_ai.db'),
  detectionServiceUrl: process.env.DETECTION_SERVICE_URL || 'http://localhost:8000',
};
