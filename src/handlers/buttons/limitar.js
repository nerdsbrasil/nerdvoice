import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { carregarCanalDoDono } from '../../utils/respostas.js';

export async function limitar(interaction) {
  const doc = await carregarCanalDoDono(interaction);
  if (!doc) return;

  const input = new TextInputBuilder()
    .setCustomId('limite')
    .setLabel('Defina um limite de usuários para o seu canal')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder('Deixe em branco para resetar o limite');

  await interaction.showModal(
    new ModalBuilder()
      .setCustomId('painel:limitar:modal')
      .setTitle('NerdsVoice')
      .addComponents(new ActionRowBuilder().addComponents(input)),
  );
}
