import { createApp } from './app';
import { config } from './config/env';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Novo Food API listening on port ${config.port} [${config.env}]`);
});
