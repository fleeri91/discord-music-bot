const { Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  const commands = [];
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`  ✓ Loaded command: /${command.data.name}`);
  }

  return commands;
}

async function registerCommands(client, commands) {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`[Commands] Registering ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log(`[Commands] Successfully registered ${commands.length} commands globally.`);
  } catch (err) {
    console.error('[Commands] Registration failed:', err);
  }
}

function setupInteractionHandler(client) {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`[Command Error] /${interaction.commandName}:`, err);
      const reply = { content: '❌ An error occurred running this command.', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  });
}

module.exports = { loadCommands, registerCommands, setupInteractionHandler };
