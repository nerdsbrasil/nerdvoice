import {
  ActionRowBuilder,
  ContainerBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
} from 'discord.js';
import { carregarCanalDoDono } from '../../utils/respostas.js';

const PRIVACY_OPTIONS = [
  {
    label: 'Trancar',
    value: 'lock',
    description: 'Apenas usuários confiáveis poderão entrar no teu canal',
    emoji: '1551744887773204591',
  },
  {
    label: 'Destrancar',
    value: 'unlock',
    description: 'Todos poderão entrar no teu canal',
    emoji: '1551824115957112852',
  },
  {
    label: 'Ocultar',
    value: 'hide',
    description: 'Apenas usuários confiáveis poderão ver o teu canal',
    emoji: '1551824103999148032',
  },
  {
    label: 'Exibir',
    value: 'show',
    description: 'Todos poderão ver o teu canal de voz',
    emoji: '1551824091911036948',
  },
];

export async function privacidade(interaction) {
  const doc = await carregarCanalDoDono(interaction);
  if (!doc) return;

  const select = new StringSelectMenuBuilder()
    .setCustomId('painel:privacidade:select')
    .setPlaceholder('Selecione uma opção de privacidade.')
    .addOptions(PRIVACY_OPTIONS);

  await interaction.reply({
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [
      new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Privacidade'))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('Defina a privacidade do seu canal.')),
      new ActionRowBuilder().addComponents(select),
    ],
  });
}
