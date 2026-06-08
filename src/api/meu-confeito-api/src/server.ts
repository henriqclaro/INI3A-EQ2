import app from './app';
import { connectDB } from './config/database';
import { env } from './config/env.config';

connectDB().then(() => {
  app.listen(env.SERVER_PORT, env.SERVER_HOST, () => {
    console.log(
      `MeuConfeito server successfully running in ${env.NODE_ENV} mode on port ${env.SERVER_PORT}`,
    );
  });
});
