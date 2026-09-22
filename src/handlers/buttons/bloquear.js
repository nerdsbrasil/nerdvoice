import {
  ActionRowBuilder,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
  UserSelectMenuBuilder,
} from 'discord.js';
import { carregarCanalDoDono, respostaEphemeral } from '../../utils/respostas.js';

export async function bloquear(interaction) {
  const doc = await carregarCanalDoDono(interaction);
  if (!doc) return;
  const remainingSlots = Math.max(0, 25 - new Set(doc.blockedUsers).size);
  if (remainingSlots === 0) {
    await interaction.reply(respostaEphemeral('Atenção!', 'Você já atingiu o limite de 25 usuários bloqueados.'));
    return;
  }

  const select = new UserSelectMenuBuilder()
    .setCustomId('painel:bloquear:select')
    .setPlaceholder('Selecione um ou mais usuários')
    .setMinValues(1)
    .setMaxValues(remainingSlots);

  await interaction.reply({
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Bloquear'))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('Usuários bloqueados são desconectados do canal e não têm permissão para entrar ou enviar mensagens nos seus canais temporários.'))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Selecione até ${remainingSlots} usuários.`)),
      new ActionRowBuilder().addComponents(select),
    ],
  });
}
