// Quick test: does Firebase Admin SDK initialize?
process.env.FIREBASE_SERVICE_ACCOUNT = require('fs').readFileSync('.env.local', 'utf8')
  .split('FIREBASE_SERVICE_ACCOUNT=')[1]
  .split('\n')[0]
  .trim();

const admin = require('firebase-admin');

async function main() {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('SA loaded, project:', sa.project_id);
    console.log('Has private_key:', !!sa.private_key);
    console.log('Private key starts with:', sa.private_key.slice(0, 30));

    const app = admin.initializeApp({
      credential: admin.credential.cert(sa),
      databaseURL: 'https://replyos-af4d3-default-rtdb.firebaseio.com',
    });
    console.log('App initialized');

    const db = admin.database(app);
    console.log('Database ref created');

    const snap = await db.ref('users').get();
    console.log('Snapshot exists:', snap.exists());
    console.log('Snapshot value:', snap.val());

    // Test write
    if (!snap.exists()) {
      console.log('Trying to write a test user...');
      await db.ref('users/test_user').set({
        email: 'test@replyos.com',
        name: 'Test User',
        createdAt: Date.now(),
      });
      console.log('Write succeeded');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}
main();
