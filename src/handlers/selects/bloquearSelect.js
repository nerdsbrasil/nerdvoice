import { ContainerBuilder, TextDisplayBuilder } from 'discord.js';
import { VoiceChannel } from '../../database/models/VoiceChannel.js';
import { aplicarPermissoes } from '../../utils/permissoes.js';
import { respostaEphemeral } from '../../utils/respostas.js';
import { logger } from '../../utils/logger.js';

function confirmacao() {
  return {
    components: [new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Atualizado!'))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('Este usuário agora está bloqueado no seu canal de voz.'))],
  };
}

export async function bloquearSelect(interaction) {
  const doc = await VoiceChannel.findOne({ activeChannelId: interaction.channelId });
  if (!doc) return interaction.reply(respostaEphemeral('Atenção!', 'Este canal não é mais uma call temporária ativa.'));
  if (interaction.user.id !== doc.id) return interaction.reply(respostaEphemeral('Atenção!', 'Somente o proprietário do canal de voz pode usar este comando.'));

  const botMember = interaction.guild.members.me
    ?? await interaction.guild.members.fetch(interaction.client.user.id);
  const selectedMembers = await Promise.all(
    interaction.values.map((userId) => interaction.guild.members.fetch(userId).catch(() => null)),
  );
  const validIds = selectedMembers
    .filter((member) => (
      member
      && !member.user.bot
      && member.id !== doc.id
      && member.roles.highest.comparePositionTo(botMember.roles.highest) <= 0
    ))
    .map((member) => member.id);
  const blockedIds = new Set(doc.blockedUsers);
  const remainingSlots = Math.max(0, 25 - blockedIds.size);
  const newBlockedIds = validIds
    .filter((id) => !blockedIds.has(id))
    .slice(0, remainingSlots);
  const selectedIds = new Set(newBlockedIds);

  doc.blockedUsers = [...blockedIds, ...newBlockedIds];
  // Um usuário bloqueado não pode continuar simultaneamente confiável.
  doc.trustedUsers = doc.trustedUsers.filter((id) => !selectedIds.has(id));

  const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
  if (!channel?.isVoiceBased()) {
    return interaction.update({ components: respostaEphemeral('Atenção!', 'Não foi possível encontrar este canal de voz.').components });
  }
  await aplicarPermissoes(channel, doc);
  await doc.save();
  logger.info('PAINEL', interaction.user.username, `Bloqueou ${newBlockedIds.length} usuário(s).`);
  await Promise.all(
    selectedMembers
      .filter((member) => member && selectedIds.has(member.id) && member.voice.channelId === channel.id)
      .map((member) => member.voice.disconnect('Usuário bloqueado da call temporária')),
  );
  await interaction.update(confirmacao());
}
