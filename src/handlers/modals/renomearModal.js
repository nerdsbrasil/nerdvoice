import { VoiceChannel } from '../../database/models/VoiceChannel.js';
import { respostaEphemeral } from '../../utils/respostas.js';
import { logger } from '../../utils/logger.js';

export async function renomearModal(interaction) {
  const doc = await VoiceChannel.findOne({ activeChannelId: interaction.channelId });
  if (!doc) return interaction.reply(respostaEphemeral('Atenção!', 'Este canal não é mais uma call temporária ativa.'));
  if (interaction.user.id !== doc.id) return interaction.reply(respostaEphemeral('Atenção!', 'Somente o proprietário do canal de voz pode usar este comando.'));
  const providedName = interaction.fields.getTextInputValue('nome').trim();
  const name = providedName || `🔊 Canal de ${interaction.user.username}`;
  const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
  if (!channel) return interaction.reply(respostaEphemeral('Atenção!', 'Não foi possível encontrar este canal de voz.'));
  await channel.setName(name, `Renomeado por ${interaction.user.tag}`);
  doc.channelName = name;
  doc.lastRenamedAt = new Date();
  await doc.save();
  logger.info('PAINEL', interaction.user.username, `Renomeou a call para #${name}.`);
  return interaction.reply(respostaEphemeral('Atualizado!', `O nome do seu canal agora é: \`${name}\`.`));
}
