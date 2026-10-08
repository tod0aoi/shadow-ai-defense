"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
async function main() {
    console.log('[*] Initializing Shadow AI Platform Database schema...');
    await database_1.db.initSchema();
    console.log('[+] Schema initialized successfully.');
    console.log('[*] Seeding default users, devices, AI services, and policies...');
    await database_1.db.seedDefaults();
    console.log('[+] Seeding completed successfully.');
    process.exit(0);
}
main().catch((err) => {
    console.error('[-] Database initialization failed:', err);
    process.exit(1);
});
