import { entrarOuCriarCanalTemporario, excluirCanalSeVazio } from '../utils/canalTemporario.js';
import { VoiceChannel } from '../database/models/VoiceChannel.js';
import { logger } from '../utils/logger.js';

export function registerVoiceStateHandler(client) {
  client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      if (newState.channelId === process.env.TRIGGER_CHANNEL_ID && oldState.channelId !== newState.channelId) {
        logger.info('CALL', newState.member.user.username, 'Entrou no canal gatilho.');
        await entrarOuCriarCanalTemporario(newState.channel, newState.member);
        return;
      }
      if (oldState.channelId && oldState.channelId !== newState.channelId) {
        const doc = await VoiceChannel.exists({ activeChannelId: oldState.channelId });
        if (doc?._id === oldState.member.id) {
          logger.info('CALL', oldState.member.user.username, 'Saiu da própria call.');
        }
        if (doc && oldState.channel?.members.size === 0) await excluirCanalSeVazio(oldState.channel);
      }
    } catch (error) {
      logger.error(newState.member?.user?.username ?? oldState.member?.user?.username ?? 'desconhecido', 'Falha ao processar alteração de voz', error);
    }
  });
}
