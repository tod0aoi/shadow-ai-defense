"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const defaultSqliteDir = path_1.default.resolve(process.env.LOCALAPPDATA || 'C:/Users/Admin/AppData/Local', 'shadow_ai_defense');
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'dev-shadow-ai-jwt-secret-do-not-use-in-prod!',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    dbType: (process.env.DB_TYPE || 'sqlite').toLowerCase(),
    databaseUrl: process.env.DATABASE_URL || '',
    sqlitePath: process.env.SQLITE_DB_PATH || path_1.default.join(defaultSqliteDir, 'shadow_ai.db'),
    detectionServiceUrl: process.env.DETECTION_SERVICE_URL || 'http://localhost:8000',
};
