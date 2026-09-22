import { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { carregarCanalDoDono, respostaEphemeral } from '../../utils/respostas.js';

const COOLDOWN_MS = 3 * 60 * 1000;

export async function renomear(interaction) {
  const doc = await carregarCanalDoDono(interaction);
  if (!doc) return;
  const remaining = doc.lastRenamedAt ? COOLDOWN_MS - (Date.now() - doc.lastRenamedAt.getTime()) : 0;
  if (remaining > 0) {
    const minutes = Math.max(1, Math.ceil(remaining / 60_000));
    await interaction.reply(respostaEphemeral('Atenção!', `Você pode renomear o canal novamente em: \`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}\`.`));
    return;
  }
  const input = new TextInputBuilder().setCustomId('nome').setStyle(TextInputStyle.Short)
    .setRequired(false).setPlaceholder('Deixe em branco para resetar o nome').setLabel('Defina um nome para o seu canal');
  await interaction.showModal(new ModalBuilder().setCustomId('painel:renomear:modal')
    .setTitle('NerdsVoice')
    .addComponents(new ActionRowBuilder().addComponents(input)));
}
