import { createApp } from './app';
import { config } from './config/env';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Novo Food API listening on port ${config.port} [${config.env}]`);
}).on('error', (err: Error) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
