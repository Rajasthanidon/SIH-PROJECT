const app = require('./app');
const env = require('./config/env');
const { testDatabaseConnection } = require('./config/database');
const { runMigrations } = require('./db/runMigrations');

async function bootstrap() {
  await runMigrations();
  const dbStatus = await testDatabaseConnection();

  app.listen(env.PORT, () => {
    console.log(`[SERVER] Academia-Industry Portal API listening on port ${env.PORT}`);
    console.log(`[DATABASE] ${dbStatus.message}`);
  });
}

bootstrap().catch((error) => {
  console.error('[SERVER] Failed to start application:', error);
  process.exit(1);
});
