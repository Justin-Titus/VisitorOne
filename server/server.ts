import app from './src/app';
import env from './src/config/env';
import connectDB from './src/config/db';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(env.port, () => {
      console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to start server: ${error.message}`);
    }
    process.exit(1);
  }
};

startServer();
