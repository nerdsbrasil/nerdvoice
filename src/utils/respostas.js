import { ContainerBuilder, MessageFlags, TextDisplayBuilder } from 'discord.js';
import { logger } from './logger.js';

export function respostaEphemeral(titulo, texto) {
  return {
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${titulo}`))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(texto))],
  };
}

export async function carregarCanalDoDono(interaction) {
  const { VoiceChannel } = await import('../database/models/VoiceChannel.js');
  const doc = await VoiceChannel.findOne({ activeChannelId: interaction.channelId });
  if (!doc) {
    logger.info('SEGURANCA', interaction.user.username, 'Tentou usar um painel de call inativa.');
    await interaction.reply(respostaEphemeral('Atenção!', 'Este canal não é mais uma call temporária ativa.'));
    return null;
  }
  if (interaction.user.id !== doc.id) {
    logger.info('SEGURANCA', interaction.user.username, 'Tentou usar o painel de uma call que não possui.');
    await interaction.reply(respostaEphemeral('Atenção!', 'Somente o proprietário do canal de voz pode usar este comando.'));
    return null;
  }
  return doc;
}
