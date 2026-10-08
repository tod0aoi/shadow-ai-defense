import { db } from '../config/database';

async function main() {
  console.log('[*] Initializing Shadow AI Platform Database schema...');
  await db.initSchema();
  console.log('[+] Schema initialized successfully.');

  console.log('[*] Seeding default users, devices, AI services, and policies...');
  await db.seedDefaults();
  console.log('[+] Seeding completed successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[-] Database initialization failed:', err);
  process.exit(1);
});
