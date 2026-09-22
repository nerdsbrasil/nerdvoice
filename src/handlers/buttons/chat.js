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

// Mensagens efêmeras só podem ser apagadas pelo webhook da interação que as
// criou. Mantemos esse webhook enquanto o diálogo de confirmação estiver vivo.
const chatPrompts = new Map();

function confirmacaoDeExclusao() {
  return {
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Apagar chat'))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('Tem certeza de que deseja apagar o chat do canal?')),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('painel:chat:delete').setLabel('Apagar').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('painel:chat:cancel').setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
      ),
    ],
  };
}

function semMensagens() {
  return {
    components: [new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Atenção!'))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('Não há mensagens neste canal.'))],
  };
}

async function buscarMensagens(channel) {
  const messages = [];
  let before;
  do {
    const page = await channel.messages.fetch({ limit: 100, before });
    messages.push(...page.values());
    before = page.last()?.id;
    if (page.size < 100) break;
  } while (before);
  return messages;
}

async function apagarMensagens(channel, messages) {
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recent = messages.filter((message) => message.createdTimestamp > fourteenDaysAgo);
  const old = messages.filter((message) => message.createdTimestamp <= fourteenDaysAgo);

  for (let index = 0; index < recent.length; index += 100) {
    const batch = recent.slice(index, index + 100);
    if (batch.length === 1) await batch[0].delete();
    else if (batch.length > 1) await channel.bulkDelete(batch, true);
  }
  for (const message of old) await message.delete();
}

async function apagarPrompt(interaction) {
  const promptWebhook = chatPrompts.get(interaction.message.id);
  if (promptWebhook) {
    await promptWebhook.deleteMessage(interaction.message.id);
    chatPrompts.delete(interaction.message.id);
    return;
  }
  await interaction.message.delete();
}

async function editarPrompt(interaction, response) {
  const promptWebhook = chatPrompts.get(interaction.message.id);
  if (promptWebhook) {
    await promptWebhook.editMessage(interaction.message.id, response);
    return;
  }
  await interaction.message.edit(response);
}

export async function chat(interaction) {
  const doc = await carregarCanalDoDono(interaction);
  if (!doc) return;

  const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
  if (!channel?.isTextBased()) {
    await interaction.reply({ flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2, ...semMensagens() });
    return;
  }
  // Duas mensagens bastam para saber se existe algo além da interface. Para
  // documentos antigos, sem interfaceMessageId, uma única mensagem é tratada
  // como a interface original.
  const recentMessages = await channel.messages.fetch({ limit: 2 });
  const hasMessagesToDelete = doc.interfaceMessageId
    ? recentMessages.some((message) => message.id !== doc.interfaceMessageId)
    : recentMessages.size > 1;
  if (!hasMessagesToDelete) {
    logger.info('CHAT', interaction.user.username, 'Tentou apagar um chat sem mensagens.');
    await interaction.reply({ flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2, ...semMensagens() });
    return;
  }

  await interaction.reply(confirmacaoDeExclusao());
  logger.info('CHAT', interaction.user.username, 'Solicitou confirmação para apagar o chat.');
  const prompt = await interaction.fetchReply().catch(() => null);
  if (prompt) chatPrompts.set(prompt.id, interaction.webhook);
}

export async function cancelarChat(interaction) {
  const doc = await VoiceChannel.findOne({ activeChannelId: interaction.channelId });
  if (!doc) return interaction.reply(respostaEphemeral('Atenção!', 'Este canal não é mais uma call temporária ativa.'));
  if (interaction.user.id !== doc.id) return interaction.reply(respostaEphemeral('Atenção!', 'Somente o proprietário do canal de voz pode usar este comando.'));
  await interaction.deferUpdate();
  await apagarPrompt(interaction);
  logger.info('CHAT', interaction.user.username, 'Cancelou a limpeza do chat.');
}

export async function apagarChat(interaction) {
  const doc = await VoiceChannel.findOne({ activeChannelId: interaction.channelId });
  if (!doc) return interaction.reply(respostaEphemeral('Atenção!', 'Este canal não é mais uma call temporária ativa.'));
  if (interaction.user.id !== doc.id) return interaction.reply(respostaEphemeral('Atenção!', 'Somente o proprietário do canal de voz pode usar este comando.'));

  await interaction.deferUpdate();
  const channel = await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
  if (!channel?.isTextBased()) {
    await editarPrompt(interaction, semMensagens());
    return;
  }
  const messages = await buscarMensagens(channel);
  const interfaceMessageId = doc.interfaceMessageId
    ?? messages.reduce((oldest, message) => (!oldest || message.createdTimestamp < oldest.createdTimestamp ? message : oldest), null)?.id;
  const deletableMessages = messages.filter((message) => message.id !== interfaceMessageId);
  if (deletableMessages.length === 0) {
    logger.info('CHAT', interaction.user.username, 'Confirmou a limpeza, mas o chat já estava vazio.');
    await editarPrompt(interaction, semMensagens());
    return;
  }

  await apagarMensagens(channel, deletableMessages);
  await apagarPrompt(interaction);
  logger.info('CHAT', interaction.user.username, `Apagou ${deletableMessages.length} mensagem(ns) do chat.`);
}
