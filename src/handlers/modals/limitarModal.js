import { VoiceChannel } from '../../database/models/VoiceChannel.js';
import { respostaEphemeral } from '../../utils/respostas.js';
import { logger } from '../../utils/logger.js';

export async function limitarModal(interaction) {
  const doc = await VoiceChannel.findOne({ activeChannelId: interaction.channelId });
  if (!doc) return interaction.reply(respostaEphemeral('Atenção!', 'Este canal não é mais uma call temporária ativa.'));
  if (interaction.user.id !== doc.id) return interaction.reply(respostaEphemeral('Atenção!', 'Somente o proprietário do canal de voz pode usar este comando.'));

  const input = interaction.fields.getTextInputValue('limite').trim();
  const parsed = Number(input);
  const userLimit = Number.isInteger(parsed) && parsed >= 1 && parsed <= 99 ? parsed : 0;
  const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
  if (!channel?.isVoiceBased()) {
    return interaction.reply(respostaEphemeral('Atenção!', 'Não foi possível encontrar este canal de voz.'));
  }

  await channel.setUserLimit(userLimit, `Limite alterado por ${interaction.user.tag}`);
  doc.userLimit = userLimit;
  await doc.save();
  logger.info('PAINEL', interaction.user.username, `Definiu o limite da call como ${userLimit || 'ilimitado'}.`);

  const value = userLimit === 0 ? 'ilimitado' : String(userLimit);
  return interaction.reply(respostaEphemeral('Atualizado!', `O limite do seu canal agora é: \`${value}\`.`));
}
