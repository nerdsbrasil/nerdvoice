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

export async function desbloquear(interaction) {
  const doc = await carregarCanalDoDono(interaction);
  if (!doc) return;
  if (doc.blockedUsers.length === 0) {
    await interaction.reply(respostaEphemeral('Atenção!', 'Não há usuários bloqueados neste canal.'));
    return;
  }

  await interaction.deferUpdate();
  const users = await Promise.all(
    doc.blockedUsers.map((userId) => interaction.client.users.fetch(userId).catch(() => null)),
  );
  const options = users
    .filter(Boolean)
    .map((user) => ({ label: user.username, value: user.id, emoji: ARROBA_EMOJI_ID }));
  if (options.length === 0) {
    await responderComSeletor(interaction, respostaEphemeral('Atenção!', 'Não foi possível encontrar os usuários bloqueados deste canal.'));
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('painel:desbloquear:select')
    .setPlaceholder('Selecione um ou mais usuários')
    .setMinValues(1)
    .setMaxValues(options.length)
    .addOptions(options);
  await responderComSeletor(interaction, {
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Desbloquear'))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('Usuários desbloqueados podem voltar a entrar e enviar mensagens no seu canal.')),
      new ActionRowBuilder().addComponents(select),
    ],
  });
}
