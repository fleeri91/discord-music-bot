require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const MusicPlayer = require("./utils/player");
const {
  loadCommands,
  registerCommands,
  setupInteractionHandler,
} = require("./handlers/commands");
const createDashboard = require("./handlers/dashboard");
const { initSpotify } = require("./utils/spotify");

// ─────────────────────────────────────────────
//  Discord Music Bot — Main Entry Point
// ─────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

// Attach music player to client
client.musicPlayer = new MusicPlayer(client);

// ── Boot Sequence ──
client.once("ready", async () => {
  console.log("");
  console.log("╔══════════════════════════════════════════╗");
  console.log("║       🎵 Discord Music Bot Online        ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  Bot:    ${client.user.tag.padEnd(30)} ║`);
  console.log(`║  Guilds: ${String(client.guilds.cache.size).padEnd(30)} ║`);
  console.log("╚══════════════════════════════════════════╝");
  console.log("");

  // Load & register commands
  console.log("[Boot] Loading commands...");
  const commands = await loadCommands(client);
  await registerCommands(client, commands);
  setupInteractionHandler(client);

  // Initialize Spotify
  console.log("[Boot] Initializing Spotify...");
  await initSpotify();

  // Start web dashboard
  console.log("[Boot] Starting dashboard...");
  createDashboard(client);

  console.log("");
  console.log("[Boot] ✅ All systems go!");
});

// ── Error Handling ──
client.on("error", (err) => console.error("[Client Error]", err));
process.on("unhandledRejection", (err) => console.error("[Unhandled]", err));

// ── Validate env ──
if (
  !process.env.DISCORD_TOKEN ||
  process.env.DISCORD_TOKEN === "your_discord_bot_token_here"
) {
  console.error("");
  console.error("╔══════════════════════════════════════════════════╗");
  console.error("║  ❌  DISCORD_TOKEN not set!                      ║");
  console.error("║                                                  ║");
  console.error("║  1. Copy .env.example to .env                    ║");
  console.error("║  2. Add your bot token from:                     ║");
  console.error("║     https://discord.com/developers/applications  ║");
  console.error("║  3. Run again: npm start                         ║");
  console.error("╚══════════════════════════════════════════════════╝");
  console.error("");
  process.exit(1);
}

if (!process.env.CLIENT_ID || process.env.CLIENT_ID === "your_client_id_here") {
  console.error(
    "❌  CLIENT_ID not set in .env — needed for slash command registration.",
  );
  process.exit(1);
}

// ── Login ──
client.login(process.env.DISCORD_TOKEN);
