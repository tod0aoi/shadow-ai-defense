"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.sha256 = sha256;
exports.maskEvidence = maskEvidence;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
/**
 * Hashes a plaintext password using bcrypt with configurable salt rounds.
 */
async function hashPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(env_1.config.bcryptSaltRounds);
    return bcryptjs_1.default.hash(password, salt);
}
/**
 * Compares plaintext password against a stored bcrypt hash.
 */
async function comparePassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
/**
 * Generates signed JWT for authenticated sessions.
 */
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.config.jwtSecret, {
        expiresIn: env_1.config.jwtExpiresIn,
    });
}
/**
 * Verifies and decodes a signed JWT.
 */
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret);
}
/**
 * Computes deterministic SHA-256 hash of a string.
 * Used for prompt deduplication and integrity verification without storing raw secrets.
 */
function sha256(text) {
    return crypto_1.default.createHash('sha256').update(text, 'utf8').digest('hex');
}
/**
 * Irreversibly masks sensitive evidence for SOC analyst review.
 * Preserves initial and trailing characters for debugging context while redacting secrets.
 * Example: 'AKIAIOSFODNN7EXAMPLE' -> 'AKIA************LE'
 * Example: 'user@corp.example.com' -> 'u***r@corp.example.com'
 */
function maskEvidence(text, category) {
    if (!text)
        return '***';
    const clean = text.trim();
    if (category === 'PII' && clean.includes('@')) {
        const parts = clean.split('@');
        const local = parts[0];
        const domain = parts[1];
        if (local.length <= 2)
            return `${local[0]}*@${domain}`;
        return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
    }
    if (clean.length <= 6) {
        return '******';
    }
    const prefixLen = Math.min(4, Math.floor(clean.length / 4));
    const suffixLen = Math.min(2, Math.floor(clean.length / 5));
    const maskedMiddle = '*'.repeat(Math.max(6, clean.length - prefixLen - suffixLen));
    return `${clean.substring(0, prefixLen)}${maskedMiddle}${clean.substring(clean.length - suffixLen)}`;
}
