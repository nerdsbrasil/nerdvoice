import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from 'discord.js';
import { VoiceChannel } from '../../database/models/VoiceChannel.js';
import { respostaEphemeral } from '../../utils/respostas.js';
import { logger } from '../../utils/logger.js';

export async function live(interaction) {
  const doc = await VoiceChannel.findOne({ activeChannelId: interaction.channelId });
  if (!doc) return interaction.reply(respostaEphemeral('Atenção!', 'Este canal não é mais uma call temporária ativa.'));
  const owner = await interaction.client.users.fetch(doc.id).catch(() => null);
  if (!owner) return interaction.reply(respostaEphemeral('Atenção!', 'Não foi possível encontrar o proprietário desta call.'));
  const url = `https://golive.nemtudo.me/watch/${encodeURIComponent(owner.username)}`;
  logger.info('PAINEL', interaction.user.username, `Abriu o GoLive de ${owner.username}.`);
  await interaction.reply({
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# GoLive'))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('Clique no botão abaixo para acessar o GoLive.')),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel(`Transmissão de ${owner.username}`)
          .setURL(url),
      ),
    ],
  });
}
