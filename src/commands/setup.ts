import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from "discord.js";
import { prisma } from "../database";
import logger from "../logger";

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Configurar seu perfil no Bot Manager");

export async function execute(interaction: CommandInteraction): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });

    const user = await prisma.user.upsert({
      where: { discordId: interaction.user.id },
      update: {
        discordTag: interaction.user.tag,
        discordAvatar: interaction.user.avatarURL(),
      },
      create: {
        discordId: interaction.user.id,
        discordTag: interaction.user.tag,
        discordAvatar: interaction.user.avatarURL(),
      },
    });

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ Setup Concluído")
      .setDescription(`Bem-vindo, ${interaction.user.username}!`)
      .addFields(
        { name: "ID", value: user.id, inline: false },
        { name: "Discord Tag", value: user.discordTag, inline: false }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    logger.info(`User setup completed: ${interaction.user.id}`);
  } catch (error) {
    logger.error("Error in setup command:", error);
    await interaction.editReply({
      content: "❌ Erro ao configurar perfil",
    });
  }
}
