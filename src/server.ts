import app from './app.js';
import { env } from './config/env.js';

const PORT = parseInt(env.PORT, 10) || 3000;

app.listen(PORT, () => {
  console.log(`[INFO] Server Running at Port http://localhost:${PORT}`);
  console.log(`[INFO] Health check: http://localhost:${PORT}/api/v1/health`);
});
