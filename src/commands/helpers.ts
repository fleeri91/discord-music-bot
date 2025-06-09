import { REST, Routes } from "discord.js";

/**
 * Fetches all global application commands for the bot.
 *
 * @param rest - The REST client used to interact with Discord's API.
 * @returns A promise that resolves to an array of command objects.
 */
export async function getCommands(rest: REST): Promise<any[]> {
  console.log("Fetching commands...");

  const clientId = process.env.CLIENT_ID;
  if (!clientId) {
    console.error("No client ID found.");
    return [];
  }

  try {
    const commands = await rest.get(Routes.applicationCommands(clientId));
    return commands as any[];
  } catch (error) {
    console.error("Failed to fetch commands:", error);
    return [];
  }
}

/**
 * Deletes a single global application command by ID.
 *
 * @param rest - The REST client used to interact with Discord's API.
 * @param id - The ID of the command to delete.
 */
export async function deleteCommand(rest: REST, id: string): Promise<void> {
  if (!id || typeof id !== "string") {
    console.error("You must provide a valid command ID.");
    return;
  }

  const clientId = process.env.CLIENT_ID;
  if (!clientId) {
    console.error("No client ID found.");
    return;
  }

  try {
    // Fetch existing commands to verify the command exists
    const commands = (await rest.get(
      Routes.applicationCommands(clientId)
    )) as any[];

    const targetCommand = commands.find((cmd) => cmd.id === id);

    if (!targetCommand) {
      console.warn(`Command with ID "${id}" not found.`);
      return;
    }

    // Delete the specified command
    await rest.delete(Routes.applicationCommand(clientId, id));
    console.log(`Deleted command: "${targetCommand.name}" (ID: ${id})`);
  } catch (error) {
    console.error("Failed to delete command:", error);
  }
}

/**
 * Deletes all global application commands registered for the bot.
 *
 * @param rest - The REST client used to interact with Discord's API.
 */
export async function deleteAllGlobalCommands(rest: REST) {
  try {
    const commands = await getCommands(rest);

    if (!commands || !Array.isArray(commands)) {
      console.warn("No commands found or failed to fetch commands.");
      return;
    }

    // Iterate through all commands and attempt to delete each one
    for (const command of commands) {
      try {
        await deleteCommand(rest, command.id);
      } catch (innerError) {
        console.error(
          `Failed to delete command "${command.name}" (ID: ${command.id}):`,
          innerError
        );
      }
    }

    console.log("All global commands processed for deletion.");
  } catch (error) {
    console.error("Failed to delete global commands:", error);
  }
}
