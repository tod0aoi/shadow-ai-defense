"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLoginPayload = validateLoginPayload;
exports.validateIngestPayload = validateIngestPayload;
const MAX_PROMPT_LENGTH = 65536; // 64 KB limit to prevent payload flooding / ReDoS
/**
 * Validates login request payload.
 */
function validateLoginPayload(req, res, next) {
    const { username, password } = req.body;
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
        res.status(400).json({ error: 'Validation Error', message: 'Field "username" is required and cannot be empty.' });
        return;
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
        res.status(400).json({ error: 'Validation Error', message: 'Field "password" is required and cannot be empty.' });
        return;
    }
    req.body.username = username.trim();
    next();
}
/**
 * Validates AI usage event ingestion payload.
 */
function validateIngestPayload(req, res, next) {
    const { user_identifier, ai_service, destination_url, prompt_text, device_info } = req.body;
    if (!user_identifier || typeof user_identifier !== 'string' || user_identifier.trim().length === 0) {
        res.status(400).json({ error: 'Validation Error', message: 'Field "user_identifier" (email or username) is required.' });
        return;
    }
    if (!ai_service || typeof ai_service !== 'string' || ai_service.trim().length === 0) {
        res.status(400).json({ error: 'Validation Error', message: 'Field "ai_service" is required (e.g. ChatGPT, Claude, Gemini).' });
        return;
    }
    if (!prompt_text || typeof prompt_text !== 'string' || prompt_text.trim().length === 0) {
        res.status(400).json({ error: 'Validation Error', message: 'Field "prompt_text" is required and cannot be empty.' });
        return;
    }
    if (prompt_text.length > MAX_PROMPT_LENGTH) {
        res.status(413).json({
            error: 'Payload Too Large',
            message: `Prompt text exceeds maximum allowed length of ${MAX_PROMPT_LENGTH} characters.`,
        });
        return;
    }
    // Sanitize fields
    req.body.user_identifier = user_identifier.trim().toLowerCase();
    req.body.ai_service = ai_service.trim();
    req.body.destination_url = destination_url ? destination_url.trim() : `https://${ai_service.toLowerCase().replace(/\s+/g, '')}.com`;
    if (!device_info || typeof device_info !== 'object') {
        req.body.device_info = {
            hostname: 'UNKNOWN-HOST',
            ip_address: req.ip || '127.0.0.1',
        };
    }
    next();
}
