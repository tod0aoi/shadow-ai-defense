/**
 * Hashes a plaintext password using bcrypt with configurable salt rounds.
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compares plaintext password against a stored bcrypt hash.
 */
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
/**
 * Generates signed JWT for authenticated sessions.
 */
export declare function generateToken(payload: object): string;
/**
 * Verifies and decodes a signed JWT.
 */
export declare function verifyToken(token: string): any;
/**
 * Computes deterministic SHA-256 hash of a string.
 * Used for prompt deduplication and integrity verification without storing raw secrets.
 */
export declare function sha256(text: string): string;
/**
 * Irreversibly masks sensitive evidence for SOC analyst review.
 * Preserves initial and trailing characters for debugging context while redacting secrets.
 * Example: 'AKIAIOSFODNN7EXAMPLE' -> 'AKIA************LE'
 * Example: 'user@corp.example.com' -> 'u***r@corp.example.com'
 */
export declare function maskEvidence(text: string, category?: string): string;
