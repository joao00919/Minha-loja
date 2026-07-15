import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import logger from "../logger";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Mostrar ajuda do Bot Manager");

export async function execute(interaction: CommandInteraction): Promise<void> {
  const helpText = `
# 📖 Bot Manager - Ajuda

## Comandos Disponíveis

### /setup
Configure seu perfil no Bot Manager. Execute apenas uma vez.

### /apps
Gerencie suas aplicações e licenças. Veja status de renovação e planos.

### /help
Exibe esta mensagem.

### /ping
Verifica a latência do bot.

## Fluxo de Pagamento PIX

1. **Carregando**: O sistema inicia o processamento
2. **Verificação**: Validação de dados
3. **Carrinho Aberto**: Você recebe um link para o carrinho privado
4. **QR Code**: Leia o QR Code com seu banco ou copie o código PIX
5. **Confirmação Automática**: Após pagamento, a licença é ativada automaticamente

## Suporte

Digite \`/help\` para mais informações.
  `;

  await interaction.reply({
    content: helpText,
    ephemeral: true,
  });

  logger.info(`Help command executed for user ${interaction.user.id}`);
}
