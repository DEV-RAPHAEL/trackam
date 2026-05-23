import { PGlite } from '@electric-sql/pglite';
try {
  const db = new PGlite('../trackam-v2-db');
  await db.waitReady;
  console.log("Ready!");
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}
