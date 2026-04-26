import 'dotenv/config';

import app from './app';
import { connectDB } from './config/database';

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`MeuConfeito server successfully running on port ${PORT}`);
  });
});
