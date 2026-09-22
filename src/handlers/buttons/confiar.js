import {
  ActionRowBuilder,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
  UserSelectMenuBuilder,
} from 'discord.js';
import { carregarCanalDoDono, respostaEphemeral } from '../../utils/respostas.js';

export async function confiar(interaction) {
  const doc = await carregarCanalDoDono(interaction);
  if (!doc) return;
  const remainingSlots = Math.max(0, 25 - new Set(doc.trustedUsers).size);
  if (remainingSlots === 0) {
    await interaction.reply(respostaEphemeral('Atenção!', 'Você já atingiu o limite de 25 usuários confiáveis.'));
    return;
  }

  const select = new UserSelectMenuBuilder()
    .setCustomId('painel:confiar:select')
    .setPlaceholder('Selecione um ou mais usuários')
    .setMinValues(1)
    .setMaxValues(remainingSlots);

  await interaction.reply({
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Confiar'))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('Usuários confiáveis têm permissão para entrar no seu canal bloqueado ou invisível.'))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Selecione até ${remainingSlots} usuários.`)),
      new ActionRowBuilder().addComponents(select),
    ],
  });
}
