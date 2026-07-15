import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from "discord.js";
import { prisma } from "../database";
import { createPrivateCart } from "../utils/cartManager";
import { PaymentProviderFactory } from "../providers/PaymentProviderFactory";
import { SecurityService } from "../services/SecurityService";
import { PaymentService } from "../services/PaymentService";
import logger from "../logger";

export const data = new SlashCommandBuilder()
  .setName("buy")
  .setDescription("Iniciar compra de plano")
  .addStringOption((option) =>
    option
      .setName("plano")
      .setDescription("Selecione o plano")
      .setRequired(true)
      .addChoices(
        { name: "Starter", value: "starter" },
        { name: "Professional", value: "professional" },
        { name: "Enterprise", value: "enterprise" }
      )
  );

export async function execute(interaction: CommandInteraction): Promise<void> {
  try {
    await interaction.deferReply({ ephemeral: true });

    // Update loading message
    await interaction.editReply({
      content: "◔ Carregando...",
    });

    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await interaction.editReply({
      content: "◔ Iniciando verificações necessárias...",
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get user
    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });

    if (!user) {
      await interaction.editReply({
        content: "❌ Usuário não encontrado. Execute /setup primeiro.",
      });
      return;
    }

    // Get plan
    const planValue = interaction.options.getString("plano", true);
    const plan = await prisma.plan.findUnique({
      where: { name: planValue },
      include: { prices: true },
    });

    if (!plan || plan.prices.length === 0) {
      await interaction.editReply({
        content: "❌ Plano não encontrado.",
      });
      return;
    }

    const planPrice = plan.prices[0];

    // Create cart in private channel
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply({
        content: "❌ Erro ao acessar servidor.",
      });
      return;
    }

    const channelId = await createPrivateCart(
      interaction.client,
      guild.id,
      user.discordId,
      interaction.user.username
    );

    // Create cart in database
    const cart = await prisma.cart.create({
      data: {
        userId: user.id,
        planId: plan.id,
        planPriceId: planPrice.id,
        channelId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });

    logger.info(`Cart created: ${cart.id}`);

    await interaction.editReply({
      content: "✓ Carrinho aberto com sucesso!",
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("Ir para carrinho")
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/channels/${guild.id}/${channelId}`)
        ),
      ],
    });

    // Send message to private cart
    const cartChannel = await interaction.client.channels.fetch(channelId);
    if (cartChannel && cartChannel.isDMBased() === false && cartChannel.type === ChannelType.GuildText) {
      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle(`Carrinho - ${plan.name}`)
        .setDescription(`Preço: R$ ${(Number(planPrice.priceInCents) / 100).toFixed(2)}`)
        .addFields(
          { name: "Duração", value: `${plan.durationDays} dias` },
          { name: "Validade do Carrinho", value: "30 minutos" }
        )
        .setTimestamp();

      const payButton = new ButtonBuilder()
        .setCustomId(SecurityService.generateCustomId("pay", cart.id, "pay"))
        .setLabel("Pagar com PIX")
        .setStyle(ButtonStyle.Success);

      await (cartChannel as any).send({
        embeds: [embed],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(payButton)],
      });
    }
  } catch (error) {
    logger.error("Error in buy command:", error);
    await interaction.editReply({
      content: "❌ Erro ao processar compra",
    });
  }
}
