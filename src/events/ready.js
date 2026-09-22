import { logger } from '../utils/logger.js';

export function registerReadyHandler(client) {
  client.once('ready', (readyClient) => {
    logger.info('BOT', readyClient.user.username, `Conectado como ${readyClient.user.tag}.`);
  });
}
