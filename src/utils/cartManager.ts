import { Client, ChannelType, PermissionFlagsBits } from "discord.js";
import { prisma } from "../database";
import logger from "../logger";

export async function createPrivateCart(
  client: Client,
  guildId: string,
  userId: string,
  userName: string
): Promise<string> {
  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      throw new Error(`Guild not found: ${guildId}`);
    }

    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const channelName = `🛒・${userName.substring(0, 15)}・${suffix}`;

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: userId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
      ],
      reason: `Private cart for user ${userId}`,
    });

    logger.info(`Private cart created: ${channel.id}`);
    return channel.id;
  } catch (error) {
    logger.error("Error creating private cart:", error);
    throw error;
  }
}

export async function archiveCart(client: Client, channelId: string): Promise<void> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel && channel.isDMBased() === false) {
      await (channel as any).setName(`🗂️・archived・${Date.now()}`);
      logger.info(`Cart archived: ${channelId}`);
    }
  } catch (error) {
    logger.error("Error archiving cart:", error);
  }
}
