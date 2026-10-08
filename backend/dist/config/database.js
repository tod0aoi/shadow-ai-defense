"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const env_1 = require("./env");
const security_1 = require("../utils/security");
let pgPool = null;
let sqliteDb = null;
const isPostgres = Boolean(env_1.config.databaseUrl || env_1.config.dbType === 'postgres');
if (isPostgres && env_1.config.databaseUrl) {
    pgPool = new pg_1.Pool({
        connectionString: env_1.config.databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
    });
}
else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseSync } = require('node:sqlite');
    const dbDir = path_1.default.dirname(env_1.config.sqlitePath);
    if (!fs_1.default.existsSync(dbDir)) {
        fs_1.default.mkdirSync(dbDir, { recursive: true });
    }
    sqliteDb = new DatabaseSync(env_1.config.sqlitePath);
}
function sanitizeParamsForSqlite(params) {
    return params.map((p) => {
        if (typeof p === 'boolean') {
            return p ? 1 : 0;
        }
        if (p !== null && typeof p === 'object' && !(p instanceof Date)) {
            return JSON.stringify(p);
        }
        return p;
    });
}
exports.db = {
    async query(sql, params = []) {
        if (isPostgres && pgPool) {
            const res = await pgPool.query(sql, params);
            return res.rows;
        }
        else {
            const sqliteSql = sql.replace(/\$\d+/g, '?');
            const cleanParams = sanitizeParamsForSqlite(params);
            const stmt = sqliteDb.prepare(sqliteSql);
            const rows = stmt.all(...cleanParams);
            return rows;
        }
    },
    async queryOne(sql, params = []) {
        const rows = await this.query(sql, params);
        return rows.length > 0 ? rows[0] : null;
    },
    async execute(sql, params = []) {
        if (isPostgres && pgPool) {
            const res = await pgPool.query(sql, params);
            return { changes: res.rowCount || 0 };
        }
        else {
            const sqliteSql = sql.replace(/\$\d+/g, '?');
            const cleanParams = sanitizeParamsForSqlite(params);
            const stmt = sqliteDb.prepare(sqliteSql);
            const result = stmt.run(...cleanParams);
            return { changes: result.changes || 0 };
        }
    },
    async initSchema() {
        const schemaPath = path_1.default.resolve(__dirname, '../../../database/schema.sql');
        if (!fs_1.default.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at: ${schemaPath}`);
        }
        let schemaSql = fs_1.default.readFileSync(schemaPath, 'utf8');
        if (isPostgres && pgPool) {
            await pgPool.query(schemaSql);
        }
        else {
            const cleanSql = schemaSql
                .replace(/TIMESTAMP WITH TIME ZONE/g, 'TIMESTAMP')
                .replace(/INET/g, 'TEXT')
                .replace(/MACADDR/g, 'TEXT');
            const statements = cleanSql
                .split(';')
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
            for (const statement of statements) {
                try {
                    sqliteDb.exec(statement);
                }
                catch (err) {
                    if (!err.message.includes('already exists')) {
                        console.error(`Error executing SQL: ${statement.substring(0, 50)}...`, err.message);
                    }
                }
            }
        }
    },
    async seedDefaults() {
        const adminHash = await (0, security_1.hashPassword)('Admin@12345!');
        const analystHash = await (0, security_1.hashPassword)('Analyst@12345!');
        // Upsert Admin User
        const existingAdmin = await this.queryOne('SELECT id FROM users WHERE username = $1', ['admin']);
        if (!existingAdmin) {
            await this.execute(`INSERT INTO users (id, username, email, password_hash, role, full_name, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                'u1111111-1111-1111-1111-111111111111',
                'admin',
                'admin@corp.internal',
                adminHash,
                'ADMIN',
                'Chief Information Security Officer',
                true,
            ]);
        }
        // Upsert Analyst User
        const existingAnalyst = await this.queryOne('SELECT id FROM users WHERE username = $1', ['analyst']);
        if (!existingAnalyst) {
            await this.execute(`INSERT INTO users (id, username, email, password_hash, role, full_name, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                'u2222222-2222-2222-2222-222222222222',
                'analyst',
                'analyst@corp.internal',
                analystHash,
                'SECURITY_ANALYST',
                'Lead SOC Incident Analyst',
                true,
            ]);
        }
        // Upsert Default Monitored Devices
        const devices = [
            { id: 'd1111111-1111-1111-1111-111111111111', hostname: 'CORP-WIN11-ENG01', ip: '10.0.1.45', os: 'Windows 11 Pro', dept: 'Core Engineering' },
            { id: 'd2222222-2222-2222-2222-222222222222', hostname: 'CORP-MAC-MKT04', ip: '10.0.2.112', os: 'macOS Sonoma', dept: 'Product Marketing' },
            { id: 'd3333333-3333-3333-3333-333333333333', hostname: 'CORP-UBUNTU-OPS02', ip: '10.0.3.88', os: 'Ubuntu 24.04 LTS', dept: 'Cloud Operations' },
        ];
        for (const d of devices) {
            const exists = await this.queryOne('SELECT id FROM devices WHERE id = $1', [d.id]);
            if (!exists) {
                await this.execute(`INSERT INTO devices (id, hostname, ip_address, os, department) VALUES ($1, $2, $3, $4, $5)`, [d.id, d.hostname, d.ip, d.os, d.dept]);
            }
        }
        // Upsert Registered AI Services
        const services = [
            { id: 's1111111-1111-1111-1111-111111111111', name: 'ChatGPT (OpenAI)', domains: 'chatgpt.com,chat.openai.com,api.openai.com', sanctioned: false, weight: 15 },
            { id: 's2222222-2222-2222-2222-222222222222', name: 'Google Gemini', domains: 'gemini.google.com,generativelanguage.googleapis.com', sanctioned: false, weight: 15 },
            { id: 's3333333-3333-3333-3333-333333333333', name: 'Anthropic Claude', domains: 'claude.ai,api.anthropic.com', sanctioned: false, weight: 15 },
            { id: 's4444444-4444-4444-4444-444444444444', name: 'Microsoft Copilot (Enterprise)', domains: 'copilot.microsoft.com', sanctioned: true, weight: 5 },
        ];
        for (const s of services) {
            const exists = await this.queryOne('SELECT id FROM ai_services WHERE id = $1', [s.id]);
            if (!exists) {
                await this.execute(`INSERT INTO ai_services (id, name, domains, is_sanctioned, base_risk_weight) VALUES ($1, $2, $3, $4, $5)`, [s.id, s.name, s.domains, s.sanctioned, s.weight]);
            }
        }
        // Upsert Baseline Security Policies
        const policies = [
            {
                id: 'p1111111-1111-1111-1111-111111111111',
                name: 'POL-01: Prohibit Cloud Credentials and API Keys',
                desc: 'Detects AWS keys, private SSH/RSA keys, JWT tokens, and API secrets submitted to external AI endpoints.',
                cat: 'SECRET',
                sev: 'CRITICAL',
                act: 'ALERT',
            },
            {
                id: 'p2222222-2222-2222-2222-222222222222',
                name: 'POL-02: Prohibit Internal Infrastructure & Network Topologies',
                desc: 'Detects RFC1918 private IPv4 addresses, database connection strings, and internal FQDNs.',
                cat: 'INFRASTRUCTURE',
                sev: 'HIGH',
                act: 'ALERT',
            },
            {
                id: 'p3333333-3333-3333-3333-333333333333',
                name: 'POL-03: Customer and Employee PII Protection',
                desc: 'Flags bulk emails, international telephone numbers, and national identifiers submitted without prior authorization.',
                cat: 'PII',
                sev: 'MEDIUM',
                act: 'ALERT',
            },
            {
                id: 'p4444444-4444-4444-4444-444444444444',
                name: 'POL-04: Proprietary Source Code Exfiltration Prevention',
                desc: 'Flags submission of proprietary source code blocks, functions, and configuration files to unsanctioned AI tools.',
                cat: 'CODE',
                sev: 'HIGH',
                act: 'ALERT',
            },
            {
                id: 'p5555555-5555-5555-5555-555555555555',
                name: 'POL-05: Restricted Classification and Confidential Documents',
                desc: 'Identifies organizational confidentiality indicators such as CONFIDENTIAL, INTERNAL ONLY, and STRICTLY PRIVATE.',
                cat: 'CONFIDENTIAL',
                sev: 'HIGH',
                act: 'ALERT',
            },
        ];
        for (const p of policies) {
            const exists = await this.queryOne('SELECT id FROM policies WHERE id = $1', [p.id]);
            if (!exists) {
                await this.execute(`INSERT INTO policies (id, name, description, target_category, severity, action, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [p.id, p.name, p.desc, p.cat, p.sev, p.act, true]);
            }
        }
    },
};
