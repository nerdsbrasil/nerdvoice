import { carregarCanalDoDono, respostaEphemeral } from '../../utils/respostas.js';

export async function indisponivel(interaction) {
  const doc = await carregarCanalDoDono(interaction);
  if (!doc) return;
  await interaction.reply(respostaEphemeral('Em breve', 'Esta ação ainda não possui regras definidas no projeto.'));
}
