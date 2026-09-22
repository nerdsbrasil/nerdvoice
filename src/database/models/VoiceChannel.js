import mongoose from 'mongoose';

const voiceChannelSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // ownerId
  guildId: { type: String, required: true },
  activeChannelId: { type: String, default: null },
  interfaceMessageId: { type: String, default: null },
  channelName: { type: String, default: null },
  userLimit: { type: Number, default: 0, min: 0, max: 99 },
  visible: { type: Boolean, default: true },
  locked: { type: Boolean, default: false },
  trustedUsers: {
    type: [String],
    default: [],
    validate: [(users) => users.length <= 25, 'O canal pode ter no máximo 25 usuários confiáveis.'],
  },
  blockedUsers: {
    type: [String],
    default: [],
    validate: [(users) => users.length <= 25, 'O canal pode ter no máximo 25 usuários bloqueados.'],
  },
  lastRenamedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  // Campo legado: usado somente para migrar registros da versão anterior.
  ownerId: { type: String, select: false },
}, { versionKey: false, collection: 'voiceChannels' });

export const VoiceChannel = mongoose.models.VoiceChannel
  ?? mongoose.model('VoiceChannel', voiceChannelSchema);
