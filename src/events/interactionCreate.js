import { renomear } from '../handlers/buttons/renomear.js';
import { limitar } from '../handlers/buttons/limitar.js';
import { confiar } from '../handlers/buttons/confiar.js';
import { desconfiar } from '../handlers/buttons/desconfiar.js';
import { bloquear } from '../handlers/buttons/bloquear.js';
import { desbloquear } from '../handlers/buttons/desbloquear.js';
import { privacidade } from '../handlers/buttons/privacidade.js';
import { cancelarExclusao, confirmarExclusao, excluir } from '../handlers/buttons/excluir.js';
import { renomearModal } from '../handlers/modals/renomearModal.js';
import { limitarModal } from '../handlers/modals/limitarModal.js';
import { confiarSelect } from '../handlers/selects/confiarSelect.js';
import { desconfiarSelect } from '../handlers/selects/desconfiarSelect.js';
import { bloquearSelect } from '../handlers/selects/bloquearSelect.js';
import { desbloquearSelect } from '../handlers/selects/desbloquearSelect.js';
import { privacidadeSelect } from '../handlers/selects/privacidadeSelect.js';
import { apagarChat, cancelarChat, chat } from '../handlers/buttons/chat.js';
import { live } from '../handlers/buttons/live.js';
import { respostaEphemeral } from '../utils/respostas.js';
import { logger } from '../utils/logger.js';

export function registerInteractionHandler(client) {
  client.on('interactionCreate', async (interaction) => {
    try {
      if ((interaction.isButton() || interaction.isModalSubmit() || interaction.isUserSelectMenu() || interaction.isStringSelectMenu()) && interaction.customId.startsWith('painel:')) {
        logger.info('PAINEL', interaction.user.username, `Interagiu com ${interaction.customId}.`);
      }
      if (interaction.isButton()) {
        const handlers = {
          'painel:renomear': renomear,
          'painel:limitar': limitar,
          'painel:confiar': confiar,
          'painel:desconfiar': desconfiar,
          'painel:bloquear': bloquear,
          'painel:desbloquear': desbloquear,
          'painel:privacidade': privacidade,
          'painel:excluir': excluir,
          'painel:excluir:confirm': confirmarExclusao,
          'painel:excluir:cancel': cancelarExclusao,
          'painel:chat': chat,
          'painel:chat:delete': apagarChat,
          'painel:chat:cancel': cancelarChat,
          'painel:live': live,
        };
        const handler = handlers[interaction.customId];
        if (handler) await handler(interaction);
        return;
      }
      if (interaction.isModalSubmit() && interaction.customId === 'painel:renomear:modal') return await renomearModal(interaction);
      if (interaction.isModalSubmit() && interaction.customId === 'painel:limitar:modal') return await limitarModal(interaction);
      if (interaction.isUserSelectMenu() && interaction.customId === 'painel:confiar:select') return await confiarSelect(interaction);
      if (interaction.isStringSelectMenu() && interaction.customId === 'painel:desconfiar:select') return await desconfiarSelect(interaction);
      if (interaction.isUserSelectMenu() && interaction.customId === 'painel:bloquear:select') return await bloquearSelect(interaction);
      if (interaction.isStringSelectMenu() && interaction.customId === 'painel:desbloquear:select') return await desbloquearSelect(interaction);
      if (interaction.isStringSelectMenu() && interaction.customId === 'painel:privacidade:select') return await privacidadeSelect(interaction);
    } catch (error) {
      logger.error(interaction.user?.username ?? 'desconhecido', 'Falha ao processar interação', error);
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply(
          respostaEphemeral('Erro!', 'Algo deu errado, tente novamente.'),
        ).catch(() => null);
      } else if (interaction.isRepliable() && interaction.deferred && !interaction.replied) {
        await interaction.followUp(respostaEphemeral('Erro!', 'Algo deu errado, tente novamente.')).catch(() => null);
      }
    }
  });
}
