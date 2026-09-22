import {
  ActionRowBuilder,
  ContainerBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
} from 'discord.js';
import { carregarCanalDoDono, respostaEphemeral } from '../../utils/respostas.js';

const ARROBA_EMOJI_ID = '1551806686946267186';

async function responderComSeletor(interaction, response) {
  await interaction.followUp(response);
}

export async function desconfiar(interaction) {
  const doc = await carregarCanalDoDono(interaction);
  if (!doc) return;
  if (doc.trustedUsers.length === 0) {
    await interaction.reply(respostaEphemeral('Atenção!', 'Não há usuários confiáveis neste canal.'));
    return;
  }

  // A resolução dos usernames pode levar mais de três segundos em listas
  // grandes. Reconhece o clique sem criar uma resposta temporária.
  await interaction.deferUpdate();

  const users = await Promise.all(
    doc.trustedUsers.map((userId) => interaction.client.users.fetch(userId).catch(() => null)),
  );
  const options = users
    .filter(Boolean)
    .map((user) => ({ label: user.username, value: user.id, emoji: ARROBA_EMOJI_ID }));

  if (options.length === 0) {
    await responderComSeletor(
      interaction,
      respostaEphemeral('Atenção!', 'Não foi possível encontrar os usuários confiáveis deste canal.'),
    );
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('painel:desconfiar:select')
    .setPlaceholder('Selecione um ou mais usuários')
    .setMinValues(1)
    .setMaxValues(options.length)
    .addOptions(options);

  await responderComSeletor(interaction, {
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Desconfiar'))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('Usuários desconfiados têm a permissão de entrar no seu canal bloqueado ou invisível revogada.')),
      new ActionRowBuilder().addComponents(select),
    ],
  });
}
