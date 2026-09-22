import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from 'discord.js';
import { VoiceChannel } from '../../database/models/VoiceChannel.js';
import { carregarCanalDoDono, respostaEphemeral } from '../../utils/respostas.js';
import { logger } from '../../utils/logger.js';

const exclusionPrompts = new Map();

function confirmacaoDeExclusao() {
  return {
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Deletar canal'))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('Tem certeza de que deseja deletar o canal? Suas configurações serão excluídas.')),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('painel:excluir:confirm').setLabel('Excluir').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('painel:excluir:cancel').setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
      ),
    ],
  };
}

async function apagarPrompt(interaction) {
  const promptWebhook = exclusionPrompts.get(interaction.message.id);
  if (promptWebhook) {
    await promptWebhook.deleteMessage(interaction.message.id);
    exclusionPrompts.delete(interaction.message.id);
    return;
  }
  await interaction.message.delete();
}

async function carregarCanalDoDonoParaExclusao(interaction) {
  const doc = await VoiceChannel.findOne({ activeChannelId: interaction.channelId });
  if (!doc) {
    await interaction.reply(respostaEphemeral('Atenção!', 'Este canal não é mais uma call temporária ativa.'));
    return null;
  }
  if (interaction.user.id !== doc.id) {
    await interaction.reply(respostaEphemeral('Atenção!', 'Somente o proprietário do canal de voz pode usar este comando.'));
    return null;
  }
  return doc;
}

export async function excluir(interaction) {
  const doc = await carregarCanalDoDono(interaction);
  if (!doc) return;
  await interaction.reply(confirmacaoDeExclusao());
  logger.info('CALL', interaction.user.username, 'Solicitou confirmação para excluir a call.');
  const prompt = await interaction.fetchReply().catch(() => null);
  if (prompt) exclusionPrompts.set(prompt.id, interaction.webhook);
}

export async function cancelarExclusao(interaction) {
  const doc = await carregarCanalDoDonoParaExclusao(interaction);
  if (!doc) return;
  await interaction.deferUpdate();
  await apagarPrompt(interaction);
  logger.info('CALL', interaction.user.username, 'Cancelou a exclusão da call.');
}

export async function confirmarExclusao(interaction) {
  const doc = await carregarCanalDoDonoParaExclusao(interaction);
  if (!doc) return;
  await interaction.deferUpdate();
  await apagarPrompt(interaction);

  const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
  if (!channel?.isVoiceBased()) throw new Error('Não foi possível encontrar o canal de voz para exclusão.');
  await VoiceChannel.findByIdAndDelete(doc.id);
  await channel.delete(`Canal excluído pelo proprietário ${interaction.user.tag}`);
  logger.info('CALL', interaction.user.username, `Excluiu manualmente a call #${channel.name} e suas configurações.`);
}
