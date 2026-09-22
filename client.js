import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { connectDatabase } from './src/database/connection.js';
import { registerReadyHandler } from './src/events/ready.js';
import { registerVoiceStateHandler } from './src/events/voiceStateUpdate.js';
import { registerInteractionHandler } from './src/events/interactionCreate.js';
import { startHealthServer } from './src/utils/health.js';

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN não foi definido. Copie .env.examples para .env e preencha as variáveis.');
}

await connectDatabase();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

registerReadyHandler(client);
registerVoiceStateHandler(client);
registerInteractionHandler(client);
startHealthServer(client);

await client.login(process.env.BOT_TOKEN);
