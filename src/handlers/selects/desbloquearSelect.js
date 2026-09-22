import { ContainerBuilder, TextDisplayBuilder } from 'discord.js';
import { VoiceChannel } from '../../database/models/VoiceChannel.js';
import { aplicarPermissoes } from '../../utils/permissoes.js';
import { respostaEphemeral } from '../../utils/respostas.js';
import { logger } from '../../utils/logger.js';

function confirmacao() {
  return {
    components: [new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Atualizado!'))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('Este usuário agora não está bloqueado no seu canal de voz.'))],
  };
}

export async function desbloquearSelect(interaction) {
  const doc = await VoiceChannel.findOne({ activeChannelId: interaction.channelId });
  if (!doc) return interaction.reply(respostaEphemeral('Atenção!', 'Este canal não é mais uma call temporária ativa.'));
  if (interaction.user.id !== doc.id) return interaction.reply(respostaEphemeral('Atenção!', 'Somente o proprietário do canal de voz pode usar este comando.'));

  const selectedIds = new Set(interaction.values.filter((id) => doc.blockedUsers.includes(id)));
  doc.blockedUsers = doc.blockedUsers.filter((id) => !selectedIds.has(id));

  const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
  if (!channel?.isVoiceBased()) {
    return interaction.update({ components: respostaEphemeral('Atenção!', 'Não foi possível encontrar este canal de voz.').components });
  }
  await aplicarPermissoes(channel, doc);
  await doc.save();
  logger.info('PAINEL', interaction.user.username, `Desbloqueou ${selectedIds.size} usuário(s).`);
  await interaction.update(confirmacao());
}
