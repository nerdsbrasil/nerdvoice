import {
  AttachmentBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from 'discord.js';
import { criarBotoesPainel } from './botoes.js';

export function criarPainel(userId) {
  const attachment = new AttachmentBuilder(process.env.INTERFACE_IMAGE_PATH || 'images/interface.png', {
    name: 'interface.png',
  });
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Interface da Call'))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Bem-vindo(a) ao seu canal de voz <@${userId}>.`))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('Esta **interface** pode ser utilizada para gerenciar o canal de voz.'))
    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://interface.png')))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Pressione os botões abaixo para usar a interface.'));

  return { components: [container, ...criarBotoesPainel()], files: [attachment], flags: MessageFlags.IsComponentsV2 };
}
