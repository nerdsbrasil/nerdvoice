import { ContainerBuilder, TextDisplayBuilder } from 'discord.js';
import { VoiceChannel } from '../../database/models/VoiceChannel.js';
import { aplicarPermissoes } from '../../utils/permissoes.js';
import { respostaEphemeral } from '../../utils/respostas.js';
import { logger } from '../../utils/logger.js';

const ACTIONS = {
  lock: { field: 'locked', value: true, label: 'trancado' },
  unlock: { field: 'locked', value: false, label: 'destrancado' },
  hide: { field: 'visible', value: false, label: 'oculto' },
  show: { field: 'visible', value: true, label: 'visível' },
};

export async function privacidadeSelect(interaction) {
  const doc = await VoiceChannel.findOne({ activeChannelId: interaction.channelId });
  if (!doc) return interaction.reply(respostaEphemeral('Atenção!', 'Este canal não é mais uma call temporária ativa.'));
  if (interaction.user.id !== doc.id) return interaction.reply(respostaEphemeral('Atenção!', 'Somente o proprietário do canal de voz pode usar este comando.'));

  const action = ACTIONS[interaction.values[0]];
  if (!action) return interaction.update({ components: respostaEphemeral('Atenção!', 'A opção de privacidade escolhida é inválida.').components });

  doc[action.field] = action.value;
  const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
  if (!channel?.isVoiceBased()) {
    return interaction.update({ components: respostaEphemeral('Atenção!', 'Não foi possível encontrar este canal de voz.').components });
  }
  await aplicarPermissoes(channel, doc);
  await doc.save();
  logger.info('PAINEL', interaction.user.username, `Alterou a privacidade da call para ${action.label}.`);
  await interaction.update({
    components: [new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Atualizado!'))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`<#${channel.id}> agora está **${action.label}**.`))],
  });
}
