import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const button = (customId, emoji) => new ButtonBuilder()
  .setCustomId(customId)
  .setEmoji(emoji)
  .setStyle(ButtonStyle.Secondary);

export function criarBotoesPainel() {
  return [
    new ActionRowBuilder().addComponents(
      button('painel:renomear', '1551743937281138708'),
      button('painel:limitar', '1551744751672369172'),
      button('painel:confiar', '1551744793674121216'),
      button('painel:desconfiar', '1551744808668758058'),
      button('painel:bloquear', '1551744839295696916'),
    ),
    new ActionRowBuilder().addComponents(
      button('painel:desbloquear', '1551744851576356885'),
      button('painel:live', '1551833335867899945'),
      button('painel:chat', '1551833074520686683'),
      button('painel:privacidade', '1551744887773204591'),
      button('painel:excluir', '1551744901253955685'),
    ),
  ];
}
