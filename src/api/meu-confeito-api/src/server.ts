import type { Server } from 'node:http';

import app from './app';
import { connectDB, disconnectDB } from './config/database';
import { env } from './config/env.config';

let server: Server | undefined;

function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    if (server) {
      server.close(async () => {
        console.log('HTTP server closed successfully.');
        await disconnectDB();
        process.exit(0);
      });

      const forceExitTimer = setTimeout(() => {
        console.error('Graceful shutdown timed out after 10s. Forcing exit.');
        process.exit(1);
      }, 10_000);

      forceExitTimer.unref();
    } else {
      await disconnectDB();
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection: ', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception: ', error);
    void shutdown('uncaughtException');
  });
}

connectDB().then(() => {
  server = app.listen(env.SERVER_PORT, env.SERVER_HOST, () => {
    console.log(
      `MeuConfeito server successfully running in ${env.NODE_ENV} mode on port ${env.SERVER_PORT}`,
    );
  });

  setupGracefulShutdown();
});
