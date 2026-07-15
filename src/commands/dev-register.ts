import { SlashCommandBuilder, REST, Routes } from "discord.js";
import { getConfig } from "../config";
import logger from "../logger";

const config = getConfig();

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Verifica a latência do bot"),
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configurar seu perfil no Bot Manager"),
  new SlashCommandBuilder()
    .setName("apps")
    .setDescription("Gerenciar suas aplicações e licenças"),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Mostrar ajuda do Bot Manager"),
];

async function registerDevCommands(): Promise<void> {
  try {
    logger.info("Registrando comandos no servidor de desenvolvimento...");

    const rest = new REST({ version: "10" }).setToken(config.MANAGER_BOT_TOKEN);

    const body = commands.map((cmd) => cmd.toJSON());

    const result = await rest.put(
      Routes.applicationGuildCommands(config.MANAGER_CLIENT_ID, config.MANAGER_GUILD_ID),
      { body }
    );

    logger.info(`✅ ${(result as unknown[]).length} comandos registrados (dev)`);
  } catch (error) {
    logger.error("Erro registrando comandos (dev):", error);
    process.exit(1);
  }
}

registerDevCommands();
