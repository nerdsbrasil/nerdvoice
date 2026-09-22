import { OverwriteType, PermissionFlagsBits } from 'discord.js';

const MANAGED_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.SendMessages,
];

const OWNER_PERMISSIONS = [
  ...MANAGED_PERMISSIONS,
  PermissionFlagsBits.MuteMembers,
  PermissionFlagsBits.DeafenMembers,
  // O Discord usa Move Members para mover ou desconectar participantes.
  PermissionFlagsBits.MoveMembers,
];

const BLOCKED_PERMISSIONS = [
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
];

export async function aplicarPermissoes(channel, doc) {
  const everyoneId = channel.guild.roles.everyone.id;
  const overwrites = [
    {
      id: everyoneId,
      type: OverwriteType.Role,
      allow: doc.visible ? [PermissionFlagsBits.ViewChannel] : [],
      deny: [
        ...(doc.visible ? [] : [PermissionFlagsBits.ViewChannel]),
        ...(doc.locked ? [PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages] : []),
      ],
    },
    { id: doc.id, type: OverwriteType.Member, allow: OWNER_PERMISSIONS },
    ...doc.trustedUsers.map((id) => ({ id, type: OverwriteType.Member, allow: MANAGED_PERMISSIONS })),
    ...doc.blockedUsers.map((id) => ({ id, type: OverwriteType.Member, deny: BLOCKED_PERMISSIONS })),
  ];
  await channel.permissionOverwrites.set(overwrites, 'Atualização das permissões da call temporária');
}
