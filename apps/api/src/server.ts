import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/environment';

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(` EduGuard AI Backend API Server`);
      console.log(` Status: RUNNING`);
      console.log(` Port: ${env.PORT}`);
      console.log(` Environment: ${env.NODE_ENV}`);
      console.log(` ML Service URL: ${env.ML_SERVICE_URL}`);
      console.log(` API Health: http://localhost:${env.PORT}/api/health`);
      console.log(`=======================================================`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${env.PORT} in use, waiting 1.5s to retry...`);
        setTimeout(() => {
          server.close();
          server.listen(env.PORT);
        }, 1500);
      } else {
        console.error('Server error:', err);
      }
    });

    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error: any) {
    console.error('Fatal error during server startup:', error.message);
    process.exit(1);
  }
}

// Only start persistent HTTP listener in standalone / local development mode (not when loaded as a Vercel Function)
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
