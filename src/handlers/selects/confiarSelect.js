import { ContainerBuilder, TextDisplayBuilder } from 'discord.js';
import { VoiceChannel } from '../../database/models/VoiceChannel.js';
import { aplicarPermissoes } from '../../utils/permissoes.js';
import { respostaEphemeral } from '../../utils/respostas.js';
import { logger } from '../../utils/logger.js';

function confirmacao() {
  return {
    components: [new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Atualizado!'))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('Este usuário agora é confiável no seu canal de voz.\n'))],
  };
}

export async function confiarSelect(interaction) {
  const doc = await VoiceChannel.findOne({ activeChannelId: interaction.channelId });
  if (!doc) return interaction.reply(respostaEphemeral('Atenção!', 'Este canal não é mais uma call temporária ativa.'));
  if (interaction.user.id !== doc.id) return interaction.reply(respostaEphemeral('Atenção!', 'Somente o proprietário do canal de voz pode usar este comando.'));

  const selectedMembers = await Promise.all(
    interaction.values.map((userId) => interaction.guild.members.fetch(userId).catch(() => null)),
  );
  const botMember = interaction.guild.members.me
    ?? await interaction.guild.members.fetch(interaction.client.user.id);
  const validIds = selectedMembers
    .filter((member) => (
      member
      && !member.user.bot
      && member.id !== doc.id
      && member.roles.highest.comparePositionTo(botMember.roles.highest) <= 0
    ))
    .map((member) => member.id);
  const trustedIds = new Set(doc.trustedUsers);
  const remainingSlots = Math.max(0, 25 - trustedIds.size);
  // Protege também contra menus antigos ou múltiplos seletores abertos.
  const newTrustedIds = validIds
    .filter((id) => !trustedIds.has(id))
    .slice(0, remainingSlots);
  const selectedIds = new Set(newTrustedIds);

  doc.trustedUsers = [...trustedIds, ...newTrustedIds];
  // Um usuário confiável não pode continuar simultaneamente bloqueado.
  doc.blockedUsers = doc.blockedUsers.filter((id) => !selectedIds.has(id));

  const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
  if (!channel?.isVoiceBased()) {
    return interaction.update({ components: respostaEphemeral('Atenção!', 'Não foi possível encontrar este canal de voz.').components });
  }
  await aplicarPermissoes(channel, doc);
  await doc.save();
  logger.info('PAINEL', interaction.user.username, `Confiou em ${newTrustedIds.length} usuário(s).`);
  // Atualiza o próprio cartão efêmero e remove o seletor após a escolha.
  await interaction.update(confirmacao());
}
