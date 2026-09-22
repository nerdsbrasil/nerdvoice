import { ChannelType } from 'discord.js';
import { VoiceChannel } from '../database/models/VoiceChannel.js';
import { criarPainel } from './painel.js';
import { aplicarPermissoes } from './permissoes.js';
import { logger } from './logger.js';

async function buscarConfiguracao(guildId, ownerId) {
  const doc = await VoiceChannel.findById(ownerId);
  if (doc) return doc;

  // Migra de forma transparente documentos criados pela estrutura anterior.
  const legacy = await VoiceChannel.findOne({ guildId, ownerId });
  if (!legacy) return VoiceChannel.create({ _id: ownerId, guildId });
  const migrated = await VoiceChannel.create({
    _id: ownerId,
    guildId,
    activeChannelId: legacy.id,
    channelName: legacy.channelName,
    userLimit: legacy.userLimit,
    visible: legacy.visible,
    locked: legacy.locked,
    trustedUsers: legacy.trustedUsers,
    blockedUsers: legacy.blockedUsers,
    lastRenamedAt: legacy.lastRenamedAt,
    createdAt: legacy.createdAt,
  });
  await VoiceChannel.findByIdAndDelete(legacy.id);
  return migrated;
}

async function buscarCanalAtivo(guild, doc) {
  if (!doc.activeChannelId) return null;
  const channel = await guild.channels.fetch(doc.activeChannelId).catch(() => null);
  if (channel?.isVoiceBased()) return channel;
  doc.activeChannelId = null;
  await doc.save();
  return null;
}

export async function entrarOuCriarCanalTemporario(triggerChannel, member) {
  const settings = await buscarConfiguracao(triggerChannel.guild.id, member.id);
  const existingChannel = await buscarCanalAtivo(triggerChannel.guild, settings);
  if (existingChannel) {
    try {
      await member.voice.setChannel(existingChannel, 'Retorno à call temporária do membro');
      logger.info('CALL', member.user.username, `Retornou à call existente #${existingChannel.name}.`);
      return existingChannel;
    } catch (error) {
      if (existingChannel.members.size === 0) await excluirCanalSeVazio(existingChannel);
      throw error;
    }
  }

  const name = settings.channelName || `🔊 Canal de ${member.user.username}`;
  let channel;
  let memberMoved = false;
  try {
    channel = await triggerChannel.guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: triggerChannel.parentId,
      userLimit: settings.userLimit,
      reason: `Call temporária de ${member.user.tag}`,
    });
    // A posição definida no create pode ser reorganizada pelo Discord; posiciona
    // novamente após existir para garantir que fique logo abaixo do gatilho.
    await channel.setPosition(triggerChannel.position + 1, {
      reason: 'Posicionamento abaixo do canal gatilho',
    });
    // Registra a call antes da movimentação para que um evento de saída muito
    // rápido também consiga encontrá-la e apagá-la se ela ficar vazia.
    settings.activeChannelId = channel.id;
    settings.channelName = name;
    await settings.save();
    logger.info('CALL', member.user.username, `Criou a call #${name}.`);
    await aplicarPermissoes(channel, settings);
    const movedMember = await member.voice.setChannel(channel, 'Movido para a call temporária');
    if (movedMember.voice.channelId !== channel.id) {
      throw new Error('O Discord não confirmou a movimentação para a call temporária.');
    }
    memberMoved = true;
    const interfaceMessage = await channel.send(criarPainel(member.id));
    settings.interfaceMessageId = interfaceMessage.id;
    await settings.save();
    return channel;
  } catch (error) {
    // Se a criação não conseguiu colocar o dono no canal, nunca deixa uma
    // call órfã e vazia no servidor.
    if (channel && !memberMoved) {
      if (settings.activeChannelId === channel.id) {
        settings.activeChannelId = null;
        await settings.save().catch(() => null);
      }
      await channel.delete('Falha ao mover o dono para a call temporária').catch(() => null);
    }
    throw error;
  }
}

export async function excluirCanalSeVazio(channel) {
  if (channel.members.size !== 0) return;
  const doc = await VoiceChannel.findOne({ activeChannelId: channel.id });
  if (!doc) return;
  doc.activeChannelId = null;
  await doc.save();
  await channel.delete('Call temporária vazia');
  const username = channel.guild.members.cache.get(doc.id)?.user.username ?? doc.id;
  logger.info('CALL', username, `Call #${channel.name} apagada por estar vazia.`);
}
